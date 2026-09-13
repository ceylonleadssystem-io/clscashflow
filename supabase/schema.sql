create extension if not exists pgcrypto;

create table if not exists public.app_documents (
  path text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  owner_uid uuid null,
  email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (path, id)
);

create index if not exists app_documents_path_idx on public.app_documents (path);
create index if not exists app_documents_owner_uid_idx on public.app_documents (owner_uid);
create index if not exists app_documents_email_idx on public.app_documents (lower(email));
create index if not exists app_documents_data_gin_idx on public.app_documents using gin (data);

alter table public.app_documents enable row level security;

drop policy if exists "service role manages app documents" on public.app_documents;
create policy "service role manages app documents"
on public.app_documents
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete on table public.app_documents to service_role;

create or replace function public.reset_workspace_with_backup(
  p_owner_uid uuid,
  p_actor_uid uuid,
  p_backup_id text,
  p_paths text[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot jsonb;
  version_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
begin
  select coalesce(jsonb_agg(jsonb_build_object('path', path, 'id', id, 'data', data)), '[]'::jsonb)
    into snapshot from public.app_documents where path = any(p_paths);
  insert into public.app_documents(path,id,data,owner_uid,created_at,updated_at)
    values ('accountDangerBackups', p_backup_id,
      jsonb_build_object('kind','reset','ownerUid',p_owner_uid,'createdAt',now(),'documents',snapshot),
      p_owner_uid, now(), now());
  delete from public.app_documents where path = any(p_paths);
  update public.app_documents
    set data = data || jsonb_build_object(
      'settings', coalesce(data->'settings','{}'::jsonb) || jsonb_build_object('dataVersion',version_ms,'growthDataVersion',version_ms),
      'nextInvNum',1,'nextInvId',1,'dataVersion',version_ms,'growthDataVersion',version_ms,
      'dataResetAt',now(),'dataResetBy',p_actor_uid,'updatedAt',now()),
      updated_at = now()
    where path = 'users' and id = p_owner_uid::text;
  return jsonb_build_object('backupId',p_backup_id,'documents',jsonb_array_length(snapshot));
end;
$$;

create or replace function public.delete_workspace_with_backup(
  p_owner_uid uuid,
  p_backup_id text,
  p_include_profile boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare snapshot jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('path', path, 'id', id, 'data', data)), '[]'::jsonb)
    into snapshot from public.app_documents
    where path like ('users/' || p_owner_uid::text || '/%')
       or owner_uid = p_owner_uid
       or (p_include_profile and path = 'users' and id = p_owner_uid::text);
  insert into public.app_documents(path,id,data,owner_uid,created_at,updated_at)
    values ('accountDangerBackups', p_backup_id,
      jsonb_build_object('kind','delete','ownerUid',p_owner_uid,'createdAt',now(),'documents',snapshot),
      p_owner_uid, now(), now());
  delete from public.app_documents
    where path <> 'accountDangerBackups' and (
      path like ('users/' || p_owner_uid::text || '/%')
      or owner_uid = p_owner_uid
      or (p_include_profile and path = 'users' and id = p_owner_uid::text)
    );
  return jsonb_build_object('backupId',p_backup_id,'documents',jsonb_array_length(snapshot));
end;
$$;

revoke all on function public.reset_workspace_with_backup(uuid,uuid,text,text[]) from public;
revoke all on function public.delete_workspace_with_backup(uuid,text,boolean) from public;
grant execute on function public.reset_workspace_with_backup(uuid,uuid,text,text[]) to service_role;
grant execute on function public.delete_workspace_with_backup(uuid,text,boolean) to service_role;

notify pgrst, 'reload schema';

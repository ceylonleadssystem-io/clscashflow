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

notify pgrst, 'reload schema';

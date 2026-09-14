'use strict';
const {headers,getUserFromEvent,getDocument,queryDocuments,upsertDocument,deleteDocument,newId,canRead,canWrite}=require('../lib/appwrite');
function response(code,body){return{statusCode:code,headers:headers(),body:JSON.stringify(body)}}
function bodyOf(event){try{return JSON.parse(event.body||'{}')}catch(_){return{}}}
exports.handler=async function(event){
  if(event.httpMethod==='OPTIONS')return response(204,{});if(event.httpMethod!=='POST')return response(405,{ok:false,error:'Method not allowed'});
  try{var b=bodyOf(event),action=String(b.action||''),path=String(b.path||'').replace(/^\/+|\/+$/g,''),id=String(b.id||''),data=b.data&&typeof b.data==='object'?b.data:{};if(!path)throw new Error('Missing document path.');
    var publicInvite=action==='get'&&id&&/^users\/[^/]+\/team$/.test(path);if(publicInvite){var invite=await getDocument(path,id);if(!invite)return response(200,{ok:true,exists:false,doc:null});var d=invite.data||{},valid=String(d.inviteToken||id)===id&&String(d.status||'pending')==='pending'&&(!d.expiresAt||Date.parse(d.expiresAt)>Date.now());return response(200,{ok:true,exists:valid,doc:valid?{id:invite.id,data:{email:d.email||'',role:d.role||'',status:d.status||'',ownerUid:d.ownerUid||'',inviteToken:id,expiresAt:d.expiresAt||''}}:null});}
    var user=await getUserFromEvent(event);if(!user)return response(401,{ok:false,error:'Please sign in again.'});
    if(action==='get'){var doc=await getDocument(path,id);if(!doc)return response(200,{ok:true,exists:false,doc:null});if(!await canRead({path,id:doc.id,data:doc.data},user))return response(403,{ok:false,error:'Not allowed.'});return response(200,{ok:true,exists:true,doc});}
    if(action==='query'){var docs=await queryDocuments(path,b.options||{}),allowed=[];for(const row of docs)if(await canRead({path,id:row.id,data:row.data},user))allowed.push(row);return response(200,{ok:true,docs:allowed});}
    if(action==='set'||action==='update'||action==='add'){id=id||newId('doc');if(!await canWrite(path,id,data,user))return response(403,{ok:false,error:'Not allowed.'});return response(200,{ok:true,doc:await upsertDocument(path,id,data,action!=='set'||b.merge!==false)});}
    if(action==='delete'){var old=await getDocument(path,id);if(old&&!await canWrite(path,id,old.data,user))return response(403,{ok:false,error:'Not allowed.'});await deleteDocument(path,id);return response(200,{ok:true});}
    return response(400,{ok:false,error:'Unsupported action.'});
  }catch(e){return response(e.statusCode||500,{ok:false,error:e.message||'Appwrite request failed.'})}
};

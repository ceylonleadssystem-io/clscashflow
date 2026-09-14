(function(){
  'use strict';
  var ENDPOINT='https://sgp.cloud.appwrite.io/v1',PROJECT='6a947d6e0012c551dfde';
  var client=new Appwrite.Client().setEndpoint(ENDPOINT).setProject(PROJECT),account=new Appwrite.Account(client);
  var currentUser=null,listeners=[],ready=false;
  function userShape(user){if(!user)return null;return{uid:user.$id,email:user.email||'',displayName:user.name||'',photoURL:(user.prefs||{}).photoURL||'',emailVerified:!!user.emailVerification,getIdToken:async function(){return(await account.createJWT()).jwt},updateProfile:async function(p){if(p.displayName!=null)await account.updateName(p.displayName);currentUser=await loadUser();return currentUser}}}
  async function loadUser(){try{return userShape(await account.get())}catch(_){return null}}
  function emit(){listeners.slice().forEach(function(fn){try{fn(currentUser)}catch(e){console.error(e)}})}
  var init=loadUser().then(function(u){currentUser=u;ready=true;emit()});
  function auth(){return authApi}
  var authApi={
    get currentUser(){return currentUser},
    onAuthStateChanged:function(fn){listeners.push(fn);init.then(function(){fn(currentUser)});return function(){listeners=listeners.filter(function(x){return x!==fn})}},
    signInWithEmailAndPassword:async function(email,password){await account.createEmailPasswordSession(email,password);currentUser=await loadUser();emit();return{user:currentUser}},
    createUserWithEmailAndPassword:async function(email,password){await account.create(Appwrite.ID.unique(),email,password);await account.createEmailPasswordSession(email,password);currentUser=await loadUser();emit();return{user:currentUser}},
    signOut:async function(){try{await account.deleteSession('current')}catch(_){}currentUser=null;emit()},
    sendPasswordResetEmail:async function(email){return account.createRecovery(email,location.origin+'/reset-password.html')},
    signInWithPopup:async function(provider){account.createOAuth2Session((provider&&provider.provider)||'google',location.origin+'/signin.html',location.origin+'/signin.html');return new Promise(function(){})}
  };
  function GoogleAuthProvider(){this.provider='google'}
  function request(body,publicRead){return init.then(async function(){var h={'Content-Type':'application/json'};if(currentUser&&!publicRead)h.Authorization='Bearer '+await currentUser.getIdToken();var r=await fetch('/.netlify/functions/appwrite-docs',{method:'POST',headers:h,body:JSON.stringify(body)}),j=await r.json();if(!r.ok||j.ok===false)throw new Error(j.error||'Appwrite request failed.');return j})}
  function Snap(row){this.id=row&&row.id||'';this.exists=!!row;this._data=row&&row.data||null}Snap.prototype.data=function(){return this._data?Object.assign({},this._data):undefined};
  function QueryRef(path,filters,order,limit){this.path=path;this.filters=filters||[];this.order=order;this.max=limit}
  QueryRef.prototype.where=function(f,o,v){return new QueryRef(this.path,this.filters.concat([{field:f,op:o,value:v}]),this.order,this.max)};
  QueryRef.prototype.orderBy=function(f,d){return new QueryRef(this.path,this.filters,{field:f,dir:d||'asc'},this.max)};
  QueryRef.prototype.limit=function(n){return new QueryRef(this.path,this.filters,this.order,n)};
  QueryRef.prototype.get=async function(){var j=await request({action:'query',path:this.path,options:{filters:this.filters,order:this.order&&this.order.field,dir:this.order&&this.order.dir,limit:this.max}});var docs=(j.docs||[]).map(function(x){return new Snap(x)});return{docs:docs,empty:!docs.length,size:docs.length,forEach:function(fn){docs.forEach(fn)}}};
  QueryRef.prototype.onSnapshot=function(fn,err){var stopped=false,timer;async function poll(){try{if(!stopped)fn(await this.get())}catch(e){if(err)err(e)}if(!stopped)timer=setTimeout(poll.bind(this),5000)}poll.call(this);return function(){stopped=true;clearTimeout(timer)}};
  function DocRef(path,id){this.path=path;this.id=id||('doc_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8))}
  DocRef.prototype.collection=function(n){return new CollectionRef(this.path+'/'+this.id+'/'+n)};
  DocRef.prototype.get=async function(){var j=await request({action:'get',path:this.path,id:this.id},/^users\/[^/]+\/team$/.test(this.path));return new Snap(j.doc)};
  DocRef.prototype.set=async function(data,opt){await request({action:'set',path:this.path,id:this.id,data:data,merge:!!(opt&&opt.merge)});return this};
  DocRef.prototype.update=async function(data){await request({action:'update',path:this.path,id:this.id,data:data});return this};
  DocRef.prototype.delete=async function(){await request({action:'delete',path:this.path,id:this.id})};
  function CollectionRef(path){QueryRef.call(this,path)}CollectionRef.prototype=Object.create(QueryRef.prototype);CollectionRef.prototype.doc=function(id){return new DocRef(this.path,id)};CollectionRef.prototype.add=async function(data){var d=new DocRef(this.path);await d.set(data);return d};
  function firestore(){return{collection:function(n){return new CollectionRef(n)},batch:function(){var jobs=[];return{set:function(r,d,o){jobs.push(function(){return r.set(d,o)})},delete:function(r){jobs.push(function(){return r.delete()})},commit:function(){return Promise.all(jobs.map(function(f){return f()}))}}}}}
  firestore.FieldValue={serverTimestamp:function(){return new Date().toISOString()},delete:function(){return{__delete:true}}};
  window.firebase={apps:[{}],initializeApp:function(){return window.firebase},auth:auth,firestore:firestore};window.firebase.auth.GoogleAuthProvider=GoogleAuthProvider;
})();

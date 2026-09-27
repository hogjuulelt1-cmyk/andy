/* ---------- Supabase backend (plain REST, no SDK) ---------- */
const CFG=window.APP_CONFIG||{};
const SB={
  url:(CFG.supabaseUrl||"").replace(/\/$/,""),key:CFG.supabaseAnonKey||"",session:null,
  configured(){return !!(this.url&&this.key);},
  loadSession(){try{this.session=JSON.parse(localStorage.getItem("cb-sb-session")||"null");}catch(e){this.session=null;}},
  storeSession(s){this.session=s;try{s?localStorage.setItem("cb-sb-session",JSON.stringify(s)):localStorage.removeItem("cb-sb-session");}catch(e){}},
  async auth(body,grant){
    const r=await fetch(this.url+"/auth/v1/token?grant_type="+grant,{method:"POST",headers:{apikey:this.key,"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error_description||j.msg||"auth");
    this.storeSession({access:j.access_token,refresh:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000,email:j.user&&j.user.email});return this.session;
  },
  login(email,password){return this.auth({email,password},"password");},
  async token(){
    if(!this.session)throw new Error("noauth");
    if(Date.now()>this.session.exp-60000){try{await this.auth({refresh_token:this.session.refresh},"refresh_token");}catch(e){this.storeSession(null);throw new Error("noauth");}}
    return this.session.access;
  },
  async req(path,opt){
    opt=opt||{};const t=await this.token();
    const r=await fetch(this.url+path,Object.assign({},opt,{headers:Object.assign({apikey:this.key,Authorization:"Bearer "+t},opt.headers||{})}));
    if(r.status===401){this.storeSession(null);throw new Error("noauth");}
    if(!r.ok)throw new Error("http "+r.status);return r;
  },
  async loadAll(){
    const out=[];let from=0;
    for(;;){const r=await this.req("/rest/v1/docs?select=path,data&order=path",{headers:{Range:from+"-"+(from+999),"Range-Unit":"items"}});const rows=await r.json();out.push(...rows);if(rows.length<1000)break;from+=1000;}
    return out;
  },
  set(path,data){return this.req("/rest/v1/docs",{method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({path,data,updated_at:new Date().toISOString()})});},
  del(path){return this.req("/rest/v1/docs?path=eq."+encodeURIComponent(path),{method:"DELETE"});},
  async upload(file,opt){
    const safe=file.name.replace(/[^A-Za-z0-9._-]+/g,"_").slice(-80)||"file";
    const id="f/"+uid()+"-"+safe;const type=(opt&&opt.type)||file.type||"application/octet-stream";
    await this.req("/storage/v1/object/library/"+id,{method:"POST",headers:{"Content-Type":type,"x-upsert":"false"},body:file});
    return{id,contentType:type,sizeBytes:file.size};
  },
  delete(id){return this.req("/storage/v1/object/library/"+id,{method:"DELETE"});},
  signed:{},
  fileUrl(id){
    const c=this.signed[id];if(c&&c.exp>Date.now())return c.url;
    if(!c||!c.pending){this.signed[id]={pending:true,exp:0,url:""};
      this.req("/storage/v1/object/sign/library/"+id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expiresIn:3600})}).then(r=>r.json()).then(j=>{this.signed[id]={url:this.url+"/storage/v1"+j.signedURL,exp:Date.now()+3500*1000};requestRender();}).catch(()=>{delete this.signed[id];});}
    return "";
  }
};
const DL={save({filename,data}){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);return Promise.resolve();}};
function showLogin(msg){
  document.body.classList.add("locked");
  const m=document.getElementById("main");
  document.getElementById("tabs").innerHTML="";
  m.innerHTML='<form class="card" id="login" style="max-width:420px;margin:24px auto;width:100%"><h2>Нэвтрэх</h2><p class="small muted">Энэ хуудас хувийн мэдээлэлтэй тул зөвхөн гэр бүлийн гишүүд нэвтэрнэ.</p><div class="field"><label for="lg-e">И-мэйл</label><input id="lg-e" type="email" autocomplete="username" required></div><div class="field"><label for="lg-p">Нууц үг</label><input id="lg-p" type="password" autocomplete="current-password" required></div>'+(msg?'<p class="small" style="color:var(--bad)">'+esc(msg)+"</p>":"")+'<button class="btn" type="submit">Нэвтрэх</button></form>';
  setSync("local","Нэвтрээгүй");
  document.getElementById("login").addEventListener("submit",async e=>{e.preventDefault();const b=e.target.querySelector("button");b.disabled=true;b.textContent="Нэвтэрч байна…";
    try{await SB.login(document.getElementById("lg-e").value.trim(),document.getElementById("lg-p").value);startCloud();}catch(err){showLogin("И-мэйл эсвэл нууц үг буруу байна.");}});
}
let pollTimer=null;
async function refreshAll(){
  const rows=await SB.loadAll();const seen=new Set();
  rows.forEach(r=>{seen.add(r.path);applySnap(r.path,r.data,true);});
  ["days","tasks","reviews","library"].forEach(c=>Object.keys(S[c]).forEach(id=>{const p=c+"/"+id;if(!seen.has(p)&&!dirty[p])delete S[c][id];}));
  requestRender();
}
async function startCloud(){
  setSync("saving","Ачаалж байна…");
  try{await refreshAll();}catch(e){if(e.message==="noauth")return showLogin();setSync("err","Сервертэй холбогдож чадсангүй");return;}
  document.body.classList.remove("locked");mode="cloud";db=true;assetsApi=SB;downloadsApi=DL;readyResolve();setSync("ok");render();
  clearInterval(pollTimer);pollTimer=setInterval(()=>{if(!document.hidden&&!Object.keys(dirty).length)refreshAll().catch(()=>{});},60000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!Object.keys(dirty).length)refreshAll().catch(()=>{});});
}
async function importBackup(file){
  const o=JSON.parse(await file.text());const docs=[["app/settings",o.settings],["app/business",o.biz]];
  ["days","tasks","reviews","library"].forEach(c=>Object.entries(o[c]||{}).forEach(([id,d])=>docs.push([c+"/"+id,d])));
  let n=0;for(const [p,d] of docs){if(!d)continue;await SB.set(p,d);n++;}
  await refreshAll();return n;
}

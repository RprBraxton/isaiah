"use strict";
// Two-way cloud sync (Supabase). Optional: app works fully offline/local without signing in.
const SB_URL="https://ewkcssbwoacakcfryyld.supabase.co";
const SB_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3a2Nzc2J3b2FjYWtjZnJ5eWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTcxMjEsImV4cCI6MjEwNzU3MzEyMX0.djOP-rBakJdwj80BkhrgbPyKnQhymdkog7hGvIvZU7s"; // public anon key (safe in client; access is enforced by RLS + allowlist)
const SYNC_KEY="isaiah.sync";
const Y=Object.assign({snap:{},lastPull:null,uploaded:{},lastSync:null},JSON.parse(localStorage.getItem(SYNC_KEY)||"{}"));
const ySave=()=>localStorage.setItem(SYNC_KEY,JSON.stringify(Y));
let sb=null,session=null,status="local",allowed=null,busy=false,chan=null,lastErr="";
try{if(window.supabase)sb=supabase.createClient(SB_URL,SB_ANON,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"implicit"}})}catch(e){}
const ARR=["letters","logs","growth","firsts"];
function settingsData(){return{baby:S.baby,headerPhoto:S.headerPhoto||null,questions:S.questions||""}}
function localEntries(){const out={};
  for(const[id,r]of Object.entries(S.ms))out["ms:"+id]={kind:"ms",id,data:r,u:r.updated||0};
  for(const k of ARR)for(const x of S[k])out[k+":"+x.id]={kind:k,id:x.id,data:x,u:x.updated||0};
  for(const[w,r]of Object.entries(S.weekly))out["weekly:"+w]={kind:"weekly",id:String(w),data:r,u:r.updated||0};
  const sd=JSON.stringify(settingsData());if(S._settingsSig!==sd){S._settingsSig=sd;S.settingsUpdated=Date.now();localStorage.setItem(KEY,JSON.stringify(S))}
  out["settings:main"]={kind:"settings",id:"main",data:settingsData(),u:S.settingsUpdated||0};return out}
function dirty(){const cur=localEntries(),rows=[];
  for(const[k,e]of Object.entries(cur))if(Y.snap[k]!==e.u)rows.push({kind:e.kind,id:e.id,data:e.data,updated_at:e.u,deleted:false});
  for(const k of Object.keys(Y.snap))if(!cur[k]&&Y.snap[k]!==-1){const[kind,...r]=k.split(":"),id=r.join(":");rows.push({kind,id,data:null,updated_at:Math.max(S.deleted[id]||0,Date.now()),deleted:true})}
  return rows}
function photosOf(rows){return rows.filter(r=>!r.deleted).flatMap(r=>[r.data?.photo,r.data?.headerPhoto]).filter(Boolean)}
async function upPhoto(pid){if(Y.uploaded[pid])return;const v=await pGet(pid);if(!v)return;const blob=await (await fetch(v)).blob();
  const {error}=await sb.storage.from("photos").upload(pid+".jpg",blob,{contentType:"image/jpeg",upsert:true});if(error&&!/exists|Duplicate/i.test(error.message))throw error;Y.uploaded[pid]=1;ySave()}
async function downPhoto(pid){if(!pid||await pGet(pid))return;const {data,error}=await sb.storage.from("photos").download(pid+".jpg");if(error||!data)return;
  const url=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(data)});await pPut(pid,url);Y.uploaded[pid]=1}
async function push(){const rows=dirty();if(!rows.length)return 0;for(const pid of photosOf(rows))await upPhoto(pid);
  for(let i=0;i<rows.length;i+=200){const {error}=await sb.from("entries").upsert(rows.slice(i,i+200),{onConflict:"kind,id"});if(error)throw error}
  for(const r of rows)Y.snap[r.kind+":"+r.id]=r.deleted?-1:r.updated_at;ySave();return rows.length}
async function applyRow(r){const key=r.kind+":"+r.id,cur=localEntries()[key];
  if(cur&&cur.u>r.updated_at)return false;if(!r.deleted&&(Y.snap[key]===r.updated_at||(S.deleted[r.id]||0)>=r.updated_at))return false;
  if(r.deleted){if(!cur&&Y.snap[key]===-1)return false;S.deleted[r.id]=r.updated_at;
    if(r.kind==="ms")delete S.ms[r.id];else if(r.kind==="weekly")delete S.weekly[r.id];else if(ARR.includes(r.kind))S[r.kind]=S[r.kind].filter(x=>x.id!==r.id);Y.snap[key]=-1}
  else{const d=r.data;await downPhoto(d.photo);
    if(r.kind==="ms")S.ms[r.id]=d;else if(r.kind==="weekly")S.weekly[r.id]=d;
    else if(r.kind==="settings"){await downPhoto(d.headerPhoto);S.baby=d.baby||S.baby;S.headerPhoto=d.headerPhoto;S.questions=d.questions;S.settingsUpdated=r.updated_at;S._settingsSig=JSON.stringify(settingsData())}
    else{const a=S[r.kind],i=a.findIndex(x=>x.id===r.id);if(i>=0)a[i]=d;else a.push(d)}
    Y.snap[key]=r.updated_at}
  return true}
async function pull(){let q=sb.from("entries").select("*").order("server_ts",{ascending:true}).limit(1000);if(Y.lastPull)q=q.gt("server_ts",Y.lastPull);
  const {data,error}=await q;if(error)throw error;let ch=0;for(const r of data){if(await applyRow(r))ch++;Y.lastPull=r.server_ts}
  if(ch){localStorage.setItem(KEY,JSON.stringify(S));refreshUI()}ySave();return data.length===1000}
function refreshUI(){if($("#sheet").classList.contains("hidden")&&typeof render==="function")render();else setTimeout(refreshUI,1500)}
async function syncNow(){if(!sb||!session||busy)return;if(!navigator.onLine){setStatus("offline");return}
  busy=true;setStatus("syncing");try{if(allowed===null){const {data}=await sb.from("allowed_emails").select("email");allowed=!!(data&&data.length)}
    if(!allowed){setStatus("denied");return}
    while(await pull());await push();Y.lastSync=Date.now();ySave();setStatus("synced");subscribe()}
  catch(e){lastErr=e.message||String(e);setStatus("error")}finally{busy=false}}
function subscribe(){if(chan||!session)return;chan=sb.channel("entries").on("postgres_changes",{event:"*",schema:"public",table:"entries"},async p=>{const r=p.new;if(!r||!r.kind)return;
  if(await applyRow(r)){localStorage.setItem(KEY,JSON.stringify(S));ySave();refreshUI()}}).subscribe()}
let pushT=null;window.onLocalSave=()=>{if(!session)return;clearTimeout(pushT);pushT=setTimeout(syncNow,800)};
function setStatus(s){status=s;const c=document.getElementById("syncCard");if(c)c.innerHTML=syncCardInner()}
const ST={en:{title:"Cloud sync",local:"Not signed in — data stays on this phone only.",syncing:"Syncing…",synced:"Synced",offline:"Offline — changes are saved and will sync later.",error:"Sync problem — will retry.",denied:"This email isn't on the family list yet.",email:"Your email",send:"Email me a sign-in link",code:"Or enter code from email",verify:"Verify",signout:"Sign out",now:"Sync now",sent:"Check your email for the sign-in link.",as:"Signed in as",help:"Sign in on both phones with an allowed email to see each other's entries."},
es:{title:"Sincronización",local:"Sin sesión — los datos se quedan solo en este teléfono.",syncing:"Sincronizando…",synced:"Sincronizado",offline:"Sin conexión — se sincronizará después.",error:"Problema al sincronizar — se reintentará.",denied:"Este correo aún no está en la lista familiar.",email:"Su correo",send:"Enviarme un enlace para entrar",code:"O escriba el código del correo",verify:"Verificar",signout:"Cerrar sesión",now:"Sincronizar ahora",sent:"Revise su correo para el enlace.",as:"Sesión de",help:"Inicie sesión en ambos teléfonos con un correo permitido para ver los registros del otro."}};
const st=k=>(ST[S.lang]||ST.en)[k];
function syncCardInner(){if(!sb)return `<h2>☁️ ${st("title")}</h2><p class="mute">${st("local")}</p>`;
  const dot={synced:"🟢",syncing:"🔄",offline:"🟡",error:"🔴",denied:"⛔",local:"⚪"}[status]||"⚪";
  if(!session)return `<h2>☁️ ${st("title")}</h2><p>${dot} ${st("local")}</p><p class="mute small">${st("help")}</p><label>${st("email")}</label><input type="email" id="syE" autocomplete="email" inputmode="email"><button class="btn" id="sySend">${st("send")}</button><label>${st("code")}</label><div class="row"><input id="syC" inputmode="numeric" autocomplete="one-time-code" maxlength="10"><button class="btn sec" id="syV" style="flex:0 0 120px">${st("verify")}</button></div><p class="small mute" id="syMsg"></p>`;
  return `<h2>☁️ ${st("title")}</h2><p>${dot} ${st(status)||status}${status==="synced"&&Y.lastSync?" · "+new Date(Y.lastSync).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}):""}</p>${status==="error"?`<p class="small mute">${esc(lastErr)}</p>`:""}<p class="small mute">${st("as")} ${esc(session.user.email)}</p><div class="row"><button class="btn sec" id="syNow">${st("now")}</button><button class="btn ghost" id="syOut">${st("signout")}</button></div>`}
document.addEventListener("click",async e=>{const id=e.target.id;if(!sb)return;
  if(id==="sySend"){const email=$("#syE").value.trim();if(!email)return;const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});$("#syMsg").textContent=error?error.message:st("sent")}
  if(id==="syV"){const {error}=await sb.auth.verifyOtp({email:$("#syE").value.trim(),token:$("#syC").value.trim(),type:"email"});if(error)$("#syMsg").textContent=error.message}
  if(id==="syNow")syncNow();
  if(id==="syOut"){await sb.auth.signOut();}});
if(sb){sb.auth.onAuthStateChange((ev,s)=>{const was=session?.user?.id;session=s;if(!s){allowed=null;if(chan){sb.removeChannel(chan);chan=null}setStatus("local");return}
    if(was!==s.user.id){allowed=null;if(Y.user&&Y.user!==s.user.id){Y.snap={};Y.lastPull=null}Y.user=s.user.id;ySave();setTimeout(syncNow,0)}else setStatus(status)});
  addEventListener("online",syncNow);addEventListener("offline",()=>setStatus("offline"));setInterval(syncNow,60000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncNow()})}
window.isaiahSync={syncNow,get status(){return status},sb:()=>sb};

"use strict";
const KEY="isaiah.v1";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const todayISO=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const DEF={baby:{name:"Isaiah",birth:"2026-08-09",weeksEarly:0,useCorrected:false},lang:"en",theme:"auto",units:"us",ms:{},logs:[],growth:[],firsts:[],timers:{},deleted:{},lastBackup:null,weekly:{},letters:[],headerPhoto:null};
let S=load();
function load(){try{return Object.assign(structuredClone(DEF),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){return structuredClone(DEF)}}
function save(){localStorage.setItem(KEY,JSON.stringify(S));window.onLocalSave&&window.onLocalSave()}
// ---------- photos (IndexedDB) ----------
let dbp;function db(){return dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open("isaiah",1);r.onupgradeneeded=()=>r.result.createObjectStore("photos");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
async function pPut(k,v){const d=await db();return new Promise((res,rej)=>{const t=d.transaction("photos","readwrite");t.objectStore("photos").put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function pGet(k){const d=await db();return new Promise(res=>{const r=d.transaction("photos").objectStore("photos").get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)})}
async function pAll(){const d=await db();return new Promise(res=>{const out={},r=d.transaction("photos").objectStore("photos").openCursor();r.onsuccess=()=>{const c=r.result;if(c){out[c.key]=c.value;c.continue()}else res(out)}})}
async function pDel(k){const d=await db();d.transaction("photos","readwrite").objectStore("photos").delete(k)}
function shrink(file,max=1280){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=img.width*s;c.height=img.height*s;c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);res(c.toDataURL("image/jpeg",.82))};img.onerror=rej;img.src=URL.createObjectURL(file)})}
async function hydratePhotos(){for(const el of document.querySelectorAll("img[data-pid]")){const v=await pGet(el.dataset.pid);if(v)el.src=v;else el.remove()}}
// ---------- i18n ----------
const T={
en:{home:"Home",milestones:"Milestones",log:"Log",growth:"Growth",more:"More",old:"old",weeks:"weeks",days:"days",months:"months",month:"month",stage:"Current checklist",next:"Coming up next",of:"of",done:"done",tip:"Try this week",talk:"Talking with your pediatrician",checkup:"Next checkup",fromCDC:"Milestone text: CDC “Learn the Signs. Act Early.”",achieved:"Date achieved",note:"Note",photo:"Photo",savebtn:"Save",cancel:"Cancel",uncheck:"Remove check",feed:"Feed",diaper:"Diaper",sleep:"Sleep",tummy:"Tummy time",left:"Left",right:"Right",bottle:"Bottle",wet:"Wet",dirty:"Dirty",both:"Both",start:"Start",stop:"Stop",today:"Today",recent:"Recent",none:"Nothing yet — tap a button above.",weight:"Weight",length:"Length",head:"Head",add:"Add",date:"Date",checkups:"Checkups & vaccines",firsts:"Firsts & memories",collage:"Monthly collage",share:"Share with partner",backup:"Backup & restore",settings:"Settings",print:"Printable checklist",doctor:"Doctor visit summary",corrected:"Use corrected age (born early)",weeksEarly:"Weeks born early",birth:"Birth date",name:"Name",theme:"Theme",auto:"Auto",light:"Light",dark:"Dark",units:"Units",exportB:"Export backup (JSON)",importB:"Restore / merge from file",ics:"Add checkups to Calendar (.ics)",shareLink:"Copy share link",shareFile:"Share data file",info:"Informational only — your pediatrician sets the actual schedule.",visitWhy:"Well-child visit times follow the AAP Bright Futures schedule; vaccine notes summarize the CDC child schedule.",addFirst:"Add a first",title:"Title",make:"Make collage",noPhotos:"No photos from this month yet. Add photos to milestones or firsts.",merged:"Merged ✓",saved:"Saved ✓",working:"Working toward",questions:"Questions for the doctor",privacy:"Everything stays on this phone. No account, no tracking.",backupReminder:"It's been a while since your last backup.",ago:"ago",oz:"oz",shareHelp:"Send the link or file to your partner. Opening it on their phone merges both sets of entries (photos only travel in the file).",corrAge:"Corrected age",install:"To install: tap Share ↗ then “Add to Home Screen”.",remindNote:"iPhone web apps can't schedule reminders without a server, so checkups go into your Calendar with an alert the day before.",allDone:"All checked — lovely!",weekly:"Weekly photos",letters:"Letters to Isaiah",recap:"Year recap",wkMissing:"Week {n} photo is missing — add it now",letterTo:"Letter to Isaiah (optional)",letterPh:"Dear Isaiah…",week:"Week",addPhoto:"Add photo",setHeader:"Use as home photo",flip:"Then & now",play:"Play",pause:"Pause",compare:"Compare two weeks",newLetter:"Write a letter",bdayIn:"{n} days until first birthday",bdayToday:"Happy birthday!",bdayN:"{n} days until birthday #{k}",recapLocked:"Preview — unlocks on {d}",milestonesDone:"Milestones reached",gained:"Growth this year",needPhotos:"Add weekly photos to see the flipbook.",min:"min",h:"h",edit:"Edit",editTime:"Change feed time",lastFeed:"Last feed",sinceFeed:"since last feed",gapPrev:"after previous",time:"Time"},
es:{home:"Inicio",milestones:"Indicadores",log:"Registro",growth:"Crecimiento",more:"Más",old:"de edad",weeks:"semanas",days:"días",months:"meses",month:"mes",stage:"Lista actual",next:"Lo que viene",of:"de",done:"logrados",tip:"Pruebe esta semana",talk:"Hablar con su pediatra",checkup:"Próximo chequeo",fromCDC:"Texto de indicadores: CDC “Aprenda los signos. Reaccione pronto.”",achieved:"Fecha en que lo logró",note:"Nota",photo:"Foto",savebtn:"Guardar",cancel:"Cancelar",uncheck:"Quitar marca",feed:"Comida",diaper:"Pañal",sleep:"Sueño",tummy:"Boca abajo",left:"Izq.",right:"Der.",bottle:"Biberón",wet:"Mojado",dirty:"Sucio",both:"Ambos",start:"Iniciar",stop:"Parar",today:"Hoy",recent:"Reciente",none:"Nada todavía — toque un botón.",weight:"Peso",length:"Largo",head:"Cabeza",add:"Agregar",date:"Fecha",checkups:"Chequeos y vacunas",firsts:"Primeras veces",collage:"Collage mensual",share:"Compartir con pareja",backup:"Copia de seguridad",settings:"Ajustes",print:"Lista para imprimir",doctor:"Resumen para el médico",corrected:"Usar edad corregida (prematuro)",weeksEarly:"Semanas de prematuridad",birth:"Fecha de nacimiento",name:"Nombre",theme:"Tema",auto:"Auto",light:"Claro",dark:"Oscuro",units:"Unidades",exportB:"Exportar copia (JSON)",importB:"Restaurar / combinar archivo",ics:"Agregar chequeos al Calendario (.ics)",shareLink:"Copiar enlace",shareFile:"Compartir archivo",info:"Solo informativo — su pediatra decide el calendario real.",visitWhy:"Las visitas siguen el calendario Bright Futures de la AAP; las vacunas resumen el calendario infantil de los CDC.",addFirst:"Agregar primera vez",title:"Título",make:"Crear collage",noPhotos:"Aún no hay fotos de este mes.",merged:"Combinado ✓",saved:"Guardado ✓",working:"En camino a",questions:"Preguntas para el médico",privacy:"Todo se queda en este teléfono. Sin cuenta, sin rastreo.",backupReminder:"Hace tiempo que no hace una copia de seguridad.",ago:"",oz:"oz",shareHelp:"Envíe el enlace o archivo a su pareja. Al abrirlo se combinan los datos (las fotos solo viajan en el archivo).",corrAge:"Edad corregida",install:"Para instalar: toque Compartir ↗ y “Agregar a inicio”.",remindNote:"Las apps web de iPhone no pueden programar recordatorios sin servidor; los chequeos se agregan al Calendario con alerta un día antes.",allDone:"¡Todo marcado!",weekly:"Fotos semanales",letters:"Cartas para Isaiah",recap:"Resumen del año",wkMissing:"Falta la foto de la semana {n} — agréguela",letterTo:"Carta para Isaiah (opcional)",letterPh:"Querido Isaiah…",week:"Semana",addPhoto:"Agregar foto",setHeader:"Usar como foto de inicio",flip:"Antes y ahora",play:"Reproducir",pause:"Pausa",compare:"Comparar dos semanas",newLetter:"Escribir una carta",bdayIn:"Faltan {n} días para su primer cumpleaños",bdayToday:"¡Feliz cumpleaños!",bdayN:"Faltan {n} días para el cumpleaños #{k}",recapLocked:"Vista previa — se abre el {d}",milestonesDone:"Indicadores logrados",gained:"Crecimiento este año",needPhotos:"Agregue fotos semanales para ver el álbum animado.",min:"min",h:"h",edit:"Editar",editTime:"Cambiar hora de comida",lastFeed:"Última comida",sinceFeed:"desde la última comida",gapPrev:"después de la anterior",time:"Hora"}};
const t=k=>T[S.lang][k]??T.en[k]??k;
const L=o=>o[S.lang]??o.en;
// ---------- age ----------
function addDays(iso,n){const d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return d}
function refDate(){return S.baby.useCorrected&&S.baby.weeksEarly>0?addDays(S.baby.birth,S.baby.weeksEarly*7):new Date(S.baby.birth+"T12:00:00")}
function ageOf(from,to=new Date()){const days=Math.floor((to-from)/864e5);let m=(to.getFullYear()-from.getFullYear())*12+to.getMonth()-from.getMonth();if(to.getDate()<from.getDate())m--;const anchor=new Date(from);anchor.setMonth(anchor.getMonth()+m);const md=Math.floor((to-anchor)/864e5);return{days,weeks:Math.floor(days/7),wd:days%7,months:Math.max(0,m),md}}
function stageIdx(months){let i=0;STAGES.forEach((s,k)=>{if(months>=s.months)i=k});return i}
const msId=(s,d,i)=>`${s.slug}:${d}:${i}`;
function stageProgress(s){let n=0,c=0;for(const d in s.m)s.m[d].forEach((_,i)=>{n++;if(S.ms[msId(s,d,i)])c++});return{n,c}}
const fmtDate=iso=>new Date(iso+"T12:00:00").toLocaleDateString(S.lang==="es"?"es-US":"en-US",{month:"short",day:"numeric",year:"numeric"});
// ---------- routing ----------
const TABS=[["home","🏡"],["milestones","🌱"],["log","🍼"],["growth","📈"],["more","☰"]];
let tab=location.hash.match(/^#(\w+)/)?.[1]||"home",selStage=null,growthMetric="w";
function nav(x){tab=x;history.replaceState(null,"","#"+x);render();scrollTo(0,0)}
function render(){
  document.documentElement.lang=S.lang;
  document.documentElement.dataset.theme=S.theme==="auto"?"":S.theme;
  $("#title").textContent=S.baby.name;$("#langBtn").textContent=S.lang==="en"?"ES":"EN";
  $("#tabs").innerHTML=TABS.map(([k,i])=>`<button class="${k===tab||(["checkups","firsts","share","settings","doctor","weekly","letters","recap"].includes(tab)&&k==="more")?"on":""}" data-tab="${k}"><span>${i}</span>${t(k)}</button>`).join("");
  ({home,milestones,log:logView,growth:growthView,more,checkups,firsts,share,settings,doctor,weekly,letters,recap}[tab]||home)();
  hydratePhotos();
}
const V=h=>$("#view").innerHTML=h;
function ring(p,size=120){const r=size/2-10,c=2*Math.PI*r;return `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--line)" stroke-width="12" fill="none"/><circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--acc)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" style="transition:stroke-dashoffset .6s"/></svg>`}
function nextVisit(){const b=new Date(S.baby.birth+"T12:00:00"),now=new Date();now.setHours(0,0,0,0);for(const v of VISITS){const d=visitDate(v);if(d>=now)return{v,d}}return null}
function visitDate(v){const b=new Date(S.baby.birth+"T12:00:00");if(v.d)b.setDate(b.getDate()+v.d);else b.setMonth(b.getMonth()+v.m);return b}
// ---------- HOME ----------
function home(){
  const real=ageOf(new Date(S.baby.birth+"T12:00:00")),a=ageOf(refDate());
  const si=stageIdx(a.months),s=STAGES[si],nx=STAGES[si+1],pr=stageProgress(s),working=a.months<s.months;
  const nv=nextVisit(),tip=s.tips[Math.floor(real.days/7)%s.tips.length];
  const today=todayISO(),tl=S.logs.filter(l=>l.start.slice(0,10)===today);
  const cnt=k=>tl.filter(l=>l.type===k).length;
  const nxItems=nx?Object.entries(nx.m).map(([d,a])=>[d,a[0]]):[];
  const needBackup=!S.lastBackup||(Date.now()-S.lastBackup>30*864e5)&&(Object.keys(S.ms).length+S.logs.length>5);
  const wk=real.weeks,hp=headerPid(),bd=birthdayInfo();
  V(`<section class="card avcard"><div class="avatar" id="avatar">${avatarHTML()}</div><div class="avinfo"><div class="age">${esc(S.baby.name)}</div><div class="mute">${real.weeks} ${t("weeks")} · ${real.months} ${t("months")}</div><div class="mute small">🎂 ${bd.txt}</div></div><button class="pphoto" data-tab="weekly" aria-label="${t("weekly")}">${hp?`<img data-pid="${hp}" alt="">`:`<span>📷</span>`}</button></section>
  ${!S.weekly[wk]?`<button class="note wprompt" data-tab="weekly">📸 ${t("wkMissing").replace("{n}",wk)}</button>`:""}
  <section class="card hero">
   <div class="ring">${ring(pr.n?pr.c/pr.n:0)}<div class="lbl">${pr.c}/${pr.n}<small>${t("done")}</small></div></div>
   <div><div class="age">${real.weeks} ${t("weeks")}${real.wd?`, ${real.wd} ${t("days")}`:""}</div>
   <div class="mute">${real.months} ${real.months===1?t("month"):t("months")}${real.md?`, ${real.md} ${t("days")}`:""} ${t("old")}</div>
   ${S.baby.useCorrected&&S.baby.weeksEarly?`<div class="mute small">${t("corrAge")}: ${a.weeks} ${t("weeks")} · ${a.months} ${t("months")}</div>`:""}
   <span class="chip">🌱 ${working?t("working")+" ":""}${L(s.label)}</span></div></section>
  ${needBackup&&S.lastBackup?`<div class="note" style="margin-top:12px">💾 ${t("backupReminder")} <a href="#share" data-tab="share">${t("backup")}</a></div>`:""}
  <section class="card"><h2>🌱 ${t("stage")}: ${L(s.label)}</h2>
   ${Object.entries(s.m).map(([d,arr])=>{const c=arr.filter((_,i)=>S.ms[msId(s,d,i)]).length;return `<div class="row" style="margin:6px 0"><span style="flex:0 0 26px">${DOMAINS[d].icon}</span><span class="small" style="flex:3">${L(DOMAINS[d]).split(" (")[0]}</span><span class="small mute" style="flex:0 0 40px;text-align:right">${c}/${arr.length}</span></div>`}).join("")}
   <button class="btn" data-tab="milestones">${t("milestones")} →</button></section>
  <section class="card"><h2>🍼 ${t("today")}</h2>${lastFeedLine()}<div class="grid4">
   ${quick("feed","🍼")}${quick("diaper","🧷")}${timerBtn("sleep","😴")}${timerBtn("tummy","🐢")}</div>
   <p class="mute small" style="margin:10px 0 0">🍼 ${cnt("feed")} · 🧷 ${cnt("diaper")} · 😴 ${dur(tl.filter(l=>l.type==="sleep"))} · 🐢 ${dur(tl.filter(l=>l.type==="tummy"))}</p></section>
  <section class="card"><h2>💡 ${t("tip")}</h2><p style="margin:0">${esc(L({en:tip[0],es:tip[1]}))}</p><p class="mute small">— CDC</p></section>
  ${nx?`<section class="card"><h2>✨ ${t("next")}: ${L(nx.label)}</h2>${nxItems.map(([d,x])=>`<div class="row" style="margin:6px 0"><span style="flex:0 0 26px">${DOMAINS[d].icon}</span><span style="flex:1">${esc(L({en:x[0],es:x[1]}))}</span></div>`).join("")}<button class="btn sec" data-stage="${si+1}">${t("milestones")} · ${L(nx.label)}</button></section>`:""}
  ${nv?`<section class="card"><h2>🩺 ${t("checkup")}</h2><div class="age" style="font-size:20px">${L(nv.v.label)}</div><div class="mute">${nv.d.toLocaleDateString(S.lang==="es"?"es-US":"en-US",{weekday:"short",month:"long",day:"numeric"})}</div>${nv.v.vax.en?`<p class="small">${esc(L(nv.v.vax))}</p>`:""}<button class="btn sec" data-tab="checkups">${t("checkups")}</button></section>`:""}
  <p class="mute small" style="text-align:center">${t("privacy")}</p>`)}
function quick(k,i){return `<button class="big" data-quick="${k}"><span>${i}</span>${t(k)}</button>`}
function timerBtn(k,i){const run=S.timers[k];return `<button class="big ${run?"run":""}" data-timer="${k}"><span>${i}</span>${t(k)}${run?` · ${t("stop")} (${Math.round((Date.now()-run)/6e4)} ${t("min")})`:""}</button>`}
function dur(arr){const m=Math.round(arr.reduce((a,l)=>a+((l.end?new Date(l.end):new Date())-new Date(l.start)),0)/6e4);return m>=60?`${Math.floor(m/60)}${t("h")} ${m%60}${t("min")}`:`${m}${t("min")}`}
// ---------- MILESTONES ----------
function milestones(){
  const a=ageOf(refDate()),cur=stageIdx(a.months);if(selStage==null)selStage=cur;const s=STAGES[selStage],pr=stageProgress(s);
  V(`<div class="stagebar">${STAGES.map((x,i)=>`<button class="${i===selStage?"on":""}" data-stage="${i}">${L(x.label)}${i===cur?" •":""}</button>`).join("")}</div>
  <section class="card"><div class="row"><div><h2 style="margin:0">${L(s.label)}</h2><div class="mute small">${pr.c} ${t("of")} ${pr.n} ${t("done")}${pr.c===pr.n?" · "+t("allDone"):""}</div></div><div style="flex:0 0 64px;position:relative">${ring(pr.n?pr.c/pr.n:0,64)}</div></div>
  <p class="mute small">${esc(L(CDC_NOTE))}</p>
  ${Object.entries(s.m).map(([d,arr])=>`<div class="dom"><span class="dot" style="background:var(--${d})"></span>${L(DOMAINS[d])}</div>`+arr.map((x,i)=>{const id=msId(s,d,i),r=S.ms[id];return `<button class="ms ${r?"done":""}" data-ms="${id}"><span class="chk">${r?"✓":""}</span><span class="t">${esc(L({en:x[0],es:x[1]}))}${r?`<div class="meta">✓ ${fmtDate(r.date)}${r.note?" · "+esc(r.note):""}</div>`:""}</span>${r?.photo?`<img class="thumb" data-pid="${r.photo}" alt="">`:""}</button>`}).join("")).join("")}
  </section>
  <section class="card"><h2>💡 ${t("tip")}</h2>${s.tips.map(x=>`<p>• ${esc(L({en:x[0],es:x[1]}))}</p>`).join("")}</section>
  <section class="card"><details><summary>💬 ${t("talk")}</summary><p class="note">${esc(L(CDC_CONCERN))}</p><p class="small mute">${L(CDC_NOTE)}</p></details></section>
  <div class="row"><button class="btn ghost" data-print="${selStage}">🖨️ ${t("print")}</button><button class="btn ghost" data-tab="doctor">🩺 ${t("doctor")}</button></div>
  <p class="mute small">${t("fromCDC")} — <a href="${(S.lang==="es"?CDC_SRC_ES:CDC_SRC_EN)+s.slug}.html" target="_blank" rel="noopener">cdc.gov</a></p>`)}
function openMs(id){
  const [slug,d,i]=id.split(":"),s=STAGES.find(x=>x.slug===slug),x=s.m[d][+i],r=S.ms[id]||{};
  sheet(`<h2 style="margin-top:0">${DOMAINS[d].icon} ${esc(L({en:x[0],es:x[1]}))}</h2>
   <label>${t("achieved")}</label><input type="date" id="fDate" value="${r.date||todayISO()}" max="${todayISO()}">
   <label>${t("note")}</label><textarea id="fNote">${esc(r.note||"")}</textarea>
   <label>💌 ${t("letterTo")}</label><textarea id="fLetter" placeholder="${t("letterPh")}">${esc(r.letter||"")}</textarea>
   <label>${t("photo")}</label>${r.photo?`<img data-pid="${r.photo}" style="width:100%;border-radius:14px;margin-bottom:6px" id="fPrev">`:`<img id="fPrev" style="width:100%;border-radius:14px;display:none">`}
   <input type="file" id="fPhoto" accept="image/*">
   <button class="btn" id="fSave">${t("savebtn")}</button>
   ${r.date?`<button class="btn sec" id="fDel">${t("uncheck")}</button>`:""}<button class="btn ghost" data-close>${t("cancel")}</button>`);
  let photo=r.photo;
  $("#fPhoto").onchange=async e=>{const f=e.target.files[0];if(!f)return;const v=await shrink(f);photo="p_"+uid();await pPut(photo,v);$("#fPrev").src=v;$("#fPrev").style.display="block"};
  $("#fSave").onclick=()=>{const was=!!S.ms[id];S.ms[id]={date:$("#fDate").value||todayISO(),note:$("#fNote").value.trim(),letter:$("#fLetter").value.trim(),photo,updated:Date.now()};delete S.deleted[id];save();closeSheet();render();toast(t("saved"));if(!was)setAvatar("happy",3500,true)};
  if($("#fDel"))$("#fDel").onclick=()=>{delete S.ms[id];S.deleted[id]=Date.now();save();closeSheet();render()};
}
// ---------- LOG ----------
function gapStr(ms){const m=Math.max(0,Math.round(ms/6e4));return m>=60?`${Math.floor(m/60)}${t("h")} ${m%60}${t("min")}`:`${m} ${t("min")}`}
function feedsSorted(){return S.logs.filter(l=>l.type==="feed").sort((a,b)=>new Date(a.start)-new Date(b.start))}
function lastFeedLine(){const f=feedsSorted(),last=f[f.length-1];if(!last)return "";return `<p class="lastfeed">🍼 ${t("lastFeed")}: <b>${gapStr(Date.now()-new Date(last.start))}</b> ${t("ago")} <span class="mute small">(${new Date(last.start).toLocaleTimeString(S.lang==="es"?"es-US":"en-US",{hour:"numeric",minute:"2-digit"})})</span></p>`}
function logView(){
  const recent=[...S.logs].sort((a,b)=>new Date(b.start)-new Date(a.start)).slice(0,40);
  const fs=feedsSorted(),prev={};fs.forEach((f,i)=>{if(i)prev[f.id]=new Date(f.start)-new Date(fs[i-1].start)});
  const loc=S.lang==="es"?"es-US":"en-US";
  V(`<section class="card"><h2>🍼 ${t("log")}</h2>${lastFeedLine()}<div class="grid4">${quick("feed","🍼")}${quick("diaper","🧷")}${timerBtn("sleep","😴")}${timerBtn("tummy","🐢")}</div></section>
  <section class="card"><h2>${t("recent")}</h2>${recent.length?recent.map(l=>`<div class="log"><span>${{feed:"🍼",diaper:"🧷",sleep:"😴",tummy:"🐢"}[l.type]} ${esc(logLabel(l))}${l.type==="feed"&&prev[l.id]!=null?`<br><span class="mute small gap">⏱ ${gapStr(prev[l.id])} ${t("gapPrev")}</span>`:""}</span><span class="mute small">${new Date(l.start).toLocaleString(loc,{weekday:"short",hour:"numeric",minute:"2-digit"})}${l.type==="feed"?`<button data-editlog="${l.id}" aria-label="${t("edit")}">✏️</button>`:""}<button data-dellog="${l.id}" aria-label="delete">✕</button></span></div>`).join(""):`<p class="mute">${t("none")}</p>`}</section>`)}
function pad2(n){return String(n).padStart(2,"0")}
function toLocalInput(iso){const d=new Date(iso);return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`}
function toLocalTime(iso){const d=new Date(iso);return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`}
function editLog(id){const l=S.logs.find(x=>x.id===id);if(!l)return;const loc=S.lang==="es"?"es-US":"en-US";
  sheet(`<h2 style="margin-top:0">🍼 ${t("editTime")}</h2><p class="mute">${esc(logLabel(l))}</p><label>${t("time")}</label><p class="mute small">${new Date(l.start).toLocaleDateString(loc,{weekday:"short",month:"short",day:"numeric"})}</p><input id="eTime" type="time" value="${toLocalTime(l.start)}"><button class="btn" id="eSave">${t("savebtn")}</button><button class="btn ghost" data-close>${t("cancel")}</button>`);
  $("#eSave").onclick=()=>{const v=$("#eTime").value;const m=/^(\d{1,2}):(\d{2})/.exec(v||"");if(!m)return;const d=new Date(l.start);d.setHours(+m[1],+m[2],0,0);if(isNaN(d))return;l.start=d.toISOString();l.updated=Date.now();save();closeSheet();render();toast(t("saved"))}}
function logLabel(l){if(l.type==="feed")return t(l.detail?.side||"feed")+(l.detail?.oz?` · ${l.detail.oz} ${t("oz")}`:"");if(l.type==="diaper")return t(l.detail?.kind||"diaper");const m=Math.round(((l.end?new Date(l.end):new Date())-new Date(l.start))/6e4);return `${t(l.type)} · ${m} ${t("min")}${l.end?"":" …"}`}
function addLog(type,detail,start=new Date().toISOString(),end=null){S.logs.push({id:uid(),type,detail,start,end,updated:Date.now()});save();render();toast(t("saved"))}
function quickSheet(k){
  if(k==="feed")sheet(`<h2 style="margin-top:0">🍼 ${t("feed")}</h2><div class="choices"><button data-f="left">${t("left")}</button><button data-f="right">${t("right")}</button><button data-f="bottle">${t("bottle")}</button></div><label>${t("bottle")} (${t("oz")})</label><input id="oz" type="number" inputmode="decimal" step="0.5" placeholder="3"><button class="btn ghost" data-close>${t("cancel")}</button>`);
  else sheet(`<h2 style="margin-top:0">🧷 ${t("diaper")}</h2><div class="choices"><button data-d="wet">💧 ${t("wet")}</button><button data-d="dirty">💩 ${t("dirty")}</button><button data-d="both">${t("both")}</button></div><button class="btn ghost" data-close>${t("cancel")}</button>`);
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{const oz=parseFloat($("#oz").value);closeSheet();addLog("feed",{side:b.dataset.f,oz:b.dataset.f==="bottle"&&oz?oz:undefined});setAvatar("feeding",4000)});
  document.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{closeSheet();addLog("diaper",{kind:b.dataset.d})});
}
function toggleTimer(k){if(S.timers[k]){addLog(k,null,new Date(S.timers[k]).toISOString(),new Date().toISOString());delete S.timers[k];save();render()}else{S.timers[k]=Date.now();save();render()}}
// ---------- GROWTH ----------
const kgToLbOz=kg=>{const oz=kg*35.274;return [Math.floor(oz/16),Math.round((oz%16)*10)/10]};
function fmtG(g,k){if(g[k]==null)return "—";if(k==="w")return S.units==="us"?(([l,o])=>`${l} lb ${o} oz`)(kgToLbOz(g.w)):`${g.w.toFixed(2)} kg`;return S.units==="us"?`${(g[k]/2.54).toFixed(2)} in`:`${g[k].toFixed(1)} cm`}
function growthView(){
  const gs=[...S.growth].sort((a,b)=>a.date.localeCompare(b.date));
  V(`<section class="card"><h2>📈 ${t("growth")}</h2><div class="stagebar">${[["w","weight"],["l","length"],["h","head"]].map(([k,n])=>`<button class="${growthMetric===k?"on":""}" data-gm="${k}">${t(n)}</button>`).join("")}</div>${chart(gs)}</section>
  <section class="card"><h2>${t("add")}</h2><label>${t("date")}</label><input type="date" id="gDate" value="${todayISO()}">
  <label>${t("weight")}</label>${S.units==="us"?`<div class="row"><input id="gLb" type="number" inputmode="numeric" placeholder="lb"><input id="gOz" type="number" inputmode="decimal" step="0.1" placeholder="oz"></div>`:`<input id="gKg" type="number" inputmode="decimal" step="0.01" placeholder="kg">`}
  <div class="row"><div><label>${t("length")} (${S.units==="us"?"in":"cm"})</label><input id="gL" type="number" inputmode="decimal" step="0.1"></div><div><label>${t("head")} (${S.units==="us"?"in":"cm"})</label><input id="gH" type="number" inputmode="decimal" step="0.1"></div></div>
  <button class="btn" id="gSave">${t("savebtn")}</button></section>
  <section class="card">${gs.length?gs.slice().reverse().map(g=>`<div class="log"><span><b>${fmtDate(g.date)}</b><br><span class="small">${fmtG(g,"w")} · ${fmtG(g,"l")} · ${fmtG(g,"h")}</span></span><button data-delg="${g.id}">✕</button></div>`).join(""):`<p class="mute">${t("none")}</p>`}</section>`);
  $("#gSave").onclick=()=>{const n=id=>{const v=parseFloat($(id)?.value);return isNaN(v)?null:v};let w=null;
    if(S.units==="us"){const lb=n("#gLb"),oz=n("#gOz");if(lb!=null||oz!=null)w=((lb||0)*16+(oz||0))/35.274}else w=n("#gKg");
    const f=S.units==="us"?2.54:1,l=n("#gL"),h=n("#gH");if(w==null&&l==null&&h==null)return;
    S.growth.push({id:uid(),date:$("#gDate").value||todayISO(),w,l:l!=null?l*f:null,h:h!=null?h*f:null,updated:Date.now()});save();render();toast(t("saved"))};
}
function chart(gs){const k=growthMetric,pts=gs.filter(g=>g[k]!=null);if(pts.length<1)return `<p class="mute">${t("none")}</p>`;
  const conv=v=>k==="w"?(S.units==="us"?v*2.20462:v):(S.units==="us"?v/2.54:v),unit=k==="w"?(S.units==="us"?"lb":"kg"):(S.units==="us"?"in":"cm");
  const b=new Date(S.baby.birth+"T12:00:00"),xs=pts.map(p=>(new Date(p.date+"T12:00:00")-b)/864e5/30.44),ys=pts.map(p=>conv(p[k]));
  const W=320,H=180,P=30,x0=0,x1=Math.max(3,Math.ceil(Math.max(...xs))+1),y0=Math.floor(Math.min(...ys)*.9),y1=Math.ceil(Math.max(...ys)*1.05)||1;
  const X=x=>P+(x-x0)/(x1-x0)*(W-P-8),Y=y=>H-20-(y-y0)/(y1-y0||1)*(H-34);
  let grid="";for(let m=0;m<=x1;m+=x1>12?3:1)grid+=`<line x1="${X(m)}" x2="${X(m)}" y1="10" y2="${H-20}" stroke="var(--line)"/><text x="${X(m)}" y="${H-6}" text-anchor="middle">${m}${S.lang==="es"?"m":"mo"}</text>`;
  for(let i=0;i<=3;i++){const v=y0+(y1-y0)*i/3;grid+=`<text x="2" y="${Y(v)+3}">${v.toFixed(1)}</text>`}
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${t("growth")}">${grid}<polyline fill="none" stroke="var(--acc)" stroke-width="3" stroke-linejoin="round" points="${xs.map((x,i)=>X(x)+","+Y(ys[i])).join(" ")}"/>${xs.map((x,i)=>`<circle cx="${X(x)}" cy="${Y(ys[i])}" r="4.5" fill="var(--card)" stroke="var(--acc)" stroke-width="2.5"/>`).join("")}</svg><p class="mute small">${unit} · ${S.lang==="es"?"edad en meses":"age in months"}. ${S.lang==="es"?"Su pediatra puede comparar con las curvas de la OMS.":"Your pediatrician can compare against WHO growth charts."}</p>`}
// ---------- MORE ----------
function more(){V(`<section class="card">${[["weekly","📸"],["letters","💌"],["recap","🎂"],["checkups","🩺"],["doctor","📋"],["firsts","⭐"],["share","🔁"],["settings","⚙️"]].map(([k,i])=>`<button class="btn sec" style="text-align:left" data-tab="${k}">${i}  ${t(k==="share"?"share":k)}${k==="share"?" · "+t("backup"):""}</button>`).join("")}
  <button class="btn sec" style="text-align:left" data-print="all">🖨️  ${t("print")}</button></section>
  <section class="card mute small"><p>${t("privacy")}</p><p>${t("install")}</p><p>${t("fromCDC")}: <a href="${CDC_SRC_EN}2-months.html" target="_blank" rel="noopener">cdc.gov/act-early</a>. ${t("visitWhy")}</p></section>`)}
function checkups(){const now=new Date();now.setHours(0,0,0,0);const nv=nextVisit();
  V(`<section class="card"><h2>🩺 ${t("checkups")}</h2><p class="note small">${t("info")}</p><div class="timeline">${VISITS.map(v=>{const d=visitDate(v),past=d<now;return `<div class="tl ${past?"past":""} ${nv&&nv.v===v?"next":""}"><div>${L(v.label)} · <span class="mute">${d.toLocaleDateString(S.lang==="es"?"es-US":"en-US",{month:"short",day:"numeric",year:"numeric"})}</span></div>${v.vax.en?`<div class="small mute">${esc(L(v.vax))}</div>`:""}</div>`}).join("")}</div>
  <button class="btn" id="icsBtn">📅 ${t("ics")}</button><p class="mute small">${t("remindNote")}</p><p class="mute small">${t("visitWhy")} <a href="https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html" target="_blank" rel="noopener">CDC schedule</a> · <a href="https://www.aap.org/periodicityschedule" target="_blank" rel="noopener">AAP</a></p></section>`);
  $("#icsBtn").onclick=exportICS}
function exportICS(){const now=new Date();const st=d=>d.toISOString().slice(0,10).replace(/-/g,"");const stamp=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  const ev=VISITS.filter(v=>visitDate(v)>=now).map(v=>{const d=visitDate(v),e=new Date(d);e.setDate(e.getDate()+1);return ["BEGIN:VEVENT",`UID:isaiah-${v.m??"d"+v.d}@milestones.local`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${st(d)}`,`DTEND;VALUE=DATE:${st(e)}`,`SUMMARY:${S.baby.name} – ${L(v.label)} ${S.lang==="es"?"chequeo (aprox.)":"well-baby checkup (approx.)"}`,`DESCRIPTION:${(L(v.vax)||"").replace(/,/g,"\\,")} — ${t("info").replace(/,/g,"\\,")}`,"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Checkup reminder","TRIGGER:-P1D","END:VALARM","END:VEVENT"].join("\r\n")});
  download(["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Isaiah Milestones//EN","CALSCALE:GREGORIAN",...ev,"END:VCALENDAR"].join("\r\n"),"isaiah-checkups.ics","text/calendar")}
function doctor(){const a=ageOf(refDate()),s=STAGES[stageIdx(a.months)],gs=[...S.growth].sort((x,y)=>y.date.localeCompare(x.date))[0];
  const done=Object.entries(S.ms).sort((x,y)=>y[1].date.localeCompare(x[1].date)).slice(0,30);
  V(`<section class="card"><h2>📋 ${t("doctor")}</h2><p><b>${esc(S.baby.name)}</b> · ${fmtDate(S.baby.birth)} · ${a.weeks} ${t("weeks")}</p>${gs?`<p class="small">${fmtDate(gs.date)}: ${fmtG(gs,"w")} · ${fmtG(gs,"l")} · ${fmtG(gs,"h")}</p>`:""}
  <h3>${L(s.label)} — ${stageProgress(s).c}/${stageProgress(s).n}</h3>${done.map(([id,r])=>{const[sl,d,i]=id.split(":"),st=STAGES.find(x=>x.slug===sl);return `<div class="small">✓ ${esc(L({en:st.m[d][i][0],es:st.m[d][i][1]}))} <span class="mute">(${fmtDate(r.date)})</span></div>`}).join("")||`<p class="mute">${t("none")}</p>`}
  <h3>${t("questions")}</h3>${L(CDC_SHARE).map(q=>`<p class="small">• ${esc(q)}</p>`).join("")}<textarea id="qs" placeholder="…">${esc(S.questions||"")}</textarea>
  <button class="btn" id="dPrint">🖨️ ${t("print")}</button></section>`);
  $("#qs").oninput=e=>{S.questions=e.target.value;save()};$("#dPrint").onclick=()=>{$("#print").innerHTML=$("#view").innerHTML;window.print()}}
function printChecklist(which){const list=which==="all"?STAGES:[STAGES[+which]];
  $("#print").innerHTML=`<h1>${esc(S.baby.name)} — ${S.lang==="es"?"Indicadores del desarrollo (CDC)":"Developmental milestones (CDC)"}</h1>`+list.map(s=>`<h2>${L(s.label)}</h2>`+Object.entries(s.m).map(([d,arr])=>`<h3>${L(DOMAINS[d])}</h3><ul>${arr.map((x,i)=>{const r=S.ms[msId(s,d,i)];return `<li>${r?"☑":"☐"} ${esc(L({en:x[0],es:x[1]}))}${r?` — ${fmtDate(r.date)}`:""}</li>`}).join("")}</ul>`).join("")).join("")+`<p><small>${esc(L(CDC_CONCERN))}</small></p><p><small>Source: ${S.lang==="es"?CDC_SRC_ES:CDC_SRC_EN}</small></p>`;
  setTimeout(()=>window.print(),50)}
// ---------- FIRSTS + COLLAGE ----------
function monthOfLife(iso){return ageOf(new Date(S.baby.birth+"T12:00:00"),new Date(iso+"T12:00:00")).months}
function firsts(){
  const items=[...S.firsts.map(f=>({...f,kind:"f"})),...Object.entries(S.ms).map(([id,r])=>{const[sl,d,i]=id.split(":"),st=STAGES.find(x=>x.slug===sl);return{id,kind:"m",date:r.date,title:L({en:st.m[d][i][0],es:st.m[d][i][1]}),note:r.note,photo:r.photo}})].sort((a,b)=>b.date.localeCompare(a.date));
  const cur=ageOf(new Date(S.baby.birth+"T12:00:00")).months;
  V(`<section class="card"><h2>⭐ ${t("firsts")}</h2><button class="btn" id="addF">＋ ${t("addFirst")}</button>
  <div class="timeline" style="margin-top:12px">${items.map(x=>`<div class="tl past"><b>${esc(x.title)}</b> <span class="mute small">${fmtDate(x.date)}</span>${x.note?`<div class="small">${esc(x.note)}</div>`:""}${x.photo?`<img data-pid="${x.photo}" style="width:100%;max-width:260px;border-radius:14px;margin-top:6px">`:""}${x.kind==="f"?`<div><button class="pill small" data-delf="${x.id}">✕</button></div>`:""}</div>`).join("")||`<p class="mute">${t("none")}</p>`}</div></section>
  <section class="card"><h2>🖼️ ${t("collage")}</h2><label>${t("month")}</label><select id="cm">${Array.from({length:cur+1},(_,i)=>`<option value="${i}" ${i===cur?"selected":""}>${S.lang==="es"?"Mes":"Month"} ${i} (${i}–${i+1})</option>`).join("")}</select><button class="btn" id="mkC">${t("make")}</button><div id="cOut"></div></section>`);
  $("#addF").onclick=()=>{sheet(`<h2 style="margin-top:0">⭐ ${t("addFirst")}</h2><label>${t("title")}</label><input id="ft" placeholder="${S.lang==="es"?"Primera sonrisa":"First smile"}"><label>${t("date")}</label><input type="date" id="fd" value="${todayISO()}"><label>${t("note")}</label><textarea id="fn"></textarea><label>${t("photo")}</label><input type="file" id="fp" accept="image/*"><button class="btn" id="fs">${t("savebtn")}</button><button class="btn ghost" data-close>${t("cancel")}</button>`);
    $("#fs").onclick=async()=>{const title=$("#ft").value.trim();if(!title)return;let photo;const f=$("#fp").files[0];if(f){photo="p_"+uid();await pPut(photo,await shrink(f))}S.firsts.push({id:uid(),title,date:$("#fd").value||todayISO(),note:$("#fn").value.trim(),photo,updated:Date.now()});save();closeSheet();render()}};
  $("#mkC").onclick=()=>collage(+$("#cm").value,items);
}
async function collage(m,items){const ph=items.filter(x=>x.photo&&monthOfLife(x.date)===m).slice(0,9);if(!ph.length){$("#cOut").innerHTML=`<p class="mute">${t("noPhotos")}</p>`;return}
  const c=document.createElement("canvas");c.width=c.height=1080;const g=c.getContext("2d");g.fillStyle="#fbf4ec";g.fillRect(0,0,1080,1080);
  const n=Math.ceil(Math.sqrt(ph.length)),pad=24,top=170,cell=(1080-pad*(n+1))/n,rows=Math.ceil(ph.length/n),ch=Math.min(cell,(1080-top-pad*(rows+1))/rows);
  g.fillStyle="#3b2f2a";g.font="bold 64px -apple-system,sans-serif";g.textAlign="center";g.fillText(`${S.baby.name} · ${S.lang==="es"?"Mes":"Month"} ${m}`,540,100);g.font="32px -apple-system,sans-serif";g.fillStyle="#e8957a";g.fillText("♥",540,145);
  for(let i=0;i<ph.length;i++){const src=await pGet(ph[i].photo);if(!src)continue;const img=await new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src=src});
    const x=pad+(i%n)*(cell+pad),y=top+pad+Math.floor(i/n)*(ch+pad),s=Math.max(cell/img.width,ch/img.height),sw=cell/s,sh=ch/s;
    g.save();g.beginPath();g.roundRect?g.roundRect(x,y,cell,ch,28):g.rect(x,y,cell,ch);g.clip();g.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,cell,ch);g.restore()}
  const url=c.toDataURL("image/jpeg",.9);$("#cOut").innerHTML=`<img src="${url}" style="width:100%;border-radius:16px;margin-top:10px"><button class="btn sec" id="cShare">↗ ${t("shareFile")}</button>`;
  $("#cShare").onclick=async()=>{const b=await (await fetch(url)).blob(),f=new File([b],`isaiah-month-${m}.jpg`,{type:"image/jpeg"});if(navigator.canShare?.({files:[f]}))navigator.share({files:[f]}).catch(()=>{});else download(b,f.name,"image/jpeg")}}
// ---------- SHARE / BACKUP ----------
function share(){V(`<section class="card"><h2>🔁 ${t("share")}</h2><p class="mute small">${t("shareHelp")}</p><button class="btn" id="sLink">🔗 ${t("shareLink")}</button><button class="btn sec" id="sFile">📤 ${t("shareFile")}</button></section>
  <section class="card"><h2>💾 ${t("backup")}</h2>${S.lastBackup?`<p class="mute small">✓ ${new Date(S.lastBackup).toLocaleDateString()}</p>`:""}<button class="btn" id="bExp">${t("exportB")}</button><label class="btn sec" style="display:flex;align-items:center;justify-content:center">${t("importB")}<input type="file" id="bImp" accept="application/json,.json" hidden></label></section>`);
  $("#sLink").onclick=async()=>{const {photosOmitted,...d}=await bundle(false);const url=location.origin+location.pathname+"#import="+await pack(d);
    if(navigator.share)navigator.share({title:S.baby.name,url}).catch(()=>{});else{await navigator.clipboard?.writeText(url);toast("✓")}};
  $("#sFile").onclick=async()=>{const blob=new Blob([JSON.stringify(await bundle(true))],{type:"application/json"}),f=new File([blob],`isaiah-share-${todayISO()}.json`,{type:"application/json"});if(navigator.canShare?.({files:[f]}))navigator.share({files:[f]}).catch(()=>{});else download(blob,f.name,"application/json")};
  $("#bExp").onclick=async()=>{download(JSON.stringify(await bundle(true)),`isaiah-backup-${todayISO()}.json`,"application/json");S.lastBackup=Date.now();save()};
  $("#bImp").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{await merge(JSON.parse(await f.text()));toast(t("merged"))}catch(err){alert("Invalid file")}render()}}
async function bundle(withPhotos){const {timers,lastBackup,...rest}=S;const out={app:"isaiah-milestones",v:1,exported:new Date().toISOString(),data:rest};if(withPhotos)out.photos=await pAll();return out}
async function pack(o){const bytes=new TextEncoder().encode(JSON.stringify(o));let b=bytes,z="0";if(window.CompressionStream){b=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());z="1"}let s="";b.forEach(c=>s+=String.fromCharCode(c));return z+btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function unpack(str){const z=str[0],bin=atob(str.slice(1).replace(/-/g,"+").replace(/_/g,"/"));let b=Uint8Array.from(bin,c=>c.charCodeAt(0));if(z==="1")b=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());return JSON.parse(new TextDecoder().decode(b))}
async function merge(o){if(o.app!=="isaiah-milestones")throw 0;const d=o.data;
  if(o.photos)for(const[k,v]of Object.entries(o.photos))if(typeof v==="string"&&v.startsWith("data:image/"))await pPut(k,v);
  const del=Object.assign({},d.deleted||{});for(const[k,v]of Object.entries(S.deleted))del[k]=Math.max(v,del[k]||0);S.deleted=del;
  for(const[id,r]of Object.entries(d.ms||{}))if((!S.ms[id]||S.ms[id].updated<r.updated)&&!(del[id]>r.updated))S.ms[id]=r;
  for(const id in S.ms)if(del[id]>S.ms[id].updated)delete S.ms[id];
  for(const[w,r]of Object.entries(d.weekly||{}))if(!S.weekly[w]||S.weekly[w].updated<r.updated)S.weekly[w]=r;
  if(d.headerPhoto&&!S.headerPhoto)S.headerPhoto=d.headerPhoto;
  for(const k of["logs","growth","firsts","letters"]){const map=new Map(S[k].map(x=>[x.id,x]));for(const x of d[k]||[])if(!map.has(x.id)||map.get(x.id).updated<x.updated)map.set(x.id,x);S[k]=[...map.values()].filter(x=>!(del[x.id]>=x.updated))}
  if(d.baby&&!localStorage.getItem(KEY+".babySet"))S.baby=d.baby;save()}
function download(data,name,type){const b=data instanceof Blob?data:new Blob([data],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
// ---------- SETTINGS ----------
function settings(){V(`<section class="card"><h2>⚙️ ${t("settings")}</h2>
  <label>${t("name")}</label><input id="sN" value="${esc(S.baby.name)}"><label>${t("birth")}</label><input type="date" id="sB" value="${S.baby.birth}">
  <label style="display:flex;gap:10px;align-items:center;color:var(--ink);font-size:16px"><input type="checkbox" id="sC" style="width:26px;height:26px" ${S.baby.useCorrected?"checked":""}> ${t("corrected")}</label>
  <label>${t("weeksEarly")}</label><input type="number" id="sW" min="0" max="16" value="${S.baby.weeksEarly}">
  <label>${t("theme")}</label><div class="choices">${["auto","light","dark"].map(x=>`<button data-theme="${x}" style="${S.theme===x?"background:var(--acc);color:#fff":""}">${t(x)}</button>`).join("")}</div>
  <label>${t("units")}</label><div class="choices">${[["us","lb / oz / in"],["metric","kg / cm"]].map(([k,n])=>`<button data-units="${k}" style="${S.units===k?"background:var(--acc);color:#fff":""}">${n}</button>`).join("")}</div>
  <button class="btn" id="sSave">${t("savebtn")}</button></section><section class="card" id="syncCard">${typeof syncCardInner==="function"?syncCardInner():""}</section><p class="mute small">${S.lang==="es"?"La CDC usa la edad corregida para prematuros hasta los 2 años.":"CDC uses corrected age for babies born prematurely (typically until age 2)."}</p>`);
  $("#sSave").onclick=()=>{S.baby={name:$("#sN").value.trim()||"Isaiah",birth:$("#sB").value||S.baby.birth,useCorrected:$("#sC").checked,weeksEarly:Math.max(0,+$("#sW").value||0)};localStorage.setItem(KEY+".babySet","1");selStage=null;save();render();toast(t("saved"))}}
// ---------- sheet / toast / events ----------
function sheet(h){$("#sheetCard").innerHTML=h;$("#sheet").classList.remove("hidden");hydratePhotos()}
function closeSheet(){$("#sheet").classList.add("hidden")}
function toast(m){const e=$("#toast");e.textContent=m;e.classList.remove("hidden");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.add("hidden"),1600)}
document.addEventListener("click",e=>{const el=e.target.closest("button,a,[data-close]");if(!el)return;const D=el.dataset;
  if(e.target===$("#sheet")){closeSheet();return}
  if(D.tab){e.preventDefault();closeSheet();nav(D.tab)}else if(D.stage!=null){selStage=+D.stage;nav("milestones")}
  else if(D.ms)openMs(D.ms);else if(D.quick)quickSheet(D.quick);else if(D.timer)toggleTimer(D.timer);
  else if(D.editlog)editLog(D.editlog);
  else if(D.dellog){S.logs=S.logs.filter(l=>l.id!==D.dellog);S.deleted[D.dellog]=Date.now();save();render()}
  else if(D.delg){S.growth=S.growth.filter(l=>l.id!==D.delg);S.deleted[D.delg]=Date.now();save();render()}
  else if(D.delf){const f=S.firsts.find(x=>x.id===D.delf);if(f?.photo)pDel(f.photo);S.firsts=S.firsts.filter(l=>l.id!==D.delf);S.deleted[D.delf]=Date.now();save();render()}
  else if(D.dell){S.letters=S.letters.filter(l=>l.id!==D.dell);S.deleted[D.dell]=Date.now();save();render()}
  else if(D.gm){growthMetric=D.gm;render()}else if(D.print!=null)printChecklist(D.print)
  else if(D.theme){S.theme=D.theme;save();render()}else if(D.units){S.units=D.units;save();render()}
  else if(D.close!=null)closeSheet()});
$("#sheet").addEventListener("click",e=>{if(e.target.id==="sheet")closeSheet()});
$("#langBtn").onclick=()=>{S.lang=S.lang==="en"?"es":"en";save();render()};
setInterval(()=>{if((Object.keys(S.timers).length||S.logs.some(l=>l.type==="feed"))&&$("#sheet").classList.contains("hidden")&&["home","log"].includes(tab))render()},30000);
setTimeout(async()=>{const m=location.hash.match(/^#import=(.+)$/);if(m){try{const o=await unpack(m[1]);if(confirm(S.lang==="es"?"¿Combinar los datos compartidos?":"Merge shared data from your partner?")){await merge(o);toast(t("merged"))}}catch(e){alert("Invalid share link")}tab="home";history.replaceState(null,"","#home")}render()},0);
if("serviceWorker" in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js");
// ===== personal features =====
const birthD=()=>new Date(S.baby.birth+"T12:00:00");
function weekDate(w){return addDays(S.baby.birth,w*7)}
function headerPid(){if(S.headerPhoto)return S.headerPhoto;const ws=Object.keys(S.weekly).map(Number).sort((a,b)=>b-a);return ws.length?S.weekly[ws[0]].photo:null}
function birthdayInfo(){const now=new Date();now.setHours(12,0,0,0);const b=birthD();let k=now.getFullYear()-b.getFullYear();let next=new Date(b);next.setFullYear(b.getFullYear()+k);if(next<now){k++;next.setFullYear(b.getFullYear()+k)}const n=Math.round((next-now)/864e5);
  return{n,k,next,txt:n===0?t("bdayToday"):(k===1?t("bdayIn").replace("{n}",n):t("bdayN").replace("{n}",n).replace("{k}",k))}}
// --- avatar ---
let avState=null,avTimer=null;const avImg={};
["neutral","happy","sleepy","feeding"].forEach(k=>{const i=new Image();i.src=`assets/avatar/${k}.png`});
function curAvatar(){return avState||(S.timers.sleep?"sleepy":"neutral")}
const AVS=["neutral","happy","sleepy","feeding"];
function avatarHTML(force){const st=force||curAvatar();return `<div class="avs" data-st="${st}">${AVS.map(k=>`<img src="assets/avatar/${k}.png" alt="${k===st?esc(S.baby.name)+" ("+k+")":""}" class="avimg ${k===st?"on":""}" data-k="${k}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:this.className,innerHTML:babySVG(this.dataset.k)}))">`).join("")}<span class="zzz" aria-hidden="true"><i>z</i><i>z</i><i>z</i></span></div>`}
function applyAvatar(){const st=curAvatar();document.querySelectorAll("#avatar .avs").forEach(a=>{a.dataset.st=st;a.querySelectorAll(".avimg").forEach(i=>i.classList.toggle("on",i.dataset.k===st));if(st==="happy"){a.classList.remove("bounce");void a.offsetWidth;a.classList.add("bounce")}})}
function babySVG(st){const eyes=st==="sleepy"?`<path d="M38 52q6 5 12 0M70 52q6 5 12 0" stroke="#3b2f2a" stroke-width="3" fill="none" stroke-linecap="round"/>`:st==="happy"?`<path d="M38 54q6-7 12 0M70 54q6-7 12 0" stroke="#3b2f2a" stroke-width="3" fill="none" stroke-linecap="round"/>`:`<circle cx="44" cy="52" r="4.5" fill="#3b2f2a"/><circle cx="76" cy="52" r="4.5" fill="#3b2f2a"/><circle cx="45.5" cy="50.5" r="1.4" fill="#fff"/><circle cx="77.5" cy="50.5" r="1.4" fill="#fff"/>`;
  const mouth=st==="happy"?`<path d="M48 68q12 14 24 0z" fill="#c9575a"/>`:st==="sleepy"?`<ellipse cx="60" cy="71" rx="4" ry="3" fill="#c9575a"/>`:st==="feeding"?`<g><rect x="54" y="66" width="12" height="9" rx="3" fill="#f3c9a8"/><rect x="62" y="60" width="28" height="18" rx="7" fill="#fff" stroke="#8fb9d8" stroke-width="2.5"/><rect x="66" y="64" width="16" height="10" rx="3" fill="#fdf3e0"/></g>`:`<path d="M52 69q8 6 16 0" stroke="#c9575a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const extra=st==="sleepy"?`<text x="92" y="28" font-size="16" fill="#8fb9d8" font-weight="700" class="zz">z</text><text x="102" y="16" font-size="12" fill="#8fb9d8" font-weight="700" class="zz">z</text>`:"";
  return `<svg viewBox="0 0 120 120" class="av av-${st}" aria-label="${st}"><circle cx="60" cy="62" r="42" fill="#f6d2b5"/><circle cx="18" cy="62" r="9" fill="#f6d2b5"/><circle cx="102" cy="62" r="9" fill="#f6d2b5"/><path d="M48 22q12-12 24 0q-6-2-12 6q-6-8-12-6z" fill="#7a5640"/>${eyes}<circle cx="34" cy="64" r="6" fill="#f4a3a0" opacity=".55"/><circle cx="86" cy="64" r="6" fill="#f4a3a0" opacity=".55"/>${mouth}${extra}</svg>`}
function setAvatar(st,ms,celebrate){avState=st;clearTimeout(avTimer);avTimer=setTimeout(()=>{avState=null;applyAvatar()},ms);applyAvatar();if(celebrate)confetti()}
function confetti(){const wrap=document.createElement("div");wrap.className="confetti";const av=document.createElement("div");av.className="celebrate-av";av.innerHTML=avatarHTML("happy");wrap.appendChild(av);
  for(let i=0;i<28;i++){const c=document.createElement("i");c.style.left=Math.random()*100+"%";c.style.background=["#e8957a","#8fc9a8","#f2c76e","#8fb9d8","#b8a3d9"][i%5];c.style.animationDelay=Math.random()*.4+"s";c.style.transform=`rotate(${Math.random()*360}deg)`;wrap.appendChild(c)}
  document.body.appendChild(wrap);setTimeout(()=>wrap.remove(),2600)}
// timers -> sleepy avatar handled in curAvatar
// --- weekly photos ---
let flipIdx=0,flipPlay=null;
function weekly(){clearInterval(flipPlay);flipPlay=null;const cur=ageOf(birthD()).weeks;const ws=Object.keys(S.weekly).map(Number).sort((a,b)=>a-b);
  V(`<section class="card"><h2>📸 ${t("weekly")}</h2>${!S.weekly[cur]?`<button class="btn" data-wk="${cur}">＋ ${t("addPhoto")} · ${t("week")} ${cur}</button>`:""}
  <div class="wgrid">${Array.from({length:cur+1},(_,w)=>cur-w).map(w=>`<button class="wcell" data-wk="${w}">${S.weekly[w]?`<img data-pid="${S.weekly[w].photo}" alt="">`:`<span class="mute">＋</span>`}<b>${t("week")} ${w}</b></button>`).join("")}</div></section>
  <section class="card"><h2>🎞️ ${t("flip")}</h2>${flipbookHTML(ws)}</section>
  ${ws.length>1?`<section class="card"><h2>↔️ ${t("compare")}</h2><div class="row"><select id="cA">${ws.map(w=>`<option ${w===ws[0]?"selected":""}>${w}</option>`).join("")}</select><select id="cB">${ws.map(w=>`<option ${w===ws[ws.length-1]?"selected":""}>${w}</option>`).join("")}</select></div><div class="row" id="cmp" style="margin-top:10px"></div></section>`:""}`);
  bindFlip(ws);if(ws.length>1){const up=()=>{$("#cmp").innerHTML=[$("#cA").value,$("#cB").value].map(w=>`<figure class="cfig"><img data-pid="${S.weekly[w].photo}"><figcaption>${ageLabel(+w)}</figcaption></figure>`).join("");hydratePhotos()};$("#cA").onchange=$("#cB").onchange=up;up()}}
function ageLabel(w){const a=ageOf(birthD(),weekDate(w));return `${t("week")} ${w} · ${a.months} ${S.lang==="es"?"m":"mo"}`}
function flipbookHTML(ws){if(!ws.length)return `<p class="mute">${t("needPhotos")}</p>`;flipIdx=Math.min(flipIdx,ws.length-1);
  return `<div class="flip"><img id="flipImg" data-pid="${S.weekly[ws[flipIdx]].photo}"><div class="flipLbl" id="flipLbl">${ageLabel(ws[flipIdx])}</div></div><input type="range" id="flipR" min="0" max="${ws.length-1}" value="${flipIdx}"><button class="btn sec" id="flipP">▶ ${t("play")}</button>`}
function bindFlip(ws){const r=$("#flipR");if(!r)return;const show=async i=>{flipIdx=i;r.value=i;const v=await pGet(S.weekly[ws[i]].photo);if(v)$("#flipImg").src=v;$("#flipLbl").textContent=ageLabel(ws[i])};
  r.oninput=()=>show(+r.value);$("#flipP").onclick=()=>{if(flipPlay){clearInterval(flipPlay);flipPlay=null;$("#flipP").textContent="▶ "+t("play")}else{$("#flipP").textContent="⏸ "+t("pause");flipPlay=setInterval(()=>{if(!$("#flipR")){clearInterval(flipPlay);flipPlay=null;return}show((flipIdx+1)%ws.length)},700)}}}
function weekSheet(w){const r=S.weekly[w];sheet(`<h2 style="margin-top:0">📸 ${ageLabel(w)}</h2><p class="mute small">${fmtDate(weekDate(w).toISOString().slice(0,10))}</p>${r?`<img data-pid="${r.photo}" style="width:100%;border-radius:16px">`:""}
  <input type="file" id="wf" accept="image/*"><button class="btn" id="wsv">${t("savebtn")}</button>${r?`<button class="btn sec" id="whd">🏡 ${t("setHeader")}</button>`:""}<button class="btn ghost" data-close>${t("cancel")}</button>`);
  $("#wsv").onclick=async()=>{const f=$("#wf").files[0];if(!f){closeSheet();return}const pid="p_"+uid();await pPut(pid,await shrink(f));S.weekly[w]={photo:pid,date:todayISO(),updated:Date.now()};save();closeSheet();render();toast(t("saved"))};
  if($("#whd"))$("#whd").onclick=()=>{S.headerPhoto=r.photo;save();closeSheet();toast(t("saved"))}}
// --- letters ---
function letters(){const items=[...S.letters.map(l=>({...l,kind:"l"})),...Object.entries(S.ms).filter(([,r])=>r.letter).map(([id,r])=>{const[sl,d,i]=id.split(":"),st=STAGES.find(x=>x.slug===sl);return{id,kind:"m",date:r.date,text:r.letter,about:L({en:st.m[d][i][0],es:st.m[d][i][1]})}})].sort((a,b)=>b.date.localeCompare(a.date));
  V(`<section class="card"><h2>💌 ${t("letters")}</h2><button class="btn" id="nl">✍️ ${t("newLetter")}</button><div class="timeline" style="margin-top:12px">${items.map(x=>`<div class="tl past letter"><div class="mute small">${fmtDate(x.date)} · ${ageLabel(Math.floor((new Date(x.date+"T12:00:00")-birthD())/864e5/7))}</div>${x.about?`<div class="small">🌱 ${esc(x.about)}</div>`:""}<p class="ltxt">${esc(x.text).replace(/\n/g,"<br>")}</p>${x.kind==="l"?`<button class="pill small" data-dell="${x.id}">✕</button>`:""}</div>`).join("")||`<p class="mute">${t("none")}</p>`}</div></section>`);
  $("#nl").onclick=()=>{sheet(`<h2 style="margin-top:0">💌 ${t("newLetter")}</h2><label>${t("date")}</label><input type="date" id="ld" value="${todayISO()}"><textarea id="lt" style="min-height:180px" placeholder="${t("letterPh")}"></textarea><button class="btn" id="ls">${t("savebtn")}</button><button class="btn ghost" data-close>${t("cancel")}</button>`);
    $("#ls").onclick=()=>{const text=$("#lt").value.trim();if(!text)return;S.letters.push({id:uid(),date:$("#ld").value||todayISO(),text,updated:Date.now()});save();closeSheet();render()}}}
// --- year recap ---
function recap(){const b=birthD(),one=new Date(b);one.setFullYear(b.getFullYear()+1);const locked=new Date()<one;const inYr=d=>new Date(d+"T12:00:00")<one;
  const ms=Object.entries(S.ms).filter(([,r])=>inYr(r.date)),fs=S.firsts.filter(f=>inYr(f.date)),gs=[...S.growth].filter(g=>inYr(g.date)).sort((a,c)=>a.date.localeCompare(c.date));
  const ws=Object.keys(S.weekly).map(Number).filter(w=>w<=52).sort((a,c)=>a-c),g0=gs[0],g1=gs[gs.length-1];
  V(`${locked?`<div class="note">🔒 ${t("recapLocked").replace("{d}",one.toLocaleDateString(S.lang==="es"?"es-US":"en-US",{month:"long",day:"numeric",year:"numeric"}))}</div>`:""}
  <section class="card recap-hero"><div style="font-size:44px">🎂</div><h2>${esc(S.baby.name)} · ${S.lang==="es"?"Primer año":"Year one"}</h2><div class="row" style="text-align:center"><div><div class="age">${ms.length}</div><div class="mute small">${t("milestonesDone")}</div></div><div><div class="age">${fs.length}</div><div class="mute small">${t("firsts")}</div></div><div><div class="age">${ws.length}</div><div class="mute small">${t("weekly")}</div></div></div></section>
  <section class="card"><h2>🎞️ ${t("flip")}</h2>${flipbookHTML(ws)}</section>
  ${g0&&g1&&g0!==g1?`<section class="card"><h2>📈 ${t("gained")}</h2><p>${t("weight")}: ${fmtG(g0,"w")} → <b>${fmtG(g1,"w")}</b></p><p>${t("length")}: ${fmtG(g0,"l")} → <b>${fmtG(g1,"l")}</b></p><p>${t("head")}: ${fmtG(g0,"h")} → <b>${fmtG(g1,"h")}</b></p></section>`:""}
  <section class="card"><h2>🌱 ${t("milestonesDone")}</h2>${ms.sort((a,c)=>a[1].date.localeCompare(c[1].date)).map(([id,r])=>{const[sl,d,i]=id.split(":"),st=STAGES.find(x=>x.slug===sl);return `<div class="small">✓ ${esc(L({en:st.m[d][i][0],es:st.m[d][i][1]}))} <span class="mute">${fmtDate(r.date)}</span></div>`}).join("")||`<p class="mute">${t("none")}</p>`}</section>
  <section class="card"><h2>⭐ ${t("firsts")}</h2>${fs.map(f=>`<div class="small">⭐ ${esc(f.title)} <span class="mute">${fmtDate(f.date)}</span></div>`).join("")||`<p class="mute">${t("none")}</p>`}</section>`);bindFlip(ws)}
document.addEventListener("click",e=>{const el=e.target.closest("[data-wk]");if(el)weekSheet(+el.dataset.wk)});

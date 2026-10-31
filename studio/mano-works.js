// تبويب "أعمال MANO" في الاستوديو: مراجعة الأعمال اللي الناس بترفعها من موقع MANO (نشر / إخفاء / حذف).
// الدخول بكود على الإيميل (Supabase) — نفس حساب أداة MANO. الصلاحيات محمية في قاعدة البيانات (RLS) بإيميلات الأدمن.
(function(){
const SB="https://ptcgkbklhvaxdmqqoeds.supabase.co",KEY="sb_publishable_QUuM6GH_VmSMo2n-A9snEA_2wpvYfxP",BUCKET="showcase",LS="manoWorksSession";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pub=p=>SB+"/storage/v1/object/public/"+BUCKET+"/"+String(p).split("/").map(encodeURIComponent).join("/");
let sess=null,items=[],filter="new",root=null;
try{sess=JSON.parse(localStorage[LS]||"null")}catch(_){sess=null}
function toast(t,err){const d=document.createElement("div");d.className="toast"+(err?" err":"");d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),err?6000:3000)}
function save(s){sess=s;if(s)localStorage[LS]=JSON.stringify(s);else localStorage.removeItem(LS)}
async function auth(path,body){const r=await fetch(SB+"/auth/v1/"+path,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.msg||d.error_description||d.message||("HTTP "+r.status));return d}
function keep(d){save({access:d.access_token,refresh:d.refresh_token,exp:Date.now()+((d.expires_in||3600)-60)*1000,email:(d.user&&d.user.email)||(sess&&sess.email)||""})}
async function token(){if(!sess)return null;if(Date.now()<sess.exp)return sess.access;
  try{keep(await auth("token?grant_type=refresh_token",{refresh_token:sess.refresh}));return sess.access}catch(e){save(null);return null}}
async function api(path,opt={}){const t=await token();if(!t){loginView();throw new Error("login")}
  const r=await fetch(SB+path,Object.assign({},opt,{headers:Object.assign({apikey:KEY,Authorization:"Bearer "+t},opt.headers||{})}));
  if(r.status==401){save(null);loginView("انتهت الجلسة، ادخل تاني.");throw new Error("401")}
  if(!r.ok){const e=new Error("HTTP "+r.status+" "+(await r.text().catch(()=>"")).slice(0,160));throw e}
  return r.status==204?null:r.json().catch(()=>null)}

function loginView(msg){root.innerHTML=`<div class="head"><a class="ghost" href="#dl/mano">→ MANO</a></div><div class="login"><h2>أعمال MANO</h2><p>${esc(msg||"ادخل بإيميل حساب MANO بتاعك، وهيوصلك كود.")}</p>
  <div class="form" style="max-width:360px;margin:auto"><input id="mwE" placeholder="email@example.com" dir="ltr" value="${esc(sess&&sess.email||"")}">
  <button class="gold" id="mwS">ابعت الكود</button><div id="mwC" hidden class="form"><input id="mwK" placeholder="الكود" dir="ltr" inputmode="numeric" maxlength="8"><button class="gold" id="mwV">دخول</button></div></div></div>`;
  const E=document.getElementById("mwE"),K=document.getElementById("mwK");
  document.getElementById("mwS").onclick=async function(){const em=E.value.trim();if(!/^\S+@\S+\.\S+$/.test(em))return toast("اكتب إيميل صحيح",1);
    this.disabled=true;try{await auth("otp",{email:em,create_user:false});document.getElementById("mwC").hidden=false;K.focus();toast("الكود اتبعت على إيميلك")}
    catch(e){toast("ما قدرناش نبعت الكود: "+e.message,1)}finally{this.disabled=false}};
  document.getElementById("mwV").onclick=async function(){const code=K.value.replace(/\D/g,"");if(code.length<6)return toast("اكتب الكود كامل",1);
    this.disabled=true;try{keep(await auth("verify",{type:"email",email:E.value.trim(),token:code}));load()}catch(e){toast("الكود غلط أو انتهى",1)}finally{this.disabled=false}};
  K&&K.addEventListener("keydown",e=>{if(e.key=="Enter")document.getElementById("mwV").click()})}

async function load(){root.innerHTML=`<p class="empty">جاري تحميل الأعمال…</p>`;
  try{items=await api("/rest/v1/showcase?select=*&order=created_at.desc&limit=500")||[];view()}
  catch(e){if(e.message!="login"&&e.message!="401")root.innerHTML=`<p class="empty">حصلت مشكلة (${esc(e.message)}). لو أول مرة، اتأكد إن إيميلك متضاف كأدمن في قاعدة البيانات.</p>`}}
function card(w){const src=pub(w.path),ig=(w.instagram||"").replace(/^@/,""),d=new Date(w.created_at);
  const media=w.kind=="video"?`<video src="${esc(src)}#t=0.1" muted playsinline preload="metadata" controls></video>`:`<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"></a>`;
  return `<div class="mwc${w.approved?" on":""}" data-id="${esc(w.id)}">${media}<div class="mwi"><b>${esc(w.title||"بدون اسم")}</b>
  <span>${esc(w.name)}${ig?` · <a href="https://instagram.com/${esc(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a>`:""}</span>
  <small>${d.toLocaleDateString("ar-EG",{day:"numeric",month:"short",year:"numeric"})} · ${w.kind=="video"?"فيديو":"صورة"}${w.approved?" · <em>منشور</em>":""}</small></div>
  <div class="mwb">${w.approved?`<button class="ghost" data-a="hide">إخفاء</button>`:`<button class="gold" data-a="ok">نشر ✓</button>`}<button class="ghost red" data-a="del">حذف</button></div></div>`}
function view(){const pend=items.filter(w=>!w.approved),pubd=items.filter(w=>w.approved),list=filter=="new"?pend:pubd;
  root.innerHTML=`<div class="head"><a class="ghost" href="#dl/mano">→ MANO</a><h2>أعمال MANO</h2><button class="ghost" id="mwR">تحديث ↻</button><button class="ghost" id="mwO">خروج من Supabase</button></div>
  <p class="hint">الأعمال اللي الناس بترفعها من <a href="https://mano-plugin.pages.dev/#mnWorksS" target="_blank">موقع MANO</a>. «نشر» يخليها تظهر في الموقع على طول — مش محتاج زرار النشر اللي تحت.</p>
  <div class="tb" style="margin-bottom:14px"><button data-f="new" style="${filter=="new"?"border-color:#CEA111;color:#CEA111":""}">جديد للمراجعة (${pend.length})</button><button data-f="pub" style="${filter=="pub"?"border-color:#CEA111;color:#CEA111":""}">منشور (${pubd.length})</button></div>
  <div class="mwg">${list.length?list.map(card).join(""):`<p class="empty">${filter=="new"?"مفيش أعمال جديدة 👌":"لسه مفيش أعمال منشورة"}</p>`}</div>`;
  root.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{filter=b.dataset.f;view()});
  document.getElementById("mwR").onclick=load;document.getElementById("mwO").onclick=()=>{save(null);loginView()};
  root.querySelectorAll(".mwc [data-a]").forEach(b=>b.onclick=()=>act(b.closest(".mwc").dataset.id,b.dataset.a,b))}
async function act(id,a,btn){const w=items.find(x=>String(x.id)==id);if(!w)return;
  if(a=="del"&&!confirm("تحذف العمل ده نهائي (الملف والبيانات)؟"))return;btn.disabled=true;
  try{if(a=="del"){await api("/storage/v1/object/"+BUCKET+"/"+w.path.split("/").map(encodeURIComponent).join("/"),{method:"DELETE"}).catch(()=>{});
      await api("/rest/v1/showcase?id=eq."+encodeURIComponent(id),{method:"DELETE",headers:{Prefer:"return=minimal"}});items=items.filter(x=>x!==w);toast("اتحذف")}
    else{const v=a=="ok";const r=await api("/rest/v1/showcase?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({approved:v})});
      if(!r||!r.length)throw new Error("مفيش صلاحية تعديل — إيميلك مش أدمن");w.approved=v;toast(v?"اتنشر في موقع MANO ✓":"اتخفى من الموقع")}
    view()}catch(e){btn.disabled=false;if(e.message!="login"&&e.message!="401")toast("ما نفعش: "+e.message,1)}}
const css=document.createElement("style");css.textContent=`.mwg{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.mwc{background:#161616;border:1px solid #262626;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}.mwc.on{border-color:#CEA11188}
.mwc img,.mwc video{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;background:#000}.mwi{padding:10px 12px;display:flex;flex-direction:column;gap:2px;flex:1}
.mwi span{font-size:.88rem;opacity:.85}.mwi small{font-size:.78rem;opacity:.6}.mwi em{color:#CEA111;font-style:normal}
.mwb{display:flex;gap:8px;padding:0 12px 12px}.mwb .gold{padding:6px 18px;font-size:.92rem}.mwb button{flex:1}`;document.head.appendChild(css);
window.MANOWorksBadge=async function(){if(!sess)return null;try{const t=await token();if(!t)return null;const r=await fetch(SB+"/rest/v1/showcase?select=id&approved=eq.false&limit=500",{headers:{apikey:KEY,Authorization:"Bearer "+t},cache:"no-store"});if(!r.ok)return null;const x=await r.json().catch(()=>null);return Array.isArray(x)?x.length:null}catch(_){return null}};
window.MANOWorks=function(el){root=el;sess?load():loginView()};
})();

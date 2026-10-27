(function(){
const REPO="ashmano19/ahmed-shaban-portfolio",BR="main",API=(window.STUDIO_API||"https://api.github.com")+"/repos/"+REPO;
const MAX_IMG=2400,MAX_TH=700,MAX_VID=25*1024*1024; // Cloudflare Pages: أقصى حجم للملف 25MB
const C=window.StudioCore,$=id=>document.getElementById(id),app=$("app");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let TOKEN="",base="",cats=[],origCatsDoc={},origCatIds="",st=null,orig=[],cur=null,dirty=false,busy=false;
const S={newGroup:true,atStart:false};

function toast(t,err){const d=document.createElement("div");d.className="toast"+(err?" err":"");d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),err?6000:3000)}
async function gh(path,opt={}){const r=await fetch(path.startsWith("http")?path:API+path,Object.assign({},opt,{headers:Object.assign({Authorization:"token "+TOKEN,Accept:"application/vnd.github+json"},opt.headers||{})}));
  if(!r.ok){const e=new Error("GitHub "+r.status);e.status=r.status;try{e.body=await r.text()}catch(_){}throw e}return opt.raw?r.text():r.json()}

// ---------- الدخول (نفس نافذة GitHub بتاعة /admin) ----------
function savedToken(){if(localStorage.studioToken)return localStorage.studioToken;try{const u=JSON.parse(localStorage["decap-cms-user"]||"null");if(u&&u.token)return u.token}catch(_){}return ""}
function loginView(msg){$("out").hidden=true;$("bar").hidden=true;
  app.innerHTML=`<div class="login"><img src="/images/logo.png" alt=""><h2>أهلاً يا أحمد 👋</h2><p>${msg||"ادخل بحساب GitHub عشان تضيف صورك وفيديوهاتك وترتبها."}</p><button class="gold" id="lg">دخول بحساب GitHub</button></div>`;
  $("lg").onclick=login}
function login(){const w=window.open("/auth?provider=github&scope=repo,user","gh-login","width=600,height=720");
  if(!w){toast("المتصفح منع النافذة، اسمح بالنوافذ المنبثقة وجرب تاني",1);return}
  function onMsg(e){if(e.origin!==location.origin)return;const d=e.data;if(typeof d!="string")return;
    if(d==="authorizing:github"){w.postMessage(d,e.origin);return}
    if(d.startsWith("authorization:github:success:")){window.removeEventListener("message",onMsg);try{TOKEN=JSON.parse(d.slice(29)).token}catch(_){}
      if(TOKEN){localStorage.studioToken=TOKEN;start()}}
    else if(d.startsWith("authorization:github:error:")){window.removeEventListener("message",onMsg);toast("الدخول ما نجحش، جرب تاني",1)}}
  window.addEventListener("message",onMsg)}
$("out").onclick=()=>{if(dirty&&!confirm("في تعديلات ما اتنشرتش، تخرج برضه؟"))return;localStorage.removeItem("studioToken");localStorage.removeItem("decap-cms-user");TOKEN="";dirty=false;loginView()};

// ---------- تحميل المحتوى من GitHub ----------
async function start(){app.innerHTML=`<p class="empty">جاري تحميل المحتوى…</p>`;
  try{const repo=await gh("");if(!repo.permissions||!repo.permissions.push){loginView("الحساب ده مالوش صلاحية تعديل على الموقع.");return}
    const ref=await gh("/git/ref/heads/"+BR);base=ref.object.sha;
    const raw=p=>gh("/contents/"+p+"?ref="+base,{raw:1,headers:{Accept:"application/vnd.github.raw+json"}});
    const [g,c]=await Promise.all([raw("content/gallery.json"),raw("content/categories.json")]);
    orig=JSON.parse(g).photos||[];origCatsDoc=JSON.parse(c);cats=origCatsDoc.categories||[];origCatIds=cats.map(x=>x.id).join();st=C.load(orig,cats);
    $("out").hidden=false;$("bar").hidden=false;setDirty(false);route()}
  catch(e){if(e.status==401){localStorage.removeItem("studioToken");localStorage.removeItem("decap-cms-user");loginView("انتهت الجلسة، ادخل تاني.")}else{app.innerHTML=`<p class="empty">حصلت مشكلة في التحميل (${esc(e.message)}). حدّث الصفحة.</p>`}}}

function setDirty(v){dirty=v;const n=countNew();$("pub").disabled=!v||busy;
  $("bmsg").innerHTML=v?`عندك تعديلات لسه ما اتنشرتش${n?` · <b>${countNew()}</b> ملف جديد`:""} — دوس <b>نشر</b>`:"كل حاجة منشورة ✓"}
const allItems=()=>{const a=[];Object.values(st.by).forEach(b=>{if(b.cover)a.push(b.cover);a.push(...b.videos,...b.photos)});return a};
const pendingFiles=()=>{const f=[];allItems().forEach(o=>(o._files||[]).forEach(x=>f.push(x)));return f};
const countNew=()=>allItems().filter(o=>o._new).length;
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});

// ---------- الشاشات ----------
function route(){const m=location.hash.match(/^#c\/(.+)/);cur=m&&st.by[decodeURIComponent(m[1])]?decodeURIComponent(m[1]):null;cur?catView():homeView();window.scrollTo(0,0)}
window.onhashchange=()=>{if(st)route()};
const src=o=>o._url||o.thumb||o.image;
function homeView(){
  app.innerHTML=`<div class="head"><h2>اختار القائمة</h2></div><p class="hint">اسحب أي قائمة عشان تغيّر ترتيبها في الموقع (على الموبايل: اضغط مطوّل وبعدين اسحب) — وبعدين دوس نشر</p><div class="cards" id="cards">${cats.map(c=>{const b=st.by[c.id],n=C.counts(b),cv=b.cover||b.photos[0]||b.videos[0],nw=[b.cover,...b.videos,...b.photos].filter(o=>o&&o._new).length;
    return `<div class="card" data-id="${esc(c.id)}" role="link" tabindex="0">${cv?`<img src="${esc(src(cv))}" data-full="${esc(cv.image||"")}" alt="" draggable="false" decoding="async">`:""}${nw?`<i>${nw} جديد</i>`:""}<div><b>${esc(c.name_ar)}</b><span>${n.p} صورة · ${n.v} فيديو</span></div></div>`}).join("")}</div>`;
  const g=$("cards");g.querySelectorAll("img").forEach(im=>im.onerror=()=>{if(im.dataset.full&&im.src.indexOf(im.dataset.full)<0)im.src=im.dataset.full});
  g.onclick=e=>{const c=e.target.closest(".card");if(c)location.hash="#c/"+encodeURIComponent(c.dataset.id)};
  g.onkeydown=e=>{const c=e.target.closest(".card");if(c&&e.key=="Enter")c.click()};
  sortable(g,ids=>{if(ids.join()===cats.map(c=>c.id).join())return;cats=ids.map(id=>cats.find(c=>c.id==id));setDirty(true);homeView()},".card")}
function tile(o,i,kind){const d=i>0&&o._div;return `<div class="t${d?" div":""}${o._new?" new":""}" data-id="${o._id}"><img loading="lazy" src="${esc(src(o))}" alt="">${kind=="v"?`<span class="vb">▶ فيديو</span>`:""}
  <div class="bt">${i>0?`<button data-a="div" title="${d?"إلغاء الخط الذهبي":"بداية مجموعة جديدة (خط ذهبي قبلها)"}">✂</button>`:""}<button data-a="cover" title="اجعلها صورة الغلاف">★</button><button class="x" data-a="del" title="حذف">✕</button></div></div>`}
function catView(){const c=cats.find(x=>x.id==cur),b=st.by[cur],n=C.counts(b);
  app.innerHTML=`<div class="head"><a class="ghost" href="#">→ القوائم</a><h2>${esc(c.name_ar)} <small style="font-size:.9rem;color:#CEA111">${n.p} صورة · ${n.v} فيديو</small></h2>
    <div class="cov">${b.cover?`<img src="${esc(src(b.cover))}" alt="">`:""}<span>صورة الغلاف<br><small>غيّرها بزرار ★</small></span></div></div>
  <div class="drop" id="drop"><b>اسحب الصور والفيديوهات هنا</b><small>أو دوس عشان تختار من جهازك — تقدر تختار كذا ملف مرة واحدة (الفيديو mp4 لحد 25MB)</small></div>
  <div class="opts"><label><input type="checkbox" id="ng" ${S.newGroup?"checked":""}> مجموعة جديدة (خط ذهبي يفصلها عن اللي قبلها)</label>
    <label><input type="checkbox" id="as" ${S.atStart?"checked":""}> حطهم في أول القائمة</label></div>
  <p class="hint">اسحب أي صورة عشان تغيّر مكانها · ✂ يحط خط ذهبي قبل الصورة · ★ يخليها غلاف القائمة · ✕ حذف</p>
  <h3 class="sub">VIDEO</h3>${b.videos.length?`<div class="grid" id="gv">${b.videos.map((o,i)=>tile(o,i,"v")).join("")}</div>`:`<p class="empty">مفيش فيديوهات في القائمة دي.</p>`}
  <h3 class="sub">PHOTO</h3>${b.photos.length?`<div class="grid" id="gp">${b.photos.map((o,i)=>tile(o,i,"p")).join("")}</div>`:`<p class="empty">مفيش صور في القائمة دي.</p>`}`;
  $("ng").onchange=e=>S.newGroup=e.target.checked;$("as").onchange=e=>S.atStart=e.target.checked;
  const dr=$("drop");dr.onclick=()=>$("fi").click();
  dr.ondragover=e=>{e.preventDefault();dr.classList.add("on")};dr.ondragleave=()=>dr.classList.remove("on");
  dr.ondrop=e=>{e.preventDefault();dr.classList.remove("on");addFiles([...e.dataTransfer.files])};
  [["gv","videos"],["gp","photos"]].forEach(([id,k])=>{const g=$(id);if(!g)return;
    g.onclick=e=>{const bt=e.target.closest("button[data-a]");if(!bt)return;const t=bt.closest(".t"),o=b[k].find(x=>x._id==t.dataset.id);act(bt.dataset.a,o,k)};
    sortable(g,ids=>{const o=b[k].map(x=>x._id).join();if(ids.join()===o)return;b[k]=ids.map(id=>b[k].find(x=>x._id==id));setDirty(true);catView()})})}
// ترتيب بالسحب (ماوس، وعلى الموبايل: اضغط مطوّل وبعدين اسحب)
function sortable(g,done,sel){sel=sel||".t";
  g.addEventListener("click",e=>{if(g._dragged){e.preventDefault();e.stopPropagation();g._dragged=false}},true);
  g.addEventListener("contextmenu",e=>{if(e.target.closest(sel))e.preventDefault()});
  g.addEventListener("pointerdown",e=>{const t=e.target.closest(sel);if(!t||t.parentNode!==g||e.target.closest("button")||e.button>0)return;
    const sx=e.clientX,sy=e.clientY,touch=e.pointerType!="mouse";let timer=0,on=false,fly=null,dx=0,dy=0;
    const begin=()=>{on=true;const r=t.getBoundingClientRect();dx=sx-r.left;dy=sy-r.top;fly=t.cloneNode(true);fly.classList.add("fly");
      Object.assign(fly.style,{left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px"});document.body.appendChild(fly);t.classList.add("ghostT");if(navigator.vibrate)navigator.vibrate(15)};
    if(touch)timer=setTimeout(begin,280);
    const tm=ev=>{if(on)ev.preventDefault()};
    const mv=ev=>{if(!on){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)<6)return;if(touch){end();return}begin()}
      ev.preventDefault();fly.style.left=ev.clientX-dx+"px";fly.style.top=ev.clientY-dy+"px";
      if(ev.clientY<70)scrollBy(0,-18);else if(ev.clientY>innerHeight-130)scrollBy(0,18);
      const o=(document.elementFromPoint(ev.clientX,ev.clientY)||{closest:()=>null}).closest(sel);if(!o||o===t||o.parentNode!==g)return;
      const r=o.getBoundingClientRect(),rtl=getComputedStyle(g).direction=="rtl",mid=ev.clientX<r.left+r.width/2;
      const before=r.top>t.getBoundingClientRect().bottom||r.bottom<t.getBoundingClientRect().top?(rtl?!mid:mid):(o.compareDocumentPosition(t)&4?true:false);
      g.insertBefore(t,before?o:o.nextSibling)};
    const end=()=>{clearTimeout(timer);removeEventListener("pointermove",mv);removeEventListener("pointerup",end);removeEventListener("pointercancel",end);t.removeEventListener("touchmove",tm);
      if(on){on=false;g._dragged=true;setTimeout(()=>g._dragged=false,400);fly.remove();t.classList.remove("ghostT");done([...g.children].map(x=>x.dataset.id))}};
    addEventListener("pointermove",mv,{passive:false});addEventListener("pointerup",end);addEventListener("pointercancel",end);t.addEventListener("touchmove",tm,{passive:false})})}
function act(a,o,k){const b=st.by[cur];
  if(a=="del"){if(!confirm("تحذف العنصر ده؟"))return;const i=b[k].indexOf(o);if(o._div&&b[k][i+1]&&!b[k][i+1]._div)b[k][i+1]._div=true;b[k].splice(i,1);if(b.cover&&o._new&&b.cover.image==o.image)b.cover._files=(o._files||[]).filter(f=>"/"+f.path==o.image||"/"+f.path==o.thumb)}
  else if(a=="div")o._div=!o._div;
  else if(a=="cover"){const c=cats.find(x=>x.id==cur);if(!b.cover)b.cover={_id:"c"+Date.now(),category:cur,title_ar:c.name_ar,title_en:c.name_en,cover:true};
    b.cover.image=o.image;b.cover.thumb=o.thumb||o.image;b.cover._url=o._url;b.cover._files=[];toast("تم تغيير صورة الغلاف")}
  setDirty(true);catView()}
$("fi").onchange=e=>{addFiles([...e.target.files]);e.target.value=""};

// ---------- تجهيز الملفات في المتصفح ----------
function canvasOf(srcEl,w,h,max){const [W,H]=C.fitSize(w,h,max),cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");x.imageSmoothingQuality="high";x.drawImage(srcEl,0,0,W,H);return cv}
function enc(cv,q){return new Promise(res=>cv.toBlob(b=>{if(b&&b.type=="image/webp")res({blob:b,ext:"webp"});else cv.toBlob(j=>res({blob:j,ext:"jpg"}),"image/jpeg",q)},"image/webp",q))}
async function decode(file){if(window.createImageBitmap){try{const bm=await createImageBitmap(file,{imageOrientation:"from-image"});return {el:bm,w:bm.width,h:bm.height}}catch(_){}}
  return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>res({el:im,w:im.naturalWidth,h:im.naturalHeight});im.onerror=()=>rej(new Error("img"));im.src=u})}
function frame(file){return new Promise((res,rej)=>{const v=document.createElement("video"),u=URL.createObjectURL(file);let done=false;const fail=()=>{if(!done){done=true;rej(new Error("vid"))}};
  v.muted=true;v.playsInline=true;v.preload="auto";v.onerror=fail;setTimeout(fail,20000);
  v.onloadedmetadata=()=>{v.currentTime=Math.min(1,(v.duration||3)/3)};
  v.onseeked=()=>{if(done)return;done=true;res({el:v,w:v.videoWidth,h:v.videoHeight,url:u})};v.src=u})}
async function addFiles(files){if(busy)return;const c=cats.find(x=>x.id==cur),b=st.by[cur];if(!c)return;
  files=files.filter(f=>/^(image|video)\//.test(f.type)||/\.(jpe?g|png|webp|mp4|mov|heic)$/i.test(f.name));if(!files.length)return;
  busy=true;setDirty(dirty);const stamp=Date.now().toString(36),added={videos:[],photos:[]},bad=[];
  for(let i=0;i<files.length;i++){const f=files[i];$("bmsg").textContent=`جاري تجهيز ${i+1} من ${files.length}…`;showProg((i)/files.length);
    const name=stamp+"-"+(i+1),dir="images/uploads/s/"+cur;
    try{const o={_id:"n"+stamp+i,_new:1,category:cur,title_ar:c.name_ar,title_en:c.name_en};
      if(f.type.startsWith("video/")||/\.(mp4|mov)$/i.test(f.name)){
        if(f.size>MAX_VID){bad.push(f.name+" (أكبر من 25MB)");continue}
        const fr=await frame(f),p=await enc(canvasOf(fr.el,fr.w,fr.h,720),.8);const ext=(f.name.match(/\.(mp4|mov|webm)$/i)||[,"mp4"])[1].toLowerCase();
        const vp=`${dir}/v/${name}.${ext}`,pp=`${dir}/v/${name}.${p.ext}`;
        Object.assign(o,{image:"/"+pp,thumb:"/"+pp,video:"/"+vp,preview:"/"+vp,_url:URL.createObjectURL(p.blob),_files:[{path:vp,blob:f},{path:pp,blob:p.blob}]});added.videos.push(o)}
      else{const im=await decode(f),big=await enc(canvasOf(im.el,im.w,im.h,MAX_IMG),.85),th=await enc(canvasOf(im.el,im.w,im.h,MAX_TH),.78);
        const ip=`${dir}/${name}.${big.ext}`,tp=`${dir}/t/${name}.${th.ext}`;
        Object.assign(o,{image:"/"+ip,thumb:"/"+tp,_url:URL.createObjectURL(th.blob),_files:[{path:ip,blob:big.blob},{path:tp,blob:th.blob}]});added.photos.push(o)}}
    catch(e){bad.push(f.name)}}
  ["videos","photos"].forEach(k=>{const a=added[k];if(!a.length)return;
    if(S.atStart){if(S.newGroup&&b[k][0])b[k][0]._div=true;b[k].unshift(...a)}else{a[0]._div=S.newGroup;b[k].push(...a)}});
  busy=false;showProg(-1);if(bad.length)toast("الملفات دي ما اتضافتش: "+bad.join("، "),1);
  if(added.videos.length+added.photos.length){setDirty(true);toast(`اتضاف ${added.photos.length} صورة و ${added.videos.length} فيديو — دوس نشر`)}else setDirty(dirty);catView()}
function showProg(x){$("prog").hidden=x<0;$("progi").style.width=Math.round(Math.max(0,x)*100)+"%"}

// ---------- النشر: كوميت واحد (blobs → tree → commit → ref) ----------
const b64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(blob)});
$("pub").onclick=async()=>{if(busy||!dirty)return;busy=true;$("pub").disabled=true;
  try{const files=pendingFiles(),tree=[];let done=0;
    const one=async f=>{const sha=(await gh("/git/blobs",{method:"POST",body:JSON.stringify({content:await b64(f.blob),encoding:"base64"})})).sha;tree.push({path:f.path,mode:"100644",type:"blob",sha});done++;
      $("bmsg").textContent=`جاري رفع الملفات ${done} من ${files.length}…`;showProg(done/(files.length+1))};
    const q=files.slice();await Promise.all([0,1,2].map(async()=>{while(q.length)await one(q.shift())}));
    $("bmsg").textContent="جاري النشر…";
    const out=C.build(st,cats);tree.push({path:"content/gallery.json",mode:"100644",type:"blob",content:JSON.stringify(out,null,2)});
    const catJson=JSON.stringify(Object.assign({},origCatsDoc,{categories:cats}),null,2);if(cats.map(c=>c.id).join()!==origCatIds)tree.push({path:"content/categories.json",mode:"100644",type:"blob",content:catJson});
    C.orphans(orig,out.photos).forEach(p=>tree.push({path:p,mode:"100644",type:"blob",sha:null}));
    const bc=await gh("/git/commits/"+base);
    const t=await gh("/git/trees",{method:"POST",body:JSON.stringify({base_tree:bc.tree.sha,tree})});
    const cm=await gh("/git/commits",{method:"POST",body:JSON.stringify({message:"تحديث المعرض من الاستوديو",tree:t.sha,parents:[base]})});
    await gh("/git/refs/heads/"+BR,{method:"PATCH",body:JSON.stringify({sha:cm.sha,force:false})});
    base=cm.sha;orig=out.photos;origCatIds=cats.map(x=>x.id).join();allItems().forEach(o=>{delete o._new;delete o._files});busy=false;showProg(-1);setDirty(false);
    toast("تم النشر ✓ الموقع هيتحدث خلال دقيقة أو اتنين");if(cur)catView();else homeView()}
  catch(e){busy=false;showProg(-1);setDirty(true);
    toast(e.status==422?"الموقع اتعدّل من مكان تاني. حدّث الصفحة وجرب تاني.":e.status==401?"انتهت الجلسة، اخرج وادخل تاني.":"النشر ما نجحش ("+e.message+"). جرب تاني.",1)}};

TOKEN=savedToken();TOKEN?start():loginView();
})();

(function(){
const REPO="ashmano19/ahmed-shaban-portfolio",BR="main",API=(window.STUDIO_API||"https://api.github.com")+"/repos/"+REPO;
const MAX_IMG=2400,MAX_TH=700,MAX_VID=25*1024*1024; // Cloudflare Pages: أقصى حجم للملف 25MB
const C=window.StudioCore,$=id=>document.getElementById(id),app=$("app");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let TOKEN="",base="",cats=[],origCatsDoc={},origCatIds="",st=null,orig=[],cur=null,dirty=false,busy=false;
// باقي الموقع: القائمة العلوية، الداونلود، الإعدادات
const NAVD=[{type:"link",label_ar:"أعمالي",label_en:"Portfolio",href:"#gallery",show:true},{type:"link",label_ar:"تواصل معي",label_en:"Contact",href:"#contact",show:true},{type:"downloads",label_ar:"Download",label_en:"Download",show:true}];
let galBase="",navItems=[],dlItems=[],dlOrig=[],setObj={},conObj={},docs0={},KN=0;const dlFiles=new Map(),dlDocs={};
const key=()=>"k"+(KN++);
const S={newGroup:true,atStart:false};

function toast(t,err){const d=document.createElement("div");d.className="toast"+(err?" err":"");d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),err?6000:3000)}
async function gh(path,opt={}){const r=await fetch(path.startsWith("http")?path:API+path,Object.assign({},opt,{headers:Object.assign({Authorization:"token "+TOKEN,Accept:"application/vnd.github+json"},opt.headers||{})}));
  if(!r.ok){const e=new Error("GitHub "+r.status);e.status=r.status;try{e.body=await r.text()}catch(_){}throw e}return opt.raw?r.text():r.json()}

// ---------- الدخول (نفس نافذة GitHub بتاعة /admin) ----------
function savedToken(){if(localStorage.studioToken)return localStorage.studioToken;try{const u=JSON.parse(localStorage["decap-cms-user"]||"null");if(u&&u.token)return u.token}catch(_){}return ""}
function loginView(msg){$("out").hidden=true;$("bar").hidden=true;$("tabs").hidden=true;
  app.innerHTML=`<div class="login"><img src="/images/logo.svg" alt=""><h2>أهلاً يا أحمد 👋</h2><p>${msg||"ادخل بحساب GitHub عشان تضيف صورك وفيديوهاتك وترتبها."}</p><button class="gold" id="lg">دخول بحساب GitHub</button></div>`;
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
    const opt=(p,d)=>raw(p).then(JSON.parse).catch(e=>{if(e.status==404)return d;throw e});
    const [g,c,nv,dl,se,co]=await Promise.all([raw("content/gallery.json"),raw("content/categories.json"),opt("content/nav.json",null),opt("content/downloads.json",{items:[]}),opt("content/settings.json",{}),opt("content/contact.json",{})]);
    dlDocs.dl=dl;navItems=((nv&&nv.items)||NAVD).map(x=>Object.assign({},x,{_k:key()}));
    dlItems=(dl.items||[]).map(x=>Object.assign({},x,{_k:key()}));dlOrig=JSON.parse(JSON.stringify(dl.items||[]));setObj=se;conObj=co;docs0=siteDocs();if(!nv)docs0["content/nav.json"]="";
    orig=JSON.parse(g).photos||[];origCatsDoc=JSON.parse(c);cats=origCatsDoc.categories||[];origCatIds=cats.map(x=>x.id).join();st=C.load(orig,cats);galBase=JSON.stringify(C.build(C.load(orig,cats),cats));
    $("out").hidden=false;$("bar").hidden=false;$("tabs").hidden=false;setDirty(false);route()}
  catch(e){if(e.status==401){localStorage.removeItem("studioToken");localStorage.removeItem("decap-cms-user");loginView("انتهت الجلسة، ادخل تاني.")}else{app.innerHTML=`<p class="empty">حصلت مشكلة في التحميل (${esc(e.message)}). حدّث الصفحة.</p>`}}}

function setDirty(v){dirty=v;const n=countNew();$("pub").disabled=!v||busy;
  $("bmsg").innerHTML=v?`عندك تعديلات لسه ما اتنشرتش${n?` · <b>${countNew()}</b> ملف جديد`:""} — دوس <b>نشر</b>`:"كل حاجة منشورة ✓"}
const allItems=()=>{const a=[];Object.values(st.by).forEach(b=>{if(b.cover)a.push(b.cover);a.push(...b.videos,...b.photos)});return a};
const pendingFiles=()=>{const f=[];allItems().forEach(o=>(o._files||[]).forEach(x=>f.push(x)));return f};
const countNew=()=>allItems().filter(o=>o._new).length+usedDlFiles().length;
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});

// ---------- الشاشات ----------
function route(){const h=location.hash,tab=/^#nav/.test(h)?"nav":/^#dl/.test(h)?"dl":/^#set/.test(h)?"set":"cats";
  document.querySelectorAll("#tabs a").forEach(a=>a.classList.toggle("on",a.dataset.t==tab));cur=null;
  if(tab=="nav")navView();else if(tab=="set")setView();else if(tab=="dl"){const m=h.match(/^#dl\/(.+)/);m?dlEdit(decodeURIComponent(m[1])):dlList()}
  else{const m=h.match(/^#c\/(.+)/);cur=m&&st.by[decodeURIComponent(m[1])]?decodeURIComponent(m[1]):null;cur?catView():homeView()}window.scrollTo(0,0)}
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
  const dr=$("drop");dr.onclick=()=>{pick=null;$("fi").click()};
  dr.ondragover=e=>{e.preventDefault();dr.classList.add("on")};dr.ondragleave=()=>dr.classList.remove("on");
  dr.ondrop=e=>{e.preventDefault();dr.classList.remove("on");addFiles([...e.dataTransfer.files])};
  [["gv","videos"],["gp","photos"]].forEach(([id,k])=>{const g=$(id);if(!g)return;
    g.onclick=e=>{const bt=e.target.closest("button[data-a]");if(!bt)return;const t=bt.closest(".t"),o=b[k].find(x=>x._id==t.dataset.id);act(bt.dataset.a,o,k)};
    sortable(g,ids=>{const o=b[k].map(x=>x._id).join();if(ids.join()===o)return;b[k]=ids.map(id=>b[k].find(x=>x._id==id));setDirty(true);catView()})})}
// ترتيب بالسحب (ماوس، وعلى الموبايل: اضغط مطوّل وبعدين اسحب)
function sortable(g,done,sel,vert){sel=sel||".t";
  g.addEventListener("click",e=>{if(g._dragged){e.preventDefault();e.stopPropagation();g._dragged=false}},true);
  g.addEventListener("contextmenu",e=>{if(e.target.closest(sel))e.preventDefault()});
  g.addEventListener("pointerdown",e=>{const t=e.target.closest(sel);if(!t||t.parentNode!==g||e.target.closest("button,input,textarea,select,label")||e.button>0)return;
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
      const before=vert?ev.clientY<r.top+r.height/2:r.top>t.getBoundingClientRect().bottom||r.bottom<t.getBoundingClientRect().top?(rtl?!mid:mid):(o.compareDocumentPosition(t)&4?true:false);
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
$("fi").onchange=e=>{const fs=[...e.target.files];e.target.value="";if(pick){const p=pick;pick=null;p(fs)}else addFiles(fs)};
let pick=null;function choose(accept,multi,cb){const f=$("fi");f.accept=accept;f.multiple=!!multi;pick=cb;f.click();setTimeout(()=>{f.accept="image/*,video/mp4,video/quicktime,video/webm";f.multiple=true},0)}

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

// ---------- باقي الموقع (القائمة العلوية · داونلود · الإعدادات) ----------
const strip=o=>{const r={};for(const k in o)if(k[0]!="_")r[k]=o[k];return r};
function siteDocs(){
  const dl=dlItems.map(x=>{const r=C.clean(x);if(x._ed){const im=[...new Set([r.cover,...C.bodyImgs(r.body)].filter(Boolean))];if(im.length)r.images=im;else delete r.images}return r});
  return {"content/nav.json":JSON.stringify({items:navItems.map(x=>{const r=strip(x);r.show=x.show!==false;return r})},null,2),
    "content/downloads.json":JSON.stringify(Object.assign({},dlDocs.dl||{},{items:dl}),null,2),
    "content/settings.json":JSON.stringify(setObj,null,2),"content/contact.json":JSON.stringify(conObj,null,2)}}
function usedDlFiles(){const u=new Set();dlItems.forEach(x=>C.dlPaths(x).forEach(p=>u.add(p.slice(1))));return [...dlFiles.keys()].filter(p=>u.has(p)&&!dlFiles.get(p).done)}
const dsrc=p=>{const f=p&&dlFiles.get(String(p).replace(/^\//,""));return f?f.url:p};
const touch=()=>setDirty(true);

// القائمة العلوية
function navView(){
  app.innerHTML=`<div class="head"><h2>القائمة العلوية</h2><button class="ghost" id="addL">+ رابط جديد</button></div>
  <p class="hint">اسحب ⋮⋮ عشان تغيّر الترتيب (على الموبايل: اضغط مطوّل وبعدين اسحب) · شيل علامة «ظاهر» عشان تخفي الرابط من غير ما تمسحه<br>الرابط ممكن يكون جزء من الصفحة (‎#gallery‎ = أعمالي، ‎#contact‎ = تواصل) أو أي لينك ‎https://…‎</p>
  <div class="rows" id="rows">${navItems.map(x=>`<div class="row${x.show===false?" off":""}" data-id="${x._k}"><span class="hd" title="اسحب">⋮⋮</span>
    <input data-k="label_ar" value="${esc(x.label_ar)}" placeholder="الاسم بالعربي"><input data-k="label_en" dir="ltr" value="${esc(x.label_en)}" placeholder="English name">
    ${x.type=="downloads"?`<span class="fix">⬇ قائمة الداونلود — بتعرض مشاركاتك</span>`:`<input data-k="href" dir="ltr" value="${esc(x.href)}" placeholder="#gallery أو https://…">`}
    <label class="sw"><input type="checkbox" data-k="show" ${x.show===false?"":"checked"}> ظاهر</label>${x.type=="downloads"?`<span class="xs"></span>`:`<button class="x" data-a="del" title="حذف">✕</button>`}</div>`).join("")}</div>`;
  const g=$("rows"),it=el=>navItems.find(x=>x._k==el.closest(".row").dataset.id);
  g.oninput=e=>{const k=e.target.dataset.k;if(!k)return;const o=it(e.target);o[k]=k=="show"?e.target.checked:e.target.value;if(k=="show")e.target.closest(".row").classList.toggle("off",!o.show);touch()};
  g.onclick=e=>{const b=e.target.closest("button[data-a=del]");if(!b)return;const o=it(b);if(!confirm(`تمسح «${o.label_ar||o.href||"الرابط"}»؟`))return;navItems.splice(navItems.indexOf(o),1);touch();navView()};
  $("addL").onclick=()=>{navItems.push({type:"link",label_ar:"رابط جديد",label_en:"New link",href:"https://",show:true,_k:key()});touch();navView();const r=g.lastElementChild||$("rows").lastElementChild;const i=$("rows").lastElementChild.querySelector("input");i.focus();i.select()};
  sortable(g,ids=>{if(ids.join()===navItems.map(x=>x._k).join())return;navItems=ids.map(id=>navItems.find(x=>x._k==id));touch();navView()},".row",true)}

// الداونلود: قائمة المشاركات
function dlList(){
  app.innerHTML=`<div class="head"><h2>مشاركات الداونلود</h2><button class="ghost" id="addP">+ مشاركة جديدة</button></div>
  <p class="hint">دي المشاركات اللي بتظهر في قائمة Download فوق. اسحب عشان تغيّر الترتيب · دوس على أي مشاركة عشان تعدّلها</p>
  ${dlItems.length?`<div class="cards" id="dcards">${dlItems.map(x=>`<div class="card dcard" data-id="${x._k}" role="link" tabindex="0">${x.cover?`<img src="${esc(dsrc(x.cover))}" alt="" draggable="false">`:`<span class="nocov">بدون غلاف</span>`}<div><b>${esc(x.title||"بدون عنوان")}</b><span>${x.slug?"صفحة تحميل":x.url?"رابط خارجي":"—"}${x.download_url?" · ⬇ فيه تحميل":""}</span></div></div>`).join("")}</div>`:`<p class="empty">لسه مفيش مشاركات. دوس «مشاركة جديدة».</p>`}`;
  $("addP").onclick=()=>{const o={_k:key(),_ed:1,title:"",slug:"",cover:"",body:"",download_url:""};dlItems.unshift(o);touch();location.hash="#dl/"+o._k};
  const g=$("dcards");if(!g)return;
  g.querySelectorAll("img").forEach(im=>im.onerror=()=>im.remove());
  g.onclick=e=>{const c=e.target.closest(".card");if(c)location.hash="#dl/"+c.dataset.id};g.onkeydown=e=>{const c=e.target.closest(".card");if(c&&e.key=="Enter")c.click()};
  sortable(g,ids=>{if(ids.join()===dlItems.map(x=>x._k).join())return;dlItems=ids.map(id=>dlItems.find(x=>x._k==id));touch();dlList()},".card")}

// الداونلود: تعديل مشاركة
function dlEdit(k){const x=dlItems.find(i=>i._k==k);if(!x){location.hash="#dl";return}
  app.innerHTML=`<div class="head"><a class="ghost" href="#dl">→ كل المشاركات</a><h2>${x.title?esc(x.title):"مشاركة جديدة"}</h2><button class="ghost red" id="delP">حذف المشاركة</button></div>
  <div class="form">
   <label>العنوان<input id="f_title" value="${esc(x.title)}" placeholder="مثلاً: حزمة تأثيرات نصوص عربية"></label>
   <div class="two"><label>الرابط المختصر للصفحة (إنجليزي)<input id="f_slug" dir="ltr" value="${esc(x.slug)}" placeholder="my-pack"><small>العنوان في المتصفح هيبقى ‎/#/download/<b id="sl">${esc(x.slug||"…")}</b>‎</small></label>
   <label>أو رابط خارجي بدل الصفحة (اختياري)<input id="f_url" dir="ltr" value="${esc(x.url)}" placeholder="https://…"><small>لو حطيت رابط هنا وسبت الرابط المختصر فاضي، الزرار هيفتح الرابط ده على طول</small></label></div>
   <div class="fl">صورة الغلاف<div class="covbox">${x.cover?`<img src="${esc(dsrc(x.cover))}" alt="">`:`<span class="nocov">مفيش غلاف</span>`}<div><button class="ghost" id="cov">${x.cover?"غيّر الغلاف":"ارفع غلاف"}</button>${x.cover?` <button class="ghost red" id="covx">شيل الغلاف</button>`:""}</div></div></div>
   <div class="fl">النص<div class="tb"><button data-i="img">🖼 صورة</button><button data-i="h">عنوان</button><button data-i="li">• نقطة</button><button data-i="b">عريض</button><button data-i="lnk">🔗 لينك</button><span></span><button id="pv" class="pvb">👁 معاينة</button></div>
    <textarea id="f_body" rows="16" placeholder="اكتب شرح المشاركة هنا…">${esc(x.body)}</textarea><div class="pv dlbody" id="pvb" hidden></div>
    <small>كل سطر فقرة · ## في أول السطر = عنوان · - في أول السطر = نقطة · **كلام** = عريض · زرار «صورة» بيرفع صورة ويحطها مكان المؤشر</small></div>
   <div class="fl">التحميل<div class="two"><label>رابط التحميل (Google Drive أو غيره)<input id="f_dl" dir="ltr" value="${esc(x.download_url)}" placeholder="https://drive.google.com/…"></label>
    <div><button class="ghost" id="upf">⬆ أو ارفع ملف (لحد 25MB)</button><small id="fn">${x.download_url&&/^\/files\//.test(x.download_url)?"ملف مرفوع: "+esc(x.download_url.split("/").pop()):""}</small></div></div></div>
   <label>فيديو يوتيوب (اختياري — لينك embed)<input id="f_video" dir="ltr" value="${esc(x.video)}" placeholder="https://www.youtube.com/embed/…"></label>
  </div>`;
  const bind=(id,f,after)=>{$(id).oninput=e=>{x[f]=e.target.value;x._ed=1;touch();if(after)after()}};
  bind("f_title","title");bind("f_url","url");bind("f_dl","download_url",()=>$("fn").textContent="");bind("f_video","video");bind("f_body","body");
  $("f_slug").oninput=e=>{const v=e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g,"-");if(v!==e.target.value)e.target.value=v;x.slug=v;x._ed=1;$("sl").textContent=v||"…";touch()};
  $("f_title").onblur=()=>{if(!x.slug&&!x.url){const s=C.slugify(x.title)||"post-"+Date.now().toString(36);x.slug=uniq(s,x);$("f_slug").value=x.slug;$("sl").textContent=x.slug;touch()}};
  $("delP").onclick=()=>{if(!confirm("تمسح المشاركة دي نهائي؟ (هتتمسح من الموقع لما تدوس نشر)"))return;dlItems.splice(dlItems.indexOf(x),1);touch();location.hash="#dl"};
  $("cov").onclick=()=>choose("image/*",false,async fs=>{const p=await dlImg(fs[0]);if(p){x.cover=p;x._ed=1;touch();dlEdit(k)}});
  if($("covx"))$("covx").onclick=()=>{x.cover="";x._ed=1;touch();dlEdit(k)};
  $("upf").onclick=()=>choose("*/*",false,fs=>{const f=fs[0];if(!f)return;if(f.size>MAX_VID){toast("الملف أكبر من 25MB — ارفعه على Google Drive وحط الرابط",1);return}
    const p=`files/s/dl/${Date.now().toString(36)}-${(f.name.replace(/[^\w.\-]+/g,"-").replace(/^-+/,"")||"file")}`;dlFiles.set(p,{blob:f,url:""});x.download_url="/"+p;x._ed=1;$("f_dl").value=x.download_url;$("fn").textContent="ملف مرفوع: "+f.name;touch();toast("اتضاف الملف — دوس نشر")});
  const ta=$("f_body"),ins=(a,b="")=>{const s=ta.selectionStart,e=ta.selectionEnd,v=ta.value,sel=v.slice(s,e);ta.value=v.slice(0,s)+a+sel+b+v.slice(e);ta.focus();ta.selectionStart=ta.selectionEnd=s+a.length+sel.length;x.body=ta.value;x._ed=1;touch()};
  const nl=()=>{const s=ta.selectionStart;return s>0&&ta.value[s-1]!="\n"?"\n":""};
  app.querySelector(".tb").onclick=e=>{const b=e.target.closest("button[data-i]");if(!b)return;e.preventDefault();const i=b.dataset.i;
    if(i=="h")ins(nl()+"## ");else if(i=="li")ins(nl()+"- ");else if(i=="b")ins("**","**");else if(i=="lnk"){const u=prompt("حط اللينك:","https://");if(u)ins("[","]("+u+")")}
    else if(i=="img"){const pos=[ta.selectionStart,ta.selectionEnd];choose("image/*",true,async fs=>{let t="";for(const f of fs){const p=await dlImg(f);if(p)t+=`\n![صورة](${p})\n`}if(t){ta.selectionStart=pos[0];ta.selectionEnd=pos[1];ins(t)}})}};
  $("pv").onclick=e=>{e.preventDefault();const p=$("pvb"),on=p.hidden;p.hidden=!on;ta.hidden=on;$("pv").textContent=on?"✎ رجوع للكتابة":"👁 معاينة";if(on)p.innerHTML=C.md(x.body,dsrc)}}
function uniq(s,self){let o=s,n=2;while(dlItems.some(i=>i!==self&&i.slug==o))o=s+"-"+(n++);return o}
async function dlImg(f){if(!f)return null;try{$("bmsg").textContent="جاري تجهيز الصورة…";const im=await decode(f),big=await enc(canvasOf(im.el,im.w,im.h,1800),.85);
  const p=`images/uploads/s/dl/${Date.now().toString(36)}${Math.random().toString(36).slice(2,5)}.${big.ext}`;dlFiles.set(p,{blob:big.blob,url:URL.createObjectURL(big.blob)});setDirty(true);return "/"+p}
  catch(e){toast("الصورة دي ما اتفتحتش: "+f.name,1);setDirty(dirty);return null}}

// الإعدادات
function setView(){const F=[["s","name_ar","الاسم (عربي)"],["s","name_en","الاسم (إنجليزي)",1],["s","tagline_ar","النص تحت اللوجو (عربي)"],["s","tagline_en","النص تحت اللوجو (إنجليزي)",1],["s","book_ar","كلمة زر الحجز (عربي) — فاضي = احجز الآن"],["s","book_en","كلمة زر الحجز (إنجليزي) — فاضي = Book Now",1],["s","book_msg_ar","رسالة واتساب الجاهزة (عربي) — فاضي = مرحبا، حابب أحجز جلسة تصوير"],["s","book_msg_en","رسالة واتساب الجاهزة (إنجليزي) — فاضي = نفس العربي",1],
  ["k","whatsapp","رقم واتساب (بالكود الدولي من غير + — مثلاً 971504046867)",1],["k","instagram","لينك إنستجرام",1],["k","facebook","لينك فيسبوك (اختياري)",1],["k","behance","لينك بيهانس (اختياري)",1],["k","email","الإيميل (اختياري)",1],["k","phone","رقم الهاتف (اختياري)",1]];
  app.innerHTML=`<div class="head"><h2>الإعدادات</h2></div><div class="form">
   <h3 class="sub">الواجهة</h3><div class="two">${F.slice(0,4).map(f=>fld(f)).join("")}</div>
   <h3 class="sub">زر «احجز الآن»</h3><p class="hint">الزر بيفتح واتساب على الرقم اللي تحت، والرسالة بتكون مكتوبة جاهزة.</p><div class="two">${F.slice(4,8).map(f=>fld(f)).join("")}</div>
   <h3 class="sub">التواصل</h3><p class="hint">واتساب وإنستجرام بيظهروا كأيقونات ذهبي في «تواصل معي». أي خانة فاضية مش هتظهر في الموقع.</p><div class="two">${F.slice(8).map(f=>fld(f)).join("")}</div></div>`;
  app.querySelectorAll("[data-o]").forEach(i=>i.oninput=()=>{const o=i.dataset.o=="s"?setObj:conObj;let v=i.value;if(i.dataset.f=="whatsapp"){v=v.replace(/\D+/g,"");if(v!==i.value)i.value=v}o[i.dataset.f]=v;touch()})}
const fld=([o,f,l,ltr])=>`<label>${l}<input data-o="${o}" data-f="${f}"${ltr?' dir="ltr"':""} value="${esc((o=="s"?setObj:conObj)[f])}"></label>`;

// ---------- النشر: كوميت واحد (blobs → tree → commit → ref) ----------
const b64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]);r.onerror=rej;r.readAsDataURL(blob)});
$("pub").onclick=async()=>{if(busy||!dirty)return;
  const bad=dlItems.find(x=>!String(x.title||"").trim()||(!x.slug&&!x.url));if(bad){toast("في مشاركة داونلود ناقصها عنوان أو رابط مختصر — كمّلها الأول",1);location.hash="#dl/"+bad._k;return}
  const dup=dlItems.find((x,i)=>x.slug&&dlItems.findIndex(y=>y.slug==x.slug)!=i);if(dup){toast("في مشاركتين بنفس الرابط المختصر «"+dup.slug+"» — غيّر واحد منهم",1);location.hash="#dl/"+dup._k;return}
  busy=true;$("pub").disabled=true;
  try{const files=pendingFiles().concat(usedDlFiles().map(p=>({path:p,blob:dlFiles.get(p).blob}))),tree=[];let done=0;
    const one=async f=>{const sha=(await gh("/git/blobs",{method:"POST",body:JSON.stringify({content:await b64(f.blob),encoding:"base64"})})).sha;tree.push({path:f.path,mode:"100644",type:"blob",sha});done++;
      $("bmsg").textContent=`جاري رفع الملفات ${done} من ${files.length}…`;showProg(done/(files.length+1))};
    const q=files.slice();await Promise.all([0,1,2].map(async()=>{while(q.length)await one(q.shift())}));
    $("bmsg").textContent="جاري النشر…";
    const out=C.build(st,cats);if(JSON.stringify(out)!==galBase)tree.push({path:"content/gallery.json",mode:"100644",type:"blob",content:JSON.stringify(out,null,2)});
    const catJson=JSON.stringify(Object.assign({},origCatsDoc,{categories:cats}),null,2);if(cats.map(c=>c.id).join()!==origCatIds)tree.push({path:"content/categories.json",mode:"100644",type:"blob",content:catJson});
    C.orphans(orig,out.photos).forEach(p=>tree.push({path:p,mode:"100644",type:"blob",sha:null}));
    const sd=siteDocs();Object.keys(sd).forEach(p=>{if(sd[p]!==docs0[p])tree.push({path:p,mode:"100644",type:"blob",content:sd[p]})});
    const dlNow=JSON.parse(sd["content/downloads.json"]).items;C.dlOrphans(dlOrig,dlNow).forEach(p=>tree.push({path:p,mode:"100644",type:"blob",sha:null}));
    const bc=await gh("/git/commits/"+base);
    const t=await gh("/git/trees",{method:"POST",body:JSON.stringify({base_tree:bc.tree.sha,tree})});
    const cm=await gh("/git/commits",{method:"POST",body:JSON.stringify({message:"تحديث الموقع من الاستوديو",tree:t.sha,parents:[base]})});
    await gh("/git/refs/heads/"+BR,{method:"PATCH",body:JSON.stringify({sha:cm.sha,force:false})});
    base=cm.sha;orig=out.photos;galBase=JSON.stringify(out);docs0=sd;dlOrig=JSON.parse(JSON.stringify(dlNow));dlItems.forEach(x=>delete x._ed);[...dlFiles.keys()].forEach(p=>{if(usedDlFiles().includes(p))dlFiles.get(p).done=1});origCatIds=cats.map(x=>x.id).join();allItems().forEach(o=>{delete o._new;delete o._files});busy=false;showProg(-1);setDirty(false);
    toast("تم النشر ✓ الموقع هيتحدث خلال دقيقة أو اتنين");route()}
  catch(e){busy=false;showProg(-1);setDirty(true);
    toast(e.status==422?"الموقع اتعدّل من مكان تاني. حدّث الصفحة وجرب تاني.":e.status==401?"انتهت الجلسة، اخرج وادخل تاني.":"النشر ما نجحش ("+e.message+"). جرب تاني.",1)}};

TOKEN=savedToken();TOKEN?start():loginView();
})();

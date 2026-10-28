(function(){
const REPO="ashmano19/ahmed-shaban-portfolio",BR="main",API=(window.STUDIO_API||"https://api.github.com")+"/repos/"+REPO;
const MAX_IMG=2400,MAX_TH=700,MAX_VID=25*1024*1024,VID_OK=24*1024*1024; // Cloudflare Pages: أقصى حجم للملف 25MB
const C=window.StudioCore,$=id=>document.getElementById(id),app=$("app");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let TOKEN="",base="",cats=[],origCatsDoc={},origCatIds="",st=null,orig=[],cur=null,dirty=false,busy=false;
// باقي الموقع: القائمة العلوية، الداونلود، الإعدادات
const NAVD=[{type:"link",label_ar:"أعمالي",label_en:"Portfolio",href:"#gallery",show:true},{type:"link",label_ar:"تواصل معي",label_en:"Contact",href:"#contact",show:true},{type:"downloads",label_ar:"Download",label_en:"Download",show:true}];
let galBase="",navItems=[],dlItems=[],dlOrig=[],setObj={},conObj={},mnObj=null,docs0={},KN=0;const dlFiles=new Map(),dlDocs={};
const key=()=>"k"+(KN++);
const S={up:"last",autoPub:true};try{S.up=localStorage.studioUp||"last";S.autoPub=localStorage.studioAutoPub!="0"}catch(_){}
// المجموعات: كل مجموعة بتبدأ بعنصر عليه _div (أو أول عنصر)
const gSplit=a=>{const g=[];a.forEach((o,i)=>{if(i==0||o._div)g.push([]);g[g.length-1].push(o)});return g};
const gJoin=g=>{const r=[];g.filter(x=>x.length).forEach((x,j)=>x.forEach((o,i)=>{o._div=i==0&&j>0;r.push(o)}));return r};

function toast(t,err){const d=document.createElement("div");d.className="toast"+(err?" err":"");d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),err?6000:3000)}
async function gh(path,opt={}){const r=await fetch(path.startsWith("http")?path:API+path,Object.assign({cache:"no-store"},opt,{headers:Object.assign({Authorization:"token "+TOKEN,Accept:"application/vnd.github+json"},opt.headers||{})}));
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
    const [g,c,nv,dl,se,co,mn]=await Promise.all([raw("content/gallery.json"),raw("content/categories.json"),opt("content/nav.json",null),opt("content/downloads.json",{items:[]}),opt("content/settings.json",{}),opt("content/contact.json",{}),opt("content/mano.json",null)]);mnObj=mn;
    dlDocs.dl=dl;navItems=((nv&&nv.items)||NAVD).map(x=>Object.assign({},x,{_k:key()}));
    dlItems=(dl.items||[]).map(x=>Object.assign({},x,{_k:key()}));dlOrig=JSON.parse(JSON.stringify(dl.items||[]));setObj=se;conObj=co;docs0=siteDocs();if(!nv)docs0["content/nav.json"]="";
    orig=JSON.parse(g).photos||[];origCatsDoc=JSON.parse(c);cats=origCatsDoc.categories||[];origCatIds=JSON.stringify(cats);st=C.load(orig,cats);galBase=JSON.stringify(C.build(C.load(orig,cats),cats));
    $("out").hidden=false;$("bar").hidden=false;$("tabs").hidden=false;setDirty(false);route()}
  catch(e){if(e.status==401){localStorage.removeItem("studioToken");localStorage.removeItem("decap-cms-user");loginView("انتهت الجلسة، ادخل تاني.")}else{app.innerHTML=`<p class="empty">حصلت مشكلة في التحميل (${esc(e.message)}). حدّث الصفحة.</p>`}}}

function setDirty(v){dirty=v;const n=countNew();$("pub").disabled=!v||busy;
  $("bmsg").innerHTML=v?`عندك تعديلات لسه ما اتنشرتش${n?` · <b>${countNew()}</b> ملف جديد`:""} — دوس <b>نشر</b>`:"كل حاجة منشورة ✓"}
const allItems=()=>{const a=[];Object.values(st.by).forEach(b=>{if(b.cover)a.push(b.cover);a.push(...b.videos,...b.photos)});return a};
const pendingFiles=()=>{const f=[];allItems().forEach(o=>(o._files||[]).forEach(x=>f.push(x)));return f};
const countNew=()=>allItems().filter(o=>o._new).length+usedDlFiles().length;
window.addEventListener("beforeunload",e=>{if(dirty||adding||busy){e.preventDefault();e.returnValue=""}});

// ---------- الشاشات ----------
function route(){app.oninput=app.onchange=app.onclick=null;const h=location.hash,tab=/^#nav/.test(h)?"nav":/^#dl/.test(h)?"dl":/^#set/.test(h)?"set":/^#works/.test(h)?"works":"cats";
  document.querySelectorAll("#tabs a").forEach(a=>a.classList.toggle("on",a.dataset.t==(tab=="works"?"dl":tab)));cur=null;
  if(tab=="works"&&window.MANOWorks)window.MANOWorks(app);else if(tab=="nav")navView();else if(tab=="set")setView();else if(tab=="dl"){const m=h.match(/^#dl\/(.+)/);m?dlEdit(decodeURIComponent(m[1])):dlList()}
  else{const m=h.match(/^#c\/(.+)/);cur=m&&st.by[decodeURIComponent(m[1])]?decodeURIComponent(m[1]):null;cur?catView():homeView()}window.scrollTo(0,0)}
window.onhashchange=()=>{if(st)route()};
const src=o=>o._url||o.thumb||o.image;
function homeView(){
  app.innerHTML=`<div class="head"><h2>اختار القائمة</h2></div><p class="hint">اسحب أي قائمة عشان تغيّر ترتيبها في الموقع (على الموبايل: اضغط مطوّل وبعدين اسحب) — وبعدين دوس نشر</p><div class="cards" id="cards">${cats.map(c=>{const b=st.by[c.id],n=C.counts(b),cv=b.cover||b.photos[0]||b.videos[0],cst=cv&&cv.cover?`object-position:${cv.pos||"50% 50%"};object-fit:${cv.fit||"cover"};transform:scale(${cv.zoom||1});transform-origin:${cv.pos||"50% 50%"}`:"",nw=[b.cover,...b.videos,...b.photos].filter(o=>o&&o._new).length;
    return `<div class="card" data-id="${esc(c.id)}" role="link" tabindex="0">${cv?`<img src="${esc(src(cv))}" data-full="${esc(cv.image||"")}" alt="" draggable="false" decoding="async" style="${cst}">`:""}${nw?`<i>${nw} جديد</i>`:""}<span class="cvbs"><button class="cvb" data-ce="${esc(c.id)}" title="ضبط مكان وحجم الغلاف">✎ ضبط</button><button class="cvb" data-cv="${esc(c.id)}" title="غيّر غلاف القائمة من جهازك">🖼 غلاف</button><button class="cvb dl" data-dc="${esc(c.id)}" title="احذف القائمة">🗑</button></span><div><b>${esc(c.name_ar)}</b><span>${n.p} صورة · ${n.v} فيديو</span></div></div>`}).join("")}<div class="addc" id="addCat" role="button" tabindex="0"><b>＋</b><span>قائمة جديدة</span></div></div>`;
  const g=$("cards");g.querySelectorAll("img").forEach(im=>im.onerror=()=>{if(im.dataset.full&&im.src.indexOf(im.dataset.full)<0)im.src=im.dataset.full});
  $("addCat").onclick=()=>catForm();$("addCat").onkeydown=e=>{if(e.key=="Enter")catForm()};
  g.onclick=e=>{const dc=e.target.closest("[data-dc]");if(dc){e.stopPropagation();catDel(dc.dataset.dc);return}const cb=e.target.closest("[data-cv]");if(cb){e.stopPropagation();coverUpload(cb.dataset.cv);return}const ce=e.target.closest("[data-ce]");if(ce){e.stopPropagation();coverEdit(ce.dataset.ce);return}const c=e.target.closest(".card");if(c)location.hash="#c/"+encodeURIComponent(c.dataset.id)};
  g.onkeydown=e=>{const c=e.target.closest(".card");if(c&&e.key=="Enter")c.click()};
  sortable(g,ids=>{ids=ids.filter(Boolean);if(ids.join()===cats.map(c=>c.id).join())return;cats=ids.map(id=>cats.find(c=>c.id==id));setDirty(true);homeView()},".card")}
function tile(o,i,kind){const d=i>0&&o._div,on=SEL.has(o._id);return `<div class="t${d?" div":""}${o._new?" new":""}${on?" sel":""}" data-id="${o._id}"><img loading="lazy" src="${esc(src(o))}" alt="">${kind=="v"?`<span class="vb">▶ فيديو</span>`:""}<span class="ck" title="تحديد">✓</span>
  <div class="bt">${kind=="v"?`<button data-a="poster" title="غيّر غلاف الفيديو من جهازك">🖼</button>`:""}${i>0?`<button data-a="div" title="${d?"إلغاء الخط الذهبي":"بداية مجموعة جديدة (خط ذهبي قبلها)"}">✂</button>`:""}<button data-a="cover" title="اجعلها صورة الغلاف">★</button><button class="x" data-a="del" title="حذف">✕</button></div></div>`}
function catView(){const c=cats.find(x=>x.id==cur),b=st.by[cur],n=C.counts(b);if(catView._c!==cur){catView._c=cur;SEL.clear();selAnchor=null}
  app.innerHTML=`<div class="head"><a class="ghost" href="#">→ القوائم</a><h2>${esc(c.name_ar)} <button class="ghost" id="catRn" style="font-size:.8rem;padding:2px 12px">✎ الاسم</button> <small style="font-size:.9rem;color:#CEA111">${n.p} صورة · ${n.v} فيديو</small></h2>
    <div class="cov">${b.cover?`<img src="${esc(src(b.cover))}" alt="">`:""}<span>صورة الغلاف<br><small>★ من الصور أو</small></span><button class="ghost" id="cvUp">🖼 غلاف من جهازك</button><button class="ghost" id="cvEd">✎ ضبط الغلاف</button></div>
    <button class="ghost" id="selT">☑ تحديد الكل</button></div>
  ${`<div class="selbar" id="selbar" hidden><b id="selN"></b><button data-s="all">تحديد الكل</button><button data-s="none">إلغاء التحديد</button><button data-s="grp">▦ مجموعة جديدة منهم</button><button data-s="top">⇡ للأول</button><button data-s="end">⇣ للآخر</button>
    <select id="selMv"><option value="">نقل إلى قائمة…</option>${cats.filter(x=>x.id!=cur).map(x=>`<option value="${esc(x.id)}">${esc(x.name_ar)}</option>`).join("")}</select><button data-s="del" class="red">🗑 حذف المحدد</button></div>`}
  <div class="drop" id="drop"><b>اسحب الصور والفيديوهات هنا</b><small>أو دوس عشان تختار من جهازك — تقدر تختار كذا ملف مرة واحدة (الفيديوهات الكبيرة بتتضغط تلقائيًا)</small></div>
  <div class="opts"><label>الملفات الجديدة تتضاف في: <select id="upT"><option value="last">آخر مجموعة</option><option value="newEnd">مجموعة جديدة في الآخر</option><option value="newStart">مجموعة جديدة في الأول</option></select></label>
    <span class="hint" style="margin:0">أو استخدم «＋ ضيف هنا» جوه أي مجموعة · «＋ مجموعة جديدة» تحت كل قسم</span></div>
  <p class="hint">🖱 دوس على أي صورة تتحدد (ودوسة تانية تلغيها) · اسحب الماوس على الصور عشان تحدد كذا صورة مرة واحدة · <b>Shift</b>+دوسة تحدد من-لحد · اسحب صورة <b>محددة</b> عشان تنقل كل المحدد مع بعض · <b>Delete</b> حذف · <b>Ctrl+A</b> الكل · <b>Esc</b> إلغاء<br>✂ يبدأ مجموعة جديدة من الصورة دي · ★ غلاف القائمة · ✕ حذف · المحدد تقدر تعمله «مجموعة جديدة» من شريط التحديد</p>
  <div class="ordbar"><span>ترتيب الأقسام في الموقع:</span><button class="ghost${c.order=="photos"?"":" on"}" data-ord="videos">🎬 الفيديو فوق</button><button class="ghost${c.order=="photos"?" on":""}" data-ord="photos">🖼 الصور فوق</button></div>
  ${(()=>{const V=`<h3 class="sub">VIDEO</h3>${secHtml(b.videos,"videos","v")}`,P=`<h3 class="sub">PHOTO</h3>${secHtml(b.photos,"photos","p")}`;return c.order=="photos"?P+V:V+P})()}`;
  $("upT").value=S.up;$("upT").onchange=e=>{S.up=e.target.value;try{localStorage.studioUp=S.up}catch(_){}};
  app.querySelectorAll("[data-g]").forEach(x=>x.onclick=()=>grpAct(x.dataset.ga,x.dataset.k,+x.dataset.g));
  app.querySelectorAll("[data-ng]").forEach(x=>x.onclick=()=>choose("image/*,video/*",true,fs=>addFiles(fs,{mode:"newEnd"})));
  $("catRn").onclick=()=>catForm(cur);
  app.querySelectorAll("[data-ord]").forEach(x=>x.onclick=()=>{const v=x.dataset.ord;if((c.order=="photos"?"photos":"videos")==v)return;if(v=="photos")c.order="photos";else delete c.order;setDirty(true);toast(v=="photos"?"الصور هتظهر فوق الفيديو — دوس نشر":"الفيديو هيظهر فوق الصور — دوس نشر");catView()});$("cvUp").onclick=()=>coverUpload(cur);$("cvEd").onclick=()=>coverEdit(cur);$("selT").onclick=()=>bulk("all");
  document.querySelectorAll(".selbar [data-s]").forEach(x=>x.onclick=()=>bulk(x.dataset.s));$("selMv").onchange=e=>{if(e.target.value)bulk("move",e.target.value)};selUpd();
  const dr=$("drop");dr.onclick=()=>{pick=null;$("fi").click()};
  dr.ondragover=e=>{e.preventDefault();dr.classList.add("on")};dr.ondragleave=()=>dr.classList.remove("on");
  dr.ondrop=e=>{e.preventDefault();e.stopPropagation();dr.classList.remove("on");addFiles([...e.dataTransfer.files])};
  app.querySelectorAll(".ghd").forEach(h=>{h.ondragover=e=>{if(e.dataTransfer.types.includes("Files")){e.preventDefault();h.classList.add("on")}};h.ondragleave=()=>h.classList.remove("on");
    h.ondrop=e=>{e.preventDefault();e.stopPropagation();h.classList.remove("on");addFiles([...e.dataTransfer.files],{mode:"into",k:h.dataset.k,g:+h.dataset.gi})}});
  [["gv","videos"],["gp","photos"]].forEach(([id,k])=>{const g=$(id);if(!g)return;
    g.onclick=e=>{if(app._marq&&Date.now()-app._marq<300)return;const bt=e.target.closest("button[data-a]");if(!bt){const t=e.target.closest(".t");if(t)selClick(t.dataset.id,e);return}const t=bt.closest(".t"),o=b[k].find(x=>x._id==t.dataset.id);act(bt.dataset.a,o,k)};
    sortable(g,(ids,dragged)=>{const gi={};let j=-1;[...g.children].forEach(x=>{if(x.classList.contains("ghd"))j++;else if(x.matches(".t"))gi[x.dataset.id]=Math.max(0,j)});
      if(dragged&&SEL.has(dragged)&&SEL.size>1){const grp=b[k].map(x=>x._id).filter(id=>SEL.has(id));if(grp.length>1){
        const rest=ids.filter(id=>!SEL.has(id)||id==dragged),at=rest.indexOf(dragged);rest.splice(at,1,...grp);ids=rest;grp.forEach(id=>gi[id]=gi[dragged])}}
      const before=b[k].map(x=>x._id+":"+(x._div?1:0)).join(),G=[];ids.forEach(id=>{const o=b[k].find(x=>x._id==id);(G[gi[id]]=G[gi[id]]||[]).push(o)});
      const nb=gJoin(G.filter(Boolean));if(nb.map(x=>x._id+":"+(x._div?1:0)).join()===before)return;b[k]=nb;setDirty(true);catView()})})}
function secHtml(arr,k,kind){if(!arr.length)return `<p class="empty">مفيش ${kind=="v"?"فيديوهات":"صور"} في القائمة دي.</p><div class="gadd"><button class="ghost" data-ng="${k}">＋ ضيف ${kind=="v"?"فيديوهات":"صور"}</button></div>`;
  const G=gSplit(arr);let i=0;
  return `<div class="grid" id="g${kind}">${G.map((g,j)=>`<div class="ghd" data-k="${k}" data-gi="${j}"><b>مجموعة ${j+1}</b><small>${g.length} ${kind=="v"?"فيديو":"صورة"}</small><span>
    <button class="ghost" data-g="${j}" data-ga="add" data-k="${k}" title="ضيف ملفات في آخر المجموعة دي">＋ ضيف هنا</button><button class="ghost" data-g="${j}" data-ga="sel" data-k="${k}">☑ تحديد</button>
    ${j>0?`<button class="ghost" data-g="${j}" data-ga="up" data-k="${k}" title="طلّع المجموعة فوق">⇡</button>`:""}${j<G.length-1?`<button class="ghost" data-g="${j}" data-ga="down" data-k="${k}" title="نزّل المجموعة تحت">⇣</button>`:""}
    ${j>0?`<button class="ghost" data-g="${j}" data-ga="merge" data-k="${k}" title="ادمجها مع المجموعة اللي قبلها">⤒ دمج</button>`:""}<button class="ghost red" data-g="${j}" data-ga="del" data-k="${k}" title="احذف المجموعة بكل اللي فيها">🗑</button></span></div>`+g.map(o=>tile(o,i++,kind)).join("")).join("")}</div>
  <div class="gadd"><button class="ghost" data-ng="${k}">＋ مجموعة جديدة</button></div>`}
function grpAct(a,k,j){const b=st.by[cur],G=gSplit(b[k]);if(!G[j])return;
  if(a=="add"){choose("image/*,video/*",true,fs=>addFiles(fs,{mode:"into",k,g:j}));return}
  if(a=="sel"){G[j].forEach(o=>SEL.add(o._id));return selUpd()}
  if(a=="del"){if(!confirm(`تحذف المجموعة ${j+1} (${G[j].length} عنصر)؟`))return;G.splice(j,1)}
  else if(a=="up"&&j>0)[G[j-1],G[j]]=[G[j],G[j-1]];
  else if(a=="down"&&j<G.length-1)[G[j+1],G[j]]=[G[j],G[j+1]];
  else if(a=="merge"&&j>0){G[j-1].push(...G[j]);G.splice(j,1)}
  b[k]=gJoin(G);setDirty(true);catView()}
// إفلات ملفات في أي حتة في صفحة القائمة = إضافة (بدل ما المتصفح يفتح الملف ويسيب الاستوديو)
addEventListener("dragover",e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes("Files"))e.preventDefault()});
addEventListener("drop",e=>{if(!e.dataTransfer||!e.dataTransfer.files.length)return;e.preventDefault();if(cur&&/^#c\//.test(location.hash))addFiles([...e.dataTransfer.files]);else toast("افتح القائمة الأول وبعدين اسحب الملفات جواها",1)});
// ---------- تحديد زي سطح المكتب: دوسة، Ctrl، Shift، مربع بالماوس، كيبورد ----------
let selAnchor=null;
const selOrder=()=>{const b=st.by[cur],c=cats.find(x=>x.id==cur);return b?(c&&c.order=="photos"?[...b.photos,...b.videos]:[...b.videos,...b.photos]).map(o=>o._id):[]};
function selUpd(){document.querySelectorAll("#app .t").forEach(t=>t.classList.toggle("sel",SEL.has(t.dataset.id)));
  const bar=$("selbar");if(bar){bar.hidden=!SEL.size;const n=$("selN");if(n)n.textContent=SEL.size+" محدد"}}
function selClick(id,e){if(e.shiftKey&&selAnchor){const o=selOrder(),a=o.indexOf(selAnchor),z=o.indexOf(id);if(a>=0&&z>=0){if(!(e.ctrlKey||e.metaKey))SEL.clear();o.slice(Math.min(a,z),Math.max(a,z)+1).forEach(x=>SEL.add(x))}}
  else{SEL.has(id)?SEL.delete(id):SEL.add(id);selAnchor=id}
  selUpd()}
// مربع التحديد: اسحب في أي مكان فاضي في صفحة القائمة
document.addEventListener("pointerdown",e=>{if(!cur||!/^#c\//.test(location.hash)||e.button>0||e.pointerType!="mouse")return;
  if(e.target.closest("button,a,input,select,textarea,label,.drop,.selbar,.cved,.ck,.top,.tabs,.bar,.toast,.cov"))return;
  const onT=e.target.closest(".t");if(onT&&SEL.has(onT.dataset.id))return;      // سحب صورة محددة = نقل المحدد
  e.preventDefault();
  const sx=e.pageX,sy=e.pageY,base=(onT||e.ctrlKey||e.metaKey||e.shiftKey)?new Set(SEL):new Set();let box=null,raf=0,lx=e.clientX,ly=e.clientY;
  const tiles=[...document.querySelectorAll("#app .t")];
  const upd=()=>{raf=0;const x1=Math.min(sx,lx+scrollX),x2=Math.max(sx,lx+scrollX),y1=Math.min(sy,ly+scrollY),y2=Math.max(sy,ly+scrollY);
    Object.assign(box.style,{left:x1+"px",top:y1+"px",width:x2-x1+"px",height:y2-y1+"px"});
    SEL=new Set(base);tiles.forEach(t=>{const r=t.getBoundingClientRect(),ax=r.left+scrollX,ay=r.top+scrollY;if(ax<x2&&ax+r.width>x1&&ay<y2&&ay+r.height>y1)SEL.add(t.dataset.id)});selUpd()};
  const mv=ev=>{lx=ev.clientX;ly=ev.clientY;if(!box){if(Math.hypot(ev.pageX-sx,ev.pageY-sy)<5)return;box=document.createElement("div");box.className="marq";document.body.appendChild(box);document.body.classList.add("noselect")}
    ev.preventDefault();if(ly<80)scrollBy(0,-20);else if(ly>innerHeight-110)scrollBy(0,20);if(!raf)raf=requestAnimationFrame(upd)};
  const up=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);document.body.classList.remove("noselect");
    if(box){box.remove();if(SEL.size)selAnchor=[...SEL].pop();app._marq=Date.now()}else if(!onT&&!(e.ctrlKey||e.metaKey||e.shiftKey)&&SEL.size){SEL.clear();selUpd()}};
  addEventListener("pointermove",mv,{passive:false});addEventListener("pointerup",up)});
addEventListener("keydown",e=>{if(!cur||!/^#c\//.test(location.hash)||e.target.closest("input,textarea,select,[contenteditable]")||document.querySelector(".cved"))return;
  if((e.key=="Delete"||e.key=="Backspace")&&SEL.size){e.preventDefault();bulk("del")}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=="a"){e.preventDefault();bulk("all")}
  else if(e.key=="Escape"&&SEL.size){SEL.clear();selUpd()}});
// ترتيب بالسحب (ماوس، وعلى الموبايل: اضغط مطوّل وبعدين اسحب)
function sortable(g,done,sel,vert){sel=sel||".t";
  g.addEventListener("click",e=>{if(g._dragged){e.preventDefault();e.stopPropagation();g._dragged=false}},true);
  g.addEventListener("contextmenu",e=>{if(e.target.closest(sel))e.preventDefault()});
  g.addEventListener("pointerdown",e=>{const t=e.target.closest(sel);if(t&&sel==".t"&&e.pointerType=="mouse"&&!t.classList.contains("sel"))return;if(!t||t.parentNode!==g||e.target.closest("button,input,textarea,select,label")||e.button>0)return;
    const sx=e.clientX,sy=e.clientY,touch=e.pointerType!="mouse";let timer=0,on=false,fly=null,dx=0,dy=0;
    const begin=()=>{on=true;const r=t.getBoundingClientRect();dx=sx-r.left;dy=sy-r.top;fly=t.cloneNode(true);fly.classList.add("fly");
      if(t.classList.contains("sel")){const n=g.querySelectorAll(sel+".sel").length;if(n>1){const bd=document.createElement("b");bd.className="flyn";bd.textContent=n;fly.appendChild(bd);g.querySelectorAll(sel+".sel").forEach(x=>{if(x!==t)x.classList.add("ghostT")})}}
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
      if(on){on=false;g._dragged=true;setTimeout(()=>g._dragged=false,400);fly.remove();g.querySelectorAll(".ghostT").forEach(x=>x.classList.remove("ghostT"));done([...g.children].filter(x=>x.matches(sel)).map(x=>x.dataset.id),t.dataset.id)}};
    addEventListener("pointermove",mv,{passive:false});addEventListener("pointerup",end);addEventListener("pointercancel",end);t.addEventListener("touchmove",tm,{passive:false})})}
function act(a,o,k){const b=st.by[cur];
  if(a=="del"){if(!confirm("تحذف العنصر ده؟"))return;const i=b[k].indexOf(o);if(o._div&&b[k][i+1]&&!b[k][i+1]._div)b[k][i+1]._div=true;b[k].splice(i,1);if(b.cover&&o._new&&b.cover.image==o.image)b.cover._files=(o._files||[]).filter(f=>"/"+f.path==o.image||"/"+f.path==o.thumb)}
  else if(a=="div")o._div=!o._div;
  else if(a=="poster"){posterUpload(o);return}
  else if(a=="cover"){const c=cats.find(x=>x.id==cur);if(!b.cover)b.cover={_id:"c"+Date.now(),category:cur,title_ar:c.name_ar,title_en:c.name_en,cover:true};
    b.cover.image=o.image;b.cover.thumb=o.thumb||o.image;b.cover._url=o._url;b.cover._files=[];toast("تم تغيير صورة الغلاف")}
  setDirty(true);catView()}
// ---------- إضافة / تسمية / حذف القوائم ----------
function catForm(id){const c=id?cats.find(x=>x.id==id):null;const d=document.createElement("div");d.className="cved";
  d.innerHTML=`<div class="cvbox" style="width:min(460px,100%)"><h3>${c?"اسم القائمة":"قائمة جديدة"}</h3>
   <div class="form"><label>الاسم بالعربي<input id="cn_ar" value="${esc(c?c.name_ar:"")}" placeholder="مثلاً: تصوير منتجات"></label>
   <label>الاسم بالإنجليزي<input id="cn_en" dir="ltr" value="${esc(c?c.name_en:"")}" placeholder="e.g. Product Photography"></label>
   ${c?"":`<p class="hint">القائمة بتظهر في الموقع أول ما تضيف فيها صور أو فيديوهات وتدوس نشر.</p>`}</div>
   <div class="cvrow"><span style="flex:1"></span><button class="ghost" id="cnNo">إلغاء</button><button class="gold" id="cnOk">${c?"حفظ":"إضافة"}</button></div></div>`;
  document.body.appendChild(d);const A=d.querySelector("#cn_ar"),E=d.querySelector("#cn_en");A.focus();
  d.querySelector("#cnNo").onclick=()=>d.remove();d.onclick=e=>{if(e.target==d)d.remove()};
  const ok=()=>{const ar=A.value.trim(),en=E.value.trim();if(!ar){toast("اكتب اسم القائمة بالعربي",1);return}
    if(c){c.name_ar=ar;c.name_en=en||ar;const b=st.by[c.id];[b.cover,...b.videos,...b.photos].forEach(o=>{if(o){o.title_ar=c.name_ar;o.title_en=c.name_en}})}
    else{let base=C.slugify(en)||"list",nid=base,n=2;while(cats.some(x=>x.id==nid))nid=base+"-"+(n++);cats.push({id:nid,name_ar:ar,name_en:en||ar});st.by[nid]={cover:null,videos:[],photos:[]};id=nid}
    d.remove();setDirty(true);toast(c?"اتغيّر الاسم — دوس نشر":"اتضافت القائمة — ضيف فيها صور وبعدين دوس نشر");location.hash="#c/"+encodeURIComponent(id);route()};
  d.querySelector("#cnOk").onclick=ok;d.addEventListener("keydown",e=>{if(e.key=="Enter")ok();if(e.key=="Escape")d.remove()})}
function catDel(id){const c=cats.find(x=>x.id==id),n=C.counts(st.by[id]);if(!c)return;
  if(!confirm(`تحذف قائمة «${c.name_ar}»${n.p+n.v?` وكل اللي فيها (${n.p} صورة و ${n.v} فيديو)`:""}؟\nالحذف بيتنفذ في الموقع لما تدوس نشر.`))return;
  cats=cats.filter(x=>x.id!=id);delete st.by[id];setDirty(true);toast("اتحذفت القائمة — دوس نشر");homeView()}
// ---------- محرر الغلاف: مكان الصورة (اسحب)، تكبير، ملء/احتواء، وحجم الكارت في الموقع ----------
function coverEdit(cid){const c=cats.find(x=>x.id==cid),b=st.by[cid];let cv=b.cover;
  if(!cv){const f=b.photos[0]||b.videos[0];if(!f){toast("ضيف صور للقائمة الأول",1);return}
    cv=b.cover={_id:"c"+Date.now(),category:cid,title_ar:c.name_ar,title_en:c.name_en,cover:true,image:f.image,thumb:f.thumb||f.image,_url:f._url,_files:[]}}
  const P=(cv.pos||"50% 50%").split(" ").map(v=>parseFloat(v)),S0={x:isNaN(P[0])?50:P[0],y:isNaN(P[1])?50:P[1],z:+cv.zoom||1,fit:cv.fit||"cover",size:cv.size||"normal"},v=Object.assign({},S0);
  const d=document.createElement("div");d.className="cved";
  d.innerHTML=`<div class="cvbox"><h3>غلاف «${esc(c.name_ar)}»</h3><p class="hint">اسحب الصورة عشان تختار الجزء اللي يظهر · العجلة أو السلايدر للتكبير</p>
   <div class="cvstage"><div class="cvcard" id="cvC"><img id="cvI" src="${esc(src(cv))}" alt="" draggable="false"><div><b>${esc(c.name_ar)}</b><span>معاينة زي الموقع</span></div></div></div>
   <div class="cvrow"><label>تكبير <input type="range" id="cvZ" min="1" max="3" step="0.01"></label><b id="cvZv"></b></div>
   <div class="cvrow"><span>طريقة العرض</span><label class="sw"><input type="radio" name="cvf" value="cover"> ملء الكارت</label><label class="sw"><input type="radio" name="cvf" value="contain"> الصورة كاملة</label></div>
   <div class="cvrow"><span>حجم الكارت في الموقع</span><label class="sw"><input type="radio" name="cvs" value="normal"> عادي</label><label class="sw"><input type="radio" name="cvs" value="wide"> عريض</label><label class="sw"><input type="radio" name="cvs" value="big"> كبير</label></div>
   <div class="cvrow"><button class="ghost" id="cvRe">↺ رجّع الافتراضي</button><span style="flex:1"></span><button class="ghost" id="cvNo">إلغاء</button><button class="gold" id="cvOk">تم</button></div></div>`;
  document.body.appendChild(d);const C_=d.querySelector("#cvC"),I=d.querySelector("#cvI"),Z=d.querySelector("#cvZ");
  const draw=()=>{C_.className="cvcard "+v.size;I.style.objectPosition=v.x.toFixed(1)+"% "+v.y.toFixed(1)+"%";I.style.objectFit=v.fit;I.style.transform="scale("+v.z+")";I.style.transformOrigin=v.x+"% "+v.y+"%";
    Z.value=v.z;d.querySelector("#cvZv").textContent=Math.round(v.z*100)+"%";d.querySelectorAll("[name=cvf]").forEach(r=>r.checked=r.value==v.fit);d.querySelectorAll("[name=cvs]").forEach(r=>r.checked=r.value==v.size)};
  Z.oninput=()=>{v.z=+Z.value;draw()};d.querySelectorAll("[name=cvf]").forEach(r=>r.onchange=()=>{v.fit=r.value;draw()});d.querySelectorAll("[name=cvs]").forEach(r=>r.onchange=()=>{v.size=r.value;draw()});
  C_.onwheel=e=>{e.preventDefault();v.z=Math.max(1,Math.min(3,+(v.z*(e.deltaY<0?1.05:1/1.05)).toFixed(3)));draw()};
  C_.onpointerdown=e=>{e.preventDefault();const r=C_.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,x0=v.x,y0=v.y;C_.setPointerCapture(e.pointerId);
    C_.onpointermove=ev=>{v.x=Math.max(0,Math.min(100,x0-(ev.clientX-sx)/r.width*100/v.z));v.y=Math.max(0,Math.min(100,y0-(ev.clientY-sy)/r.height*100/v.z));draw()};
    C_.onpointerup=()=>{C_.onpointermove=null}};
  d.querySelector("#cvRe").onclick=()=>{Object.assign(v,{x:50,y:50,z:1,fit:"cover",size:"normal"});draw()};
  d.querySelector("#cvNo").onclick=()=>d.remove();d.onclick=e=>{if(e.target==d)d.remove()};
  d.querySelector("#cvOk").onclick=()=>{const pos=Math.round(v.x)+"% "+Math.round(v.y)+"%";
    if(pos=="50% 50%")delete cv.pos;else cv.pos=pos;if(v.z>1.001)cv.zoom=+v.z.toFixed(2);else delete cv.zoom;
    if(v.fit=="contain")cv.fit="contain";else delete cv.fit;if(v.size!="normal")cv.size=v.size;else delete cv.size;
    d.remove();setDirty(true);toast("اتضبط الغلاف — دوس نشر");route()};
  draw()}
// ---------- أغلفة + تحديد متعدد ----------
let SEL=new Set();
async function makeImg(file,dir,name){const im=await decode(file),big=await enc(canvasOf(im.el,im.w,im.h,MAX_IMG),.85),th=await enc(canvasOf(im.el,im.w,im.h,MAX_TH),.78);
  const ip=`${dir}/${name}.${big.ext}`,tp=`${dir}/t/${name}.${th.ext}`;return {image:"/"+ip,thumb:"/"+tp,_url:URL.createObjectURL(th.blob),_files:[{path:ip,blob:big.blob},{path:tp,blob:th.blob}]}}
function coverUpload(cid){if(busy)return;choose("image/*",false,async fs=>{const f=fs[0];if(!f)return;
  try{const c=cats.find(x=>x.id==cid),b=st.by[cid];const r=await makeImg(f,"images/uploads/s/"+cid+"/cover","c"+Date.now().toString(36));
    if(!b.cover)b.cover={_id:"c"+Date.now(),category:cid,title_ar:c.name_ar,title_en:c.name_en,cover:true};Object.assign(b.cover,r,{_new:1});
    setDirty(true);toast("اتغيّر غلاف «"+c.name_ar+"» — دوس نشر");route()}catch(e){toast("ما قدرتش أقرا الصورة دي",1)}})}
function posterUpload(o){if(busy)return;choose("image/*",false,async fs=>{const f=fs[0];if(!f)return;
  try{const im=await decode(f),p=await enc(canvasOf(im.el,im.w,im.h,720),.8),pp=`images/uploads/s/${cur}/v/p${Date.now().toString(36)}.${p.ext}`;
    o.image="/"+pp;o.thumb="/"+pp;o._url=URL.createObjectURL(p.blob);o._new=1;o._files=(o._files||[]).filter(x=>"/"+x.path==o.video).concat([{path:pp,blob:p.blob}]);
    setDirty(true);toast("اتغيّر غلاف الفيديو — دوس نشر");catView()}catch(e){toast("ما قدرتش أقرا الصورة دي",1)}})}
function bulk(a,arg){const b=st.by[cur],ks=["videos","photos"];
  if(a=="all"){ks.forEach(k=>b[k].forEach(o=>SEL.add(o._id)));return selUpd()}
  if(a=="none"){SEL.clear();return selUpd()}
  if(!SEL.size){toast("حدد عناصر الأول",1);return}
  const n=SEL.size;
  if(a=="del"){if(!confirm(`تحذف ${n} عنصر؟`))return;
    ks.forEach(k=>{const keep=[];let carry=false;b[k].forEach(o=>{if(SEL.has(o._id)){if(o._div)carry=true;return}if(carry){o._div=true;carry=false}keep.push(o)});b[k]=keep});toast(`اتحذف ${n} عنصر — دوس نشر`)}
  else if(a=="grp")ks.forEach(k=>{const mv=b[k].filter(o=>SEL.has(o._id));if(!mv.length)return;const G=gSplit(b[k]).map(g=>g.filter(o=>!SEL.has(o._id)));G.push(mv);b[k]=gJoin(G)});
  else if(a=="top"||a=="end")ks.forEach(k=>{const s1=b[k].filter(o=>SEL.has(o._id)),s2=b[k].filter(o=>!SEL.has(o._id));s1.forEach(o=>o._div=false);b[k]=a=="top"?s1.concat(s2):s2.concat(s1)});
  else if(a=="move"){const t=cats.find(x=>x.id==arg),tb=st.by[arg];if(!t||!tb)return;
    ks.forEach(k=>{const mv=b[k].filter(o=>SEL.has(o._id));b[k]=b[k].filter(o=>!SEL.has(o._id));mv.forEach((o,i)=>{o.category=arg;o.title_ar=t.name_ar;o.title_en=t.name_en;o._div=i==0&&tb[k].length>0});tb[k].push(...mv)});
    toast(`اتنقل ${n} عنصر لـ «${t.name_ar}» — دوس نشر`)}
  SEL.clear();setDirty(true);catView()}
$("fi").onchange=e=>{const fs=[...e.target.files];e.target.value="";if(pick){const p=pick;pick=null;p(fs)}else addFiles(fs)};
let pick=null;function choose(accept,multi,cb){const f=$("fi");f.accept=accept;f.multiple=!!multi;pick=cb;f.click();setTimeout(()=>{f.accept="image/*,video/*";f.multiple=true},0)}

// ---------- تجهيز الملفات في المتصفح ----------
function canvasOf(srcEl,w,h,max){const [W,H]=C.fitSize(w,h,max),cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");x.imageSmoothingQuality="high";x.drawImage(srcEl,0,0,W,H);return cv}
function enc(cv,q){return new Promise(res=>cv.toBlob(b=>{if(b&&b.type=="image/webp")res({blob:b,ext:"webp"});else cv.toBlob(j=>res({blob:j,ext:"jpg"}),"image/jpeg",q)},"image/webp",q))}
async function decode(file){if(window.createImageBitmap){try{const bm=await createImageBitmap(file,{imageOrientation:"from-image"});return {el:bm,w:bm.width,h:bm.height}}catch(_){}}
  return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>res({el:im,w:im.naturalWidth,h:im.naturalHeight});im.onerror=()=>rej(new Error("img"));im.src=u})}
function frame(file){return new Promise((res,rej)=>{const v=document.createElement("video"),u=URL.createObjectURL(file);let done=false;const fail=()=>{if(!done){done=true;rej(new Error("vid"))}};
  v.muted=true;v.playsInline=true;v.preload="auto";v.onerror=fail;setTimeout(fail,20000);
  v.onloadedmetadata=()=>{v.currentTime=Math.min(1,(v.duration||3)/3)};
  v.onseeked=()=>{if(done)return;done=true;res({el:v,w:v.videoWidth,h:v.videoHeight,url:u})};v.src=u})}
let adding=false,queue=[],vpT=0,vpStart=0;
const VEXT=/\.(mp4|mov|m4v|webm|mkv|avi|3gp)$/i,isVid=f=>f.type.startsWith("video/")||VEXT.test(f.name);
// لوحة تقدم واضحة في نص الشاشة أثناء تجهيز/ضغط الفيديوهات
function vpShow(on){let d=$("vp");if(!on){if(d)d.remove();clearInterval(vpT);return}
  if(d)return;d=document.createElement("div");d.id="vp";d.innerHTML=`<div class="vpb"><b id="vpT">جاري تجهيز الملفات…</b><span id="vpN"></span><div class="vpbar"><i id="vpI"></i></div><small id="vpE"></small>
  <label class="vpa"><input type="checkbox" id="vpP" ${S.autoPub?"checked":""}> انشر لوحده أول ما يخلص</label>
  <p>تقدر تصغّر اللوحة وتكمل شغلك في الاستوديو، أو تروح لأي برنامج أو تاب تاني — هيكمل. بس ما تقفلش التاب نفسه.</p>
  <div class="vpk"><button class="gold" id="vpM">⇲ صغّرها وكمّل شغلك</button><button class="ghost" id="vpX">إلغاء</button></div></div><button class="vpmini" id="vpS"></button>`;document.body.appendChild(d);
  $("vpP").onchange=e=>{S.autoPub=e.target.checked;try{localStorage.studioAutoPub=S.autoPub?"1":"0"}catch(_){}};
  $("vpM").onclick=()=>d.classList.add("min");$("vpS").onclick=()=>d.classList.remove("min");
  $("vpX").onclick=()=>{cancelled=true;queue=[];if(vctl.cancel)vctl.cancel().catch?.(()=>{});import("/studio/ffmpeg/compress.js?v=17").then(m=>m.abort&&m.abort()).catch(()=>{});$("vpT").textContent="بلغي…"};
  vpStart=Date.now();clearInterval(vpT);vpT=setInterval(vpTick,1000)}
let vpP=0,cancelled=false;
function vpSet(t,n,p){if(!$("vp"))return;if(t!=null){$("vpT").textContent=t;$("vpS").textContent="⏳ "+t}if(n!=null)$("vpN").textContent=n;if(p!=null){vpP=p;$("vpI").style.width=Math.round(p*100)+"%"}vpTick()}
function vpTick(){const e=$("vpE");if(!e)return;const s=Math.round((Date.now()-vpStart)/1000),f=x=>Math.floor(x/60)+":"+String(x%60).padStart(2,"0");
  let t="الوقت: "+f(s);if(vpP>.03&&s>8)t+=" · فاضل تقريبًا "+f(Math.max(0,Math.round(s/vpP-s)));e.textContent=t}
async function addFiles(files,tgt){tgt=tgt||{mode:S.up};const cid=tgt.cid||cur,c=cats.find(x=>x.id==cid),b=st.by[cid];if(!c)return;tgt.cid=cid;
  const all=files;files=files.filter(f=>/^image\//.test(f.type)||isVid(f)||/\.(jpe?g|png|webp|heic|gif)$/i.test(f.name));
  if(files.length<all.length)toast("الملفات دي نوعها مش مدعوم: "+all.filter(f=>!files.includes(f)).map(f=>f.name).join("، "),1);
  if(!files.length)return;
  if(adding){queue.push(...files.map(f=>(f._t=tgt,f)));toast(`اتضافوا للطابور (${queue.length}) — هيتجهزوا بعد اللي شغالين`);return}
  if(busy)return toast("استنى لحد ما النشر يخلص",1);
  adding=true;busy=true;cancelled=false;setDirty(dirty);let unlock=null;if(navigator.locks)navigator.locks.request("studio-work",()=>new Promise(r=>unlock=r)).catch(()=>{});const stamp=Date.now().toString(36),added={videos:[],photos:[]},bad=[];
  const hasVid=files.some(isVid);if(hasVid)vpShow(true);
  for(let i=0;i<files.length&&!cancelled;i++){const f=files[i],cnt=`${f.name} — ملف ${i+1} من ${files.length} · ${(f.size/1048576).toFixed(1)}MB`;
    $("bmsg").textContent=`جاري تجهيز ${i+1} من ${files.length}…`;showProg(i/files.length);vpSet("جاري تجهيز الملف…",cnt,i/files.length);
    const name=stamp+"-"+(i+1),dir="images/uploads/s/"+cid;
    try{const o={_id:"n"+stamp+i,_new:1,category:cid,title_ar:c.name_ar,title_en:c.name_en};
      if(isVid(f)){
        let vf=f,fr=null,ext="mp4";
        if(f.size<=VID_OK&&(/mp4/.test(f.type)||/\.(mp4|m4v)$/i.test(f.name))){vpSet("بقرا الفيديو…");try{fr=await frame(f)}catch(_){}}
        if(!fr){try{vf=await squeeze(f,i,files.length,cnt)}catch(e){if(!cancelled)bad.push(f.name+" ("+vidErr(e)+")");continue}
          fr=await frame(vf)}
        const p=await enc(canvasOf(fr.el,fr.w,fr.h,720),.8);
        const vp=`${dir}/v/${name}.${ext}`,pp=`${dir}/v/${name}.${p.ext}`;
        Object.assign(o,{image:"/"+pp,thumb:"/"+pp,video:"/"+vp,preview:"/"+vp,_url:URL.createObjectURL(p.blob),_files:[{path:vp,blob:vf},{path:pp,blob:p.blob}]});added.videos.push(o)}
      else{const im=await decode(f),big=await enc(canvasOf(im.el,im.w,im.h,MAX_IMG),.85),th=await enc(canvasOf(im.el,im.w,im.h,MAX_TH),.78);
        const ip=`${dir}/${name}.${big.ext}`,tp=`${dir}/t/${name}.${th.ext}`;
        Object.assign(o,{image:"/"+ip,thumb:"/"+tp,_url:URL.createObjectURL(th.blob),_files:[{path:ip,blob:big.blob},{path:tp,blob:th.blob}]});added.photos.push(o)}}
    catch(e){console.warn(e);bad.push(f.name+(/heic/i.test(f.name)?" (HEIC مش مدعوم في المتصفح — حوّلها JPG)":""))}}
  ["videos","photos"].forEach(k=>{const a=added[k];if(!a.length)return;
    a.forEach(o=>o._div=false);const G=gSplit(b[k]);
    if(tgt.mode=="newStart")G.unshift(a);else if(tgt.mode=="newEnd")G.push(a);
    else if(tgt.mode=="into"&&tgt.k==k&&G[tgt.g])G[tgt.g].push(...a);else if(G.length)G[G.length-1].push(...a);else G.push(a);
    b[k]=gJoin(G)});
  adding=false;busy=false;showProg(-1);if(bad.length)toast("الملفات دي ما اتضافتش: "+bad.join("، "),1);
  const got=added.videos.length+added.photos.length;
  if(got){setDirty(true);toast(`اتضاف ${added.photos.length} صورة و ${added.videos.length} فيديو`+(S.autoPub&&hasVid?" — بنشر دلوقتي…":" — دوس نشر"))}else setDirty(dirty);
  if(location.hash=="#c/"+cid)catView();
  if(queue.length&&!cancelled){if(unlock)unlock();const q=queue.splice(0),t0=q[0]._t;return addFiles(q,t0)}
  if(got&&hasVid&&S.autoPub&&!cancelled){vpSet("بنشر على الموقع…","",1);try{await $("pub").onclick()}catch(_){}}
  vpShow(false);if(unlock)unlock()}
// ضغط/تحويل الفيديو لـ mp4 أقل من 24MB (ffmpeg.wasm بيتحمل بس لما نحتاجه)
let vmod=null;
let fmod=null,vctl={};
async function squeeze(f,i,n,cnt){const tag=n>1?` ${i+1} من ${n}`:"";vpSet(`بضغط الفيديو${tag}…`,cnt,0);
  try{if(!fmod)fmod=import("/studio/fast.js?v=17");const fm=await fmod;vpStart=Date.now();
    return await fm.fastCompress(f,(p,pass)=>{const t=`بضغط الفيديو${tag}… ${Math.round(p*100)}%`+(pass>1?" (محاولة أصغر)":"");$("bmsg").textContent=t;showProg((i+p)/n);vpSet(t,null,p)},vctl)}
  catch(e){vctl={};if(cancelled)throw e;if(e&&e.message=="toobig")throw e;console.warn("fast compress → ffmpeg",e)}
  vpSet("بحمّل أداة الضغط الاحتياطية (أبطأ)…",cnt,0);
  if(!vmod)vmod=import("/studio/ffmpeg/compress.js?v=17");let m;try{m=await vmod}catch(e){vmod=null;throw new Error("load")}
  return m.compressVideo(f,s=>{const pc=Math.round((s.p||0)*100);
    const t=s.phase=="load"?`بحمّل أداة ضغط الفيديو (أول مرة بس)… ${pc}%`:s.phase=="probe"?`بجهّز الفيديو${tag}…`:`بضغط الفيديو${tag}… ${pc}%`+(s.pass>1?" (محاولة أصغر)":"");
    $("bmsg").textContent=t;showProg(s.phase=="enc"?(i+(s.p||0))/n:i/n);
    if(s.phase=="load"){vpSet(t,null,s.p||0)}else{if(s.phase=="probe")vpStart=Date.now();vpSet(t,null,s.phase=="enc"?(s.p||0):0)}})}
function vidErr(e){const m=e&&e.message||"";return m=="toobig"?"طويل جدًا — حتى بعد الضغط أكبر من 25MB، قصّه وجرب تاني":m=="load"?"ما قدرتش أحمّل أداة الضغط، اتأكد من النت وجرب تاني":m=="novideo"?"مفيهوش فيديو يتقري":"ما قدرتش أضغط الفيديو ده"}
function showProg(x){$("prog").hidden=x<0;$("progi").style.width=Math.round(Math.max(0,x)*100)+"%"}

// ---------- باقي الموقع (القائمة العلوية · داونلود · الإعدادات) ----------
const strip=o=>{const r={};for(const k in o)if(k[0]!="_")r[k]=o[k];return r};
function siteDocs(){
  const dl=dlItems.map(x=>{const r=C.clean(x);if(x._ed){const im=[...new Set([r.cover,...C.bodyImgs(r.body)].filter(Boolean))];if(im.length)r.images=im;else delete r.images}return r});
  return {"content/nav.json":JSON.stringify({items:navItems.map(x=>{const r=strip(x);r.show=x.show!==false;return r})},null,2),
    "content/downloads.json":JSON.stringify(Object.assign({},dlDocs.dl||{},{items:dl}),null,2),
    "content/settings.json":JSON.stringify(setObj,null,2),"content/contact.json":JSON.stringify(conObj,null,2),...(mnObj?{"content/mano.json":JSON.stringify(mnObj,null,2)}:{})}}
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
  ${mnObj?`<h3 class="sub">MANO</h3><div class="cards"><div class="card dcard" id="mnCard" role="link" tabindex="0"><img src="https://mano-plugin.pages.dev/images/og.jpg" alt="" draggable="false">${mnObj.show===false?`<i>مخفي</i>`:""}<div><b>${esc(mnObj.menu_ar||"MANO")}</b><span>${esc((mnObj.site_url||"https://mano-plugin.pages.dev").replace(/^https?:\/\//,""))} · إضافة DaVinci Resolve</span></div></div></div><h3 class="sub">المشاركات</h3>`:""}
  ${dlItems.length?`<div class="cards" id="dcards">${dlItems.map(x=>`<div class="card dcard" data-id="${x._k}" role="link" tabindex="0">${x.cover?`<img src="${esc(dsrc(x.cover))}" alt="" draggable="false">`:`<span class="nocov">بدون غلاف</span>`}<div><b>${esc(x.title||"بدون عنوان")}</b><span>${x.page_url?"صفحة مستقلة "+esc(x.page_url):x.slug?"صفحة تحميل":x.url?"رابط خارجي":"—"}${x.download_url?" · ⬇ فيه تحميل":""}</span></div></div>`).join("")}</div>`:`<p class="empty">لسه مفيش مشاركات. دوس «مشاركة جديدة».</p>`}`;
  $("addP").onclick=()=>{const o={_k:key(),_ed:1,title:"",slug:"",cover:"",body:"",download_url:""};dlItems.unshift(o);touch();location.hash="#dl/"+o._k};
  if($("mnCard")){$("mnCard").onclick=()=>location.hash="#dl/mano";$("mnCard").onkeydown=e=>{if(e.key=="Enter")location.hash="#dl/mano"}}
  const g=$("dcards");if(!g)return;
  g.querySelectorAll("img").forEach(im=>im.onerror=()=>im.remove());
  g.onclick=e=>{const c=e.target.closest(".card");if(c)location.hash="#dl/"+c.dataset.id};g.onkeydown=e=>{const c=e.target.closest(".card");if(c&&e.key=="Enter")c.click()};
  sortable(g,ids=>{if(ids.join()===dlItems.map(x=>x._k).join())return;dlItems=ids.map(id=>dlItems.find(x=>x._k==id));touch();dlList()},".card")}

// الداونلود: تعديل مشاركة
// MANO: كل بيانات صفحة MANO (موقع mano-plugin بيقراها من content/mano.json هنا)
const MNG=[["القائمة في موقعك",["show","menu_ar","menu_en","site_url"]],["الأساسيات",["version","download_url","file_size","subscribe_url","trial_days"]],
 ["أول الصفحة",["badge_ar","badge_en","hero_title_ar","hero_title_en","hero_accent_ar","hero_accent_en","tagline_ar","tagline_en"]],
 ["الاشتراك",["plan_ar","plan_en","price_ar","price_en","period_ar","period_en"]],["آخر الصفحة",["cta_title_ar","cta_title_en","cta_accent_ar","cta_accent_en","cta_text_ar","cta_text_en"]],
 ["قوائم قصيرة (كل سطر عنصر)",["chips_ar","chips_en","flow_ar","flow_en","steps_ar","steps_en"]],["المميزات",["features"]],["لقطات من جوه الأداة",["shots"]],["فيديوهات",["videos"]],["أسئلة",["faq"]],
 ["تواصل",["whatsapp","instagram","author_ar","author_en","portfolio_url"]]];
const MNL={show:"ظاهر في قائمة Download",menu_ar:"الاسم في القائمة (عربي)",menu_en:"الاسم في القائمة (English)",site_url:"رابط موقع MANO",version:"رقم الإصدار",download_url:"رابط التحميل",file_size:"حجم الملف",subscribe_url:"رابط الاشتراك (Stripe)",trial_days:"أيام التجربة المجانية",
 badge_ar:"الشارة (عربي)",badge_en:"الشارة (English)",hero_title_ar:"العنوان (عربي)",hero_title_en:"العنوان (English)",hero_accent_ar:"الجزء الذهبي من العنوان (عربي)",hero_accent_en:"الجزء الذهبي (English)",tagline_ar:"الوصف (عربي)",tagline_en:"الوصف (English)",
 plan_ar:"اسم الباقة (عربي)",plan_en:"اسم الباقة (English)",price_ar:"السعر (عربي)",price_en:"السعر (English)",period_ar:"المدة (عربي)",period_en:"المدة (English)",
 cta_title_ar:"العنوان (عربي)",cta_title_en:"العنوان (English)",cta_accent_ar:"الجزء الذهبي (عربي)",cta_accent_en:"الجزء الذهبي (English)",cta_text_ar:"النص (عربي)",cta_text_en:"النص (English)",
 chips_ar:"الشرايط (عربي)",chips_en:"الشرايط (English)",flow_ar:"خطوات البداية (عربي)",flow_en:"خطوات البداية (English)",steps_ar:"خطوات التثبيت (عربي)",steps_en:"خطوات التثبيت (English)",
 whatsapp:"واتساب (رقم دولي)",instagram:"رابط إنستجرام",author_ar:"اسم المطوّر (عربي)",author_en:"اسم المطوّر (English)",portfolio_url:"رابط موقعك",
 icon:"أيقونة",title_ar:"العنوان (عربي)",title_en:"العنوان (English)",desc_ar:"الوصف (عربي)",desc_en:"الوصف (English)",image:"الصورة (مسار في موقع MANO)",caption_ar:"الاسم (عربي)",caption_en:"الاسم (English)",
 q_ar:"السؤال (عربي)",q_en:"السؤال (English)",a_ar:"الإجابة (عربي)",a_en:"الإجابة (English)",mp4:"فيديو mp4",webm:"فيديو webm",poster:"صورة الغلاف"};
const MNTPL={features:{icon:"✦",title_ar:"",title_en:"",desc_ar:"",desc_en:""},shots:{image:"images/",caption_ar:"",caption_en:"",desc_ar:"",desc_en:""},videos:{mp4:"",webm:"",poster:"",caption_ar:"",caption_en:"",desc_ar:"",desc_en:""},faq:{q_ar:"",q_en:"",a_ar:"",a_en:""}};
function mnEdit(){const m=mnObj;if(!m){location.hash="#dl";return}
  const long=k=>/^(desc|tagline|cta_text|a)_/.test(k),ltr=k=>/_en$|url|^(mp4|webm|poster|image|version|whatsapp|file_size)$/.test(k);
  const fld=(k,v,path)=>{const lb=esc(MNL[k]||k),p=esc(path);
    if(typeof v=="boolean")return `<label class="sw" style="font-weight:700"><input type="checkbox" data-p="${p}" ${v?"checked":""}> ${lb}</label>`;
    if(Array.isArray(v)&&!v.some(x=>x&&typeof x=="object"))return `<label>${lb}<textarea data-p="${p}" data-t="lines" rows="${Math.max(3,v.length+1)}" style="min-height:0"${ltr(k)?' dir="ltr"':""}>${esc(v.join("\n"))}</textarea></label>`;
    if(typeof v=="number")return `<label>${lb}<input data-p="${p}" data-t="num" dir="ltr" value="${esc(v)}"></label>`;
    return long(k)?`<label>${lb}<textarea data-p="${p}" rows="3" style="min-height:0"${ltr(k)?' dir="ltr"':""}>${esc(v)}</textarea></label>`:`<label>${lb}<input data-p="${p}" value="${esc(v)}"${ltr(k)?' dir="ltr"':""}></label>`};
  const pair=(ks,obj,pre)=>{let h="",i=0;while(i<ks.length){const a=ks[i],b=ks[i+1];
    if(b&&a.endsWith("_ar")&&b==a.slice(0,-3)+"_en"&&!(Array.isArray(obj[a])&&obj[a].some(x=>x&&typeof x=="object"))){h+=`<div class="two">${fld(a,obj[a]??"",pre+a)}${fld(b,obj[b]??"",pre+b)}</div>`;i+=2}
    else{h+=fld(a,obj[a]??"",pre+a);i++}}return h};
  const list=k=>{const arr=m[k]||[],keys=[...new Set([].concat(...arr.map(o=>Object.keys(o)),Object.keys(MNTPL[k]||{})))];
    return `<div class="rows">${arr.map((o,i)=>`<div class="mnitem"><div class="mnbar"><b>${i+1}</b><span style="flex:1"></span><button class="xs" data-mv="${k}:${i}:-1" title="فوق">↑</button><button class="xs" data-mv="${k}:${i}:1" title="تحت">↓</button><button class="x" data-rm="${k}:${i}" title="حذف">✕</button></div>${pair(keys,o,k+"."+i+".")}</div>`).join("")}</div><button class="ghost" data-add="${k}">+ إضافة</button>`};
  const used=new Set([].concat(...MNG.map(g=>g[1])));const other=Object.keys(m).filter(k=>!used.has(k)&&k!="cms_url");
  const groups=MNG.concat(other.length?[["أخرى",other]]:[]);
  app.innerHTML=`<div class="head"><a class="ghost" href="#dl">→ الداونلود</a><h2>MANO</h2><a class="ghost" href="${esc(m.site_url||"https://mano-plugin.pages.dev")}" target="_blank" rel="noopener">فتح موقع MANO ↗</a></div>
  <p class="hint">كل بيانات صفحة MANO. أي تعديل هنا + نشر = يظهر في موقع MANO خلال دقيقة (الصفحة بتقرا البيانات من موقعك).</p>
  <div class="form"><div class="fl">أعمال الناس<div class="covbox"><a class="gold" href="#works" style="text-decoration:none;padding:10px 26px;font-size:.95rem">🖼 أعمال MANO — مراجعة ونشر</a><span><small>الأعمال اللي الناس بترفعها من موقع MANO.</small></span></div></div>
  ${groups.map(([t,ks])=>`<details class="mng"${t=="القائمة في موقعك"||t=="الأساسيات"?" open":""}><summary>${esc(t)}</summary><div class="form">${ks.some(k=>Array.isArray(m[k])&&m[k].some(x=>x&&typeof x=="object")||MNTPL[k])?ks.map(list).join(""):pair(ks.filter(k=>k in m||!["videos","portfolio_url"].includes(k)),m,"")}</div></details>`).join("")}</div>`;
  const open=[...app.querySelectorAll("details.mng")].map(d=>d.open);
  const setp=(path,val)=>{const ps=path.split(".");let o=m;for(let i=0;i<ps.length-1;i++)o=o[ps[i]];o[ps[ps.length-1]]=val;touch()};
  app.oninput=app.onchange=e=>{const el=e.target,p=el.dataset.p;if(!p)return;
    setp(p,el.type=="checkbox"?el.checked:el.dataset.t=="lines"?el.value.split("\n").map(x=>x.trim()).filter(Boolean):el.dataset.t=="num"?(+el.value||0):el.value)};
  const redraw=()=>{const op=[...app.querySelectorAll("details.mng")].map(d=>d.open),y=scrollY;mnEdit();app.querySelectorAll("details.mng").forEach((d,i)=>d.open=op[i]);scrollTo(0,y)};
  app.onclick=e=>{const a=e.target.closest("[data-add]"),r=e.target.closest("[data-rm]"),v=e.target.closest("[data-mv]");
    if(a){const k=a.dataset.add;m[k]=m[k]||[];m[k].push(JSON.parse(JSON.stringify(MNTPL[k]||{})));touch();redraw()}
    else if(r){const [k,i]=r.dataset.rm.split(":");if(!confirm("تحذف العنصر ده؟"))return;m[k].splice(+i,1);touch();redraw()}
    else if(v){const [k,i,d]=v.dataset.mv.split(":"),a_=m[k],j=+i+ +d;if(j<0||j>=a_.length)return;[a_[+i],a_[j]]=[a_[j],a_[+i]];touch();redraw()}}}
function dlEdit(k){if(k=="mano")return mnEdit();const x=dlItems.find(i=>i._k==k);if(!x){location.hash="#dl";return}
  app.innerHTML=`<div class="head"><a class="ghost" href="#dl">→ كل المشاركات</a><h2>${x.title?esc(x.title):"مشاركة جديدة"}</h2><button class="ghost red" id="delP">حذف المشاركة</button></div>
  <div class="form">
   <label>العنوان<input id="f_title" value="${esc(x.title)}" placeholder="مثلاً: حزمة تأثيرات نصوص عربية"></label>
   <div class="two"><label>الرابط المختصر للصفحة (إنجليزي)<input id="f_slug" dir="ltr" value="${esc(x.slug)}" placeholder="my-pack"><small>العنوان في المتصفح هيبقى ‎/#/download/<b id="sl">${esc(x.slug||"…")}</b>‎</small></label>
   <label>أو رابط خارجي بدل الصفحة (اختياري)<input id="f_url" dir="ltr" value="${esc(x.url)}" placeholder="https://…"><small>لو حطيت رابط هنا وسبت الرابط المختصر فاضي، الزرار هيفتح الرابط ده على طول</small></label></div>
   <label>صفحة مستقلة للبوست (اختياري)<input id="f_page" dir="ltr" value="${esc(x.page_url)}" placeholder="/arabic-text-effects/"><small>لو مليان، زرار البوست في قائمة Download هيفتح الصفحة المستقلة دي (زي MANO)، والرابط القديم ‎/#/download/…‎ هيحوّل عليها</small></label>
   <div class="fl">صورة الغلاف<div class="covbox">${x.cover?`<img src="${esc(dsrc(x.cover))}" alt="">`:`<span class="nocov">مفيش غلاف</span>`}<div><button class="ghost" id="cov">${x.cover?"غيّر الغلاف":"ارفع غلاف"}</button>${x.cover?` <button class="ghost red" id="covx">شيل الغلاف</button>`:""}</div></div></div>
   <div class="fl">النص<div class="tb"><button data-i="img">🖼 صورة</button><button data-i="h">عنوان</button><button data-i="li">• نقطة</button><button data-i="b">عريض</button><button data-i="lnk">🔗 لينك</button><span></span><button id="pv" class="pvb">👁 معاينة</button></div>
    <textarea id="f_body" rows="16" placeholder="اكتب شرح المشاركة هنا…">${esc(x.body)}</textarea><div class="pv dlbody" id="pvb" hidden></div>
    <small>كل سطر فقرة · ## في أول السطر = عنوان · - في أول السطر = نقطة · **كلام** = عريض · زرار «صورة» بيرفع صورة ويحطها مكان المؤشر</small></div>
   <div class="fl">التحميل<div class="two"><label>رابط التحميل (Google Drive أو غيره)<input id="f_dl" dir="ltr" value="${esc(x.download_url)}" placeholder="https://drive.google.com/…"></label>
    <div><button class="ghost" id="upf">⬆ أو ارفع ملف (لحد 25MB)</button><small id="fn">${x.download_url&&/^\/files\//.test(x.download_url)?"ملف مرفوع: "+esc(x.download_url.split("/").pop()):""}</small></div></div></div>
   <label>فيديو يوتيوب (اختياري — لينك embed)<input id="f_video" dir="ltr" value="${esc(x.video)}" placeholder="https://www.youtube.com/embed/…"></label>
  </div>`;
  const bind=(id,f,after)=>{$(id).oninput=e=>{x[f]=e.target.value;x._ed=1;touch();if(after)after()}};
  bind("f_title","title");bind("f_url","url");bind("f_page","page_url");bind("f_dl","download_url",()=>$("fn").textContent="");bind("f_video","video");bind("f_body","body");
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
    const catJson=JSON.stringify(Object.assign({},origCatsDoc,{categories:cats}),null,2);if(JSON.stringify(cats)!==origCatIds)tree.push({path:"content/categories.json",mode:"100644",type:"blob",content:catJson});
    C.orphans(orig,out.photos).forEach(p=>tree.push({path:p,mode:"100644",type:"blob",sha:null}));
    const sd=siteDocs();Object.keys(sd).forEach(p=>{if(sd[p]!==docs0[p])tree.push({path:p,mode:"100644",type:"blob",content:sd[p]})});
    const dlNow=JSON.parse(sd["content/downloads.json"]).items;C.dlOrphans(dlOrig,dlNow).forEach(p=>tree.push({path:p,mode:"100644",type:"blob",sha:null}));
    const head=(await gh("/git/ref/heads/"+BR+"?t="+Date.now())).object.sha;     // آخر نسخة في GitHub (حتى لو اتعدّل من مكان تاني)
    const bc=await gh("/git/commits/"+head);
    if(head!==base){const have=new Set();   // ملفات اتمسحت في النسخة الأحدث: ما نمسحهاش تاني
      const full=await gh("/git/trees/"+bc.tree.sha+"?recursive=1");(full.tree||[]).forEach(x=>have.add(x.path));
      for(let i=tree.length-1;i>=0;i--)if(tree[i].sha===null&&!have.has(tree[i].path))tree.splice(i,1)}
    const t=await gh("/git/trees",{method:"POST",body:JSON.stringify({base_tree:bc.tree.sha,tree})});
    const cm=await gh("/git/commits",{method:"POST",body:JSON.stringify({message:"تحديث الموقع من الاستوديو",tree:t.sha,parents:[head]})});
    await gh("/git/refs/heads/"+BR,{method:"PATCH",body:JSON.stringify({sha:cm.sha,force:false})});
    base=cm.sha;orig=out.photos;galBase=JSON.stringify(out);docs0=sd;dlOrig=JSON.parse(JSON.stringify(dlNow));dlItems.forEach(x=>delete x._ed);[...dlFiles.keys()].forEach(p=>{if(usedDlFiles().includes(p))dlFiles.get(p).done=1});origCatIds=JSON.stringify(cats);allItems().forEach(o=>{delete o._new;delete o._files});busy=false;showProg(-1);setDirty(false);
    toast("تم النشر ✓ الموقع هيتحدث خلال دقيقة أو اتنين");route()}
  catch(e){busy=false;showProg(-1);setDirty(true);
    toast(e.status==422?"الموقع اتعدّل من مكان تاني. حدّث الصفحة وجرب تاني.":e.status==401?"انتهت الجلسة، اخرج وادخل تاني.":"النشر ما نجحش ("+e.message+"). جرب تاني.",1)}};

TOKEN=savedToken();TOKEN?start():loginView();
})();

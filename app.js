const T={ar:{gallery:"أعمالي",about:"من أنا",contact:"تواصل معي",view:"شاهد الأعمال",all:"الكل",back:"→ رجوع",photos:"صورة",videos:"فيديو",email:"البريد",phone:"الهاتف",whatsapp:"واتساب",instagram:"إنستجرام",facebook:"فيسبوك",behance:"بيهانس",book:"احجز الآن",bookMsg:"مرحبا، حابب أحجز جلسة تصوير"},
en:{gallery:"Portfolio",about:"About",contact:"Contact",view:"View Work",all:"All",back:"← Back",photos:"photos",videos:"videos",email:"Email",phone:"Phone",whatsapp:"WhatsApp",instagram:"Instagram",facebook:"Facebook",behance:"Behance",book:"Book Now",bookMsg:"Hi, I'd like to book a photo session"}};
let L=localStorage.lang||"ar",D={},cat="all",list=[],idx=0;const $=id=>document.getElementById(id);
const get=f=>fetch("/content/"+f+".json?"+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}));
const esc=x=>String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const NAVD=[{type:"link",label_ar:"أعمالي",label_en:"Portfolio",href:"#gallery",show:true},{type:"link",label_ar:"تواصل معي",label_en:"Contact",href:"#contact",show:true},{type:"link",label_ar:"MANO",label_en:"MANO",href:"#/mano",show:true},{type:"downloads",label_ar:"Download",label_en:"Download",show:true}];
const IC={whatsapp:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>'};
Promise.all(["settings","categories","gallery","contact","downloads","featured","nav","mano"].map(get)).then(([s,c,g,k,d,f,n,mn])=>{D={mn,f:f.items||[],s,c:c.categories||[],g:g.photos||[],k,d:d.items||[],n:Array.isArray(n.items)?n.items:NAVD};render()});
function render(){const t=T[L],s=D.s;document.documentElement.lang=L;document.documentElement.dir=L=="ar"?"rtl":"ltr";
$("lang").textContent=L=="ar"?"EN":"عربي";document.querySelectorAll("[data-i]").forEach(e=>e.textContent=t[e.dataset.i]);
$("fname").textContent=s["name_"+L];$("tagline").textContent=s["tagline_"+L];document.title=s["name_"+L];
$("heroBg").style.backgroundImage=`url(${s.hero_image})`;$("yr").textContent="2017";
renderNav();renderBook();
if(renderMano())return;
if(renderDl())return;
const m=location.hash.match(/^#\/category\/(.+)/);cat=m?decodeURIComponent(m[1]):null;const cc=D.c.find(c=>c.id==cat);
if(!cc)cat=null;$("back").hidden=!cat;$("back").textContent=t.back;$("gTitle").textContent=cat?cc["name_"+L]:t.gallery;
$("cards").innerHTML=cat?"":D.c.map(c=>{const ps=D.g.filter(p=>p.category==c.id);if(!ps.length)return"";const cv=ps.find(p=>p.cover)||ps[0];const it=ps.filter(p=>!p.cover),nv=it.filter(p=>p.video).length,np=it.length-nv;return `<a class="card" href="#/category/${c.id}"><img loading="lazy" src="${cv.thumb||cv.image}" alt=""><div><b>${c["name_"+L]}</b><span>${[np?np+" "+t.photos:"",nv?nv+" "+t.videos:""].filter(Boolean).join(" · ")}</span></div></a>`}).join("");
list=cat?D.g.filter(p=>p.category==cat&&!p.cover):D.f;if(cat)list=[...list.filter(p=>p.video),...list.filter(p=>!p.video)];$("grid").classList.toggle("feat",!cat);$("grid").classList.toggle("reels",!!cat&&list.filter(p=>p.video).length*2>=list.length);
$("grid").innerHTML=list.map((p,i)=>(cat&&(i==0||!!list[i-1].video!=!!p.video)?`<h3 class="gsub">${p.video?"VIDEO":"PHOTO"}</h3>`:(cat&&i>0&&p.group!=null&&list[i-1].group!=null&&p.group!=list[i-1].group?`<hr class="gdiv">`:""))+`<figure data-i="${i}"${p.video?' class="vid"':""}>${p.video&&p.preview?`<video muted loop playsinline autoplay preload="none" poster="${p.thumb||p.image}" data-src="${p.preview}"></video>`:`<img loading="lazy" decoding="async" src="${p.thumb||p.image}" alt="${p["title_"+L]||""}">`}<figcaption>${p["title_"+L]||""}</figcaption></figure>`).join("");
$("grid").querySelectorAll("figure").forEach(f=>f.onclick=()=>open(+f.dataset.i));vidObs();
const k=D.k,links=[["email","mailto:"+k.email,k.email],["phone","tel:"+k.phone,k.phone],["whatsapp","https://wa.me/"+k.whatsapp,"+"+k.whatsapp],["instagram",k.instagram,"@"],["facebook",k.facebook,"f"],["behance",k.behance,"b"]].filter(x=>x[1]&&!/(undefined|:|\+)$/.test(x[1])&&k[x[0]]);
$("contactBox").innerHTML=`<div class="cicons">${links.filter(x=>IC[x[0]]).map(([n,h])=>`<a class="ci" href="${esc(h)}" target="_blank" rel="noopener" aria-label="${t[n]}" title="${t[n]}">${IC[n]}</a>`).join("")}</div>`+links.filter(x=>!IC[x[0]]).map(([n,h,v])=>`<a href="${h}" target="_blank"><small>${t[n]}</small><span dir="ltr">${n=="instagram"||n=="facebook"||n=="behance"?h.replace(/https?:\/\/(www\.)?/,""):v}</span></a>`).join("")}
let VO;function vidObs(){if(VO)VO.disconnect();const vs=$("grid").querySelectorAll("video[data-src]");if(!vs.length)return;
const play=v=>{v.muted=true;v.defaultMuted=true;if(!v.src)v.src=v.dataset.src;const pr=v.play();if(pr&&pr.catch)pr.catch(()=>{})};
if(!("IntersectionObserver"in window)){vs.forEach(play);return}
VO=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting)play(v);else if(!v.paused)v.pause()}),{rootMargin:"200px 0px"});vs.forEach(v=>{v.muted=true;v.setAttribute("muted","");VO.observe(v)})}
document.addEventListener("visibilitychange",()=>{if(!VO)return;$("grid").querySelectorAll("video[data-src]").forEach(v=>{if(document.hidden)v.pause()})});
function open(i){idx=(i+list.length)%list.length;const p=list[idx];$("lbv").innerHTML=p.video?(/\.(mp4|webm|mov)(\?|$)/i.test(p.video)?`<video src="${p.video}" controls autoplay playsinline></video>`:`<iframe src="${p.video}" allow="autoplay; fullscreen" allowfullscreen></iframe>`):"";$("lbv").hidden=!p.video;$("lbimg").hidden=!!p.video;$("lbimg").src=p.video?"":p.image;$("lbcap").textContent=p["title_"+L]||"";$("lb").classList.add("show");if(VO){VO.disconnect();VO=null}$("grid").querySelectorAll("video").forEach(v=>{v.autoplay=false;v.pause()})}
$("lbx").onclick=()=>{$("lb").classList.remove("show");$("lbv").innerHTML="";vidObs()};$("lbp").onclick=()=>open(idx-1);$("lbn").onclick=()=>open(idx+1);
document.onkeydown=e=>{if(!$("lb").classList.contains("show"))return;if(e.key=="Escape")$("lbx").onclick();if(e.key=="ArrowLeft")open(idx-1);if(e.key=="ArrowRight")open(idx+1)};
$("lang").onclick=()=>{L=L=="ar"?"en":"ar";localStorage.lang=L;render()};

$("back").onclick=()=>{location.hash="#gallery"};window.onhashchange=()=>{render();const h=location.hash;if(h.startsWith("#/category"))$("gallery").scrollIntoView();else if(h=="#gallery"||h=="#contact")$(h.slice(1)).scrollIntoView()};
function renderNav(){const dl=D.d.map(x=>x.page_url?`<a href="${esc(x.page_url)}">${esc(x.title)}</a>`:x.slug?`<a href="#/download/${encodeURIComponent(x.slug)}">${esc(x.title)}</a>`:`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join("");
$("navL").innerHTML=D.n.filter(x=>x&&x.show!==false).map(x=>{const lb=esc(x["label_"+L]||x.label_ar||x.label_en||"");if(x.type=="downloads"){const mn=D.mn||{},ma=mn.show!==false?`<a href="${esc(manoUrl())}" class="dd-mano">${esc(mn["menu_"+L]||mn.menu_ar||"MANO")}</a>`:"";return (ma||D.d.length)?`<div class="dd" id="dd"><button class="ddb" id="ddb" aria-haspopup="true" aria-expanded="false">${lb} ▾</button><div class="ddm" id="ddm">${ma}${dl}</div></div>`:""}
const h=x.href||"#",ext=/^(https?:|mailto:|tel:)/i.test(h);return `<a href="${esc(h)}"${ext?' target="_blank" rel="noopener"':""}>${lb}</a>`}).join("");
const b=$("ddb");if(b)b.onclick=e=>{e.stopPropagation();const o=$("dd").classList.toggle("open");b.setAttribute("aria-expanded",o)}}
document.addEventListener("click",e=>{const d=$("dd");if(d&&!d.contains(e.target))d.classList.remove("open")});

function md(s){const esc=x=>x.replace(/&/g,"&amp;").replace(/</g,"&lt;");const inl=x=>esc(x).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
let h="",ul=false;for(const l of (s||"").split("\n")){const t=l.trim();if(!t.startsWith("- ")&&ul){h+="</ul>";ul=false}
let m;if(m=t.match(/^!\[(.*?)\]\((.+?)\)$/))h+=`<img src="${m[2]}" alt="${esc(m[1])}" loading="lazy">`;else if(m=t.match(/^(#{1,4}) (.*)/))h+=`<h${m[1].length+1}>${inl(m[2])}</h${m[1].length+1}>`;
else if(t.startsWith("- ")){if(!ul){h+="<ul>";ul=true}h+=`<li>${inl(t.slice(2))}</li>`}else if(t)h+=`<p>${inl(t)}</p>`}return h+(ul?"</ul>":"")}
function renderDl(){const m=location.hash.match(/^#\/download\/(.+)/),pg=$("dlpage");if(!m){pg.hidden=true;document.body.classList.remove("dlmode");return false}
{const it=D.d.find(o=>o&&o.slug==decodeURIComponent(m[1]));if(it&&it.page_url){location.replace(it.page_url);return true}}
const x=D.d.find(i=>i.slug==decodeURIComponent(m[1]));if(!x){pg.hidden=true;document.body.classList.remove("dlmode");return false}
document.body.classList.add("dlmode");pg.hidden=false;const ar=L=="ar";
pg.innerHTML=`<button class="back" onclick="location.hash='#gallery'">${T[L].back}</button><h1>${x.title}</h1>${x.cover?`<img class="dlcover" src="${x.cover}" alt="">`:""}${x.video?`<div class="vid"><iframe src="${x.video}" allowfullscreen loading="lazy"></iframe></div>`:""}<div class="dlbody">${md(x.body)}</div>${x.download_url?`<a class="dlbtn" href="${x.download_url}" target="_blank" rel="noopener">⬇ ${ar?"رابط التحميل":"Download"}</a>`:""}`;
window.scrollTo(0,0);return true}

(function(){const h=$("hero");if(!h||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
let tx=0,ty=0,x=0,y=0,z=0,last=-1e9,vis=true,run=false,asked=false;const now=()=>performance.now();
const set=(a,b)=>{tx=Math.max(-1,Math.min(1,a));ty=Math.max(-1,Math.min(1,b));last=now();go()};
h.addEventListener("pointermove",e=>{if(e.pointerType!="mouse")return;const r=h.getBoundingClientRect();set((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1)});
h.addEventListener("pointerleave",()=>{last=-1e9});
addEventListener("deviceorientation",e=>{if(e.gamma==null)return;set(e.gamma/25,(e.beta-45)/25)});
const DOE=window.DeviceOrientationEvent;if(DOE&&typeof DOE.requestPermission=="function")h.addEventListener("touchend",()=>{if(asked)return;asked=true;DOE.requestPermission().catch(()=>{})},{once:true});
new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)go()}).observe(h);
function go(){if(!run&&vis){run=true;requestAnimationFrame(tick)}}
function tick(t){if(!vis||document.hidden){run=false;return}
const idle=now()-last>2500;let gx=tx,gy=ty;if(idle){gx=Math.sin(t/4200)*.55;gy=Math.cos(t/5300)*.4}
x+=(gx-x)*.06;y+=(gy-y)*.06;z=(Math.sin(t/6000)+1)/2;
h.style.setProperty("--mx",x.toFixed(4));h.style.setProperty("--my",y.toFixed(4));h.style.setProperty("--z",z.toFixed(4));requestAnimationFrame(tick)}
document.addEventListener("visibilitychange",go);go()})();

/* MANO: صفحة مستقلة على https://mano-plugin.pages.dev — الرابط القديم #/mano بيحوّل لها */
const manoUrl=()=>(D.mn||{}).site_url||"https://mano-plugin.pages.dev";
function renderMano(){if(location.hash=="#/mano"){location.replace(manoUrl());return true}return false}

/* احجز الآن: زر في الهيرو + زر عائم، بيفتح واتساب برسالة جاهزة */
function renderBook(){const t=T[L],s=D.s||{},wa=String((D.k||{}).whatsapp||"").replace(/\D+/g,""),h=$("bookH"),f=$("bookF");if(!h||!f)return;
if(!wa){h.hidden=f.hidden=true;return}
const lb=s["book_"+L]||t.book,msg=s["book_msg_"+L]||s.book_msg_ar||t.bookMsg,u="https://wa.me/"+wa+"?text="+encodeURIComponent(msg);
h.hidden=f.hidden=false;h.href=f.href=u;h.textContent=lb;f.innerHTML=IC.whatsapp+"<span>"+esc(lb)+"</span>";f.setAttribute("aria-label",lb+" — "+t.whatsapp)}

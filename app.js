const T={ar:{gallery:"أعمالي",about:"من أنا",contact:"تواصل معي",view:"شاهد الأعمال",all:"الكل",back:"→ رجوع",photos:"صورة",email:"البريد",phone:"الهاتف",whatsapp:"واتساب",instagram:"إنستجرام",facebook:"فيسبوك",behance:"بيهانس"},
en:{gallery:"Portfolio",about:"About",contact:"Contact",view:"View Work",all:"All",back:"← Back",photos:"photos",email:"Email",phone:"Phone",whatsapp:"WhatsApp",instagram:"Instagram",facebook:"Facebook",behance:"Behance"}};
let L=localStorage.lang||"ar",D={},cat="all",list=[],idx=0;const $=id=>document.getElementById(id);
const get=f=>fetch("/content/"+f+".json?"+Date.now()).then(r=>r.json());
Promise.all(["settings","categories","gallery","contact","downloads","featured"].map(get)).then(([s,c,g,k,d,f])=>{D={f:f.items||[],s,c:c.categories||[],g:g.photos||[],k,d:d.items||[]};render()});
function render(){const t=T[L],s=D.s;document.documentElement.lang=L;document.documentElement.dir=L=="ar"?"rtl":"ltr";
$("lang").textContent=L=="ar"?"EN":"عربي";document.querySelectorAll("[data-i]").forEach(e=>e.textContent=t[e.dataset.i]);
$("fname").textContent=s["name_"+L];$("tagline").textContent=s["tagline_"+L];document.title=s["name_"+L];
$("heroBg").style.backgroundImage=`url(${s.hero_image})`;$("yr").textContent=new Date().getFullYear();
$("ddm").innerHTML=D.d.map(x=>x.slug?`<a href="#/download/${x.slug}">${x.title}</a>`:`<a href="${x.url}" target="_blank" rel="noopener">${x.title}</a>`).join("");$("dd").hidden=!D.d.length;
if(renderDl())return;
const m=location.hash.match(/^#\/category\/(.+)/);cat=m?decodeURIComponent(m[1]):null;const cc=D.c.find(c=>c.id==cat);
if(!cc)cat=null;$("back").hidden=!cat;$("back").textContent=t.back;$("gTitle").textContent=cat?cc["name_"+L]:t.gallery;
$("cards").innerHTML=cat?"":D.c.map(c=>{const ps=D.g.filter(p=>p.category==c.id);if(!ps.length)return"";const cv=ps.find(p=>p.cover)||ps[0];const n=ps.filter(p=>!p.cover).length;return `<a class="card" href="#/category/${c.id}"><img loading="lazy" src="${cv.thumb||cv.image}" alt=""><div><b>${c["name_"+L]}</b><span>${n} ${t.photos}</span></div></a>`}).join("");
list=cat?D.g.filter(p=>p.category==cat&&!p.cover):D.f;if(cat)list=[...list.filter(p=>p.video),...list.filter(p=>!p.video)];$("grid").classList.toggle("feat",!cat);$("grid").classList.toggle("reels",!!cat&&list.filter(p=>p.video).length*2>=list.length);
$("grid").innerHTML=list.map((p,i)=>(cat&&(i==0||!!list[i-1].video!=!!p.video)?`<h3 class="gsub">${p.video?"VIDEO":"PHOTO"}</h3>`:"")+`<figure data-i="${i}"${p.video?' class="vid"':""}><img loading="lazy" decoding="async" src="${p.thumb||p.image}" alt="${p["title_"+L]||""}">${p.video?'<span class="play" aria-hidden="true"></span>':""}<figcaption>${p["title_"+L]||""}</figcaption></figure>`).join("");
$("grid").querySelectorAll("figure").forEach(f=>f.onclick=()=>open(+f.dataset.i));
const k=D.k,links=[["email","mailto:"+k.email,k.email],["phone","tel:"+k.phone,k.phone],["whatsapp","https://wa.me/"+k.whatsapp,"+"+k.whatsapp],["instagram",k.instagram,"@"],["facebook",k.facebook,"f"],["behance",k.behance,"b"]].filter(x=>x[1]&&!/(undefined|:|\+)$/.test(x[1])&&k[x[0]]);
$("contactBox").innerHTML=links.map(([n,h,v])=>`<a href="${h}" target="_blank"><small>${t[n]}</small><span dir="ltr">${n=="instagram"||n=="facebook"||n=="behance"?h.replace(/https?:\/\/(www\.)?/,""):v}</span></a>`).join("")}
function open(i){idx=(i+list.length)%list.length;const p=list[idx];$("lbv").innerHTML=p.video?`<iframe src="${p.video}" allow="autoplay; fullscreen" allowfullscreen></iframe>`:"";$("lbv").hidden=!p.video;$("lbimg").hidden=!!p.video;$("lbimg").src=p.video?"":p.image;$("lbcap").textContent=p["title_"+L]||"";$("lb").classList.add("show")}
$("lbx").onclick=()=>{$("lb").classList.remove("show");$("lbv").innerHTML=""};$("lbp").onclick=()=>open(idx-1);$("lbn").onclick=()=>open(idx+1);
document.onkeydown=e=>{if(!$("lb").classList.contains("show"))return;if(e.key=="Escape")$("lbx").onclick();if(e.key=="ArrowLeft")open(idx-1);if(e.key=="ArrowRight")open(idx+1)};
$("lang").onclick=()=>{L=L=="ar"?"en":"ar";localStorage.lang=L;render()};

$("back").onclick=()=>{location.hash="#gallery"};window.onhashchange=()=>{render();if(location.hash.startsWith("#/category"))document.getElementById("gallery").scrollIntoView()};
$("ddb").onclick=e=>{e.stopPropagation();const o=$("dd").classList.toggle("open");$("ddb").setAttribute("aria-expanded",o)};document.addEventListener("click",e=>{if(!$("dd").contains(e.target))$("dd").classList.remove("open")});

function md(s){const esc=x=>x.replace(/&/g,"&amp;").replace(/</g,"&lt;");const inl=x=>esc(x).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
let h="",ul=false;for(const l of (s||"").split("\n")){const t=l.trim();if(!t.startsWith("- ")&&ul){h+="</ul>";ul=false}
let m;if(m=t.match(/^!\[(.*?)\]\((.+?)\)$/))h+=`<img src="${m[2]}" alt="${esc(m[1])}" loading="lazy">`;else if(m=t.match(/^(#{1,4}) (.*)/))h+=`<h${m[1].length+1}>${inl(m[2])}</h${m[1].length+1}>`;
else if(t.startsWith("- ")){if(!ul){h+="<ul>";ul=true}h+=`<li>${inl(t.slice(2))}</li>`}else if(t)h+=`<p>${inl(t)}</p>`}return h+(ul?"</ul>":"")}
function renderDl(){const m=location.hash.match(/^#\/download\/(.+)/),pg=$("dlpage");if(!m){pg.hidden=true;document.body.classList.remove("dlmode");return false}
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

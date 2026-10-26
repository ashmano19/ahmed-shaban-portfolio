const T={ar:{gallery:"أعمالي",about:"من أنا",contact:"تواصل معي",view:"شاهد الأعمال",all:"الكل",email:"البريد",phone:"الهاتف",whatsapp:"واتساب",instagram:"إنستجرام",facebook:"فيسبوك",behance:"بيهانس"},
en:{gallery:"Portfolio",about:"About",contact:"Contact",view:"View Work",all:"All",email:"Email",phone:"Phone",whatsapp:"WhatsApp",instagram:"Instagram",facebook:"Facebook",behance:"Behance"}};
let L=localStorage.lang||"ar",D={},cat="all",list=[],idx=0;const $=id=>document.getElementById(id);
const get=f=>fetch("/content/"+f+".json?"+Date.now()).then(r=>r.json());
Promise.all(["settings","categories","gallery","contact"].map(get)).then(([s,c,g,k])=>{D={s,c:c.categories||[],g:g.photos||[],k};render()});
function render(){const t=T[L],s=D.s;document.documentElement.lang=L;document.documentElement.dir=L=="ar"?"rtl":"ltr";
$("lang").textContent=L=="ar"?"EN":"عربي";document.querySelectorAll("[data-i]").forEach(e=>e.textContent=t[e.dataset.i]);
$("logo").textContent=$("name").textContent=$("fname").textContent=s["name_"+L];$("tagline").textContent=s["tagline_"+L];document.title=s["name_"+L];
$("hero").style.backgroundImage=`url(${s.hero_image})`;$("yr").textContent=new Date().getFullYear();
$("filters").innerHTML=[{id:"all",["name_"+L]:t.all},...D.c].map(c=>`<button data-c="${c.id}" class="${c.id==cat?"on":""}">${c["name_"+L]}</button>`).join("");
$("filters").querySelectorAll("button").forEach(b=>b.onclick=()=>{cat=b.dataset.c;render()});
list=D.g.filter(p=>cat=="all"||p.category==cat);
$("grid").innerHTML=list.map((p,i)=>`<figure data-i="${i}"><img loading="lazy" src="${p.image}" alt="${p["title_"+L]||""}"><figcaption>${p["title_"+L]||""}</figcaption></figure>`).join("");
$("grid").querySelectorAll("figure").forEach(f=>f.onclick=()=>open(+f.dataset.i));
const k=D.k,links=[["email","mailto:"+k.email,k.email],["phone","tel:"+k.phone,k.phone],["whatsapp","https://wa.me/"+k.whatsapp,"+"+k.whatsapp],["instagram",k.instagram,"@"],["facebook",k.facebook,"f"],["behance",k.behance,"b"]].filter(x=>x[1]&&!/(undefined|:|\+)$/.test(x[1])&&k[x[0]]);
$("contactBox").innerHTML=links.map(([n,h,v])=>`<a href="${h}" target="_blank"><small>${t[n]}</small><span dir="ltr">${n=="instagram"||n=="facebook"||n=="behance"?h.replace(/https?:\/\/(www\.)?/,""):v}</span></a>`).join("")}
function open(i){idx=(i+list.length)%list.length;const p=list[idx];$("lbimg").src=p.image;$("lbcap").textContent=p["title_"+L]||"";$("lb").classList.add("show")}
$("lbx").onclick=()=>$("lb").classList.remove("show");$("lbp").onclick=()=>open(idx-1);$("lbn").onclick=()=>open(idx+1);
document.onkeydown=e=>{if(!$("lb").classList.contains("show"))return;if(e.key=="Escape")$("lbx").onclick();if(e.key=="ArrowLeft")open(idx-1);if(e.key=="ArrowRight")open(idx+1)};
$("lang").onclick=()=>{L=L=="ar"?"en":"ar";localStorage.lang=L;render()};

/* Arabic Text Effects for DaVinci Resolve: standalone page (same design as MANO) */
(()=>{"use strict";
const T={"ar": {"mnFeat": "المميزات", "mnShots": "معاينة", "mnInstall": "خطوات التثبيت", "mnDl": "تحميل الحزمة", "mnSoon": "رابط التحميل قريبًا", "mnShare": "مشاركة", "mnCopied": "اتنسخ الرابط", "mnFlow": "خطوات بسيطة", "mnFor": "تأثيرات نصوص عربية لـ DaVinci Resolve", "mnBy": "من تطوير", "mnFaq": "أسئلة", "mnFaqT": "أسئلة بتتكرر.", "mnShowT": "معاينة التميز والتنوع.", "mnShowP": "اختار الصورة وشوف الحزمة من جوه.", "mnFeatT": "مميزات الحزمة.", "mnFlowT": "ابدأ في أربع خطوات.", "mnInstallT": "التثبيت في دقيقة.", "mnHelp": "المساعدة", "mnBack": "موقع أحمد شعبان", "mnPage": "الحزمة", "brand": "Arabic Text FX", "docT": "تأثيرات النصوص العربية لـ DaVinci Resolve — أحمد شعبان"}, "en": {"mnFeat": "Features", "mnShots": "Preview", "mnInstall": "Install steps", "mnDl": "Download the pack", "mnSoon": "Download link coming soon", "mnShare": "Share", "mnCopied": "Link copied", "mnFlow": "Simple steps", "mnFor": "Arabic text effects for DaVinci Resolve", "mnBy": "by", "mnFaq": "FAQ", "mnFaqT": "Common questions.", "mnShowT": "See the variety.", "mnShowP": "Pick an image and see the pack from the inside.", "mnFeatT": "What's in the pack.", "mnFlowT": "Start in four steps.", "mnInstallT": "Install in a minute.", "mnHelp": "Help", "mnBack": "Ahmed Shaban's site", "mnPage": "The pack", "brand": "Arabic Text FX", "docT": "Arabic Text Effects for DaVinci Resolve — Ahmed Shaban"}};
const $=id=>document.getElementById(id),esc=x=>String(x==null?"":x).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SITE="https://ahmedshaban-ph.com/arabic-text-effects/";
let L=(()=>{try{const q=new URLSearchParams(location.search).get("lang");if(q=="ar"||q=="en")return q;return localStorage.ateLang||"ar"}catch(e){return"ar"}})(),X={},first=true;
const mnL=(x,k)=>x[k+"_"+L]||x[k+"_ar"]||"";
const rm=matchMedia("(prefers-reduced-motion: reduce)");
function render(){const pg=$("app"),x=X,t=T[L],g=k=>mnL(x,k),arr=k=>x[k+"_"+L]||x[k+"_ar"]||[];
document.documentElement.lang=L;document.documentElement.dir=L=="ar"?"rtl":"ltr";
document.title=t.docT;
const wa=x.whatsapp,ig=x.instagram,author=g("author")||"Ahmed Shaban",logo=`<img src="images/wordmark.svg" alt="${t.brand}" width="1041" height="84">`;
const trial=x.trial_days?((+x.trial_days==2&&L=="ar"&&t.mnTrial2)||t.mnTrial.replace("%d",+x.trial_days)):"";
const dl=(c="")=>x.download_url?`<a class="mn-btn mn-gold ${c}" href="${esc(x.download_url)}" target="_blank" rel="noopener">⬇ ${t.mnDl}${x.file_size?` <small>${esc(x.file_size)}</small>`:""}</a>`:`<span class="mn-btn mn-ghost mn-off ${c}" aria-disabled="true">⬇ ${t.mnSoon}</span>`;
const sub=(c="")=>x.subscribe_url?`<a class="mn-btn mn-gold ${c}" href="${esc(x.subscribe_url)}" target="_blank" rel="noopener">${t.mnSub} <span class="mn-arr">←</span></a>`:"";
const share=`<button class="mn-btn mn-icon" data-share type="button" aria-label="${t.mnShare}" title="${t.mnShare}">⤴ <span>${t.mnShare}</span></button>`;
const feats=(x.features||[]).map((f,i)=>`<article class="mn-card mn-rv${i==3?" mn-big":""}" style="--d:${(i%4)*70}ms"><div class="mn-fi">${esc(f.icon||"✦")}</div><h3>${esc(mnL(f,"title"))}</h3><p>${esc(mnL(f,"desc"))}</p></article>`).join("");
const vids=(x.videos||[]).map((v,i)=>`<figure class="mn-vid mn-rv" style="--d:${(i%3)*70}ms"><video muted loop playsinline preload="none" poster="${esc(v.poster)}" width="1020" height="800" aria-label="${esc(mnL(v,"caption"))}">${v.webm?`<source data-src="${esc(v.webm)}" type="video/webm">`:""}${v.mp4?`<source data-src="${esc(v.mp4)}" type="video/mp4">`:""}</video><figcaption>${esc(mnL(v,"caption"))}${mnL(v,"desc")?`<small>${esc(mnL(v,"desc"))}</small>`:""}</figcaption></figure>`).join("");
const shots=x.shots||[];
const tabs=shots.map((s,i)=>`<button class="mn-tab${i==0?" on":""}" data-tab="${i}" type="button"><b>${String(i+1).padStart(2,"0")}</b><span><strong>${esc(mnL(s,"caption"))}</strong><small>${esc(mnL(s,"desc"))}</small></span></button>`).join("");
const chip=arr("chips").map(c=>`<span class="mn-chip">✦ ${esc(c)}</span>`).join("");
const mq=(x.features||[]).map(f=>`<span class="mn-chip">${esc(f.icon||"✦")} ${esc(mnL(f,"title"))}</span>`).join("");
const flow=arr("flow").map((s,i)=>`<li class="mn-rv" style="--d:${i*80}ms"><b>${i+1}</b><p>${esc(s)}</p></li>`).join("");
const steps=arr("steps").map(s=>`<li>${esc(s)}</li>`).join("");
const inc=(x.features||[]).map(f=>`<li>${esc(mnL(f,"title"))}</li>`).join("");
const faq=(x.faq||[]).map(q=>`<details class="mn-q mn-rv"><summary>${esc(mnL(q,"q"))}<i></i></summary><p>${esc(mnL(q,"a"))}</p></details>`).join("");
const links=[["mnShowS",t.mnShots],["mnFeatS",t.mnFeat],["mnStepsS",t.mnInstall],["mnFaqS",t.mnFaq]].map(([id,l])=>`<button type="button" data-go="${id}">${l}</button>`).join("");
const price=g("price");
pg.innerHTML=`<header class="mn-top"><a href="./" class="mn-brand" aria-label="${t.brand}">${logo}</a><nav class="mn-links">${links}</nav><div class="mn-topr"><button class="mn-lang" id="mnLang" type="button" aria-label="Language"><span class="${L=="ar"?"on":""}">ع</span><span class="${L=="en"?"on":""}">EN</span></button>${x.download_url?`<a class="mn-btn mn-gold mn-sm" href="${esc(x.download_url)}" target="_blank" rel="noopener">⬇ ${t.mnDl}</a>`:""}</div></header>
<section class="mn-hero"><div class="mn-grid-bg" aria-hidden="true"></div>
<div class="mn-hero-txt"><span class="mn-badge"><i></i>${esc(g("badge"))}</span>
<div class="mn-3d" id="mn3d"><div class="mn-3d-in"><div class="mn-3d-glow"></div><img class="mn-3d-shadow" src="images/wordmark.svg" alt="" aria-hidden="true" width="1041" height="84"><img class="mn-logo" src="images/wordmark.svg" alt="${t.brand}" width="1041" height="84"><div class="mn-sheen" aria-hidden="true"></div></div></div>
<h1>${esc(g("hero_title"))}<em>${esc(g("hero_accent"))}</em></h1><p class="mn-tag">${esc(g("tagline"))}</p>
<div class="mn-cta">${sub()}${dl()}${share}</div>
<p class="mn-meta">${trial?`<span>✓ ${trial}</span>`:""}${x.version?`<span>${t.mnVer} ${esc(x.version)}</span>`:""}</p></div>
${shots[0]?`<div class="mn-hero-vis"><div class="mn-frame" id="mnFrame"><div class="mn-frame-bar"><i></i><i></i><i></i><span>DaVinci Resolve</span></div><img src="${esc(shots[0].image)}" alt="${esc(mnL(shots[0],"caption"))}" width="500" height="283" fetchpriority="high"></div></div>`:""}
</section>
${chip?`<div class="mn-strip mn-rv">${chip}</div>`:""}
<section class="mn-sec" id="mnShowS"><div class="mn-head"><span class="mn-kick">${t.mnShots}</span><h2>${t.mnShowT}</h2><p>${t.mnShowP}</p></div>
<div class="mn-show mn-rv"><div class="mn-tabs" role="tablist">${tabs}</div><div class="mn-stage"><div class="mn-frame"><div class="mn-frame-bar"><i></i><i></i><i></i><span id="mnStageCap">${esc(shots[0]?mnL(shots[0],"caption"):"")}</span></div><img id="mnStage" src="${esc(shots[0]?shots[0].image:"")}" alt="" width="500" height="283" loading="lazy"></div></div></div></section>
<section class="mn-sec" id="mnFeatS"><div class="mn-head"><span class="mn-kick">${t.mnFeat}</span><h2>${t.mnFeatT}</h2></div>${vids?`<div class="mn-vids" id="mnVids">${vids}</div>`:""}<div class="mn-bento">${feats}</div></section>
${mq?`<div class="mn-marquee" aria-hidden="true"><div class="mn-mq">${mq}${mq}</div></div>`:""}
${flow?`<section class="mn-sec"><div class="mn-head"><span class="mn-kick">${t.mnFlow}</span><h2>${t.mnFlowT}</h2></div><ol class="mn-flow4">${flow}</ol></section>`:""}
${price?`<section class="mn-sec" id="mnPriceS"><div class="mn-head"><span class="mn-kick">${t.mnPlan}</span><h2>${t.mnPriceT}</h2><p>${t.mnPriceP}</p></div>
<div class="mn-price mn-rv"><div class="mn-plan">${esc(g("plan"))}</div><div class="mn-amt"><b>${esc(price)}</b><span>${esc(g("period"))}</span></div>${trial?`<div class="mn-trial">${trial}</div>`:""}<p class="mn-inc">${t.mnInc}</p><ul class="mn-check">${inc}</ul>${sub("mn-full")}</div></section>`:""}
${faq?`<section class="mn-sec" id="mnFaqS"><div class="mn-head"><span class="mn-kick">${t.mnFaq}</span><h2>${t.mnFaqT}</h2></div><div class="mn-faq">${faq}</div></section>`:""}
${steps?`<section class="mn-sec" id="mnStepsS"><div class="mn-head"><span class="mn-kick">${t.mnInstall}</span><h2>${t.mnInstallT}</h2></div><ol class="mn-steps mn-rv">${steps}</ol></section>`:""}
<section class="mn-final mn-rv"><div class="mn-final-glow" aria-hidden="true"></div><span class="mn-badge"><i></i>${t.brand}</span><h2>${esc(g("cta_title"))} <em>${esc(g("cta_accent"))}</em></h2><p>${esc(g("cta_text"))}</p><div class="mn-cta">${sub()}${dl()}${share}</div></section>
<footer class="mn-foot"><div class="mn-fcol mn-fbrand">${logo}<p>${t.mnFor}</p></div>
<div class="mn-fcol"><b>${t.mnPage}</b>${links}</div>
<div class="mn-fcol"><b>${t.mnHelp}</b>${wa?`<a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>`:""}${ig?`<a href="${esc(ig)}" target="_blank" rel="noopener">Instagram</a>`:""}${x.portfolio_url?`<a href="${esc(x.portfolio_url)}" target="_blank" rel="noopener">${t.mnBack}</a>`:""}</div>
<p class="mn-copy">© ${t.brand} · ${t.mnBy} ${esc(author)}</p></footer>
<div class="mn-toast" id="mnToast" role="status" aria-live="polite"></div><div class="mn-lb" id="mnLb"><img alt=""></div>`;
pg.querySelectorAll("[data-share]").forEach(b=>b.onclick=share_);
$("mnLang").onclick=()=>{L=L=="ar"?"en":"ar";try{localStorage.ateLang=L}catch(e){}render()};
pg.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{const e=$(b.dataset.go);if(e)e.scrollIntoView({behavior:rm.matches?"auto":"smooth",block:"start"})});
const st=$("mnStage");pg.querySelectorAll(".mn-tab").forEach(b=>b.onclick=()=>{const s=shots[+b.dataset.tab];pg.querySelectorAll(".mn-tab").forEach(o=>o.classList.toggle("on",o==b));st.classList.add("sw");setTimeout(()=>{st.src=s.image;st.alt=mnL(s,"caption");$("mnStageCap").textContent=mnL(s,"caption");st.classList.remove("sw")},180)});
const lb=$("mnLb");if(st)st.onclick=()=>{lb.querySelector("img").src=st.src;lb.classList.add("show")};lb.onclick=()=>lb.classList.remove("show");
document.onkeydown=e=>{if(e.key=="Escape")lb.classList.remove("show")};
const rv=pg.querySelectorAll(".mn-rv");if(window.IntersectionObserver&&!rm.matches){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.1});rv.forEach(el=>io.observe(el))}else rv.forEach(el=>el.classList.add("in"));
vidObs();if(first){first=false}mn3d()}
function vidObs(){const vs=document.querySelectorAll(".mn-vid video");if(!vs.length)return;
const load=v=>{if(v.dataset.ok)return;v.dataset.ok=1;v.querySelectorAll("source").forEach(s=>s.src=s.dataset.src);v.load()};
if(!window.IntersectionObserver){vs.forEach(v=>{load(v);if(!rm.matches)v.play().catch(()=>{})});return}
const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){load(v);if(!rm.matches)v.play().catch(()=>{})}else v.pause()}),{rootMargin:"200px 0px",threshold:.25});vs.forEach(v=>{io.observe(v);if(rm.matches){v.controls=true}})}
function toast(m){const e=$("mnToast");if(!e)return;e.textContent=m;e.classList.add("show");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("show"),2200)}
async function share_(){const url=X.site_url||SITE,title=T[L].docT,text=mnL(X,"tagline");
if(navigator.share){try{await navigator.share({title,text,url});return}catch(e){if(e&&e.name=="AbortError")return}}
try{await navigator.clipboard.writeText(url);toast(T[L].mnCopied)}catch(e){const i=document.createElement("textarea");i.value=url;i.style.position="fixed";i.style.opacity="0";document.body.appendChild(i);i.select();try{document.execCommand("copy");toast(T[L].mnCopied)}catch(_){prompt("",url)}i.remove()}}
const mn3d=(()=>{let run=false,started=false,tx=0,ty=0,x=0,y=0,last=-1e9,asked=false;
const set=(a,b)=>{tx=Math.max(-1,Math.min(1,a));ty=Math.max(-1,Math.min(1,b));last=performance.now();go()};
function init(){started=true;
addEventListener("pointermove",e=>{if(e.pointerType!="mouse")return;const el=$("mn3d");if(!el)return;const r=el.getBoundingClientRect();set((e.clientX-(r.left+r.width/2))/(innerWidth/2),(e.clientY-(r.top+r.height/2))/(innerHeight/2))},{passive:true});
addEventListener("deviceorientation",e=>{if(e.gamma==null)return;set(e.gamma/30,(e.beta-45)/30)});
const DOE=window.DeviceOrientationEvent;if(DOE&&typeof DOE.requestPermission=="function")addEventListener("touchend",()=>{if(asked)return;asked=true;DOE.requestPermission().catch(()=>{})},{passive:true});
document.addEventListener("visibilitychange",go)}
function go(){if(!run&&!rm.matches&&!document.hidden&&$("mn3d")){run=true;requestAnimationFrame(tick)}}
function tick(t){const el=$("mn3d");if(!el||document.hidden){run=false;return}
let gx=tx,gy=ty;if(t-last>2500){gx=Math.sin(t/3600)*.55;gy=Math.cos(t/4700)*.35}
x+=(gx-x)*.06;y+=(gy-y)*.06;const fl=Math.sin(t/1800);
el.style.setProperty("--rx",(-y*12).toFixed(2)+"deg");el.style.setProperty("--ry",(x*18).toFixed(2)+"deg");el.style.setProperty("--fy",(fl*6).toFixed(2)+"px");
const fr=$("mnFrame");if(fr){fr.style.setProperty("--rx",(-y*5).toFixed(2)+"deg");fr.style.setProperty("--ry",(x*-7).toFixed(2)+"deg")}
el.style.setProperty("--sx",(x*-14).toFixed(1)+"px");el.style.setProperty("--sy",(18+y*-8).toFixed(1)+"px");requestAnimationFrame(tick)}
return()=>{if(!started)init();go()}})();
fetch("content.json",{cache:"no-cache"}).then(r=>r.json()).then(d=>{X=d;render();
/* live values from the portfolio studio (same origin): the download post's link + contact links. The page works without them. */
const up=(u,f)=>u&&fetch(u,{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(c=>{if(c&&f(c))render()}).catch(()=>{});
up(d.downloads_json,c=>{const it=(c.items||[]).find(o=>o&&o.slug==d.slug);if(it&&it.download_url&&it.download_url!==X.download_url){X.download_url=it.download_url;return true}});
up(d.contact_json||"/content/contact.json",c=>{let ch=false;if(c.whatsapp&&c.whatsapp!==X.whatsapp){X.whatsapp=String(c.whatsapp).replace(/\D/g,"");ch=true}if(c.instagram&&c.instagram!==X.instagram){X.instagram=c.instagram;ch=true}return ch})}).catch(()=>{$("app").innerHTML='<p style="padding:40px;text-align:center">Arabic Text Effects — DaVinci Resolve</p>'});
})();

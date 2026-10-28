// منطق لوحة الاستوديو (بدون واجهة) — يتجرب في node كمان
(function(root){
const isVid=p=>!!p.video;
// يحوّل gallery.json لقوائم داخلية: لكل قائمة غلاف + فيديوهات + صور، و _div = بداية مجموعة جديدة
function load(photos,cats){
  const by={},extra=[];cats.forEach(c=>by[c.id]={cover:null,videos:[],photos:[]});
  let n=0;
  const mixed=new Set(cats.filter(c=>c.order=="mixed").map(c=>c.id));
  photos.forEach(p=>{const o=Object.assign({},p,{_id:"i"+(n++)});const b=by[p.category];
    if(!b){extra.push(o);return}
    if(p.cover&&!b.cover)b.cover=o;else if(isVid(p)&&!mixed.has(p.category))b.videos.push(o);else b.photos.push(o)});
  Object.values(by).forEach(b=>["videos","photos"].forEach(k=>b[k].forEach((o,i,a)=>{o._div=i>0&&o.group!=null&&a[i-1].group!=null&&o.group!=a[i-1].group})));
  return {by,extra};
}
const clean=o=>{const r={};for(const k in o)if(k[0]!="_"&&o[k]!==undefined&&o[k]!==null&&o[k]!=="")r[k]=o[k];return r};
// يرجّع gallery.json بالترتيب وأرقام المجموعات محسوبة من الخطوط
function build(st,cats){
  const out=[];
  cats.forEach(c=>{const b=st.by[c.id];if(!b)return;
    if(b.cover)out.push(Object.assign(clean(b.cover),{cover:true,group:0}));
    let g=1;
    b.videos.forEach((o,i)=>{if(i>0&&o._div)g++;const r=clean(o);delete r.cover;r.group=g;out.push(r)});
    if(b.videos.length)g++;
    b.photos.forEach((o,i)=>{if(i>0&&o._div)g++;const r=clean(o);delete r.cover;r.group=g;out.push(r)});
  });
  st.extra.forEach(o=>out.push(clean(o)));
  return {photos:out};
}
function counts(b){if(!b)return {p:0,v:0};const a=[...b.videos,...b.photos],v=a.filter(isVid).length;return {p:a.length-v,v}}
// الملفات القديمة اللي اترفعت من الاستوديو ومبقتش مستخدمة -> تتمسح من الريبو
function orphans(before,after){
  const used=new Set();const paths=p=>[p.image,p.thumb,p.preview,p.video].filter(x=>typeof x=="string"&&x.startsWith("/images/uploads/s/"));
  after.forEach(p=>paths(p).forEach(x=>used.add(x)));
  const del=new Set();before.forEach(p=>paths(p).forEach(x=>{if(!used.has(x))del.add(x)}));
  return [...del].map(x=>x.slice(1));
}
function fitSize(w,h,max){const s=Math.min(1,max/Math.max(w,h));return [Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s))]}
function b64utf8(str){if(typeof Buffer!="undefined")return Buffer.from(str,"utf8").toString("base64");
  const u=new TextEncoder().encode(str);let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
// markdown بسيط زي اللي في الموقع (للمعاينة)
function md(s,mapSrc){mapSrc=mapSrc||(x=>x);const esc=x=>x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");const inl=x=>esc(x).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  let h="",ul=false;for(const l of (s||"").split("\n")){const t=l.trim();if(!t.startsWith("- ")&&ul){h+="</ul>";ul=false}
  let m;if(m=t.match(/^!\[(.*?)\]\((.+?)\)$/))h+=`<img src="${esc(mapSrc(m[2]))}" alt="${esc(m[1])}">`;else if(m=t.match(/^(#{1,4}) (.*)/))h+=`<h${m[1].length+1}>${inl(m[2])}</h${m[1].length+1}>`;
  else if(t.startsWith("- ")){if(!ul){h+="<ul>";ul=true}h+=`<li>${inl(t.slice(2))}</li>`}else if(t)h+=`<p>${inl(t)}</p>`}return h+(ul?"</ul>":"")}
// صور ونصوص مشاركة الداونلود
const bodyImgs=b=>[...String(b||"").matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map(m=>m[1]);
const STUDIO_PREFIX=/^\/(images\/uploads\/s|files\/s)\//;
function dlPaths(x){return [x.cover,x.download_url,...(x.images||[]),...bodyImgs(x.body)].filter(p=>typeof p=="string"&&STUDIO_PREFIX.test(p))}
function dlOrphans(before,after){const used=new Set();after.forEach(x=>dlPaths(x).forEach(p=>used.add(p)));const del=new Set();before.forEach(x=>dlPaths(x).forEach(p=>{if(!used.has(p))del.add(p)}));return [...del].map(p=>p.slice(1))}
function slugify(t){const s=String(t||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);return s}
root.StudioCore={load,build,counts,orphans,fitSize,b64utf8,clean,md,bodyImgs,dlPaths,dlOrphans,slugify};
if(typeof module!="undefined")module.exports=root.StudioCore;
})(typeof window!="undefined"?window:globalThis);

// منطق لوحة الاستوديو (بدون واجهة) — يتجرب في node كمان
(function(root){
const isVid=p=>!!p.video;
// يحوّل gallery.json لقوائم داخلية: لكل قائمة غلاف + فيديوهات + صور، و _div = بداية مجموعة جديدة
function load(photos,cats){
  const by={},extra=[];cats.forEach(c=>by[c.id]={cover:null,videos:[],photos:[]});
  let n=0;
  photos.forEach(p=>{const o=Object.assign({},p,{_id:"i"+(n++)});const b=by[p.category];
    if(!b){extra.push(o);return}
    if(p.cover&&!b.cover)b.cover=o;else if(isVid(p))b.videos.push(o);else b.photos.push(o)});
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
function counts(b){return {p:b?b.photos.length:0,v:b?b.videos.length:0}}
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
root.StudioCore={load,build,counts,orphans,fitSize,b64utf8,clean};
if(typeof module!="undefined")module.exports=root.StudioCore;
})(typeof window!="undefined"?window:globalThis);

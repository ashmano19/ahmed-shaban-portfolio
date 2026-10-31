function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
async function adminUser(request){
  const token=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token)return false;
  const r=await fetch("https://api.github.com/user",{headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","User-Agent":"MANO-review-admin"}});
  if(!r.ok)return false;
  const user=await r.json().catch(()=>null);
  return user&&user.login==="ashmano19";
}
const pending=s=>!["reviewed","approved","rejected"].includes(String(s||"").toLowerCase());
export async function onRequest({request,env}){
  if(!env.PROMOTIONS_DB)return json({error:"database_unavailable"},503);
  if(!await adminUser(request))return json({error:"unauthorized"},401);
  if(request.method==="GET"){
    try{
      const {results=[]}=await env.PROMOTIONS_DB.prepare("SELECT id,email,video_url,status,created_at,updated_at FROM promotion_requests ORDER BY created_at DESC,id DESC LIMIT 500").all();
      return json({items:results,pending:results.filter(x=>pending(x.status)).length});
    }catch(_){return json({error:"read_failed"},500)}
  }
  if(request.method==="PATCH"){
    let data;try{data=await request.json()}catch(_){return json({error:"invalid_json"},400)}
    const id=String(data&&data.id||"").slice(0,100),status=String(data&&data.status||"");
    if(!id||!["reviewed","approved","rejected"].includes(status))return json({error:"invalid_request"},400);
    try{
      const result=await env.PROMOTIONS_DB.prepare("UPDATE promotion_requests SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(status,id).run();
      if(!result.meta||!result.meta.changes)return json({error:"not_found"},404);
      return json({ok:true,id,status});
    }catch(_){return json({error:"update_failed"},500)}
  }
  return json({error:"method_not_allowed"},405);
}

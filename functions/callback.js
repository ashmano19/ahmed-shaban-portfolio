export async function onRequest({ request, env }) {
  const code = new URL(request.url).searchParams.get("code");
  const r = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "decap-oauth" }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }) });
  const d = await r.json();
  const ok = !!d.access_token;
  const msg = ok ? "authorization:github:success:" + JSON.stringify({ token: d.access_token, provider: "github" }) : "authorization:github:error:" + JSON.stringify(d);
  const html = `<!doctype html><html><body><script>
(function(){function recv(e){window.opener.postMessage(${JSON.stringify(msg)},e.origin);window.removeEventListener("message",recv,false);setTimeout(function(){window.close()},300)}
window.addEventListener("message",recv,false);window.opener.postMessage("authorizing:github","*");})();
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}

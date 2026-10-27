export async function onRequest({ request, env }) {
  const u = new URL(request.url);
  const p = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${u.origin}/callback`, scope: "repo,user", state: crypto.randomUUID() });
  return Response.redirect(`https://github.com/login/oauth/authorize?${p}`, 302);
}

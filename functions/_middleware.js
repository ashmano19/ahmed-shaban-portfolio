export async function onRequest({ request, next }) {
  const u = new URL(request.url);
  if (u.hostname.endsWith(".pages.dev") || u.hostname === "www.ahmedshaban-ph.com") {
    u.hostname = "ahmedshaban-ph.com";
    u.protocol = "https:";
    u.port = "";
    return Response.redirect(u.toString(), 301);
  }
  return next();
}

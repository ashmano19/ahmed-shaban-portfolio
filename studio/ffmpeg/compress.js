// ضغط/تحويل الفيديو في المتصفح لـ mp4 (H.264/AAC) أقل من 24MB — ffmpeg.wasm 0.12 (single-thread)
// الملفات الصغيرة (ffmpeg.js/worker) هنا على نفس الدومين، والـ core الكبير (~31MB) بيتحمل من CDN مرة واحدة.
import { FFmpeg } from "./classes.js";
const CORE_V = "0.12.10";
const CDNS = [`https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_V}/dist/esm/`, `https://unpkg.com/@ffmpeg/core@${CORE_V}/dist/esm/`];
export const LIMIT = 24.5 * 1024 * 1024, TARGET = 21 * 1024 * 1024;
let ffP = null;

async function blobURL(url, type, onP, guess) {
  const r = await fetch(url); if (!r.ok) throw new Error("fetch " + r.status);
  const total = +r.headers.get("content-length") || guess || 0;
  if (!r.body || !total || !onP) return URL.createObjectURL(new Blob([await r.arrayBuffer()], { type }));
  const rd = r.body.getReader(), parts = []; let got = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onP(Math.min(1, got / total)); }
  return URL.createObjectURL(new Blob(parts, { type }));
}
async function getFF(onLoad) {
  if (ffP) return ffP;
  ffP = (async () => {
    let lastErr;
    for (const base of CDNS) {
      try {
        if (onLoad) onLoad(0);
        const coreURL = await blobURL(base + "ffmpeg-core.js", "text/javascript");
        const wasmURL = await blobURL(base + "ffmpeg-core.wasm", "application/wasm", onLoad, 32232419);
        const ff = new FFmpeg(); await ff.load({ coreURL, wasmURL }); return ff;
      } catch (e) { lastErr = e; }
    }
    console.warn(lastErr); throw new Error("load");
  })();
  ffP.catch(() => { ffP = null });
  return ffP;
}
export function preload(onLoad) { return getFF(onLoad) }

// onStatus({phase:"load"|"probe"|"enc", p:0..1, pass:1|2})
export async function compressVideo(file, onStatus = () => {}) {
  const ff = await getFF(p => onStatus({ phase: "load", p }));
  onStatus({ phase: "probe", p: 0 });
  const dir = "/in" + Date.now(), nm = (file.name || "video").replace(/[^\w.\-]+/g, "_") || "video";
  let inp, mounted = false;
  await ff.createDir(dir);
  try { await ff.mount("WORKERFS", { files: [new File([file], nm, { type: file.type })] }, dir); mounted = true; inp = dir + "/" + nm }
  catch (_) { inp = "/" + nm; await ff.writeFile(inp, new Uint8Array(await file.arrayBuffer())) }
  // قراءة المدة والـ fps من اللوج
  let log = ""; const lg = ({ message }) => { log += message + "\n" }; ff.on("log", lg);
  await ff.exec(["-hide_banner", "-i", inp]); ff.off("log", lg);
  const dm = log.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const dur = dm ? (+dm[1]) * 3600 + (+dm[2]) * 60 + (+dm[3]) : 0;
  const fm = log.match(/Video:[^\n]*?([\d.]+)\s*fps/), fps = fm ? +fm[1] : 0;
  if (!/Video:/.test(log)) { await cleanup(ff, dir, inp, mounted); throw new Error("novideo") }
  const D = dur > 0 ? dur : 60, AUD = 96;
  let vk = Math.floor(TARGET * 8 / D / 1000) - AUD;  // kbps للفيديو
  vk = Math.max(150, Math.min(vk, 6000));
  const run = async (kbps, maxSide, pass) => {
    const out = "/out" + pass + ".mp4";
    const S = maxSide, sc = `scale='if(gt(iw,ih),trunc(min(${S},iw)/2)*2,-2)':'if(gt(iw,ih),-2,trunc(min(${S},ih)/2)*2)'`;
    const vf = (fps > 31 ? "fps=30," : "") + sc;
    const pr = ({ time }) => { if (dur > 0 && time > 0) onStatus({ phase: "enc", p: Math.min(1, time / 1e6 / dur), pass }) };
    ff.on("progress", pr);
    const ret = await ff.exec(["-i", inp, "-map", "0:v:0", "-map", "0:a:0?", "-vf", vf,
      "-c:v", "libx264", "-preset", "veryfast", "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-b:v", kbps + "k", "-maxrate", Math.round(kbps * 1.5) + "k", "-bufsize", Math.round(kbps * 2) + "k",
      "-c:a", "aac", "-b:a", AUD + "k", "-ac", "2", "-movflags", "+faststart", "-map_metadata", "-1", out]);
    ff.off("progress", pr);
    let data = null; try { data = await ff.readFile(out) } catch (_) {}
    try { await ff.deleteFile(out) } catch (_) {}
    if (ret !== 0 || !data || !data.length) throw new Error("encode " + ret);
    return data;
  };
  try {
    const side = vk < 1500 ? 1280 : 1920;
    let data = await run(vk, side, 1);
    if (data.length > LIMIT) {
      const k2 = Math.max(120, Math.floor(vk * (TARGET / data.length) * 0.85));
      data = await run(k2, Math.min(side, 1280), 2);
      if (data.length > LIMIT) throw new Error("toobig");
    }
    return new Blob([data], { type: "video/mp4" });
  } finally { await cleanup(ff, dir, inp, mounted) }
}
async function cleanup(ff, dir, inp, mounted) {
  try { if (mounted) await ff.unmount(dir); else await ff.deleteFile(inp) } catch (_) {}
  try { await ff.deleteDir(dir) } catch (_) {}
}

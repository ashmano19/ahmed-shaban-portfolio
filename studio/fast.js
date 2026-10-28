// ضغط سريع للفيديو بكارت الشاشة (WebCodecs عن طريق Mediabunny) — أسرع بكتير من ffmpeg.wasm، ولو المتصفح ما يدعمش بنرجع لـ ffmpeg.
import { Input, Output, Conversion, ALL_FORMATS, BlobSource, BufferTarget, Mp4OutputFormat } from "./mb/mediabunny.min.js";
const LIMIT = 24.5 * 1048576, TARGET = 21 * 1048576, even = x => Math.max(2, Math.round(x / 2) * 2);
export async function fastCompress(file, onP = () => {}, ctl = {}) {
  if (typeof VideoEncoder == "undefined") throw new Error("nowebcodecs");
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const vt = await input.getPrimaryVideoTrack(); if (!vt) throw new Error("novideo");
    const dur = await input.computeDuration().catch(() => 0), D = dur > 0 ? dur : 60;
    let bps = Math.floor(TARGET * 8 / D) - 128000; bps = Math.max(250000, Math.min(bps, 8e6));
    const run = async (rate, side, pass) => {
      const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
      const w = vt.displayWidth, h = vt.displayHeight, big = Math.max(w, h) > side;
      const video = { codec: "avc", bitrate: rate, forceTranscode: true };
      if (big) { if (w >= h) video.width = even(side); else video.height = even(side) }
      const conv = await Conversion.init({ input, output, video, audio: { codec: "aac", bitrate: 128000 }, showWarnings: false });
      if (!conv.isValid) throw new Error("invalid");
      if (conv.discardedTracks.some(t => t.track.type == "video")) throw new Error("invalid");
      ctl.cancel = () => conv.cancel();
      conv.onProgress = p => onP(p, pass);
      await conv.execute();
      return new Blob([output.target.buffer], { type: "video/mp4" });
    };
    const side = bps < 2.5e6 || D > 40 ? 1280 : 1920;
    let out = await run(bps, side, 1);
    if (out.size > LIMIT) { out = await run(Math.max(200000, Math.floor(bps * TARGET / out.size * 0.85)), 1280, 2); if (out.size > LIMIT) throw new Error("toobig") }
    return out;
  } finally { try { input.dispose && input.dispose() } catch (_) {} }
}

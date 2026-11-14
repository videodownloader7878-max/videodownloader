// Copies the single-thread FFmpeg core into /public/ffmpeg so conversion works without a CDN or special headers.
import { cpSync, mkdirSync, existsSync } from "node:fs";
const src = "node_modules/@ffmpeg/core/dist/umd";
if (!existsSync(src)) { console.warn("@ffmpeg/core not found; skipping copy"); process.exit(0); }
mkdirSync("public/ffmpeg", { recursive: true });
for (const f of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) cpSync(`${src}/${f}`, `public/ffmpeg/${f}`);

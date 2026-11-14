export type Tool = { slug: string; name: string; glyph: string; bg: string; hosts?: RegExp };
export const tools: Tool[] = [
  { slug: "youtube-downloader", name: "YouTube Downloader", glyph: "▶", bg: "#f00", hosts: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { slug: "facebook-downloader", name: "Facebook Downloader", glyph: "f", bg: "#1877f2", hosts: /(^|\.)(facebook\.com|fb\.watch)$/ },
  { slug: "instagram-downloader", name: "Instagram Downloader", glyph: "◎", bg: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)", hosts: /(^|\.)instagram\.com$/ },
  { slug: "tiktok-downloader", name: "TikTok Downloader", glyph: "♪", bg: "#111", hosts: /(^|\.)tiktok\.com$/ },
  { slug: "twitter-downloader", name: "Twitter (X) Downloader", glyph: "X", bg: "#111", hosts: /(^|\.)(twitter\.com|x\.com)$/ },
  { slug: "pinterest-downloader", name: "Pinterest Downloader", glyph: "P", bg: "#e60023", hosts: /(^|\.)(pinterest\.com|pin\.it)$/ },
  { slug: "vimeo-downloader", name: "Vimeo Downloader", glyph: "v", bg: "#19b7ea", hosts: /(^|\.)vimeo\.com$/ },
  { slug: "dailymotion-downloader", name: "Dailymotion Downloader", glyph: "d", bg: "#0066dc", hosts: /(^|\.)(dailymotion\.com|dai\.ly)$/ },
  { slug: "reddit-downloader", name: "Reddit Downloader", glyph: "r", bg: "#ff4500", hosts: /(^|\.)reddit\.com$/ },
  { slug: "threads-downloader", name: "Threads Downloader", glyph: "@", bg: "#111", hosts: /(^|\.)threads\.net$/ },
  { slug: "linkedin-downloader", name: "LinkedIn Downloader", glyph: "in", bg: "#0a66c2", hosts: /(^|\.)linkedin\.com$/ },
  { slug: "video-to-mp3", name: "Video to MP3 Converter", glyph: "♫", bg: "#8a3dff" },
];
export function detectTool(u: URL) { return tools.find((t) => t.hosts?.test(u.hostname)); }

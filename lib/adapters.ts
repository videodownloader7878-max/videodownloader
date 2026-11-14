import { tools } from "./tools";
// One adapter per platform. Only documented, permitted functionality: link validation and (when the admin has
// marked the integration "verified") public oEmbed metadata. No file downloading, no bypassing logins, privacy or DRM.
export type Adapter = { platform: string; oembed?: string; limitation: string; alternatives: string[] };
const lim = (p: string) => `${p} doesn’t offer a public, permitted way to download other people’s videos, so MediaAura can’t fetch the file. We never bypass logins, privacy settings or DRM.`;
export const adapters: Record<string, Adapter> = {
  "youtube-downloader": { platform: "YouTube", oembed: "https://www.youtube.com/oembed", limitation: lim("YouTube"), alternatives: ["YouTube Premium: official offline downloads inside the YouTube app.", "Your own videos: download the original from YouTube Studio.", "Ask the uploader to share the original file."] },
  "facebook-downloader": { platform: "Facebook", limitation: lim("Facebook"), alternatives: ["Your own content: use Facebook’s “Download your information” tool.", "Ask the person who posted it to share the original file.", "Use Facebook’s Save option to watch it later in the app."] },
  "instagram-downloader": { platform: "Instagram", limitation: lim("Instagram"), alternatives: ["Your own content: use Instagram’s “Download your information” tool.", "Ask the creator to share the original file.", "Use Instagram’s Save option to keep it in the app."] },
  "tiktok-downloader": { platform: "TikTok", oembed: "https://www.tiktok.com/oembed", limitation: lim("TikTok"), alternatives: ["Use TikTok’s own Save video option when the creator allows downloads.", "Your own videos: request them with TikTok’s “Download your data” tool.", "Ask the creator to share the original file."] },
  "twitter-downloader": { platform: "Twitter (X)", oembed: "https://publish.twitter.com/oembed", limitation: lim("X"), alternatives: ["Your own posts: request your data archive in X settings.", "Ask the poster to share the original file.", "Bookmark the post to find it later."] },
  "pinterest-downloader": { platform: "Pinterest", limitation: lim("Pinterest"), alternatives: ["Your own Pins: use Pinterest’s built-in download option or data export.", "Ask the creator to share the original file.", "Save the Pin to a board."] },
  "vimeo-downloader": { platform: "Vimeo", oembed: "https://vimeo.com/api/oembed.json", limitation: "Vimeo only allows downloads when the video’s owner turns them on, and that happens on Vimeo itself, so MediaAura can’t fetch the file.", alternatives: ["If the owner enabled downloads, a Download button appears under the video on Vimeo.", "Your own videos: download them from Vimeo’s video manager.", "Ask the owner to share the file."] },
  "dailymotion-downloader": { platform: "Dailymotion", oembed: "https://www.dailymotion.com/services/oembed", limitation: lim("Dailymotion"), alternatives: ["Ask the uploader to share the original file.", "Use Dailymotion’s own sharing and embed options.", "Your own videos: keep the original file from your upload."] },
  "reddit-downloader": { platform: "Reddit", oembed: "https://www.reddit.com/oembed", limitation: lim("Reddit"), alternatives: ["Your own posts: use Reddit’s data request tool.", "Ask the poster to share the original file.", "Save the post in the Reddit app."] },
  "threads-downloader": { platform: "Threads", limitation: lim("Threads"), alternatives: ["Your own posts: use Meta’s “Download your information” tool.", "Ask the creator to share the original file.", "Save the post in the Threads app."] },
  "linkedin-downloader": { platform: "LinkedIn", limitation: lim("LinkedIn"), alternatives: ["Your own content: use LinkedIn’s “Get a copy of your data” option.", "Ask the person who posted it to share the original file.", "Save the post to revisit it on LinkedIn."] },
};
// Strict validation: https only, no credentials or custom ports, host must match the platform.
export function validateUrl(slug: string, input: string): URL | null {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool?.hosts) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" || u.username || u.password || u.port || !tool.hosts.test(u.hostname)) return null;
    u.hash = "";
    return u;
  } catch { return null; }
}

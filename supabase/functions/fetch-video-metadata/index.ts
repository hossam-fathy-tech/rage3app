import { corsHeaders } from "../_shared/cors.ts";

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";

function extractYouTubeId(input: string): string {
  const cleaned = input.trim();
  // Already an ID (11 chars, no special chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) return cleaned;
  const match = cleaned.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? cleaned;
}

function extractLinks(text: string): { url: string; title: string }[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s)}\]>"']+)/g;
  const matches = [...text.matchAll(urlRegex)];
  const seen = new Set<string>();
  return matches
    .map((m) => {
      const url = m[1].replace(/[.,;:!?]+$/, "");
      if (seen.has(url)) return null;
      seen.add(url);
      return { url, title: smartLabel(url) };
    })
    .filter(Boolean) as { url: string; title: string }[];
}

function smartLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    if (host.includes("drive.google")) return "تحميل الملف";
    if (host.includes("docs.google")) return "مستند Google";
    if (host.includes("t.me") || host.includes("telegram")) return "قناة تيليجرام";
    if (url.match(/\.pdf(\?|$)/i)) return "ملف PDF";
    if (host.includes("youtube") || host.includes("youtu.be")) return "فيديو YouTube";
    if (host.includes("dropbox")) return "Dropbox";
    if (host.includes("bit.ly") || host.includes("tinyurl") || host.includes("rb.gy")) return "رابط مختصر";
    if (host.includes("facebook") || host.includes("fb.")) return "صفحة فيسبوك";
    if (host.includes("instagram")) return "حساب إنستغرام";
    if (host.includes("twitter") || host.includes("x.com")) return "تويتر / X";
    return "رابط إضافي";
  } catch {
    return "رابط إضافي";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(
        JSON.stringify({ error: "video_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ytId = extractYouTubeId(video_id);
    if (!ytId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL or ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ytId}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `YouTube API: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await res.json();
    const item = json.items?.[0];
    if (!item) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const snippet = item.snippet ?? {};
    const description = snippet.description ?? "";
    const links = extractLinks(description);

    // Parse ISO 8601 duration
    const isoDuration = item.contentDetails?.duration ?? "";
    const durationMatch = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    let durationStr = "";
    if (durationMatch) {
      const h = parseInt(durationMatch[1] ?? "0");
      const m = parseInt(durationMatch[2] ?? "0");
      const s = parseInt(durationMatch[3] ?? "0");
      if (h > 0) durationStr = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      else durationStr = `${m}:${String(s).padStart(2, "0")}`;
    }

    return new Response(
      JSON.stringify({
        youtube_video_id: ytId,
        title: snippet.title ?? "",
        description,
        thumbnail: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? "",
        duration: durationStr,
        channel: snippet.channelTitle ?? "",
        links,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

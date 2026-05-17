import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

async function fetchPlaylistItems(playlistId: string, apiKey: string) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const items: any[] = [];
  let pageToken = "";

  do {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "YouTube API error");
    }
    const json = await res.json();
    items.push(...(json.items ?? []));
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);

  return items;
}

async function fetchPlaylistMeta(playlistId: string, apiKey: string) {
  const url = new URL(`${YOUTUBE_API_BASE}/playlists`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", playlistId);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch playlist metadata");
  const json = await res.json();
  return json.items?.[0]?.snippet ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { playlist_id, course_id, lecture_id } = await req.json();
    if (!playlist_id) throw new Error("playlist_id is required");
    if (!course_id) throw new Error("course_id is required");

    // Fetch playlist meta + items
    const [meta, items] = await Promise.all([
      fetchPlaylistMeta(playlist_id, apiKey),
      fetchPlaylistItems(playlist_id, apiKey),
    ]);

    // Save playlist record
    const { data: playlistRow, error: playlistErr } = await supabase
      .from("playlists")
      .upsert({ playlist_id, title: meta?.title ?? playlist_id, description: meta?.description ?? "", thumbnail: meta?.thumbnails?.high?.url ?? "" }, { onConflict: "playlist_id" })
      .select()
      .single();
    if (playlistErr) throw playlistErr;

    // Link playlist to course
    await supabase.from("course_playlists").upsert({ course_id, playlist_id: playlistRow.id }, { onConflict: "course_id,playlist_id" });

    // Determine target lecture
    let targetLectureId = lecture_id;
    if (!targetLectureId) {
      // Create a new lecture from playlist title
      const { data: newLecture, error: lecErr } = await supabase
        .from("lectures")
        .insert({ course_id, title: meta?.title ?? "محاضرة مستوردة", order_index: 0 })
        .select()
        .single();
      if (lecErr) throw lecErr;
      targetLectureId = newLecture.id;
    }

    // Insert lessons
    const lessons = items
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item, index) => ({
        lecture_id: targetLectureId,
        title: item.snippet.title,
        description: item.snippet.description?.slice(0, 500) ?? "",
        video_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        youtube_video_id: item.snippet.resourceId.videoId,
        order_index: index,
        is_preview: false,
        is_completed: false,
        duration: "",
      }));

    const { data: insertedLessons, error: lessonsErr } = await supabase
      .from("lessons")
      .insert(lessons)
      .select();
    if (lessonsErr) throw lessonsErr;

    return new Response(
      JSON.stringify({
        success: true,
        lecture_id: targetLectureId,
        playlist_title: meta?.title,
        imported_count: insertedLessons?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  } catch (err: any) {
    console.error("import-youtube-playlist error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

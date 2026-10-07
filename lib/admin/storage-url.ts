export const PHOTO_BUCKET = "produtos";

const PUBLIC_DIR = `/storage/v1/object/public/${PHOTO_BUCKET}/`;
// Exactly the paths requestImageUpload hands out: "YYYY-MM/<uuid>.<ext>".
const PHOTO_PATH =
  /^\d{4}-\d{2}\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/;

/**
 * Storage path from a public URL of our photos bucket, or null for anything
 * else. Checked on the parsed URL (dot segments, encoded or not, already
 * resolved), never on the raw text: ".../produtos/../outro/x.png" is another
 * bucket.
 */
export function photoPathFromUrl(
  url: string,
  supabaseUrl: string,
): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const extras = u.username || u.password || u.search || u.hash;
  if (u.origin !== new URL(supabaseUrl).origin || extras) {
    return null;
  }
  if (!u.pathname.startsWith(PUBLIC_DIR)) return null;
  const path = u.pathname.slice(PUBLIC_DIR.length);
  return PHOTO_PATH.test(path) ? path : null;
}

/**
 * Resolve a public asset path against Vite's configured base URL.
 *
 * Scene backdrops and sprite sheets are referenced as root-absolute strings
 * (e.g. "/sprites/elder.png") in the scene data. That works when the app is
 * served from "/", but a GitHub Pages *project* site is served from
 * "/<repo>/", where "/sprites/…" would 404. Routing every image URL through
 * this helper rewrites it against `import.meta.env.BASE_URL` so the same data
 * works at the site root (dev) and under a sub-path (Pages) unchanged.
 */
export function asset(path: string): string {
  // Leave absolute URLs and inline data URIs untouched.
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
}

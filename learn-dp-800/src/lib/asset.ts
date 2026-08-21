// Base path the app is served under (e.g. "/learn-dp-800" on GitHub Pages).
// Injected at build time via next.config.mjs (NEXT_PUBLIC_BASE_PATH).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix a public asset path (e.g. "/brand/logo.png") with the base path so it
 * resolves correctly on both root and sub-path deployments. next/image does not
 * reliably prepend basePath to public assets in static export, so use this for
 * plain <img>/<link> references.
 */
export function asset(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}

/**
 * Resolve an in-app route for a static export (GitHub Pages). Next.js Link
 * prefetches RSC payloads (`?_rsc=` / `*.txt`) that GitHub Pages cannot serve,
 * which surfaces as 503/failed-resource console errors and can stall navigation.
 * Native `<a href>` needs the base path and a trailing slash to match
 * `trailingSlash: true` folder output.
 */
export function resolveRoute(path: string, basePath = BASE_PATH): string {
  if (/^(https?:|mailto:|tel:)/i.test(path) || path.startsWith("#")) return path;
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefixed = `${basePath}${clean}`;
  const withSlash = prefixed.endsWith("/") ? prefixed : `${prefixed}/`;
  return `${withSlash}${query}${hash}`;
}

export function route(path: string): string {
  return resolveRoute(path);
}

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Optional base path for project-site hosting (e.g. "/learn-dp-800").
// Leave empty for a user/org root site (ntttrang.github.io).
const basePath = process.env.BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a fully static site into ./out for GitHub Pages.
  output: "export",
  // GitHub Pages has no Next.js image optimizer.
  images: { unoptimized: true },
  // Serve each route as a folder with index.html (Pages-friendly).
  trailingSlash: true,
  basePath: basePath || undefined,
  // Expose the base path to client code for asset URLs.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Silence the multi-lockfile workspace-root inference warning.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

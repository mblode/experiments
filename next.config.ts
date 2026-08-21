import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * PostHog is reverse-proxied through r.blode.co, and posthog-js lazy-loads its
 * extension bundles from `api_host`, so the origin belongs in `script-src` as
 * well as `connect-src`.
 *
 * The fallback is the deployed proxy rather than "": this file is evaluated at
 * build time, and an env var that is only bound on production would otherwise
 * ship previews a CSP that silently blocks analytics.
 */
const posthogOrigin =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://r.blode.co";

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is not optional: Next inlines the RSC flight payload as a
  // <script>. 'unsafe-eval' is dev-only, for the Turbopack HMR runtime. WebGL
  // shaders compile in the GPU driver, not the JS engine, so the Three.js
  // demos need nothing extra here.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${posthogOrigin}`,
  `connect-src 'self' ${posthogOrigin}`,
  // blob: for the sticky-notes demo, which serialises an SVG and loads the
  // object URL as a texture. The two remote hosts are the `remotePatterns`
  // below, listed because `components/ui/media-image.tsx` renders `unoptimized`
  // and so bypasses the same-origin /_next/image route.
  "img-src 'self' data: blob: https://images.unsplash.com https://placehold.co",
  // The theme picker injects a Google Fonts stylesheet at runtime
  // (`hooks/use-google-fonts.ts`), which in turn pulls faces from gstatic.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Demo scenery videos are served from this origin.
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * blode.co deliberately skips zone paths in its own `headers()`, because two
 * Content-Security-Policy headers on one response are intersected by the
 * browser rather than overridden. So this zone owns its response headers.
 *
 * No `Cross-Origin-Resource-Policy`: `same-origin` would need a `cross-origin`
 * override on every OG route, of which this app has five, and missing one kills
 * a share card silently. HSTS is already set at the edge.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  assetPrefix: "/experiments",
  basePath: "/experiments",
  cacheComponents: true,
  // Prefetch only the static shell of a route, never its dynamic data. Requires
  // cacheComponents, which is already on.
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  headers() {
    // Every matching rule applies in array order and a later one wins per
    // header key, so the catch-all comes first and per-path rules after it.
    //
    // `/:path*` rather than `/(.*)`: `headers` sources are basePath-prefixed,
    // and `/experiments/(.*)` does not match the bare `/experiments` the zone
    // rewrite actually requests. The `*` modifier makes the segment optional,
    // so `/experiments/:path*` covers the zone root as well as everything
    // under it.
    return Promise.resolve([
      {
        headers: securityHeaders,
        source: "/:path*",
      },
      {
        // Scenery inside the lighting demo and silent gallery previews of the
        // demos themselves — neither is watchable content, so keep both out of
        // Google's video index.
        source: "/:dir(videos|previews)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ]);
  },
  redirects() {
    return Promise.resolve([
      {
        // Public URL is blode.co/experiments/moon; this catches the same path
        // on the zone origin (basePath prefixes source to /experiments/moon).
        destination: "https://blode.co/moon",
        permanent: true,
        source: "/moon",
      },
      {
        // Ahead of the :path* host catch-all so experiments.blode.co/moon does
        // not hop through blode.co/experiments/moon first.
        basePath: false,
        destination: "https://blode.co/moon",
        has: [{ type: "host" as const, value: "experiments.blode.co" }],
        permanent: true,
        source: "/moon",
      },
      {
        basePath: false,
        destination: "https://blode.co/experiments",
        has: [{ type: "host" as const, value: "experiments.blode.co" }],
        permanent: true,
        source: "/",
      },
      {
        basePath: false,
        destination: "https://blode.co/experiments/:path*",
        has: [{ type: "host" as const, value: "experiments.blode.co" }],
        permanent: true,
        source: "/:path*",
      },
    ]);
  },
};

export default nextConfig;

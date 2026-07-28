import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: "/experiments",
  basePath: "/experiments",
  cacheComponents: true,
  // TypeScript 7's compiler API moved; `check-types` remains the authoritative
  // gate while Next's redundant inline validation is skipped.
  typescript: { ignoreBuildErrors: true },
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
    return Promise.resolve([
      {
        // The zone origin and the *.vercel.app aliases are non-canonical
        // hostnames inside the sc-domain:blode.co Search Console property, so
        // left open they are a crawlable duplicate of the whole site.
        //
        // Keyed off x-forwarded-host, NOT host: the multi-zone rewrite proxies
        // to the origin, so `host` is the origin for real blode.co traffic
        // too. Matching on `host` would noindex the live site.
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
        has: [
          {
            key: "x-forwarded-host",
            type: "header" as const,
            value: String.raw`.*\.zone\.blode\.co|.*\.vercel\.app`,
          },
        ],
        source: "/:path*",
      },
      {
        // The clips are decorative scenery inside the lighting demo, not
        // watchable content — keep them out of Google's video index.
        source: "/videos/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ]);
  },
  redirects() {
    return Promise.resolve([
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

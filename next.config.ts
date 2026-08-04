import type { NextConfig } from "next";

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
    return Promise.resolve([
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

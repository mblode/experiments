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

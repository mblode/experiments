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

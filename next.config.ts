import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This checkout is nested under another directory with a package-lock.json.
  // Limit module resolution and file watching to this project.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;


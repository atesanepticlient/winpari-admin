import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "res.cloudinary.com",
      "download.logo.wine",
      "logos-world.net",
      "mir-s3-cdn-cf.behance.net",
      "cdn.prod.website-files.com",
    ],
  },
};

export default nextConfig;

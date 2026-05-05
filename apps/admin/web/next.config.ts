import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    domains: ["storage.googleapis.com", "lh3.googleusercontent.com"],
  },
};

export default nextConfig;

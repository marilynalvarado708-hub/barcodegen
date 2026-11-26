import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the project root so stray lockfiles in parent folders are ignored.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

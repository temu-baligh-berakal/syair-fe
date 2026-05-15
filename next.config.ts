import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // @ts-ignore
  allowedDevOrigins: ['192.168.1.40'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
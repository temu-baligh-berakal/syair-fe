import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  turbopack: {
    root: __dirname,
  },
};

module.exports = {
  allowedDevOrigins: ['192.168.1.40'],
}

export default nextConfig;
import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL || "http://localhost:5003").replace(/\/$/, "");

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ["localhost:3003", "127.0.0.1:3003"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

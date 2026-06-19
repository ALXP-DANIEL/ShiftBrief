import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.104"],
  experimental: {
    viewTransition: true,
  },
  reactCompiler: true,
};

export default nextConfig;

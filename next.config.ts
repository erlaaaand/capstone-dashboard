import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Matikan telemetry di environment CI/production
  // (bisa juga set env NEXT_TELEMETRY_DISABLED=1 di platform deploy)

  images: {
    remotePatterns: [
      // Development
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      // Supabase storage (production)
      {
        protocol: "https",
        hostname: "ncexezvwssvcfffipiqk.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
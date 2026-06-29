import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Izinkan gambar dari localhost (development)
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
      {
        protocol: "https",
        hostname: "ncexezvwssvcfffipiqk.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
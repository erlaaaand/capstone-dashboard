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
      // Tambahkan hostname storage backend production di sini
      // Contoh: { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;

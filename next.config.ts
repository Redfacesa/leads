import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/:path*", destination: "/dashboard/:path*", permanent: false },
      { source: "/partner", destination: "/client", permanent: true },
      { source: "/partner/:path*", destination: "/client/:path*", permanent: true },
      { source: "/dashboard/partners", destination: "/dashboard/clients", permanent: true },
    ];
  },
};

export default nextConfig;

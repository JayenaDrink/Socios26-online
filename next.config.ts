import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  serverExternalPackages: ['@supabase/supabase-js']
};

export default nextConfig;

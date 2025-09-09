import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps to avoid URL encoding issues
  productionBrowserSourceMaps: false,
  
  // Additional configuration to handle source map issues
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = false; // Disable source maps in development
    }
    return config;
  },
};

export default nextConfig;

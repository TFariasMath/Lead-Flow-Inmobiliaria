import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: true,
    buildActivity: true,
    buildActivityPosition: 'top-right',
  },
};

export default nextConfig;

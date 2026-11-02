import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 is a Node.js driver; keep it out of the server bundle.
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;

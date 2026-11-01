import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conventional rendering for the scaffold (cacheComponents/dynamicIO removed so
  // dynamic params, redirect() and client hooks work without extra Suspense boundaries).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

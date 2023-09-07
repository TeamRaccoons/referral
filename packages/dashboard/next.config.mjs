import { whitelistedImageUrls } from "./whitelistedImageUrls.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Wildcard not available yet, Issues over: https://github.com/vercel/next.js/pull/27345
    domains: whitelistedImageUrls,
  },
  // cors headers
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/referral/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;

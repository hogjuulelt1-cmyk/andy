import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Korean is the default locale and lives at the root; other locales are
  // prefixed (/en/...). Any path that is not a real route (so not /en/...,
  // not /_next/...) is served by the [locale] tree as "ko" while the URL stays
  // unprefixed; /ko/... redirects back to the unprefixed URL.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/ko" },
        // Everything except an explicit locale prefix and Next internals.
        { source: "/:path((?!en(?:/|$)|_next/|api/).*)", destination: "/ko/:path" },
      ],
      fallback: [],
    };
  },
  async redirects() {
    return [
      { source: "/ko", destination: "/", permanent: true },
      { source: "/ko/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;

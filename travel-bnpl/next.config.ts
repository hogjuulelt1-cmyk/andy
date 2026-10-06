import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Korean is the default locale and lives at the root; other locales are
  // prefixed (/en). The URL stays "/" while the [locale] route renders "ko".
  async rewrites() {
    return [{ source: "/", destination: "/ko" }];
  },
  async redirects() {
    return [{ source: "/ko", destination: "/", permanent: true }];
  },
};

export default nextConfig;

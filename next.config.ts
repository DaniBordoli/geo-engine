import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium/puppeteer deben quedar externos (no bundlearse) para que el binario
  // headless funcione en el runtime de Vercel.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;

declare module "next-pwa" {
  import type { NextConfig } from "next";
  type RuntimeCaching = unknown;
  interface NextPwaOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: RuntimeCaching[];
    [key: string]: unknown;
  }
  export default function withPWA(options?: NextPwaOptions): (config: NextConfig) => NextConfig;
}

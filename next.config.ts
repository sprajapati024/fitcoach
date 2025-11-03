import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: false,
  runtimeCaching: [
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.destination === "document" ||
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "font",
      handler: "CacheFirst",
      options: {
        cacheName: "fitcoach-app-shell",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/api/") &&
        !url.pathname.startsWith("/api/auth/"),
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "fitcoach-api",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/log"),
      handler: "NetworkOnly",
      method: "POST",
      options: {
        backgroundSync: {
          name: "fitcoach-log-queue",
          options: {
            maxRetentionTime: 24 * 60, // minutes
          },
        },
      },
    },
    {
      urlPattern: ({ request }: { request: Request }) => request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "fitcoach-images",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
})(nextConfig);

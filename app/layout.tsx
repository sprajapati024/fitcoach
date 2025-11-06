import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { publicEnv } from "@/lib/env/public";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ToastProvider } from "@/components/Toast";
import { KeyboardViewportProvider } from "@/components/providers/KeyboardViewportProvider";
import InstallPrompt from "@/components/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: publicEnv.NEXT_PUBLIC_APP_NAME,
  description:
    "FitCoach is a monochrome fitness coaching PWA with AI-assisted planning and deterministic progression.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitCoach",
  },
  icons: {
    apple: "/icons/ios-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0b0b0f" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <KeyboardViewportProvider>
          <SupabaseProvider>
            <ToastProvider>{children}</ToastProvider>
          </SupabaseProvider>
        </KeyboardViewportProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}

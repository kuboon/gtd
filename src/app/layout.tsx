import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tindone",
  description: "Swipe your way to GTD nirvana",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "tindone",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff4458",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Declarative Web Push */}
        <link rel="push-subscription" href="/api/push-subscription" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

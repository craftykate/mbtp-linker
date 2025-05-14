import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { theme } from "@/theme";
import "@mantine/core/styles.css";
import "./globals.css";
import { SavedLinksContextProvider } from "@/store/settings";

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  maximumScale: 1,
  width: "device-width",
};

export const metadata: Metadata = {
  title: "Easy MBTP Linker",
  description: "Quick links to MBTP resources",
  openGraph: {
    title: "Easy MBTP Linker",
    description: "Quick links to MBTP resources",
    url: "https://mbtp-linker.vercel.app",
    type: "website",
    images: [
      {
        url: "https://mbtp-linker.vercel.app/thumbnail.png",
        width: 1200,
        height: 630,
      },
    ],
    siteName: "mbtp-linker.vercel.app",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Easy MBTP Linker",
    description: "Quick links to MBTP resources",
    images: "https://mbtp-linker.vercel.app/thumbnail.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-mantine-color-scheme="light">
      {/* data-mantine-color-scheme tag added to suppress mantine hydration bug error */}
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <SavedLinksContextProvider>
          <MantineProvider theme={theme}>
            {children}
            <Analytics />
          </MantineProvider>
        </SavedLinksContextProvider>
      </body>
    </html>
  );
}

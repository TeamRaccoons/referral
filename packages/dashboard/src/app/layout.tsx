import { Inter } from "next/font/google";
import LocalFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/footer";
import { MainNav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { WalletButton } from "@/components/wallet-button";
import WalletProvider from "@/components/wallet-provider";
import { cn } from "@/lib/utils";
import { siteConfig } from "./config";

require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");

const fontSans = Inter({
  subsets: ["latin"] as const,
  variable: "--font-sans",
});
const fontCal = LocalFont({
  src: "../styles/calsans.ttf",
  variable: "--font-cal",
});

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [{ url: "/opengraph-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "https://acme-corp-lib.vercel.app/opengraph-image.png" }],
    creator: "@jullerino",
  },
  metadataBase: new URL("https://acme-corp.jumr.dev"),
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <html lang="en" suppressHydrationWarning className="bg-background">
        <body
          className={cn(
            "min-h-screen font-sans antialiased",
            fontSans.variable,
            fontCal.variable,
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WalletProvider>
              <div className="flex min-h-screen flex-col">
                <nav className="bg-background/95 container sticky top-0 z-50 flex h-16 items-center border-b border-gray-200 shadow-sm backdrop-blur-sm dark:border-gray-800">
                  <Link
                    className="flex items-center gap-2.5 transition-all duration-200 hover:opacity-80"
                    href="/"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      <Image src="/jup.png" alt="logo" width={24} height={24} />
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                      {siteConfig.name}
                    </span>
                  </Link>
                  <div className="mx-4 h-5 w-px bg-gray-200 dark:bg-gray-700"></div>
                  <MainNav />
                  <div className="ml-auto flex items-center">
                    <WalletButton />
                  </div>
                </nav>

                <main className="flex flex-1 flex-col items-center">
                  {props.children}
                </main>
                <SiteFooter />
              </div>
            </WalletProvider>
          </ThemeProvider>
          <Toaster />
        </body>
      </html>
    </>
  );
}

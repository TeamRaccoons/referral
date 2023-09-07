import { Inter } from "next/font/google";
import LocalFont from "next/font/local";
import Link from "next/link";

import { SiteFooter } from "@/components/footer";
import { MainNav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import * as Icons from "@/components/ui/icons";
import { Toaster } from "@/components/ui/toaster";
import { WalletButton } from "@/components/wallet-button";
import WalletProvider from "@/components/wallet-provider";
import { cn } from "@/lib/utils";
import { siteConfig } from "./config";

require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");

const fontSans = Inter({
  subsets: ["latin"],
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
                <nav className="bg-background container z-50 flex h-16 items-center border-b">
                  <Link className="mr-8 flex items-center" href="/">
                    <Icons.Logo className="mr-2 h-6 w-6" />
                    <span className="text-lg font-bold tracking-tight">
                      {siteConfig.name}
                    </span>
                  </Link>
                  <nav></nav>
                  {/* <MobileDropdown /> */}
                  <MainNav />
                  <div className="ml-auto flex items-center space-x-4">
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

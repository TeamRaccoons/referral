"use client";

import * as React from "react";
import Image from "next/image";
import { DoorOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { Balancer } from "react-wrap-balancer";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const { theme } = useTheme();
  const logoSrc =
    theme === "dark"
      ? "/powered-by-jupiter-dark.svg"
      : "/powered-by-jupiter-light.svg";

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="z-10 w-full max-w-5xl">
        <h1
          className="animate-fade-up from-foreground to-muted-foreground bg-gradient-to-br bg-clip-text text-center text-4xl font-bold tracking-[-0.02em] opacity-0 drop-shadow-sm dark:text-[#FCFCFD] sm:text-5xl md:text-7xl/[5rem]"
          style={{ animationDelay: "0.20s", animationFillMode: "forwards" }}
        >
          <Balancer>Jupiter Referral Dashboard</Balancer>
        </h1>
        <p
          className="animate-fade-up mx-auto mt-6 max-w-2xl text-center text-base opacity-0 dark:text-[#98A2B3] sm:mt-8 sm:text-lg md:text-xl"
          style={{ animationDelay: "0.30s", animationFillMode: "forwards" }}
        >
          <Balancer>
            The Jupiter Referral Program empowers any developer to earn fees
            when integrating with Jupiter&apos;s APIs.
          </Balancer>
          <Balancer className="text-muted-foreground mt-3 block text-sm sm:text-base">
            (Anyone can also use the Referral Program for their own Solana
            program)
          </Balancer>
        </p>
        <Image
          src={logoSrc}
          alt="Powered by Jupiter"
          width={175}
          height={175}
          className="animate-fade-up mx-auto mt-8 opacity-0"
          style={{ animationDelay: "0.40s", animationFillMode: "forwards" }}
        />
        <div
          className="animate-fade-up mx-auto mt-8 flex flex-col items-center justify-center space-y-4 opacity-0 sm:flex-row sm:space-x-5 sm:space-y-0"
          style={{ animationDelay: "0.40s", animationFillMode: "forwards" }}
        >
          <a
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "w-full px-8 py-6 text-base sm:w-auto sm:text-lg",
            )}
            href="https://dev.jup.ag/docs/tool-kits/referral-program"
            target="_blank"
            rel="noopener noreferrer"
          >
            <DoorOpen className="mr-2 h-5 w-5" />
            <span className="text-center">View Documentation</span>
          </a>
        </div>
        <div className="animate-fade-up relative mt-12 h-[300px] w-full overflow-hidden rounded-xl sm:mt-16 sm:h-[400px] md:h-[500px]">
          <Image
            src="/hero-banner.png"
            alt="Jupiter Referral Program Hero Banner"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </main>
  );
}

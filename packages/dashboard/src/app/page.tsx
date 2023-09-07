import * as React from "react";
import { Balancer } from "react-wrap-balancer";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitHub } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { marketingFeatures, siteConfig } from "./config";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center pt-24">
      <div className="z-10 min-h-[50vh] w-full max-w-4xl px-5 xl:px-0">
        <h1
          className="animate-fade-up from-foreground to-muted-foreground bg-gradient-to-br bg-clip-text text-center text-4xl font-bold tracking-[-0.02em] opacity-0 drop-shadow-sm dark:text-[#FCFCFD] md:text-6xl/[5rem]"
          style={{ animationDelay: "0.20s", animationFillMode: "forwards" }}
        >
          <Balancer>
            Your <span className="text-[#2E90FA]">all-in-one</span> wealth
            accumulation
          </Balancer>
        </h1>
        <p
          className="animate-fade-up mt-6 text-center opacity-0 dark:text-[#98A2B3] md:text-xl"
          style={{ animationDelay: "0.30s", animationFillMode: "forwards" }}
        >
          <Balancer>
            Easiest way to create a referral account for your Solana program
          </Balancer>
        </p>
        <div
          className="animate-fade-up mx-auto mt-6 flex items-center justify-center space-x-5 opacity-0"
          style={{ animationDelay: "0.40s", animationFillMode: "forwards" }}
        >
          <a
            className={cn(buttonVariants({ variant: "default" }))}
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHub className="mr-1 h-4 w-4" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>
      <div className="animate-fade-up my-16 w-full max-w-screen-lg gap-5 border-t p-5 xl:px-0">
        <h2 className="pt-4 text-center text-3xl font-bold dark:text-[#98A2B3] md:text-4xl">
          The Solana Solution
        </h2>

        <p className="pb-8 pt-4 text-center text-lg dark:text-[#475467]">
          <Balancer>
            Solana programs need a way to incentivize developers to use their
            contracts. We provide a simple way to create a referral account for
            your Solana program. Start earning today!
          </Balancer>
        </p>

        <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-3">
          {marketingFeatures.map((feature) => (
            <Card key={feature.title} className={cn("p-2")}>
              <CardHeader>
                <span className="w-fit rounded-xl p-4 dark:bg-[#344054]">
                  {feature.icon}
                </span>
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="dark:text-[#98A2B3]">
                  {feature.title}
                </CardTitle>
                <CardDescription className="mt-2 text-sm/6 dark:text-[#667085]">
                  {feature.body}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

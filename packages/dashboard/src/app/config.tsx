import type { Route } from "next";
import * as Lucide from "lucide-react";

export const siteConfig = {
  name: "Referral",
  description:
    "Easiest way to create referral account for your Solana program. Start earning today!",
  github: "https://github.com/TeamRaccoons/referral",
  twitter: "https://twitter.com/jullerino",
};

export const navItems = [
  {
    href: "/dashboard",
    title: "Dashboard (Swap)",
  },
  {
    href: "/dashboard-ultra",
    title: "Dashboard (Ultra)",
  },
  {
    href: "/api",
    title: "API",
  },
] satisfies { href: Route; title: string }[];

export const marketingFeatures = [
  {
    icon: <Lucide.Hand className="h-10 w-10" />,
    title: "Better Outreach",
    body: (
      <>
        Incentive for developers to integrate your program! <br /> Integrations
        bring more users!
      </>
    ),
  },
  {
    icon: <Lucide.DollarSignIcon className="h-10 w-10" />,
    title: "More Revenue",
    body: <>More users means more revenue for your program!</>,
  },
  {
    icon: <Lucide.Cable className="h-10 w-10" />,
    title: "Simple and Easy to Use",
    body: (
      <>
        1. Create.
        <br /> 2. Add the referral account to your program.
      </>
    ),
  },
];

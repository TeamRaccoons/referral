"use client";

import { useQuery } from "@tanstack/react-query";

export const useTopTokens = () =>
  useQuery({
    queryKey: ["top-tokens"],
    queryFn: async () => {
      const topTokens: string[] = await (
        await fetch("https://cache.jup.ag/top-tokens")
      ).json();

      const top10Tokens = topTokens.slice(0, 10);
      const top10TokensSet = new Set(top10Tokens);

      return top10TokensSet;
    },
  });

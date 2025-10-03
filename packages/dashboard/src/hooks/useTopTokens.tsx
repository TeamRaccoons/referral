"use client";

import { useQuery } from "@tanstack/react-query";

export const useTopTokens = () =>
  useQuery({
    queryKey: ["top-tokens"],
    queryFn: async () => {
      const topTokens: string[] = await (
        await fetch("https://lite-api.jup.ag/tokens/v2/toptraded/24h")
      ).json();

      const top10Tokens = topTokens.slice(0, 10);
      const top10TokensSet = new Set(top10Tokens);

      return top10TokensSet;
    },
  });

import { useEffect, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { chunks } from "@/lib/utils";

export interface PriceAPIResult {
  [tokenAddress: string]: {
    blockId: number;
    decimals: number;
    usdPrice: number;
    priceChange24h: number;
  };
}
export const TOKEN_PRICES_KEY = "token-prices";
export const useFetchTokenPrices = (tokenMints: string[]) => {
  return useQueries({
    queries: chunks(tokenMints, 50).map((tokens) => {
      return {
        queryKey: [TOKEN_PRICES_KEY, ...tokens],
        queryFn: async () => {
          const response = await fetch(
            `https://lite-api.jup.ag/price/v3?ids=${tokens.join(",")}`,
          );
          const data: PriceAPIResult = await response.json();
          return data;
        },
      };
    }),
  });
};

export const useGetTokenPrice = (mint: string) => {
  const [_, rerender] = useState<{}>();
  const queryClient = useQueryClient();

  useEffect(() => {
    const queryCache = queryClient.getQueryCache();

    const unsubscribe = queryCache.subscribe((event) => {
      if (!event) {
        return;
      }

      const {
        query: { queryKey },
      } = event;

      if (queryKey[0] === TOKEN_PRICES_KEY && queryKey.includes(mint)) {
        rerender({});
      }
    });

    return unsubscribe;
  }, [queryClient, mint]);

  const price = useMemo(() => {
    const queriesData = queryClient.getQueriesData<PriceAPIResult>({
      queryKey: [TOKEN_PRICES_KEY],
      exact: false,
    });

    for (const [queryKey, data] of queriesData) {
      if (data && queryKey.includes(mint)) {
        return data[mint]?.usdPrice;
      }
    }

    return undefined;
  }, [queryClient, mint]);

  return price;
};

export const useGetTokenPrices = (mints: string[]) => {
  const [_, rerender] = useState<{}>();
  const queryClient = useQueryClient();

  useEffect(() => {
    const queryCache = queryClient.getQueryCache();

    const unsubscribe = queryCache.subscribe((event) => {
      if (!event) {
        return;
      }

      const {
        query: { queryKey },
      } = event;

      if (
        queryKey[0] === TOKEN_PRICES_KEY &&
        queryKey.some((key: string) => mints.includes(key))
      ) {
        rerender({});
      }
    });

    return unsubscribe;
  }, [queryClient, mints]);

  const pricesHash = useMemo(() => {
    const queriesData = queryClient.getQueriesData<PriceAPIResult>({
      queryKey: [TOKEN_PRICES_KEY],
      exact: false,
    });

    const result: PriceAPIResult = {};

    for (const mint of mints) {
      for (const [queryKey, data] of queriesData) {
        if (data && queryKey.includes(mint) && data[mint]) {
          result[mint] = data[mint];
          break;
        }
      }
    }

    return result;
  }, [queryClient, mints]);

  return pricesHash;
};

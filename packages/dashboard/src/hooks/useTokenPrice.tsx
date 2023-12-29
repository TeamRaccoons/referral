import { useEffect, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { chunks } from "@/lib/utils";

export interface PriceAPIResult {
  data: Record<
    string,
    {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: number;
    }
  >;
}
export const TOKEN_PRICES_KEY = "token-prices";
export const useFetchTokenPrices = (tokenMints: string[]) => {
  return useQueries({
    queries: chunks(tokenMints, 100).map((tokens) => {
      return {
        queryKey: [TOKEN_PRICES_KEY, ...tokens],
        queryFn: async () => {
          const response = await fetch(
            `https://price.jup.ag/v4/price?ids=${tokens.join(",")}`,
          );
          const data: PriceAPIResult = await response.json();
          return data.data;
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
    const prices = queryClient.getQueryData<PriceAPIResult>(
      [TOKEN_PRICES_KEY],
      {
        exact: false,
        queryKey: [mint],
      },
    ) as PriceAPIResult["data"] | undefined;

    return prices?.[mint]?.price;
  }, [queryClient, mint, _]);

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
    return mints.reduce((acc, mint) => {
      const prices = queryClient.getQueryData<PriceAPIResult>(
        [TOKEN_PRICES_KEY],
        {
          exact: false,
          queryKey: [mint],
        },
      ) as PriceAPIResult["data"] | undefined;
      return { ...acc, ...(prices || {}) };
    }, {} as PriceAPIResult["data"]);
  }, [queryClient, mints]);

  return pricesHash;
};

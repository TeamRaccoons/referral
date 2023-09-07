import { useMemo } from "react";
import { RawAccountWithPubkey } from "@jup-ag/referral-sdk";

import { useTokenInfos } from "./useTokenInfo";
import { PriceAPIResult, useFetchTokenPrices } from "./useTokenPrice";

export const useTotalUnclaimed = (tokenAccounts: RawAccountWithPubkey[]) => {
  const queries = useFetchTokenPrices(
    useMemo(
      () => tokenAccounts.map(({ account }) => account.mint.toString()),
      [tokenAccounts],
    ),
  );

  const { isLoading, pricesData } = useMemo(() => {
    return {
      isLoading: queries.some(({ isLoading }) => isLoading),
      pricesData: queries.reduce((acc, { data }) => {
        return {
          ...acc,
          ...data,
        };
      }, {} as PriceAPIResult["data"]),
    };
  }, [queries]);

  const tokeninfos = useTokenInfos();

  const totalUnclaimed = useMemo(() => {
    if (!isLoading) {
      return tokenAccounts.reduce((acc, { pubkey, account }) => {
        const decimals = tokeninfos.data?.tokenInfoMap.get(
          account.mint.toString(),
        )?.decimals;
        if (typeof decimals === "number") {
          const price =
            ((pricesData[account.mint.toString()]?.price || 0) *
              Number(account.amount)) /
            10 ** decimals;

          return acc + price;
        }
        return acc;
      }, 0);
    }

    return 0;
  }, [isLoading, pricesData, tokenAccounts, tokeninfos]);

  return {
    isLoading,
    totalUnclaimed,
  };
};

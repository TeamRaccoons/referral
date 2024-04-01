import { useQuery } from "@tanstack/react-query";

export type TokenInfo = {
  chainId?: number;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI?: string;
};

export type TokenInfoMap = Map<string, TokenInfo>;

export const useTokenInfos = () =>
  useQuery({
    queryKey: ["tokeninfo"],
    queryFn: async () => {
      async function fetchJupiterTokens() {
        const tokenInfos: TokenInfo[] = await (
          await fetch("https://token.jup.ag/strict")
        ).json();

        const tokenInfoMap = tokenInfos.reduce((acc, tokenInfo) => {
          if (tokenInfo.chainId === 101) {
            return acc.set(tokenInfo.address, tokenInfo);
          }
          return acc;
        }, new Map<string, TokenInfo>());

        return { tokenInfoMap, tokenInfos };
      }

      const { tokenInfoMap, tokenInfos } = await fetchJupiterTokens();

      return { tokenInfoMap, tokenInfos };
    },
  });

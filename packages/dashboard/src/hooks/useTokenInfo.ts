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
          await fetch("https://tokens.jup.ag/tokens?tags=verified")
        ).json();

        const tokenInfoMap = tokenInfos.reduce((acc, tokenInfo) => {
          return acc.set(tokenInfo.address, tokenInfo);
        }, new Map<string, TokenInfo>());

        return { tokenInfoMap, tokenInfos };
      }

      const { tokenInfoMap, tokenInfos } = await fetchJupiterTokens();

      return { tokenInfoMap, tokenInfos };
    },
  });

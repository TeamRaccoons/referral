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
        // Fetch verified tokens
        const verifiedResponse = await fetch(
          "https://lite-api.jup.ag/tokens/v2/tag?query=verified",
        );
        const verifiedTokens = await verifiedResponse.json();

        // Fetch LST tokens
        const lstResponse = await fetch(
          "https://lite-api.jup.ag/tokens/v2/tag?query=lst",
        );
        const lstTokens = await lstResponse.json();

        // Combine and deduplicate tokens
        const allTokensMap = new Map();

        [...verifiedTokens, ...lstTokens].forEach((token: any) => {
          if (!allTokensMap.has(token.id)) {
            allTokensMap.set(token.id, {
              chainId: undefined,
              name: token.name,
              symbol: token.symbol,
              address: token.id,
              decimals: token.decimals,
              logoURI: token.icon,
            });
          }
        });

        const tokenInfos: TokenInfo[] = Array.from(allTokensMap.values());
        const tokenInfoMap = tokenInfos.reduce((acc, tokenInfo) => {
          return acc.set(tokenInfo.address, tokenInfo);
        }, new Map<string, TokenInfo>());

        return { tokenInfoMap, tokenInfos };
      }

      const { tokenInfoMap, tokenInfos } = await fetchJupiterTokens();

      return { tokenInfoMap, tokenInfos };
    },
  });

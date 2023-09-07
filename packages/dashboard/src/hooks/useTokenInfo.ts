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
      async function fetchSolflareTokens() {
        const tokenInfos: TokenInfo[] = await (
          await fetch(
            "https://cdn.jsdelivr.net/gh/solflare-wallet/token-list/solana-tokenlist.json",
          )
        )
          .json()
          .then((res) => res.tokens);

        return tokenInfos.reduce((acc, tokenInfo) => {
          return acc.set(tokenInfo.address, tokenInfo);
        }, new Map<string, TokenInfo>());
      }

      async function fetchJupiterTokens() {
        const tokenInfos: TokenInfo[] = await (
          await fetch("https://token.jup.ag/all")
        ).json();

        const tokenInfoMap = tokenInfos.reduce((acc, tokenInfo) => {
          if (tokenInfo.chainId === 101) {
            return acc.set(tokenInfo.address, tokenInfo);
          }
          return acc;
        }, new Map<string, TokenInfo>());

        return { tokenInfoMap, tokenInfos };
      }

      const [{ tokenInfoMap, tokenInfos }, solflareTokenMap] =
        await Promise.all([
          fetchJupiterTokens(),
          new Map(), // fetchSolflareTokens(),
        ]);

      // solflareTokenMap.forEach((tokenInfo, address) => {
      //   if (!jupiterTokenMap.has(address)) {
      //     jupiterTokenMap.set(address, tokenInfo);
      //   }
      // });

      return { tokenInfoMap, tokenInfos };
    },
  });

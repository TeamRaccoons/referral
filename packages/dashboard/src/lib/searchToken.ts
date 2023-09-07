import { TokenInfo } from "@/hooks/useTokenInfo";

export type NormalizedTokenInfo = {
  token: TokenInfo;
  values: string;
};

export const normalizeTokenInfo = (item: TokenInfo): NormalizedTokenInfo => {
  return {
    token: item,
    values: `${item.symbol} ${item.name}`.toLowerCase(),
  };
};

const generateSearchTerm = (item: NormalizedTokenInfo, searchValue: string) => {
  const isMatchingWithSymbol =
    item.token.symbol.toLowerCase().indexOf(searchValue) >= 0;
  const matchingSymbolPercent = isMatchingWithSymbol
    ? searchValue.length / item.token.symbol.length
    : 0;

  return {
    token: item.token,
    matchingIdx: item.values.indexOf(searchValue),
    matchingSymbolPercent,
  };
};

export const startSearch = async (
  items: NormalizedTokenInfo[],
  searchValue: string,
): Promise<TokenInfo[]> => {
  const normalizedSearchValue = searchValue.toLowerCase();

  const searchTermResults = items.reduce((acc, item) => {
    const result = generateSearchTerm(item, normalizedSearchValue);
    if (result.matchingIdx >= 0) {
      acc.push(result);
    }
    return acc;
  }, [] as Array<ReturnType<typeof generateSearchTerm>>);

  return searchTermResults
    .sort((i1, i2) => {
      let score = 0;
      const matchingIndex = i1.matchingIdx - i2.matchingIdx;
      const matchingSymbol =
        i2.matchingSymbolPercent > i1.matchingSymbolPercent
          ? 1
          : i2.matchingSymbolPercent == i1.matchingSymbolPercent
          ? 0
          : -1;

      return matchingIndex >= 0 ? matchingSymbol : matchingIndex;
    })
    .map((item) => item.token);
};

export const startAddressSearch = (
  items: NormalizedTokenInfo[],
  searchValue: string,
) => {
  return items.find((item) => item.token.address === searchValue);
};

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Control, useForm, useWatch } from "react-hook-form";
import AutoSizer from "react-virtualized-auto-sizer";
import { areEqual, FixedSizeList, ListChildComponentProps } from "react-window";

import PageTitle from "@/components/page-title";
import TokenIcon from "@/components/token-icon";
import TokenLink from "@/components/token-link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { WalletButton } from "@/components/wallet-button";
import { useConnection, useWallet } from "@/components/wallet-provider";
import TokenList from "@/app/dashboard/[referral]/create-token-accounts/token-list";
import { useReferralTokens } from "@/hooks/useReferralTokens";
import useSearchArrowNavigation, {
  useReactiveEventListener,
} from "@/hooks/useSearchArrowNavigation";
import { useSendTransaction } from "@/hooks/useSendTransaction";
import { TokenInfo, TokenInfoMap, useTokenInfos } from "@/hooks/useTokenInfo";
import { createReferralTokenAccounts } from "@/lib/referral";
import {
  NormalizedTokenInfo,
  normalizeTokenInfo,
  startAddressSearch,
  startSearch,
} from "@/lib/searchToken";
import { cn, nonNullable } from "@/lib/utils";

interface ICreateTokenAccountsProps {}

interface FormValues {
  tokens: Set<string>;
}

const CreateTokenAccounts: React.FunctionComponent<
  ICreateTokenAccountsProps
> = (props) => {
  const { replace, push } = useRouter();
  const { referral } = useParams();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const referralPubkey = React.useMemo(() => {
    try {
      return new PublicKey(referral?.toString() || "");
    } catch (e) {
      replace("/");
      return PublicKey.default;
    }
  }, [referral, replace]);
  const referralProvider = React.useMemo(() => {
    return new ReferralProvider(connection);
  }, [connection]);
  const referralTokens = useReferralTokens(referralProvider, referralPubkey);

  const tokenInfos = useTokenInfos();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    defaultValues: {
      tokens: new Set(),
    },
  });

  const existingReferralTokenMints = React.useMemo(() => {
    if (!referralTokens.data) {
      return new Set<string>();
    }
    const { token2022Accounts, tokenAccounts } = referralTokens.data;

    const mints = new Set<string>();
    token2022Accounts.forEach((token) => {
      mints.add(token.account.mint.toString());
    });
    tokenAccounts.forEach((token) => {
      mints.add(token.account.mint.toString());
    });

    return mints;
  }, [referralTokens.data]);

  const existingTokenInfos = React.useMemo(() => {
    return Array.from(existingReferralTokenMints)
      .map((mint) => {
        return tokenInfos.data?.tokenInfoMap.get(mint);
      })
      .filter(nonNullable);
  }, [existingReferralTokenMints, tokenInfos]);

  const sendTransaction = useSendTransaction();

  const tableData = React.useMemo(() => {
    if (!referralTokens.data || !tokenInfos.data) {
      return [];
    }
    const { tokenAccounts, token2022Accounts } = referralTokens.data;
    const mintToTokeninfoMap = tokenInfos.data.tokenInfoMap;

    return tokenAccounts
      .concat(token2022Accounts)
      .map(({ account, pubkey }) => {
        let mint = account.mint.toBase58();
        let tokenInfo = mintToTokeninfoMap.get(mint);

        if (!tokenInfo) {
          console.error("Failed to get token info");
          return;
        }

        return {
          tokenName: `${tokenInfo.name} (${tokenInfo.symbol})`,
          mint,
          address: pubkey.toBase58(),
          amount: new Decimal(account.amount.toString()).div(
            10 ** tokenInfo.decimals,
          ),
        };
      })
      .filter(nonNullable);
  }, [referralTokens, tokenInfos]);

  const createOnSubmit = async (values: FormValues) => {
    const { tokens } = values;
    if (tokens.size === 0) {
      toast({
        title: "Select at least one token",
        variant: "destructive",
      });
      return;
    }
    let mintsToCreate = Array.from(tokens).filter(
      (mint) => !existingReferralTokenMints.has(mint),
    );

    if (publicKey && mintsToCreate.length > 0) {
      const tx = await createReferralTokenAccounts({
        referralProvider,
        referralPubkey,
        tokenMints: mintsToCreate.map((mint) => new PublicKey(mint)),
        wallet: publicKey,
      });
      await sendTransaction(tx);
      referralTokens.refetch();

      // first time create, redirect to dashboard
      if (tableData.length === 0) {
        push("/dashboard");
      }
    }

    toast({
      title: "All tokens are created",
    });

    form.reset();
    return;
  };

  if (!connected) {
    return (
      <Card className="m-auto max-w-[350px]">
        <WalletButton />
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col", tableData.length > 0 && "w-full")}>
      <div className="mb-6">
        <PageTitle
          title="Create Token Accounts"
          referralPubkey={referralPubkey.toBase58()}
        />
      </div>
      <div className="relative flex w-full flex-col justify-center gap-2 md:flex-row">
        <Form {...form}>
          <form
            className="h-[678.5px] w-full"
            autoComplete="off"
            onSubmit={form.handleSubmit(createOnSubmit)}
          >
            {referralTokens.isLoading && (
              <Skeleton className="absolute top-0 z-10 h-full  w-full opacity-100" />
            )}
            <Card className="m-auto flex h-full w-full flex-col">
              <CardHeader className=" py-5">
                <CardTitle>Referral Token Accounts</CardTitle>
                <CardDescription>
                  Select new token accounts that you would like to earn fees
                  when using Swap + Trigger APIs.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-6 pt-4 dark:bg-[#101828]">
                <TokenInputField
                  control={form.control}
                  tokenInfoMap={tokenInfos.data?.tokenInfoMap || new Map()}
                  tokenInfos={tokenInfos.data?.tokenInfos || []}
                  existingTokenMints={existingReferralTokenMints}
                />
                <Separator />
                <SelectedCount control={form.control} />
              </CardContent>
              <CardFooter className="flex justify-end py-3">
                <Button type="submit">Create</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
        {tableData.length > 0 && (
          <Card className="flex h-[678.5px] w-full flex-col">
            <CardHeader>
              <CardTitle>My Token Accounts</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 rounded-b-lg px-3 pt-2 dark:bg-[#101828]">
              <TokenList data={existingTokenInfos} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const SelectedCount: React.FC<{
  control: Control<FormValues>;
}> = ({ control }) => {
  const tokens = useWatch({ control, name: "tokens" });

  return <div className="text-right text-sm">{tokens.size} selected</div>;
};

const PAIR_ROW_HEIGHT = 40;

const TokenInputField: React.FC<{
  control: Control<FormValues>;
  tokenInfoMap: TokenInfoMap;
  tokenInfos: TokenInfo[]; // sorted by jup volume from their api
  existingTokenMints: Set<string>;
}> = ({ control, tokenInfos, existingTokenMints }) => {
  const { theme } = useTheme();
  const [searchValue, setSearchValue] = React.useState("");

  const listRef = React.createRef<FixedSizeList>();

  const fileteredTokenInfos = React.useMemo(() => {
    return tokenInfos.filter(
      (tokenInfo) => !existingTokenMints.has(tokenInfo.address),
    );
  }, [tokenInfos, existingTokenMints]);

  const [searchResults, setSearchResults] =
    React.useState<TokenInfo[]>(fileteredTokenInfos);

  // Arrow navigations
  const { itemsRef, keyboardIndex, setFocusIndex } = useSearchArrowNavigation({
    items: searchResults || [],
    defaultIndex: 0,
    key: searchValue,
  });

  const normalizedTokenInfos = React.useMemo(
    () =>
      fileteredTokenInfos.map((tokenInfo) => {
        return normalizeTokenInfo(tokenInfo);
      }) as NormalizedTokenInfo[],
    [fileteredTokenInfos],
  );

  React.useEffect(() => {
    // Search by token address
    if (searchValue.length >= 32 && searchValue.length <= 48) {
      const foundToken = startAddressSearch(normalizedTokenInfos, searchValue);
      if (foundToken) {
        setSearchResults([foundToken.token]);
        return;
      }
    }

    if (searchValue.length === 0) {
      setSearchResults(fileteredTokenInfos);
      return;
    }
    // keep this as promise to not block main thread
    startSearch(normalizedTokenInfos, searchValue).then((result) => {
      setSearchResults(result);
    });
  }, [normalizedTokenInfos, searchValue, fileteredTokenInfos]);

  React.useEffect(() => {
    listRef?.current?.scrollToItem(keyboardIndex);
  }, [keyboardIndex, listRef]);

  return (
    <FormField
      control={control}
      name="tokens"
      render={({ field }) => {
        const onSelect = (tokenInfo: TokenInfo) => {
          if (field.value.has(tokenInfo.address)) {
            field.value.delete(tokenInfo.address);
          } else {
            field.value.add(tokenInfo.address);
          }
          field.onChange(new Set(field.value));
        };
        return (
          <FormItem className="flex h-full flex-col">
            <FormControl></FormControl>
            <FormMessage />
            <Input
              // className="dark:bg-[#1D2939]"
              name="search"
              placeholder="Token Address / Symbol"
              autoComplete="false"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
            />

            <div className="flex-1">
              <div className="h-full">
                {searchResults.length > 0 && (
                  <AutoSizer>
                    {({ height = 0, width = 0 }) => {
                      return (
                        <FixedSizeList
                          ref={listRef}
                          height={height}
                          itemCount={searchResults.length}
                          itemSize={PAIR_ROW_HEIGHT}
                          width={width - 2} // -2 for scrollbar
                          itemData={{
                            searchResults,
                            itemsRef,
                            keyboardIndex,
                            setFocusIndex,
                            onSelect,
                            getIsSelected: (tokenInfo: TokenInfo) => {
                              return field.value.has(tokenInfo.address);
                            },
                          }}
                          className={cn(
                            "mr-1 min-h-[12rem] overflow-y-scroll px-5",
                            `webkit-scrollbar ${
                              theme === "dark" ? "webkit-scrollbar-dark" : ""
                            }`,
                          )}
                        >
                          {rowRenderer}
                        </FixedSizeList>
                      );
                    }}
                  </AutoSizer>
                )}
              </div>
            </div>
          </FormItem>
        );
      }}
    />
  );
};

const rowRenderer = React.memo(function Row(props: ListChildComponentProps) {
  const { data, index, style } = props;
  const item = data.searchResults[index];

  return (
    <PairRow
      key={item.address}
      item={item}
      index={index}
      style={style}
      onSelect={data.onSelect}
      getIsSelected={data.getIsSelected}
      keyboardRefs={data.itemsRef}
      isKeyboardFocused={index === data.keyboardIndex}
      onMouseEnter={() => data.setFocusIndex(index)}
    />
  );
}, areEqual);

interface IPairRow {
  item: TokenInfo;
  index: number;
  style: React.CSSProperties;
  onSelect(item: TokenInfo): void;
  getIsSelected(item: TokenInfo): boolean;
  isKeyboardFocused: boolean;
  onMouseEnter(): void;
  keyboardRefs: React.MutableRefObject<React.RefObject<HTMLElement>[]>;
}

const PairRow = ({
  item,
  index,
  style,
  onSelect,
  getIsSelected,
  isKeyboardFocused,
  onMouseEnter,
  keyboardRefs,
}: IPairRow) => {
  const ref = React.createRef<HTMLLIElement>();

  const isSelected = React.useMemo(() => {
    return getIsSelected(item);
  }, [getIsSelected, item]);

  const onClick = React.useCallback(() => {
    onSelect(item);
  }, [onSelect, item]);

  const handler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Enter" && isKeyboardFocused) {
        onClick();
        e.preventDefault();
      }
    },
    [onClick, isKeyboardFocused],
  );
  React.useMemo(() => {
    keyboardRefs.current[index] = ref;
  }, [keyboardRefs, index, ref]);
  useReactiveEventListener("keydown", handler);

  return (
    <li
      className={`flex w-full cursor-pointer list-none items-center rounded px-5 py-1`}
      style={{ maxHeight: PAIR_ROW_HEIGHT, height: PAIR_ROW_HEIGHT, ...style }}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      translate="no"
    >
      <div
        className={
          isKeyboardFocused
            ? "absolute left-0 top-0 h-full w-full bg-slate-800 opacity-20 dark:bg-slate-500"
            : ""
        }
      />

      <div className="flex w-full items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="h-6 w-6 rounded-full bg-gray-200">
            <TokenIcon info={item} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex space-x-2">
            <p className="truncate text-sm font-medium">{item.symbol}</p>
            <div className="z-10 self-end" onClick={(e) => e.stopPropagation()}>
              <TokenLink tokenInfo={item} />
            </div>
          </div>
        </div>
        {isSelected && <Check size={14} />}
      </div>
    </li>
  );
};

export default CreateTokenAccounts;

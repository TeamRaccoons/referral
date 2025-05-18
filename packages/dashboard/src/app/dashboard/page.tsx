"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReferralProvider, type ReferralAccount } from "@jup-ag/referral-sdk";
import { PublicKey } from "@solana/web3.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Decimal } from "decimal.js";
import { Dot, FileText, Github } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import PageTitle from "@/components/page-title";
import {
  TokenDataTable,
  TokenDataTableRowData,
} from "@/components/token-data-table";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Wallet } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletButton } from "@/components/wallet-button";
import { useConnection, useWallet } from "@/components/wallet-provider";
import { useReferralTokens } from "@/hooks/useReferralTokens";
import { useSendAllTransactions } from "@/hooks/useSendAllTransactions";
import { useSendTransaction } from "@/hooks/useSendTransaction";
import { useTokenInfos } from "@/hooks/useTokenInfo";
import { useGetTokenPrices } from "@/hooks/useTokenPrice";
import { useTopTokens } from "@/hooks/useTopTokens";
import { useTotalUnclaimed } from "@/hooks/useTotalUnclaimed";
import { JUPITER_PROJECT } from "@/lib/constants";
import { getReferralAccounts } from "@/lib/referral";
import { cn, nonNullable } from "@/lib/utils";

interface IDashboardProps {
  params: { referral: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const Dashboard: React.FunctionComponent<IDashboardProps> = ({
  params: { referral },
}) => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const referralProvider = React.useMemo(() => {
    return new ReferralProvider(connection);
  }, [connection]);

  const {
    isLoading,
    data: referrerAccounts,
    refetch,
  } = useQuery({
    queryKey: ["referrer", publicKey, referral],
    queryFn: async () => {
      // spoof account birdeye wallet
      return referral
        ? [
            {
              publicKey: new PublicKey(referral),
              account: await referralProvider.getReferralAccount(
                new PublicKey(referral),
              ),
            },
          ]
        : getReferralAccounts(referralProvider, publicKey!);
    },
    enabled: Boolean(publicKey),
  });

  if (!connected) {
    return (
      <div className="m-auto flex max-w-[350px] flex-col items-center text-center">
        <Wallet className="fill-black text-black" />
        <div className="py-6">
          <h2 className="text-2xl font-semibold">Referral Token Accounts</h2>
          <p className="text-sm/5 font-medium dark:text-[#667085]">
            Connect your wallet to interact with your referral token accounts.
          </p>
        </div>
        <WalletButton />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="m-auto h-[300px] w-[300px] max-w-[350px]">
        <Skeleton className="h-full w-full"></Skeleton>
      </Card>
    );
  }

  const hasReferrerAccount = referrerAccounts && referrerAccounts.length > 0;

  if (!hasReferrerAccount) {
    return (
      <CreateForm
        referralProvider={referralProvider}
        onSuccess={() => {
          refetch();
        }}
      />
    );
  }
  return (
    <TokenTable
      referralProvider={referralProvider}
      referralPubkey={referrerAccounts[0].publicKey}
      referralAccount={referrerAccounts[0].account}
    />
  );
};

export default Dashboard;

const createFormSchema = z.object({
  projectName: z
    .string()
    .min(2, "Name must contain at least 2 character(s)")
    .max(50, "Name too long"),
});

interface Props {
  referralProvider: ReferralProvider;
}

const CreateForm: React.FC<Props & { onSuccess: () => void }> = ({
  referralProvider,
  onSuccess,
}) => {
  const { wallet } = useWallet();
  const form = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      projectName: "",
    },
  });

  const sendTransaction = useSendTransaction();
  const createOnSubmit = async (values: z.infer<typeof createFormSchema>) => {
    if (!wallet || !wallet.adapter.publicKey) return;

    let { tx } = await referralProvider.initializeReferralAccountWithName({
      name: values.projectName,
      partnerPubKey: wallet.adapter.publicKey,
      payerPubKey: wallet.adapter.publicKey,
      projectPubKey: JUPITER_PROJECT,
    });
    try {
      const txid = await sendTransaction(tx);
      console.log({ txid });
      onSuccess();
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <Form {...form}>
      <form
        className="m-auto w-[350px]"
        onSubmit={form.handleSubmit(createOnSubmit)}
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Referral Account</CardTitle>
            <CardDescription>Use your project name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g: Birdeye, Meteora, Solend"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant={"default"}>Create</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

const TokenTable: React.FC<
  Props & { referralPubkey: PublicKey; referralAccount: ReferralAccount }
> = ({ referralProvider, referralPubkey, referralAccount }) => {
  const tokenInfosMap = useTokenInfos();

  const router = useRouter();

  const topTokens = useTopTokens();

  const referralTokens = useReferralTokens(referralProvider, referralPubkey);

  const hasTokens =
    referralTokens.data?.token2022Accounts.length ||
    referralTokens.data?.tokenAccounts.length;

  const isLoading =
    referralTokens.isLoading || tokenInfosMap.isLoading || topTokens.isLoading;

  const tokens = React.useMemo(() => {
    return [
      ...(referralTokens.data?.tokenAccounts || []),
      ...(referralTokens.data?.token2022Accounts || []),
    ].map((a) => a.account.mint.toString());
  }, [referralTokens]);

  const pricesHash = useGetTokenPrices(tokens);

  const data: TokenDataTableRowData[] = React.useMemo(() => {
    if (!referralTokens.data || !tokenInfosMap.data) {
      return [];
    }
    const { tokenAccounts, token2022Accounts } = referralTokens.data;
    const mintToTokeninfoMap = tokenInfosMap.data.tokenInfoMap;

    return tokenAccounts
      .concat(token2022Accounts)
      .map(({ account, pubkey }) => {
        let mint = account.mint.toBase58();
        let tokenInfo = mintToTokeninfoMap.get(mint);

        if (!tokenInfo) {
          console.error("Failed to get token info");
          return;
        }

        const amount = new Decimal(account.amount.toString()).div(
          10 ** tokenInfo.decimals,
        );
        const price = new Decimal(pricesHash[mint]?.price || 0);
        return {
          tokenName: `${tokenInfo.name} (${tokenInfo.symbol})`,
          mint,
          price,
          amount,
          value: amount.mul(price),
          address: pubkey.toBase58(),
        };
      })
      .filter(nonNullable);
  }, [referralTokens, tokenInfosMap, pricesHash]);

  // Only withdraw tokens with value >= 1
  const withdrawalableTokenAccounts = React.useMemo(() => {
    const addressWithValue = data
      .filter((item) => item.value.gte(new Decimal(1)))
      .map((item) => new PublicKey(item.address));

    return addressWithValue;
  }, [data]);

  React.useMemo(() => {
    const url = `/dashboard/${referralPubkey.toString()}/create-token-accounts`;
    if (!hasTokens && !referralTokens.isLoading) {
      router.push(url);
    } else {
      router.prefetch(url);
    }
  }, [referralTokens.isLoading, hasTokens, referralPubkey, router]);

  return isLoading ? (
    <Card className="m-auto w-full max-w-lg">
      <Skeleton className="h-[300px] w-full"></Skeleton>
    </Card>
  ) : (
    <>
      <DashboardHeader
        withdrawalableTokenAddress={withdrawalableTokenAccounts}
        referralProvider={referralProvider}
        referralPubkey={referralPubkey}
        referralAccount={referralAccount}
      />
      <Card className="flex min-h-[700px] w-full flex-col">
        <CardHeader>
          <CardTitle className="mb-3 flex justify-between">
            <span>Swap + Trigger Referral Token Accounts</span>
            <Link
              href={`/dashboard/${referralPubkey.toString()}/create-token-accounts`}
            >
              <Button>Create Token Accounts</Button>
            </Link>
          </CardTitle>
          <CardDescription>
            <p className="mb-2">
              Token accounts must be created to collect fees in their
              corresponding tokens. Only tokens in the Jupiter strict list are
              displayed.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-800/30">
              <Github size={14} />
              <span>
                To harvest unknown tokens use the{" "}
                <a
                  href="https://github.com/TeamRaccoons/referral/tree/main/example"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SDK Example
                </a>
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 rounded-b-lg py-4 dark:bg-[#101828]">
          <TokenDataTable
            data={data}
            referralProvider={referralProvider}
            referralPubkey={referralPubkey}
          />
        </CardContent>
      </Card>
    </>
  );
};

const DashboardHeader: React.FC<{
  withdrawalableTokenAddress: PublicKey[];
  referralProvider: ReferralProvider;
  referralPubkey: PublicKey;
  referralAccount: ReferralAccount;
}> = ({
  withdrawalableTokenAddress,
  referralProvider,
  referralPubkey,
  referralAccount,
}) => {
  const [isClaiming, setIsClaiming] = React.useState(false);
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const sendAllTransactions = useSendAllTransactions();

  const referralTokens = useReferralTokens(referralProvider, referralPubkey);

  const tokensWithAmount = React.useMemo(() => {
    return [
      ...(referralTokens.data?.tokenAccounts || []).filter(
        (item) => item.account.amount > 0,
      ),
      ...(referralTokens.data?.token2022Accounts || []).filter(
        (item) => item.account.amount > 0,
      ),
    ];
  }, [referralTokens.data]);

  const { isLoading: isTotalUnclaimedLoading, totalUnclaimed } =
    useTotalUnclaimed(tokensWithAmount);

  const [protocolFeePct, projectFeePct] = React.useMemo(() => {
    const shareBpsPct = referralAccount.shareBps / 100;

    return [shareBpsPct, 100 - shareBpsPct];
  }, [referralAccount]);

  const claimTokens = React.useCallback(async () => {
    if (!wallet.publicKey) return;

    try {
      setIsClaiming(true);

      const txsCompiled = await referralProvider.claimPartially({
        payerPubKey: wallet.publicKey,
        referralAccountPubKey: referralPubkey,
        withdrawalableTokenAddress,
      });
      setIsClaiming(false);

      await sendAllTransactions(txsCompiled);
      queryClient.refetchQueries({
        queryKey: ["tokens"],
      });
    } finally {
      setIsClaiming(false);
    }
  }, [
    withdrawalableTokenAddress,
    referralPubkey,
    wallet,
    referralProvider,
    sendAllTransactions,
    queryClient,
  ]);

  return (
    <div className="w-full">
      <PageTitle
        title="Swap + Trigger Dashboard"
        referralPubkey={referralPubkey.toBase58()}
      />

      <div className="my-2">
        <Card className="grid gap-2 md:grid-cols-2 lg:grid-cols-2">
          <CardContent className="border-b border-[#344054] p-8 md:border-b-0 md:border-r">
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm dark:text-[#E8F9FF]/50">
                <span className="flex items-center gap-1">
                  <Dot /> Fee to protocol
                </span>
                <span>{protocolFeePct}%</span>
              </div>
              <div className="flex items-center justify-between text-sm dark:text-[#E8F9FF]/50">
                <span className="flex items-center gap-1">
                  <Dot /> Fee to Jupiter
                </span>
                <span>{projectFeePct}%</span>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
              <h3 className="mb-3 text-sm font-semibold tracking-tight">
                How to use Referral Account in Swap + Trigger APIs?
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Link
                  href="https://dev.jup.ag/docs/swap-api/add-fees-to-swap"
                  target="_blank"
                  className="text-primary hover:bg-primary dark:hover:bg-primary/90 flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-2.5 shadow-sm transition-all hover:text-white dark:bg-gray-700"
                >
                  <FileText size={16} className="flex-shrink-0" />
                  <span className="font-medium">Documentation</span>
                </Link>
                <Link
                  href="https://github.com/Jupiter-DevRel/typescript-examples/tree/main/swap/quote-build-send-with-referral-accounts"
                  target="_blank"
                  className="text-primary hover:bg-primary dark:hover:bg-primary/90 flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-2.5 shadow-sm transition-all hover:text-white dark:bg-gray-700"
                >
                  <Github size={16} className="flex-shrink-0" />
                  <span className="font-medium">TypeScript Example</span>
                </Link>
              </div>
            </div>
          </CardContent>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#98A2B3]">
                Unclaimed Fee
              </p>
              {isTotalUnclaimedLoading ? (
                <Skeleton className="h-8 w-8" />
              ) : (
                <div className="text-3xl font-bold">
                  ${totalUnclaimed.toFixed(2)}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={claimTokens}
                disabled={withdrawalableTokenAddress.length === 0}
                loading={isClaiming}
              >
                Claim
              </Button>
            </div>

            <div className="mt-2 flex justify-end text-right text-xs">
              <div className="max-w-[300px]">
                Only stricts tokens with value more than $1 with be claimed.
                Please use the SDK to claim other tokens.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

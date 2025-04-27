"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useWallet } from "@/components/wallet-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: true,
    },
  },
});

export default function Layout(props: { children: ReactNode }) {
  const wallet = useWallet();

  useEffect(() => {
    if (!wallet.connected) {
      queryClient.clear();
    }
  }, [wallet.connected]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex w-full max-w-screen-lg flex-1 flex-col items-center p-4">
        {props.children}
      </div>
    </QueryClientProvider>
  );
}

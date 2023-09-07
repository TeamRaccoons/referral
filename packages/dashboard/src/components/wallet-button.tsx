"use client";

import * as React from "react";
import { WalletModalButton } from "@solana/wallet-adapter-react-ui";

import { useWallet } from "@/components/wallet-provider";
import { cn, shortenAddress } from "@/lib/utils";
import { Button, buttonVariants } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface IWalletButtonProps {}

export const WalletButton: React.FunctionComponent<IWalletButtonProps> = (
  props,
) => {
  const { connected, publicKey, disconnect } = useWallet();

  if (connected && publicKey) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="">
            <span className="">{shortenAddress(publicKey.toBase58())}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              disconnect();
            }}
          >
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <WalletModalButton
      style={{
        backgroundColor: "#2E90FA",
        padding: "10px 18px",
        borderRadius: "8px",
      }}
    >
      Connect
    </WalletModalButton>
  );
};

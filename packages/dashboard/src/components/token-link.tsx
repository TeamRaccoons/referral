import { forwardRef } from "react";
import { ExternalLink } from "lucide-react";

import { TokenInfo } from "@/hooks/useTokenInfo";
import { shortenAddress } from "@/lib/utils";

interface TokenLinkProps {
  tokenInfo: TokenInfo;
}

const TokenLink = forwardRef<HTMLAnchorElement, TokenLinkProps>(
  function TokenLink({ tokenInfo }, ref) {
    return (
      <a
        ref={ref}
        target="_blank"
        rel="noreferrer"
        className="flex cursor-pointer items-center space-x-1 rounded bg-slate-200 px-2 py-0.5 dark:bg-slate-600"
        href={`https://solscan.io/account/${tokenInfo.address}`}
      >
        <div className="text-xs">{shortenAddress(tokenInfo.address)}</div>
        <ExternalLink width={10} height={10} />
      </a>
    );
  },
);

export default TokenLink;

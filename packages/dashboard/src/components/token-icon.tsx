import * as React from "react";
import Image from "next/image";
import UnknownCoin from "public/unknown.svg";

import { TokenInfo } from "@/hooks/useTokenInfo";
// @ts-ignore
import { whitelistedImageUrls } from "../../whitelistedImageUrls.mjs";

interface ITokenIconProps {
  info: TokenInfo | undefined;
  width?: number;
  height?: number;
}

const TokenIcon: React.FunctionComponent<ITokenIconProps> = ({
  info,
  width = 32,
  height = 32,
}) => {
  const [hasError, setHasError] = React.useState(false);
  const imageUrl = React.useMemo(() => {
    try {
      return info?.logoURI ? new URL(info.logoURI) : undefined;
    } catch (error) {
      return undefined;
    }
  }, [info?.logoURI]);

  let ImageNode = React.useMemo(() => {
    if (!imageUrl || !info || hasError) {
      return (
        <Image alt="unknown" src={UnknownCoin} width={width} height={height} />
      );
    }

    // @ts-ignore
    if (whitelistedImageUrls.includes(imageUrl.host)) {
      return (
        <Image
          priority={true}
          className="rounded-full"
          alt={info.symbol}
          src={imageUrl.href}
          width={width}
          height={height}
          onError={() => {
            setHasError(true);
          }}
        />
      );
    }
    return (
      // eslint-disable-next-line
      <img
        width={width}
        height={height}
        className="rounded-full"
        src={info.logoURI || ""}
        alt={info.symbol}
        onError={() => {
          setHasError(true);
        }}
      />
    );
  }, [info, hasError, imageUrl, width, height]);

  // not in the whitelisted domains, so we just use img tag
  return <span className="relative">{ImageNode}</span>;
};

export default TokenIcon;

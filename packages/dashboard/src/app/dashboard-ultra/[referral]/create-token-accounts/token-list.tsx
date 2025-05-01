import * as React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { areEqual, FixedSizeList, ListChildComponentProps } from "react-window";

import { TokenInfo } from "@/hooks/useTokenInfo";
import { cn } from "@/lib/utils";
import TokenIcon from "../../../../components/token-icon";
import TokenLink from "../../../../components/token-link";
import { Separator } from "../../../../components/ui/separator";

interface ITokenListProps {
  data: TokenInfo[];
}
const ROW_HEIGHT = 40;

const TokenList: React.FunctionComponent<ITokenListProps> = ({ data }) => {
  const listRef = React.createRef<FixedSizeList>();

  return (
    <AutoSizer>
      {({ height = 0, width = 0 }) => {
        return (
          <FixedSizeList
            ref={listRef}
            height={height}
            itemCount={data.length}
            itemSize={ROW_HEIGHT}
            width={width - 2} // -2 for scrollbar
            itemData={{
              data,
            }}
            className={cn("mr-1 min-h-[12rem] overflow-y-scroll px-5")}
          >
            {rowRenderer}
          </FixedSizeList>
        );
      }}
    </AutoSizer>
  );
};

const rowRenderer = React.memo(function Row(
  props: ListChildComponentProps<{ data: TokenInfo[] }>,
) {
  const { data, index, style } = props;
  const token = data.data[index];

  return (
    <TokenListItem
      idx={index}
      key={token.address}
      token={token}
      style={style}
    />
  );
},
areEqual);

const TokenListItem: React.FC<{
  idx: number;
  token: TokenInfo;
  style: React.CSSProperties;
}> = ({ token, idx, ...props }) => (
  <div {...props} className={"h-10"}>
    {idx === 0 && <Separator />}
    <div className="py-2">
      <div className="flex items-center gap-3 align-middle text-sm">
        <TokenIcon height={24} width={24} info={token} />
        <p>{token.symbol}</p>
        <div className="z-10 self-end" onClick={(e) => e.stopPropagation()}>
          <TokenLink tokenInfo={token} />
        </div>
      </div>
    </div>
    <Separator />
  </div>
);

export default TokenList;

import React from "react";
import { ReferralProvider } from "@jup-ag/referral-sdk";
import { PublicKey } from "@solana/web3.js";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import Decimal from "decimal.js";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { useConnection, useWallet } from "@/components/wallet-provider";
import { useSendTransaction } from "@/hooks/useSendTransaction";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useToast } from "./ui/use-toast";

export type TokenDataTableRowData = {
  tokenName: string;
  mint: string;
  address: string;
  amount: Decimal;
  price: Decimal;
};

interface Props {
  referralProvider: ReferralProvider;
  disableActions?: boolean;
}

export const TokenDataTable: React.FC<
  { data: TokenDataTableRowData[]; referralPubkey: PublicKey } & Props
> = ({ data, referralProvider, referralPubkey, disableActions }) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      desc: true,
      id: "value",
    },
  ]);
  const [rowSelection, setRowSelection] = React.useState({});
  const sendTransaction = useSendTransaction();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();

  const columns = React.useMemo(
    () =>
      [
        {
          accessorKey: "tokenName",
          cell: ({ row }) => <div>{row.getValue("tokenName")}</div>,
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => {
                  if (column.getIsSorted() === "desc") {
                    column.clearSorting();
                  } else {
                    column.toggleSorting(column.getIsSorted() === "asc");
                  }
                }}
              >
                Token
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            );
          },
        },
        {
          id: "value",
          accessorKey: "value",
          sortDescFirst: false,
          header: ({ column }) => {
            return (
              <div className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (column.getIsSorted() === "desc") {
                      column.clearSorting();
                    } else {
                      column.toggleSorting(column.getIsSorted() === "asc");
                    }
                  }}
                >
                  Value
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            );
          },
          sortingFn: (a, b) => {
            const aValue: Decimal = a.getValue("value");
            const bValue: Decimal = b.getValue("value");

            return aValue.cmp(bValue);
          },
          cell: (info) => {
            const value = info.getValue<Decimal>();

            return (
              <div className="text-right font-medium">${value.toFixed(2)}</div>
            );
          },
        },
        {
          id: "price",
          accessorKey: "price",
          sortDescFirst: false,
          header: ({ column }) => {
            return (
              <div className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (column.getIsSorted() === "desc") {
                      column.clearSorting();
                    } else {
                      column.toggleSorting(column.getIsSorted() === "asc");
                    }
                  }}
                >
                  Price
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            );
          },
          sortingFn: (a, b) => {
            const aPrice: Decimal = a.getValue("price");
            const bPrice: Decimal = b.getValue("price");

            return aPrice.cmp(bPrice);
          },
          cell: (info) => {
            const price = info.getValue<Decimal>();

            return (
              <div className="text-right font-medium">${price.toFixed(2)}</div>
            );
          },
        },
        {
          accessorKey: "amount",
          header: ({ column }) => {
            return (
              <div className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (column.getIsSorted() === "desc") {
                      column.clearSorting();
                    } else {
                      column.toggleSorting(column.getIsSorted() === "asc");
                    }
                  }}
                >
                  Amount
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
            );
          },
          sortingFn: (a, b) => {
            const aAmount: Decimal = a.getValue("amount");
            const bAmount: Decimal = b.getValue("amount");

            return aAmount.cmp(bAmount);
          },
          cell: ({ row }) => {
            const amount: Decimal = row.getValue("amount");

            return (
              <div className="text-right font-medium">{amount.toString()}</div>
            );
          },
        },

        {
          id: "actions",
          enableHiding: false,
          cell: ({ row }) => {
            const data = row.original as TokenDataTableRowData;

            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {!disableActions && (
                    <DropdownMenuItem
                      onClick={async () => {
                        if (!wallet.publicKey) {
                          toast({
                            title: "No wallet connected",
                            variant: "destructive",
                          });
                          return;
                        }
                        const mint = new PublicKey(data.mint);
                        const tx = await referralProvider.claim({
                          mint,
                          payerPubKey: wallet.publicKey,
                          referralAccountPubKey: referralPubkey,
                        });
                        await sendTransaction(tx);
                      }}
                    >
                      Claim
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(data.address)}
                  >
                    Copy Token Address
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ] as ColumnDef<RowData>[],
    [
      referralProvider,
      referralPubkey,
      sendTransaction,
      disableActions,
      toast,
      wallet.publicKey,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 7,
        pageIndex: 0,
      },
      sorting: [
        {
          id: "value",
          desc: true,
        },
      ],
    },
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

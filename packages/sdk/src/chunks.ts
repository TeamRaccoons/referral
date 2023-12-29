import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";

export function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply(0, new Array(Math.ceil(array.length / size))).map(
    (_: any, index: number) => array.slice(index * size, (index + 1) * size),
  );
}

export async function chunkedGetMultipleAccountInfos(
  connection: Connection,
  pks: PublicKey[],
  chunkSize: number = 100,
): Promise<(AccountInfo<Buffer> | null)[]> {
  return (
    await Promise.all(
      chunks(pks, chunkSize).map((chunk) =>
        connection.getMultipleAccountsInfo(chunk),
      ),
    )
  ).flat();
}

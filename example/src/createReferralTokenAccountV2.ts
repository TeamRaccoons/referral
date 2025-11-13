import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

// import { ReferralProvider } from "@jup-ag/referral-sdk";
import { ReferralProvider } from "../../packages/sdk/src/referral";

const connection = new Connection(process.env.RPC_URL || "");
const keypair = Keypair.fromSecretKey(bs58.decode(process.env.KEYPAIR || ""));
const provider = new ReferralProvider(connection);

// Input this from the previous step.
const REFERRAL_ACCOUNT_PUBKEY = new PublicKey(
  "2a8fBUm3gcojf9LjGq5qk3WBe7LspPrwyftXe16cZbLH",
);

(async () => {
  const mints = [
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", //USDT
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", //USDC
    "So11111111111111111111111111111111111111112", //wSOL
    // "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", //JUP
  ];
  // 108, that's a lot. At ~0.5 USD per ATA (at current SOL price), that's ~50 USD. Ensure wallet has sufficient funds.
  // const mints = [
  //   "So11111111111111111111111111111111111111112",
  //   "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  //   "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  //   "7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT",
  //   "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
  //   "A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM",
  //   "Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1",
  //   "5goWRao6a3yNC4d6UjMdQxonkCMvKBwdpubU3qhfcdf1",
  //   "EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o",
  //   "FCqfQSujuPxy6V42UvafBhsysWtEq1vhjfMN1PUbgaxA",
  //   "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
  //   "DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT",
  //   "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
  //   "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA",
  //   "9zNQRsGLjNKwCUU5Gq5LR8beUCPzQMVMqKAi3SSZh54u",
  //   "So111DzVTTNpDq81EbeyKZMi4SkhU9yekqB8xmMpqzA",
  //   "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  //   "9EaLkQrbjmbbuZG9Wdpo8qfNUEjHATJFSycEmw6f1rGX",
  //   "BdUJucPJyjkHxLMv6ipKNUhSeY3DWrVtgxAES1iSBAov",
  //   "fpSoL8EJ7UA5yJxFKWk1MFiWi35w8CbH36G5B9d7DsV",
  //   "Fi5GayacZzUrfaCRCJtBz2vSYkGF56xjgCceZx5SbXwq",
  //   "pathdXw4He1Xk3eX84pDdDZnGKEme3GivBamGCVPZ5a",
  //   "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
  //   "BgYgFYq4A9a2o5S1QbWkmYVFBh7LBQL8YvugdhieFg38",
  //   "phaseZSfPxTDBpiVb96H4XFSD8xHeHxZre5HerehBJG",
  //   "BANXyWgPpa519e2MtQF1ecRbKYKKDMXPF1dyBxUq9NQG",
  //   "iceSdwqztAQFuH6En49HWwMxwthKMnGzLFQcMN3Bqhj",
  //   "fmSoLKzBY6h9b5RQ67UVs7xE3Ym6mx2ChpPxHdoaVho",
  //   "AxM7a5HNmRNHbND6h5ZMSsU8n3NLa1tskoN6m5mAgVvL",
  //   "MLLWWq9TLHK3oQznWqwPyqD7kH4LXTHSKXK4yLz7LjD",
  //   "SnKAf8aNjeYz8pY8itYn3VxFhT6Q8WNdPwy17s9USgC",
  //   "uPtSoL2qszk4SuPHNE2zqk1gDtqCq21ZE1yZCqvFTqq",
  //   "pWrSoLAhue6jUxUkbWgmEy5rD9VJzkFmvfTDV5KgNuu",
  //   "suPer8CPwxoJPQ7zksGMwFvjBQhjAHwUMmPV4FVatBw",
  //   "jucy5XJ76pHVvtPZb5TKRcGQExkwit2P5s4vY8UzmpC",
  //   "BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs",
  //   "Dso1bDeDjCQxTrWHqUUi63oBvV7Mdm6WaobLbQ7gnPQ",
  //   "Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h",
  //   "picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX",
  //   "GRJQtWwdJmp5LLpy8JWjPgn5FnLyqSJGNhn5ZnCTFUwM",
  //   "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
  //   "strng7mqqc1MBJJV6vMzYbEqnwVGvKKGKedeCvtktWA",
  //   "LnTRntk2kTfWEY6cVB8K9649pgJbt6dJLS1Ns1GZCWg",
  //   "st8QujHLPsX3d6HG9uQg9kJ91jFxUgruwsb1hyYXSNd",
  //   "pumpkinsEq8xENVZE6QgTS93EN4r9iKvNxNALS1ooyp",
  //   "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A",
  //   "LSoLi4A4Pk4i8DPFYcfHziRdEbH9otvSJcSrkMVq99c",
  //   "CgnTSoL3DgY9SFHxcLj6CgCgKKoTBr6tp4CPAEWy25DE",
  //   "LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X",
  //   "vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7",
  //   "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
  //   "GEJpt3Wjmr628FqXxTgxMce1pLntcPV4uFi8ksxMyPQh",
  //   "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  //   "7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn",
  //   "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp",
  //   "Zippybh3S5xYYam2nvL6hVJKz1got6ShgV4DyD1XQYF",
  //   "edge86g9cVz87xcpKpy3J77vbp4wYd9idEV562CCntt",
  //   "ELSoL1owwMWQ9foMsutweCsMKbTPVBD9pFqxQGidTaMC",
  //   "aeroXvCT6tjGVNyTvZy86tFDwE4sYsKCh7FbNDcrcxF",
  //   "ThUGsoLWtoTCfb24AmQTKDVjTTUBbNrUrozupJeyPsy",
  //   "WensoLXxZJnev2YvihHFchn1dVVFnFLYvgomXWvvwRu",
  //   "camaK1kryp4KJ2jS1HDiZuxmK7S6dyEtr9DA7NsuAAB",
  //   "2LuXDpkn7ZWMqufwgUv7ZisggGkSE5FpeHCHBsRgLg3m",
  //   "D1gittVxgtszzY4fMwiTfM4Hp7uL5Tdi1S9LYaepAUUm",
  //   "3bfv2scCdbvumVBc3Sar5QhYXx7Ecsi8EFF2akjxe329",
  //   "DLGToUUnqy9hXxpJTm5VaiBKqnw9Zt1qzvrpwKwUmuuZ",
  //   "DUAL6T9pATmQUFPYmrWq2BkkGdRxLtERySGScYmbHMER",
  //   "haSo1Vz5aTsqEnz8nisfnEsipvbAAWpgzRDh2WhhMEh",
  //   "HausGKcq9G9zM3azwNmgZyzUvYeeqR8h8663PmZpxuDj",
  //   "KUMAgSzADhUmwXwNiUbNHYnMBnd89u4t9obZThJ4dqg",
  //   "nordEhq2BnR6weCyrdezNVk7TwC3Ej94znPZxdBnfLM",
  //   "PoLaRbHgtHnmeSohWQN83LkwA4xnQt91VUqL5hx5VTc",
  //   "EPCz5LK372vmvCkZH3HgSuGNKACJJwwxsofW6fypCPZL",
  //   "RSoLp7kddnNwvvvaz4b1isQy8vcqdSwXjgm1wXaMhD8",
  //   "spkyB5SzVaz2x3nNzSBuhpLSEF8otbRDbufc73fuLXg",
  //   "stkrHcjQGytQggswj3tCF77yriaJYYhrRxisRqe9AiZ",
  //   "B5GgNAZQDN8vPrQ15jPrXmJxVtManHLqHogj9B9i4zSs",
  //   "fuseYvhNJbSzdDByyTCrLcogsoNwAviB1WeewhbqgFc",
  //   "MangmsBgFqJhW4cLUR9LxfVgMboY1xAoP8UUBiWwwuY",
  //   "apySoLhdVa6QbvNyEjXCbET3FdUm9cCdEvYyjCU7icM",
  //   "StPsoHokZryePePFV8N7iXvfEmgUoJ87rivABX7gaW6",
  //   "uSo1ynGWS3qc2B1nN2MmEHN5cYaNbT7vJp87LtgkpV8",
  //   "gangqfNY8fA7eQY3tHyjrevxHCLnhKRrLGRwUMBR4y6",
  //   "eon5tgYNk5FjJUcBUcLno49t2GfpmWZDzJHeYkbh9Zo",
  //   "gSvP9zBJ33pX7W2finzAYJZp6Q9ipNAQ19xU9PrCirz",
  //   "Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B",
  //   "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm",
  //   "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
  //   "BNso1VUJnh4zcfpZa6986Ea66P6TCp59hvtNJ8b1X85",
  //   "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  //   "7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3",
  //   "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82",
  //   "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  //   "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
  //   "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
  //   "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  //   "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
  //   "9Ttyez3xiruyj6cqaR495hbBkJU6SUWdV6AmQ9MvbyyS",
  //   "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  //   "25hAyBQfoDhfWx9ay6rarbgvWGwDdNqcHsXS3jQ3mTDJ",
  //   "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
  //   "CLoUDKc4Ane7HeQcPpE3YHnznRxhMimJ4MyaUqyHFzAu",
  //   "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump",
  //   "GJtJuWD9qYcCkrwMBmtY1tpapV1sKfB2zUv9Q4aqpump",
  //   "5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp",
  //   "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  //   "61V8vBaqAGMpgDQi4JcAwo1dmBGHsyhzodcPqnEVpump",
  //   "3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y",
  // ];

  let idx = 0; // for nicer prints only.

  // create in parallel else slow af
  const ps = mints.map(async (mint) => {
    const { tx, tokenAccount } =
      await provider.initializeReferralTokenAccountV2({
        payerPubKey: keypair.publicKey,
        referralAccountPubKey: REFERRAL_ACCOUNT_PUBKEY,
        mint: new PublicKey(mint),
      });

    const referralTokenAccount = await connection.getAccountInfo(tokenAccount);

    if (!referralTokenAccount) {
      const txId = await sendAndConfirmTransaction(connection, tx, [keypair]);
      console.log(
        `[${++idx}/${
          mints.length
        }] referralTokenAccount ${tokenAccount.toBase58()} for mint ${mint} created in tx ${txId}`,
      );
    } else {
      console.log(
        `[${++idx}/${
          mints.length
        }] referralTokenAccount ${tokenAccount.toBase58()} for mint ${mint} already exists`,
      );
    }
  });
  await Promise.all(ps);
})();

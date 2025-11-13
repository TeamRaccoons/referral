# Referral Program

This Referral program is what Jupiter uses to power our referral system across all Jupiter programs. Anyone can also use this Referral program.

## Easy to Integrate

### How does it work?

In the Jupiter Swap program, anyone can append a referral token account that matches the output mint and set a percentage to receive a swap fee. Part of the swap fee goes to Jupiter, and part of the swap fee goes to the referral.

The referral token account is created using the Referral program. Hence, not all token accounts can be used. On the Jupiter Swap program, it has a simple check on it:

```rust
#[account(
    mut,
    token::authority = project_public_key, // The `Project` account, PDA of ["project", base]
)]
referral_token_account: Account<'info, TokenAccount>
```

So, only the referral token account with the `project` authority can be used as the `referral_token_account`.

### Protocol

For a protocol that wants to use this Referral program, you must create a `Project` by calling `initialize_project` with your chosen `base` key, `admin`, and project `name`. The `base` key is the key identifier of your project.

You can set a `default_share_bps` on the percentage you want to share with your referrer.

### Referrer

For referrers who want to get referral fees for protocols that integrate with the Referral program, they will have to first create their own `Referral` account by calling `initialize_referral_account` with the correct `project` account, the `referral_account`, and their own `partner` account. The `partner` account is the admin of this referral account.

Then, for each token mint they wish to receive the referral fee from, they must call `initialize_referral_token_account` to create the token account. That token account will be the `referral_token_account` that they use above.

## Dashboard

You can also check out the web dashboard here if you want to interact with the contract via browser: [https://referral.jup.ag/](https://referral.jup.ag/).

# JD new referral partner

```
RPC_URL='https://jupiter-backend.rpcpool.com/b70d1b98-a541-4cd8-9c44-de379f3d848d' KEYPAIR=SECRET pnpm run createReferralAccountWithName


```
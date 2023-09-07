# Referral Program

The motivation of this referral program is to make it easy for Solana protocols to have their referral programs.

The goal is to open source this project. We can build a nice dashboard that will manage, claim, and track these referral fees for both the protocols and the referrers.

We could charge on percentage (0.5% of all referral fees) or a fixed fees monthly.

## Easy to Integrate

One main thing we would like to achieve is easy integration for other protocols. It should only require 1 extra token account, which is the same as how OpenOrders referral works.

First, the project will need to create a project account first with the Referral program by calling `initialize_project`. With that, you will have your own project public key.

```
#[account(
    mut,
    token::authority = project_public_key
)]
referral_token_account: Account<'info, TokenAccount>
```

For referrer, they can create their own referral account by calling `initialize_referral_account`. For each token mint that they wish to receive the referral fee from,
they will need to call `initialize_referral_token_account` to create the token account. That token account will be the `referral_token_account` that they use above.

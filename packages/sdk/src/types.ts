import { IdlAccounts } from "@coral-xyz/anchor";

import type { Referral } from "./idl";

export type ReferralAccount = IdlAccounts<Referral>["referralAccount"];
export type Project = IdlAccounts<Referral>["project"];

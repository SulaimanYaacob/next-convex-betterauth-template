import { query } from "./_generated/server";
import { getAppUser, getCoinBalance } from "./authUsers";

// ECON-04: returns the real-time coin balance for the authenticated user.
// Balance = SUM of all coinLedger.amount rows for this user (append-only ledger).
// Returns null for guests or users without an app-user row.
// Identity is server-derived — never accept a userId argument (T-02-01 / T-02-02).
export const getBalance = query({
  args: {},
  handler: async (ctx): Promise<number | null> => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    return await getCoinBalance(ctx, appUser._id);
  },
});

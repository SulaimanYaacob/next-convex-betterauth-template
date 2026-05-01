import { query } from "./_generated/server";
import { betterAuthComponent } from "./auth";

// ECON-04: returns the real-time coin balance for the authenticated user.
// Balance = SUM of all coinLedger.amount rows for this user (append-only ledger).
// Returns null for guests or users without an app-user row.
// Identity is server-derived — never accept a userId argument (T-02-01 / T-02-02).
export const getBalance = query({
  args: {},
  handler: async (ctx): Promise<number | null> => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return null;

    const rows = await ctx.db
      .query("coinLedger")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(1000);

    return rows.reduce((sum, row) => sum + row.amount, 0);
  },
});

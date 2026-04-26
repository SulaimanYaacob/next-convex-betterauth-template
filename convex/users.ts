import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Idempotent — anonymous-to-account conversion fires create.after twice
// (once for anonymous temp email, once for real email). Guard prevents
// duplicate users rows on edge cases. Pitfall 1.
export const syncUserCreation = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) return;
    await ctx.db.insert("users", {
      email: args.email,
      // userId and username intentionally omitted — both optional
    });
  },
});

// Cascades into all 5 user-foreign-key tables. Uses .take(100) per
// Convex guideline (never .collect() for unbounded sets). For Phase 1
// (new users) 100 rows is far above realistic counts; if Phase 5 real-
// money usage produces >100 ledger rows, a scheduled continuation
// pattern can be layered on later without changing this signature.
export const syncUserDeletion = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!appUser) return;

    // Cascade: presence (one row max per user)
    const presenceRow = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .first();
    if (presenceRow) await ctx.db.delete(presenceRow._id);

    // Cascade: coinLedger
    const ledgerRows = await ctx.db
      .query("coinLedger")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of ledgerRows) await ctx.db.delete(row._id);

    // Cascade: ownedItems
    const owned = await ctx.db
      .query("ownedItems")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of owned) await ctx.db.delete(row._id);

    // Cascade: equippedItems
    const equipped = await ctx.db
      .query("equippedItems")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of equipped) await ctx.db.delete(row._id);

    // Cascade: games
    const games = await ctx.db
      .query("games")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of games) await ctx.db.delete(row._id);

    // Finally delete the application user row
    await ctx.db.delete(appUser._id);
  },
});

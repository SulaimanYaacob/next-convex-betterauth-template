import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireEnv } from "./util";
import { Id } from "./_generated/dataModel";
import { getAppUser } from "./authUsers";

// GAME-01: create a new game session row and return its Id
export const startSession = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, args): Promise<Id<"games"> | null> => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    return await ctx.db.insert("games", {
      userId: appUser._id,
      gameId: args.gameId,
      startedAt: Date.now(),
    });
  },
});

// GAME-02: record the latest score event on an in-progress session
export const updateScore = mutation({
  args: {
    gameSessionId: v.id("games"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const session = await ctx.db.get(args.gameSessionId);
    if (!session || session.userId !== appUser._id) return null;

    await ctx.db.patch(args.gameSessionId, {
      scoreEvent: { score: args.score, updatedAt: Date.now() },
    });
  },
});

// ECON-02: finalise a session and award coins — idempotent (double-call returns cached value)
export const endSession = mutation({
  args: {
    gameSessionId: v.id("games"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const session = await ctx.db.get(args.gameSessionId);
    if (!session || session.userId !== appUser._id) return null;

    // Idempotency guard — T-03-03: prevent double-award
    if (session.endedAt !== undefined) {
      return session.coinsAwarded ?? 0;
    }

    const coins: number = await ctx.runMutation(
      internal.games.awardSessionCoins,
      { userId: appUser._id, gameSessionId: args.gameSessionId, score: args.score },
    );

    return coins;
  },
});

// ECON-02 internal: coin calculation + ledger insert — NOT in public api.*
// T-03-04/T-03-05: internalMutation only — client cannot call this directly
export const awardSessionCoins = internalMutation({
  args: {
    userId: v.id("users"),
    gameSessionId: v.id("games"),
    score: v.number(),
  },
  handler: async (ctx, args): Promise<number> => {
    const divisor = parseInt(requireEnv("COIN_SCORE_DIVISOR"), 10);
    const cap = parseInt(requireEnv("COIN_SESSION_CAP"), 10);

    // D-14/D-15/D-16: server-side coin formula
    const coins = Math.min(Math.floor(args.score / divisor), cap);

    if (coins > 0) {
      await ctx.db.insert("coinLedger", {
        userId: args.userId,
        amount: coins,
        reason: "game_earn",
        sessionId: args.gameSessionId.toString(),
      });
    }

    await ctx.db.patch(args.gameSessionId, {
      endedAt: Date.now(),
      coinsAwarded: coins,
      sessionCap: cap,
    });

    return coins;
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getAppUser,
  getCoinBalance,
  getEquippedSlugs,
  userDisplayName,
} from "./authUsers";

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const [balance, equipped] = await Promise.all([
      getCoinBalance(ctx, appUser._id),
      getEquippedSlugs(ctx, appUser._id),
    ]);
    const displayName = userDisplayName(appUser);

    return {
      email: appUser.email,
      username: appUser.username ?? "",
      displayName,
      initials: displayName.slice(0, 2).toUpperCase(),
      balance,
      equipped,
    };
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const username = args.username.trim();
    if (username.length < 2 || username.length > 18) {
      throw new Error("Username must be 2-18 characters.");
    }
    if (!/^[a-zA-Z0-9_ -]+$/.test(username)) {
      throw new Error("Use letters, numbers, spaces, hyphens, or underscores.");
    }

    await ctx.db.patch(appUser._id, { username });
    return { username };
  },
});

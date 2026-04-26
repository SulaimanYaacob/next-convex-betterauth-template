import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

// PRES-01: heartbeat mutation. Phase 1 ships the table + mutation;
// Phase 2 wires the client-side 15s interval. Status union enforced
// server-side via validator. Identity always derived from
// betterAuthComponent.getAuthUser — never from a userId argument.
export const updatePresence = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("in-game"),
      v.literal("idle"),
    ),
  },
  handler: async (ctx, args) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return; // unauthenticated — silently no-op

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        status: args.status,
      });
    } else {
      await ctx.db.insert("presence", {
        userId: appUser._id,
        lastSeen: Date.now(),
        status: args.status,
      });
    }
  },
});

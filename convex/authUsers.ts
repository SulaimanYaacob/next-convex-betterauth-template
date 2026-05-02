import { betterAuthComponent } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

export type AppUser = Doc<"users">;
type AppCtx = QueryCtx | MutationCtx;

export async function getAppUser(ctx: AppCtx): Promise<AppUser | null> {
  let authUser;
  try {
    authUser = await betterAuthComponent.getAuthUser(ctx);
  } catch {
    return null;
  }
  if (!authUser) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", authUser.email))
    .first();
}

export async function getCoinBalance(ctx: AppCtx, userId: Id<"users">) {
  const rows = await ctx.db
    .query("coinLedger")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(1000);

  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function getEquippedSlugs(ctx: AppCtx, userId: Id<"users">) {
  const equippedRows = await ctx.db
    .query("equippedItems")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(10);

  const equipped: Partial<Record<Doc<"equippedItems">["slot"], string>> = {};
  for (const row of equippedRows) {
    const item = await ctx.db.get(row.itemId);
    if (item) equipped[row.slot] = item.slug;
  }

  return equipped;
}

export async function getPlayerLoadout(ctx: AppCtx, userId: Id<"users">) {
  const equipped = await getEquippedSlugs(ctx, userId);

  return {
    playerShape: equipped.player_shape,
    playerColor: equipped.player_color,
    playerEffect: equipped.player_effect,
    skillPrimary: equipped.skill_primary,
  };
}

export function userDisplayName(user: AppUser) {
  return user.username ?? user.email.split("@")[0] ?? "Player";
}

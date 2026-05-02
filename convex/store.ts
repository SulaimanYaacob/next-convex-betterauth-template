import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { getAppUser, getCoinBalance, getEquippedSlugs } from "./authUsers";

const cosmeticType = v.union(
  v.literal("cursor_skin"),
  v.literal("cursor_trail"),
  v.literal("player_shape"),
  v.literal("player_color"),
  v.literal("player_effect"),
  v.literal("skill"),
  v.literal("ui_theme"),
);

const equipSlot = v.union(
  v.literal("cursor_skin"),
  v.literal("cursor_trail"),
  v.literal("player_shape"),
  v.literal("player_color"),
  v.literal("player_effect"),
  v.literal("skill_primary"),
  v.literal("ui_theme"),
);

const storeSeed: Array<Omit<Doc<"storeItems">, "_id" | "_creationTime">> = [
  {
    slug: "ember-pointer",
    name: "Ember Pointer",
    type: "cursor_skin",
    price: 240,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "mint-pointer",
    name: "Mint Pointer",
    type: "cursor_skin",
    price: 320,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "void-pointer",
    name: "Void Pointer",
    type: "cursor_skin",
    price: 950,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "soft-spark",
    name: "Soft Spark",
    type: "cursor_trail",
    price: 260,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "bubble-line",
    name: "Bubble Line",
    type: "cursor_trail",
    price: 420,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "aurora-drift",
    name: "Aurora Drift",
    type: "cursor_trail",
    price: 0,
    rarity: "epic",
    earnedOnly: true,
  },
  {
    slug: "shape-orb",
    name: "Orb Shape",
    type: "player_shape",
    price: 180,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "shape-diamond",
    name: "Diamond Shape",
    type: "player_shape",
    price: 320,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "shape-rounded-square",
    name: "Rounded Square",
    type: "player_shape",
    price: 560,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "color-mint",
    name: "Mint Core",
    type: "player_color",
    price: 220,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "color-ember",
    name: "Ember Core",
    type: "player_color",
    price: 300,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "color-violet",
    name: "Violet Core",
    type: "player_color",
    price: 620,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "effect-pulse-ring",
    name: "Pulse Ring",
    type: "player_effect",
    price: 260,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "effect-soft-trail",
    name: "Soft Trail",
    type: "player_effect",
    price: 420,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "effect-spark-pop",
    name: "Spark Pop",
    type: "player_effect",
    price: 760,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "skill-boost",
    name: "Boost",
    type: "skill",
    price: 360,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "skill-shield",
    name: "Immortality",
    type: "skill",
    price: 520,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "skill-magnet",
    name: "Magnet",
    type: "skill",
    price: 680,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "skill-stunner",
    name: "Stunner",
    type: "skill",
    price: 780,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "skill-slowmo",
    name: "Slow Motion",
    type: "skill",
    price: 640,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "sunrise-lite",
    name: "Sunrise Lite",
    type: "ui_theme",
    price: 280,
    rarity: "common",
    earnedOnly: false,
  },
  {
    slug: "arcade-fresh",
    name: "Arcade Fresh",
    type: "ui_theme",
    price: 520,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "mono-focus",
    name: "Mono Focus",
    type: "ui_theme",
    price: 720,
    rarity: "rare",
    earnedOnly: false,
  },
  {
    slug: "night-score",
    name: "Night Score",
    type: "ui_theme",
    price: 1100,
    rarity: "epic",
    earnedOnly: false,
  },
];

type PurchaseResult =
  | { status: "purchased"; itemId: Id<"storeItems"> }
  | { status: "owned"; itemId: Id<"storeItems"> };

function slotForItemType(type: Doc<"storeItems">["type"]): Doc<"equippedItems">["slot"] {
  return type === "skill" ? "skill_primary" : type;
}

export const list = query({
  args: { type: v.optional(cosmeticType) },
  handler: async (ctx, args) => {
    const type = args.type;
    if (type !== undefined) {
      return await ctx.db
        .query("storeItems")
        .withIndex("by_type", (q) => q.eq("type", type))
        .take(100);
    }

    return await ctx.db.query("storeItems").take(100);
  },
});

export const getViewerInventory = query({
  args: {},
  handler: async (ctx) => {
    const appUser = await getAppUser(ctx);
    const items = await ctx.db.query("storeItems").take(100);

    if (!appUser) {
      return {
        authenticated: false,
        balance: null,
        username: null,
        items: items.map((item) => ({
          ...item,
          owned: false,
          equipped: false,
        })),
        equipped: {},
      };
    }

    const [ownedRows, equippedRows, balance] = await Promise.all([
      ctx.db
        .query("ownedItems")
        .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
        .take(200),
      ctx.db
        .query("equippedItems")
        .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
        .take(10),
      getCoinBalance(ctx, appUser._id),
    ]);

    const ownedIds = new Set(ownedRows.map((row) => row.itemId));
    const equippedIds = new Set(equippedRows.map((row) => row.itemId));
    const equipped = await getEquippedSlugs(ctx, appUser._id);

    return {
      authenticated: true,
      balance,
      username: appUser.username ?? appUser.email.split("@")[0],
      items: items.map((item) => ({
        ...item,
        owned: ownedIds.has(item._id),
        equipped: equippedIds.has(item._id),
      })),
      equipped,
    };
  },
});

export const purchase = mutation({
  args: { itemId: v.id("storeItems") },
  handler: async (ctx, args): Promise<PurchaseResult | null> => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const result: PurchaseResult = await ctx.runMutation(
      internal.store.purchaseWithCoins,
      {
        userId: appUser._id,
        itemId: args.itemId,
      },
    );

    return result;
  },
});

export const purchaseWithCoins = internalMutation({
  args: {
    userId: v.id("users"),
    itemId: v.id("storeItems"),
  },
  handler: async (ctx, args): Promise<PurchaseResult> => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found.");
    if (item.earnedOnly) throw new Error("This item is earned through play.");

    const existing = await ctx.db
      .query("ownedItems")
      .withIndex("by_userId_and_itemId", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      )
      .first();
    if (existing) return { status: "owned", itemId: args.itemId };

    const balance = await getCoinBalance(ctx, args.userId);
    if (balance < item.price) throw new Error("Not enough coins.");

    await ctx.db.insert("coinLedger", {
      userId: args.userId,
      amount: -item.price,
      reason: "cosmetic_purchase",
    });

    await ctx.db.insert("ownedItems", {
      userId: args.userId,
      itemId: args.itemId,
      acquiredAt: Date.now(),
    });

    return { status: "purchased", itemId: args.itemId };
  },
});

export const equip = mutation({
  args: { itemId: v.id("storeItems") },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found.");

    const owned = await ctx.db
      .query("ownedItems")
      .withIndex("by_userId_and_itemId", (q) =>
        q.eq("userId", appUser._id).eq("itemId", args.itemId),
      )
      .first();
    if (!owned) throw new Error("Own this item before equipping it.");

    const existing = await ctx.db
      .query("equippedItems")
      .withIndex("by_userId_and_slot", (q) =>
        q.eq("userId", appUser._id).eq("slot", slotForItemType(item.type)),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { itemId: args.itemId });
    } else {
      await ctx.db.insert("equippedItems", {
        userId: appUser._id,
        slot: slotForItemType(item.type),
        itemId: args.itemId,
      });
    }

    return { slot: slotForItemType(item.type), itemId: args.itemId };
  },
});

export const unequip = mutation({
  args: { slot: equipSlot },
  handler: async (ctx, args) => {
    const appUser = await getAppUser(ctx);
    if (!appUser) return null;

    const existing = await ctx.db
      .query("equippedItems")
      .withIndex("by_userId_and_slot", (q) =>
        q.eq("userId", appUser._id).eq("slot", args.slot),
      )
      .first();

    if (existing) await ctx.db.delete(existing._id);
    return { slot: args.slot };
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const legacyCloak = await ctx.db
      .query("storeItems")
      .withIndex("by_slug", (q) => q.eq("slug", "skill-cloak"))
      .unique();
    const existingMagnet = await ctx.db
      .query("storeItems")
      .withIndex("by_slug", (q) => q.eq("slug", "skill-magnet"))
      .unique();

    if (legacyCloak && !existingMagnet) {
      await ctx.db.patch(legacyCloak._id, {
        slug: "skill-magnet",
        name: "Magnet",
        price: 680,
        rarity: "rare",
        earnedOnly: false,
      });
    }

    for (const seedItem of storeSeed) {
      const existing = await ctx.db
        .query("storeItems")
        .withIndex("by_slug", (q) => q.eq("slug", seedItem.slug))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, seedItem);
      } else {
        await ctx.db.insert("storeItems", seedItem);
      }
    }
  },
});

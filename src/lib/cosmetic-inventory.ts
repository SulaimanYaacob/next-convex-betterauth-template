import { Id } from "../../convex/_generated/dataModel";
import { CosmeticRarity, CosmeticType, EquipSlot } from "@/lib/cosmetics";

export type CosmeticInventoryItem = {
  _id: Id<"storeItems">;
  slug: string;
  name: string;
  type: CosmeticType;
  price: number;
  rarity: CosmeticRarity;
  earnedOnly: boolean;
  owned: boolean;
  equipped: boolean;
};

export type EquippedCosmeticSlugs = Partial<Record<EquipSlot, string>>;

export function readableCosmeticError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Not enough coins")) return "Not enough coins yet.";
  if (message.includes("earned through play")) {
    return "This cosmetic is earned through play.";
  }
  if (message.includes("Own this item")) return "Buy this cosmetic first.";
  if (message.includes("Username")) return message;
  if (message.includes("Use letters")) return message;
  return "That did not work. Try again.";
}

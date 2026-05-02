import { Check, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";
import { CosmeticInventoryItem } from "@/lib/cosmetic-inventory";
import { TYPE_LABELS, getCosmeticMeta, rarityClass } from "@/lib/cosmetics";

export function CosmeticDetailPanel({
  item,
  authenticated,
  busy,
  onBuy,
  onEquip,
}: {
  item: CosmeticInventoryItem | null;
  authenticated?: boolean;
  busy?: boolean;
  onBuy: (item: CosmeticInventoryItem) => void;
  onEquip: (item: CosmeticInventoryItem) => void;
}) {
  if (!item) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a cosmetic to preview it.
      </p>
    );
  }

  const meta = getCosmeticMeta(item.slug);

  return (
    <div className="space-y-4">
      <CosmeticPreview slug={item.slug} type={item.type} />
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{item.name}</h2>
            <p className="text-sm text-muted-foreground">
              {TYPE_LABELS[item.type]}
            </p>
          </div>
          <Badge variant="outline" className={rarityClass(item.rarity)}>
            {item.rarity}
          </Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {meta?.description ??
            "A clean cosmetic tuned for minimal play sessions."}
        </p>
      </div>

      {item.earnedOnly ? (
        <Button disabled className="w-full gap-2">
          <Lock className="size-4" />
          Earned through play
        </Button>
      ) : item.equipped ? (
        <Button disabled className="w-full gap-2">
          <Check className="size-4" />
          Equipped
        </Button>
      ) : item.owned ? (
        <Button
          className="w-full gap-2"
          disabled={busy}
          onClick={() => onEquip(item)}
        >
          <Sparkles className="size-4" />
          Equip
        </Button>
      ) : (
        <Button
          className="w-full"
          disabled={!authenticated || busy}
          onClick={() => onBuy(item)}
        >
          Buy for {item.price} coins
        </Button>
      )}

      {!authenticated && (
        <p className="text-xs text-muted-foreground">
          Sign in to buy and equip cosmetics.
        </p>
      )}
    </div>
  );
}

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";
import { CosmeticInventoryItem } from "@/lib/cosmetic-inventory";
import { TYPE_LABELS, getCosmeticMeta, rarityClass } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

export function CosmeticCard({
  item,
  selected,
  onSelect,
  action,
}: {
  item: CosmeticInventoryItem;
  selected?: boolean;
  onSelect?: (item: CosmeticInventoryItem) => void;
  action?: React.ReactNode;
}) {
  const meta = getCosmeticMeta(item.slug);

  return (
    <article
      className={cn(
        "flex min-h-[260px] flex-col rounded-md border bg-card p-3 text-left shadow-sm transition",
        selected && "border-primary",
        onSelect &&
          "group cursor-pointer hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring",
        item.equipped && !selected && "border-primary/70",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        className="text-left focus-visible:outline-none"
        disabled={!onSelect}
      >
        <CosmeticPreview slug={item.slug} type={item.type} compact />
      </button>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{item.name}</h2>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {meta?.tone ?? TYPE_LABELS[item.type]}
          </p>
        </div>
        {item.equipped ? (
          <Badge className="gap-1">
            <Check className="size-3" />
            Equipped
          </Badge>
        ) : item.owned ? (
          <Badge variant="secondary">Owned</Badge>
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <Badge variant="outline" className={rarityClass(item.rarity)}>
          {item.rarity}
        </Badge>
        {action ?? (
          <span className="text-sm font-semibold tabular-nums">
            {item.earnedOnly ? "Earned" : `${item.price} coins`}
          </span>
        )}
      </div>
    </article>
  );
}

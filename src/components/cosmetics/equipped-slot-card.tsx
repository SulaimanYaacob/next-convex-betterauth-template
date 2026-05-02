import { CircleSlash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";
import { CosmeticInventoryItem } from "@/lib/cosmetic-inventory";
import { EQUIP_SLOT_LABELS, EquipSlot, getCosmeticMeta } from "@/lib/cosmetics";

export function EquippedSlotCard({
  slot,
  item,
  busy,
  onUnequip,
}: {
  slot: EquipSlot;
  item?: CosmeticInventoryItem;
  busy?: boolean;
  onUnequip: (slot: EquipSlot) => void;
}) {
  const meta = getCosmeticMeta(item?.slug);

  return (
    <div className="min-h-[220px] rounded-md border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{EQUIP_SLOT_LABELS[slot]}</p>
          <p className="text-xs text-muted-foreground">
            {item?.name ?? "Nothing equipped"}
          </p>
        </div>
        {item && <Badge variant="secondary">Active</Badge>}
      </div>
      <div className="mt-3">
        {item ? (
          <CosmeticPreview slug={item.slug} type={item.type} compact />
        ) : (
          <div className="grid h-20 place-items-center rounded-md border border-dashed text-xs text-muted-foreground">
            Empty slot
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full gap-2"
        disabled={!item || busy}
        onClick={() => onUnequip(slot)}
      >
        <CircleSlash className="size-4" />
        Unequip
      </Button>
      {meta && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {meta.tone}
        </p>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { CosmeticType, TYPE_LABELS, TYPE_ORDER } from "@/lib/cosmetics";

export const COSMETIC_FILTERS: Array<"all" | CosmeticType> = [
  "all",
  ...TYPE_ORDER,
];

export function CosmeticFilterTabs({
  value,
  onChange,
}: {
  value: "all" | CosmeticType;
  onChange: (value: "all" | CosmeticType) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {COSMETIC_FILTERS.map((filter) => (
        <Button
          key={filter}
          type="button"
          variant={value === filter ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => onChange(filter)}
        >
          {filter === "all" ? "All" : TYPE_LABELS[filter]}
        </Button>
      ))}
    </div>
  );
}

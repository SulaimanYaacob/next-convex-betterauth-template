"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CHIPS = ["All", "Multiplayer", "Desktop", "Mobile"] as const;
type Chip = (typeof CHIPS)[number];

export function FilterChips() {
  const [active, setActive] = useState<Chip>("All");

  return (
    <div
      role="radiogroup"
      aria-label="Game filters"
      className="flex flex-row gap-2 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto"
    >
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          role="radio"
          aria-checked={active === chip}
          onClick={() => setActive(chip)}
          className={cn(
            "px-4 rounded-full text-sm min-h-[44px] transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            active === chip
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

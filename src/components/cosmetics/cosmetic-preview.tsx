import { COSMETICS, CosmeticType, getCosmeticMeta } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

interface CosmeticPreviewProps {
  slug: string;
  type: CosmeticType;
  compact?: boolean;
}

export function CosmeticPreview({ slug, type, compact }: CosmeticPreviewProps) {
  const meta = getCosmeticMeta(slug);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-muted",
        compact ? "h-20" : "h-40",
        meta?.previewClass,
      )}
    >
      {type === "cursor_skin" && (
        <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-[40%_60%_45%_55%] border-2 border-foreground/70 bg-background/70 shadow-sm" />
      )}

      {type === "cursor_trail" && (
        <div className="absolute inset-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${(meta?.trail?.size ?? 9) + i}px`,
                height: `${(meta?.trail?.size ?? 9) + i}px`,
                left: `${22 + i * 12}%`,
                top: `${62 - i * 8}%`,
                background: meta?.trail?.color ?? "currentColor",
                boxShadow: meta?.trail?.shadow,
                opacity: 0.25 + i * 0.13,
              }}
            />
          ))}
        </div>
      )}

      {type === "player_shape" && (
        <div className="absolute inset-0 grid place-items-center">
          <div
            className={cn(
              "size-14 border-2 border-foreground/70 bg-background/75 shadow-sm",
              meta?.playerShape === "diamond" && "rotate-45 rounded-sm",
              meta?.playerShape === "rounded-square" && "rounded-xl",
              (!meta?.playerShape || meta.playerShape === "orb") &&
                "rounded-full",
            )}
          />
        </div>
      )}

      {type === "player_color" && (
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="size-14 rounded-full border-2 shadow-lg"
            style={{
              background: meta?.playerColor?.fill ?? "currentColor",
              borderColor: meta?.playerColor?.stroke ?? "currentColor",
              boxShadow: `0 0 24px ${meta?.playerColor?.glow ?? "transparent"}`,
            }}
          />
        </div>
      )}

      {type === "player_effect" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative grid size-20 place-items-center">
            {meta?.playerEffect === "pulse-ring" && (
              <span className="absolute size-20 rounded-full border border-foreground/25" />
            )}
            {meta?.playerEffect === "soft-trail" && (
              <>
                <span className="absolute left-2 top-10 size-7 rounded-full bg-foreground/15" />
                <span className="absolute left-6 top-9 size-9 rounded-full bg-foreground/20" />
              </>
            )}
            {meta?.playerEffect === "spark-pop" && (
              <>
                <span className="absolute left-4 top-5 size-1.5 rounded-full bg-foreground/50" />
                <span className="absolute right-5 top-4 size-2 rounded-full bg-foreground/40" />
                <span className="absolute bottom-5 right-3 size-1.5 rounded-full bg-foreground/45" />
              </>
            )}
            <span className="relative size-12 rounded-full border-2 border-foreground/70 bg-background/80" />
          </div>
        </div>
      )}

      {type === "ui_theme" && (
        <div className="absolute inset-4 grid grid-cols-[1fr_44px] gap-3">
          <div className="space-y-2">
            <div
              className="h-4 rounded"
              style={{ background: meta?.theme?.primary }}
            />
            <div
              className="h-3 w-2/3 rounded"
              style={{ background: meta?.theme?.secondary }}
            />
            <div
              className="h-10 rounded border"
              style={{
                background: meta?.theme?.background,
                borderColor: meta?.theme?.border,
              }}
            />
          </div>
          <div
            className="rounded"
            style={{ background: meta?.theme?.muted }}
          />
        </div>
      )}

      {type === "skill" && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative grid size-20 place-items-center rounded-full border border-foreground/15 bg-background/65 shadow-sm">
            <span className="absolute size-16 rounded-full border border-foreground/15" />
            <span className="absolute size-10 rounded-full bg-foreground/10" />
            <span className="relative text-lg font-black uppercase text-foreground/80">
              {meta?.label.slice(0, 1) ?? "S"}
            </span>
          </div>
        </div>
      )}

      {!meta && (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
          Preview
        </div>
      )}
    </div>
  );
}

export function EquippedMiniBadges({
  equipped,
}: {
  equipped?: Partial<Record<string, string>>;
}) {
  const active = Object.entries(equipped ?? {}).filter((entry) =>
    Boolean(COSMETICS[entry[1] ?? ""]),
  ) as Array<[CosmeticType, string]>;

  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-1" aria-label="Equipped cosmetics">
      {active.map(([type, slug]) => {
        const meta = getCosmeticMeta(slug);
        return (
          <span
            key={`${type}-${slug}`}
            title={meta?.label ?? slug}
            className={cn(
              "size-2.5 rounded-full border border-background shadow-sm",
              meta?.previewClass,
            )}
          />
        );
      })}
    </div>
  );
}

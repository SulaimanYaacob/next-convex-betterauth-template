export type CosmeticType =
  | "cursor_skin"
  | "cursor_trail"
  | "player_shape"
  | "player_color"
  | "player_effect"
  | "skill"
  | "ui_theme";
export type EquipSlot = Exclude<CosmeticType, "skill"> | "skill_primary";
export type CosmeticRarity = "common" | "rare" | "epic" | "legendary";
export type PlayerShape = "orb" | "diamond" | "rounded-square";
export type PlayerEffect = "none" | "pulse-ring" | "soft-trail" | "spark-pop";
export type SkillEffect = "boost" | "shield" | "magnet" | "stunner" | "slowmo";
export type SkillMode = "singleplayer" | "multiplayer" | "both";

export interface CosmeticMeta {
  slug: string;
  label: string;
  type: CosmeticType;
  tone: string;
  description: string;
  previewClass: string;
  cursor?: string;
  trail?: {
    color: string;
    shadow: string;
    size: number;
  };
  playerShape?: PlayerShape;
  playerColor?: {
    fill: string;
    stroke: string;
    glow: string;
  };
  playerEffect?: PlayerEffect;
  skill?: {
    effect: SkillEffect;
    cooldownMs: number;
    durationMs: number;
    mode: SkillMode;
  };
  theme?: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    border: string;
  };
}

const cursorSvg = (fill: string, stroke: string) =>
  `url("data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 3L22 15L14 17L10 25L5 3Z' fill='${fill}' stroke='${stroke}' stroke-width='2' stroke-linejoin='round'/%3E%3C/svg%3E") 5 3, auto`;

export const COSMETICS: Record<string, CosmeticMeta> = {
  "ember-pointer": {
    slug: "ember-pointer",
    label: "Ember Pointer",
    type: "cursor_skin",
    tone: "Warm click feedback without visual noise.",
    description: "A compact amber pointer for players who want a little heat.",
    previewClass: "bg-[oklch(0.94_0.06_65)]",
    cursor: cursorSvg("%23f2a33a", "%2321011f"),
  },
  "mint-pointer": {
    slug: "mint-pointer",
    label: "Mint Pointer",
    type: "cursor_skin",
    tone: "Fresh, readable, and light.",
    description: "A cool green pointer that stays visible on soft surfaces.",
    previewClass: "bg-[oklch(0.93_0.08_168)]",
    cursor: cursorSvg("%236ee7b7", "%2311231d"),
  },
  "void-pointer": {
    slug: "void-pointer",
    label: "Void Pointer",
    type: "cursor_skin",
    tone: "A sharper rare skin with high contrast.",
    description: "Dark core, pale rim, and a precise arcade feel.",
    previewClass: "bg-[oklch(0.24_0.03_280)]",
    cursor: cursorSvg("%23241d33", "%23f8f6f2"),
  },
  "soft-spark": {
    slug: "soft-spark",
    label: "Soft Spark",
    type: "cursor_trail",
    tone: "Small sparks that fade quickly.",
    description: "A minimal trail that makes motion feel rewarding.",
    previewClass: "bg-[oklch(0.96_0.04_78)]",
    trail: {
      color: "oklch(0.72 0.13 50)",
      shadow: "0 0 14px oklch(0.72 0.13 50 / 0.42)",
      size: 9,
    },
  },
  "bubble-line": {
    slug: "bubble-line",
    label: "Bubble Line",
    type: "cursor_trail",
    tone: "Soft blue beads with a clean fade.",
    description: "A calm trail that reads well without stealing focus.",
    previewClass: "bg-[oklch(0.94_0.04_220)]",
    trail: {
      color: "oklch(0.62 0.08 218)",
      shadow: "0 0 16px oklch(0.62 0.08 218 / 0.45)",
      size: 10,
    },
  },
  "aurora-drift": {
    slug: "aurora-drift",
    label: "Aurora Drift",
    type: "cursor_trail",
    tone: "Earned-only shimmer for later mastery hooks.",
    description: "A premium drift trail reserved for future skill unlocks.",
    previewClass: "bg-[oklch(0.35_0.08_245)]",
    trail: {
      color: "oklch(0.82 0.12 190)",
      shadow: "0 0 20px oklch(0.82 0.12 190 / 0.5)",
      size: 11,
    },
  },
  "shape-orb": {
    slug: "shape-orb",
    label: "Orb Shape",
    type: "player_shape",
    tone: "A clean round avatar silhouette.",
    description: "The classic Gami player shape with a focused arcade read.",
    previewClass: "bg-[oklch(0.95_0.025_184)]",
    playerShape: "orb",
  },
  "shape-diamond": {
    slug: "shape-diamond",
    label: "Diamond Shape",
    type: "player_shape",
    tone: "Sharper identity without changing the hitbox.",
    description: "A pointed player silhouette that keeps the same gameplay size.",
    previewClass: "bg-[oklch(0.95_0.035_52)]",
    playerShape: "diamond",
  },
  "shape-rounded-square": {
    slug: "shape-rounded-square",
    label: "Rounded Square",
    type: "player_shape",
    tone: "Stable, chunky, and easy to spot.",
    description: "A compact rounded square drawn over the same fixed hitbox.",
    previewClass: "bg-[oklch(0.94_0.025_274)]",
    playerShape: "rounded-square",
  },
  "color-mint": {
    slug: "color-mint",
    label: "Mint Core",
    type: "player_color",
    tone: "Fresh color with strong contrast.",
    description: "A calm mint avatar palette for fast movement games.",
    previewClass: "bg-[oklch(0.94_0.06_168)]",
    playerColor: {
      fill: "#67d7ba",
      stroke: "#12362f",
      glow: "rgba(103, 215, 186, 0.42)",
    },
  },
  "color-ember": {
    slug: "color-ember",
    label: "Ember Core",
    type: "player_color",
    tone: "Warm player color with bright action energy.",
    description: "An amber-orange avatar palette that stays readable.",
    previewClass: "bg-[oklch(0.94_0.06_56)]",
    playerColor: {
      fill: "#f09b55",
      stroke: "#35190f",
      glow: "rgba(240, 155, 85, 0.4)",
    },
  },
  "color-violet": {
    slug: "color-violet",
    label: "Violet Core",
    type: "player_color",
    tone: "Rare cool color with a clear outline.",
    description: "A violet player palette tuned for dark and light arenas.",
    previewClass: "bg-[oklch(0.91_0.055_295)]",
    playerColor: {
      fill: "#9b87ff",
      stroke: "#211947",
      glow: "rgba(155, 135, 255, 0.42)",
    },
  },
  "effect-pulse-ring": {
    slug: "effect-pulse-ring",
    label: "Pulse Ring",
    type: "player_effect",
    tone: "A soft ring that breathes around your avatar.",
    description: "A readable pulse effect that adds identity without clutter.",
    previewClass: "bg-[oklch(0.96_0.035_180)]",
    playerEffect: "pulse-ring",
  },
  "effect-soft-trail": {
    slug: "effect-soft-trail",
    label: "Soft Trail",
    type: "player_effect",
    tone: "A short movement trail for better motion feel.",
    description: "A compact trail that follows your avatar for a moment.",
    previewClass: "bg-[oklch(0.95_0.035_210)]",
    playerEffect: "soft-trail",
  },
  "effect-spark-pop": {
    slug: "effect-spark-pop",
    label: "Spark Pop",
    type: "player_effect",
    tone: "Small sparks on movement and claims.",
    description: "A rare pop effect with controlled, minimal particles.",
    previewClass: "bg-[oklch(0.95_0.05_68)]",
    playerEffect: "spark-pop",
  },
  "sunrise-lite": {
    slug: "sunrise-lite",
    label: "Sunrise Lite",
    type: "ui_theme",
    tone: "Warm, readable, close to Gami's base tone.",
    description: "A gentle morning palette for long sessions.",
    previewClass: "bg-[oklch(0.97_0.04_70)]",
    theme: {
      background: "oklch(0.99 0.018 72)",
      foreground: "oklch(0.22 0.03 56)",
      primary: "oklch(0.68 0.14 50)",
      secondary: "oklch(0.57 0.05 190)",
      muted: "oklch(0.94 0.02 70)",
      accent: "oklch(0.95 0.04 84)",
      border: "oklch(0.88 0.025 72)",
    },
  },
  "arcade-fresh": {
    slug: "arcade-fresh",
    label: "Arcade Fresh",
    type: "ui_theme",
    tone: "Light, minty, and still restrained.",
    description: "A clean playroom palette with bright action color.",
    previewClass: "bg-[oklch(0.94_0.06_165)]",
    theme: {
      background: "oklch(0.985 0.018 165)",
      foreground: "oklch(0.2 0.035 210)",
      primary: "oklch(0.64 0.12 165)",
      secondary: "oklch(0.58 0.07 215)",
      muted: "oklch(0.93 0.018 170)",
      accent: "oklch(0.94 0.05 158)",
      border: "oklch(0.86 0.025 170)",
    },
  },
  "mono-focus": {
    slug: "mono-focus",
    label: "Mono Focus",
    type: "ui_theme",
    tone: "Quiet rare theme for low-distraction play.",
    description: "Soft contrast, muted action color, and less visual noise.",
    previewClass: "bg-[oklch(0.9_0.005_260)]",
    theme: {
      background: "oklch(0.985 0.002 260)",
      foreground: "oklch(0.2 0.018 260)",
      primary: "oklch(0.54 0.035 260)",
      secondary: "oklch(0.62 0.035 198)",
      muted: "oklch(0.93 0.004 260)",
      accent: "oklch(0.9 0.004 260)",
      border: "oklch(0.84 0.005 260)",
    },
  },
  "night-score": {
    slug: "night-score",
    label: "Night Score",
    type: "ui_theme",
    tone: "Dark, crisp, and built for late play.",
    description: "A deeper theme with warm reward accents.",
    previewClass: "bg-[oklch(0.22_0.025_280)]",
    theme: {
      background: "oklch(0.18 0.014 280)",
      foreground: "oklch(0.88 0.006 260)",
      primary: "oklch(0.72 0.13 50)",
      secondary: "oklch(0.66 0.07 198)",
      muted: "oklch(0.26 0.012 280)",
      accent: "oklch(0.3 0.018 280)",
      border: "oklch(0.32 0.015 280)",
    },
  },
  "skill-boost": {
    slug: "skill-boost",
    label: "Boost",
    type: "skill",
    tone: "Short speed burst for clean escapes.",
    description: "Move faster for a few seconds after a full cooldown.",
    previewClass: "bg-[oklch(0.95_0.055_168)]",
    skill: {
      effect: "boost",
      cooldownMs: 9000,
      durationMs: 2600,
      mode: "both",
    },
  },
  "skill-shield": {
    slug: "skill-shield",
    label: "Immortality",
    type: "skill",
    tone: "Brief protection when the arena gets tight.",
    description: "Ignore hazards for a short window after activation.",
    previewClass: "bg-[oklch(0.94_0.045_210)]",
    skill: {
      effect: "shield",
      cooldownMs: 13000,
      durationMs: 2400,
      mode: "both",
    },
  },
  "skill-magnet": {
    slug: "skill-magnet",
    label: "Magnet",
    type: "skill",
    tone: "Pull rewards closer without changing your hitbox.",
    description: "Draws nearby objectives toward you for a short moment.",
    previewClass: "bg-[oklch(0.95_0.06_92)]",
    skill: {
      effect: "magnet",
      cooldownMs: 12000,
      durationMs: 2800,
      mode: "both",
    },
  },
  "skill-stunner": {
    slug: "skill-stunner",
    label: "Stunner",
    type: "skill",
    tone: "Freeze nearby danger just long enough to escape.",
    description: "Stops nearby hazards or enemies for a short moment.",
    previewClass: "bg-[oklch(0.95_0.055_68)]",
    skill: {
      effect: "stunner",
      cooldownMs: 15000,
      durationMs: 1600,
      mode: "both",
    },
  },
  "skill-slowmo": {
    slug: "skill-slowmo",
    label: "Slow Motion",
    type: "skill",
    tone: "Single-player only pressure control.",
    description: "Slows hazards and enemies in supported solo games.",
    previewClass: "bg-[oklch(0.94_0.035_250)]",
    skill: {
      effect: "slowmo",
      cooldownMs: 12000,
      durationMs: 3200,
      mode: "singleplayer",
    },
  },
};

export const TYPE_LABELS: Record<CosmeticType, string> = {
  cursor_skin: "Cursor",
  cursor_trail: "Trail",
  player_shape: "Shape",
  player_color: "Player Color",
  player_effect: "Player Effect",
  skill: "Skill",
  ui_theme: "Theme",
};

export const EQUIP_SLOT_LABELS: Record<EquipSlot, string> = {
  cursor_skin: "Cursor",
  cursor_trail: "Trail",
  player_shape: "Shape",
  player_color: "Player Color",
  player_effect: "Player Effect",
  skill_primary: "Skill",
  ui_theme: "Theme",
};

export const TYPE_ORDER: CosmeticType[] = [
  "cursor_skin",
  "cursor_trail",
  "player_shape",
  "player_color",
  "player_effect",
  "skill",
  "ui_theme",
];

export const EQUIP_SLOT_ORDER: EquipSlot[] = [
  "cursor_skin",
  "cursor_trail",
  "player_shape",
  "player_color",
  "player_effect",
  "skill_primary",
  "ui_theme",
];

export function getCosmeticMeta(slug?: string | null) {
  if (!slug) return null;
  return COSMETICS[slug] ?? null;
}

export function rarityClass(rarity: CosmeticRarity) {
  switch (rarity) {
    case "legendary":
      return "border-amber-400/60 bg-amber-400/10 text-amber-700";
    case "epic":
      return "border-sky-400/60 bg-sky-400/10 text-sky-700";
    case "rare":
      return "border-emerald-400/60 bg-emerald-400/10 text-emerald-700";
    default:
      return "border-border bg-background text-muted-foreground";
  }
}

export type EquippedCosmetics = Partial<Record<CosmeticType, string>>;
export type EquippedSlots = Partial<Record<EquipSlot, string>>;

export interface PlayerAppearance {
  shape: PlayerShape;
  fill: string;
  stroke: string;
  glow: string;
  effect: PlayerEffect;
}

export const DEFAULT_PLAYER_APPEARANCE: PlayerAppearance = {
  shape: "orb",
  fill: "#67d7ba",
  stroke: "#12362f",
  glow: "rgba(103, 215, 186, 0.42)",
  effect: "none",
};

export function getPlayerAppearance(
  equipped?: EquippedCosmetics | null,
): PlayerAppearance {
  const shapeMeta = getCosmeticMeta(equipped?.player_shape);
  const colorMeta = getCosmeticMeta(equipped?.player_color);
  const effectMeta = getCosmeticMeta(equipped?.player_effect);

  return {
    shape: shapeMeta?.playerShape ?? DEFAULT_PLAYER_APPEARANCE.shape,
    fill: colorMeta?.playerColor?.fill ?? DEFAULT_PLAYER_APPEARANCE.fill,
    stroke: colorMeta?.playerColor?.stroke ?? DEFAULT_PLAYER_APPEARANCE.stroke,
    glow: colorMeta?.playerColor?.glow ?? DEFAULT_PLAYER_APPEARANCE.glow,
    effect: effectMeta?.playerEffect ?? DEFAULT_PLAYER_APPEARANCE.effect,
  };
}

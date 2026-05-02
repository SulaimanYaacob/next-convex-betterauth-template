import { getCosmeticMeta, SkillEffect } from "@/lib/cosmetics";

export type SkillSupport = "none" | "singleplayer" | "multiplayer";

export type EquippedSkill = {
  slug: string;
  label: string;
  effect: SkillEffect;
  cooldownMs: number;
  durationMs: number;
  mode: "singleplayer" | "multiplayer" | "both";
};

export type SkillRuntime = {
  activeUntil: number;
  cooldownUntil: number;
};

export function getEquippedSkill(
  equipped?: Partial<Record<string, string>> | null,
): EquippedSkill | null {
  const slug = equipped?.skill_primary;
  const meta = getCosmeticMeta(slug);
  if (!slug || !meta?.skill) return null;

  return {
    slug,
    label: meta.label,
    effect: meta.skill.effect,
    cooldownMs: meta.skill.cooldownMs,
    durationMs: meta.skill.durationMs,
    mode: meta.skill.mode,
  };
}

export function canUseSkillInMode(
  skill: EquippedSkill | null,
  mode: "singleplayer" | "multiplayer",
) {
  return Boolean(skill && (skill.mode === "both" || skill.mode === mode));
}

export function skillReadyPercent(runtime: SkillRuntime, now: number) {
  if (runtime.cooldownUntil <= now) return 1;
  const remaining = runtime.cooldownUntil - now;
  return Math.max(0, Math.min(1, 1 - remaining / 10000));
}

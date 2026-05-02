import {
  DEFAULT_PLAYER_APPEARANCE,
  EquippedCosmetics,
  PlayerAppearance,
  getPlayerAppearance,
} from "@/lib/cosmetics";

export function appearanceFromSlugs(slugs?: {
  playerShape?: string | null;
  playerColor?: string | null;
  playerEffect?: string | null;
}): PlayerAppearance {
  return getPlayerAppearance({
    player_shape: slugs?.playerShape ?? undefined,
    player_color: slugs?.playerColor ?? undefined,
    player_effect: slugs?.playerEffect ?? undefined,
  } satisfies EquippedCosmetics);
}

export function drawPlayerAvatar(
  ctx: CanvasRenderingContext2D,
  appearance: PlayerAppearance = DEFAULT_PLAYER_APPEARANCE,
  x: number,
  y: number,
  radius: number,
  time: number,
  options: { stunned?: boolean; alpha?: number } = {},
) {
  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;

  if (appearance.effect === "soft-trail") {
    ctx.fillStyle = appearance.glow;
    for (let i = 3; i >= 1; i -= 1) {
      ctx.globalAlpha = (options.alpha ?? 1) * (0.08 + i * 0.04);
      ctx.beginPath();
      ctx.arc(x - i * radius * 0.45, y + i * 1.5, radius * (1 - i * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = options.alpha ?? 1;
  }

  if (appearance.effect === "pulse-ring" || options.stunned) {
    const pulse = 1 + Math.sin(time / 180) * 0.08;
    ctx.strokeStyle = options.stunned ? "rgba(240, 95, 87, 0.72)" : appearance.glow;
    ctx.lineWidth = Math.max(2, radius * 0.16);
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.55 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (appearance.effect === "spark-pop") {
    ctx.fillStyle = appearance.glow;
    for (let i = 0; i < 5; i += 1) {
      const angle = time / 360 + i * 1.26;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * radius * 1.55,
        y + Math.sin(angle) * radius * 1.55,
        Math.max(1.5, radius * 0.13),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.fillStyle = options.stunned ? "#c9c3bd" : appearance.fill;
  ctx.strokeStyle = options.stunned ? "#f05f57" : appearance.stroke;
  ctx.lineWidth = Math.max(2, radius * 0.18);
  ctx.shadowColor = appearance.glow;
  ctx.shadowBlur = radius * 1.2;

  ctx.beginPath();
  if (appearance.shape === "diamond") {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius, y);
    ctx.closePath();
  } else if (appearance.shape === "rounded-square") {
    const side = radius * 1.55;
    const left = x - side / 2;
    const top = y - side / 2;
    ctx.roundRect(left, top, side, side, radius * 0.32);
  } else {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();
}

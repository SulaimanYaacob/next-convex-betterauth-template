"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GameHud } from "@/components/games/game-hud";
import { GameStartOverlay } from "@/components/games/game-start-overlay";
import { GameSurface } from "@/components/games/game-surface";
import { resizeCanvasToViewport } from "@/lib/canvas-stage";
import { EquippedCosmetics, SkillEffect, getPlayerAppearance } from "@/lib/cosmetics";
import { postGameMessage } from "@/lib/game-messages";
import { drawPlayerAvatar } from "@/lib/player-avatar";
import { canUseSkillInMode, getEquippedSkill } from "@/lib/skills";

type Core = { x: number; y: number; r: number; life: number; pulse: number };
type Warning = { side: number; lane: number; age: number; duration: number };
type Spike = { x: number; y: number; size: number; vx: number; vy: number; angle: number; dead?: boolean };
type Enemy = {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  variant: "drifter" | "anchor";
  chaseTime: number;
  fadeTime: number;
  alpha: number;
  dead?: boolean;
};
type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; color: string };

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function skillColor(effect: SkillEffect | null) {
  if (effect === "boost") return "#69b9b0";
  if (effect === "shield") return "#78d6ff";
  if (effect === "magnet") return "#f8d36a";
  if (effect === "stunner") return "#e68445";
  if (effect === "slowmo") return "#8fa8ff";
  return "#f8d36a";
}

export default function PixelRushPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inventory = useQuery(api.store.getViewerInventory);
  const appearance = useMemo(
    () => getPlayerAppearance(inventory?.equipped as EquippedCosmetics | undefined),
    [inventory?.equipped],
  );
  const skill = useMemo(
    () => getEquippedSkill(inventory?.equipped as Partial<Record<string, string>> | undefined),
    [inventory?.equipped],
  );
  const appearanceRef = useRef(appearance);
  const skillRef = useRef(skill);
  const [hud, setHud] = useState({
    score: 0,
    combo: 1,
    lives: 3,
    time: 60,
    skill: "No skill",
    skillReady: false,
    skillActive: false,
  });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    skillRef.current = skill;
  }, [skill]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    const state = {
      running: false,
      paused: false,
      ended: false,
      width: 0,
      height: 0,
      dpr: 1,
      mobile: false,
      score: 0,
      combo: 1,
      lives: 3,
      timeLeft: 60,
      lastTime: performance.now(),
      coreTimer: 0,
      hazardTimer: 0,
      enemyTimer: 0,
      comboTimer: 0,
      shake: 0,
      invulnerable: 0,
      skillActiveUntil: 0,
      skillCooldownUntil: 0,
      player: { x: 0, y: 0, r: 15, speed: 520 },
      pointer: null as null | { x: number; y: number },
      keys: new Set<string>(),
      cores: [] as Core[],
      warnings: [] as Warning[],
      spikes: [] as Spike[],
      enemies: [] as Enemy[],
      particles: [] as Particle[],
    };

    function resize() {
      const stage = resizeCanvasToViewport(canvasEl, context);
      state.dpr = stage.dpr;
      state.width = stage.width;
      state.height = stage.height;
      state.mobile = stage.mobile;
      state.player.r = state.mobile ? 11 : 15;
      state.player.speed = state.mobile ? 430 : 520;
      if (!state.running) {
        state.player.x = state.width / 2;
        state.player.y = state.height / 2;
      }
    }

    function syncHud(now = performance.now()) {
      const currentSkill = canUseSkillInMode(skillRef.current, "singleplayer")
        ? skillRef.current
        : null;
      setHud({
        score: state.score,
        combo: state.combo,
        lives: state.lives,
        time: Math.ceil(state.timeLeft),
        skill: currentSkill?.label ?? "No skill",
        skillReady: Boolean(currentSkill && state.skillCooldownUntil <= now),
        skillActive: Boolean(currentSkill && state.skillActiveUntil > now),
      });
    }

    function elapsed() {
      return 60 - state.timeLeft;
    }

    function hazardInterval() {
      const pressure = elapsed() / (state.mobile ? 165 : 125);
      return Math.max(
        state.mobile ? 0.74 : 0.42,
        (state.mobile ? rand(0.92, 1.38) : rand(0.66, 1)) - pressure,
      );
    }

    function enemyInterval() {
      const pressure = elapsed() / (state.mobile ? 185 : 145);
      return Math.max(
        state.mobile ? 2.8 : 1.35,
        (state.mobile ? rand(3.8, 5.8) : rand(2, 3.15)) - pressure,
      );
    }

    function spawnCore() {
      state.cores.push({
        x: rand(44, Math.max(88, state.width - 44)),
        y: rand(86, Math.max(132, state.height - 44)),
        r: rand(8, 13),
        life: 7,
        pulse: rand(0, Math.PI * 2),
      });
    }

    function spawnWarning() {
      const side = Math.floor(rand(0, 4));
      const lane =
        side < 2
          ? rand(90, Math.max(130, state.height - 50))
          : rand(50, Math.max(90, state.width - 50));
      state.warnings.push({ side, lane, age: 0, duration: 0.78 });
    }

    function materializeSpike(warning: Warning) {
      const speed =
        (state.mobile ? rand(178, 250) : rand(210, 310)) +
        Math.min(elapsed() * (state.mobile ? 1.4 : 1.9), state.mobile ? 110 : 170);
      const spike: Spike = {
        x: 0,
        y: 0,
        size: state.mobile ? rand(26, 38) : rand(30, 44),
        vx: 0,
        vy: 0,
        angle: 0,
      };
      if (warning.side === 0) {
        spike.x = -44;
        spike.y = warning.lane;
        spike.vx = speed;
        spike.angle = Math.PI / 2;
      } else if (warning.side === 1) {
        spike.x = state.width + 44;
        spike.y = warning.lane;
        spike.vx = -speed;
        spike.angle = -Math.PI / 2;
      } else if (warning.side === 2) {
        spike.x = warning.lane;
        spike.y = -44;
        spike.vy = speed;
        spike.angle = Math.PI;
      } else {
        spike.x = warning.lane;
        spike.y = state.height + 44;
        spike.vy = -speed;
      }
      state.spikes.push(spike);
    }

    function spawnEnemy() {
      const side = Math.floor(rand(0, 4));
      const variant = Math.random() < 0.58 ? "drifter" : "anchor";
      const size = state.mobile ? rand(16, 26) : rand(22, 38);
      const enemy: Enemy = {
        x: side === 0 ? -50 : side === 1 ? state.width + 50 : rand(50, state.width - 50),
        y: side === 2 ? -50 : side === 3 ? state.height + 50 : rand(90, state.height - 50),
        size,
        baseSize: size,
        vx: 0,
        vy: 0,
        angle: rand(0, Math.PI * 2),
        spin: rand(-0.95, 0.95),
        variant,
        chaseTime: variant === "drifter" ? rand(5, 8) : rand(1, 3),
        fadeTime: 0,
        alpha: 1,
      };
      state.enemies.push(enemy);
    }

    function burst(x: number, y: number, color: string, count = 12) {
      for (let i = 0; i < count; i += 1) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(80, 280);
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: rand(2, 5),
          life: rand(0.32, 0.72),
          color,
        });
      }
    }

    function endRun() {
      if (state.ended) return;
      state.running = false;
      state.ended = true;
      postGameMessage("pixel-rush", "GAME_OVER", { score: state.score });
    }

    function hitHazard(entity: { dead?: boolean }) {
      if (state.invulnerable > 0 || state.ended) return;
      const currentSkill = skillRef.current;
      if (
        currentSkill?.effect === "shield" &&
        state.skillActiveUntil > performance.now()
      ) {
        entity.dead = true;
        burst(state.player.x, state.player.y, "#69b9b0", 12);
        return;
      }
      state.lives -= 1;
      state.combo = 1;
      state.score = Math.max(0, state.score - 90);
      state.shake = 0.2;
      state.invulnerable = 1.25;
      entity.dead = true;
      burst(state.player.x, state.player.y, "#f05f57", 22);
      postGameMessage("pixel-rush", "SCORE_UPDATE", { score: state.score });
      syncHud();
      if (state.lives <= 0) endRun();
    }

    function reset() {
      Object.assign(state, {
        running: true,
        paused: false,
        ended: false,
        score: 0,
        combo: 1,
        lives: 3,
        timeLeft: 60,
        lastTime: performance.now(),
        coreTimer: 0,
        hazardTimer: 0,
        enemyTimer: state.mobile ? 3.2 : 1.8,
        comboTimer: 0,
        shake: 0,
        invulnerable: 0,
        skillActiveUntil: 0,
        skillCooldownUntil: 0,
        cores: [],
        warnings: [],
        spikes: [],
        enemies: [],
        particles: [],
      });
      state.player.x = state.width / 2;
      state.player.y = state.height / 2;
      for (let i = 0; i < 5; i += 1) spawnCore();
      setStarted(true);
      syncHud();
      postGameMessage("pixel-rush", "GAME_STARTED");
      postGameMessage("pixel-rush", "SCORE_UPDATE", { score: 0 });
    }

    function update(dt: number) {
      if (!state.running || state.paused || state.ended) return;
      const nowMs = performance.now();
      const currentSkill = skillRef.current;
      const activeSkill =
        currentSkill && state.skillActiveUntil > nowMs ? currentSkill.effect : null;
      const slowFactor = activeSkill === "slowmo" ? 0.48 : 1;
      state.timeLeft = Math.max(0, state.timeLeft - dt);
      if (state.timeLeft <= 0) {
        endRun();
        return;
      }

      let ax = 0;
      let ay = 0;
      if (state.keys.has("ArrowLeft") || state.keys.has("a")) ax -= 1;
      if (state.keys.has("ArrowRight") || state.keys.has("d")) ax += 1;
      if (state.keys.has("ArrowUp") || state.keys.has("w")) ay -= 1;
      if (state.keys.has("ArrowDown") || state.keys.has("s")) ay += 1;
      if (state.pointer) {
        const dx = state.pointer.x - state.player.x;
        const dy = state.pointer.y - state.player.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 4) {
          ax += (dx / distance) * 1.35;
          ay += (dy / distance) * 1.35;
        }
      }
      const inputLength = Math.hypot(ax, ay) || 1;
      state.player.x = clamp(
        state.player.x +
          (ax / inputLength) *
            state.player.speed *
            (activeSkill === "boost" ? 1.55 : 1) *
            dt,
        state.player.r,
        state.width - state.player.r,
      );
      state.player.y = clamp(
        state.player.y +
          (ay / inputLength) *
            state.player.speed *
            (activeSkill === "boost" ? 1.55 : 1) *
            dt,
        72,
        state.height - state.player.r,
      );

      state.coreTimer -= dt;
      if (state.coreTimer <= 0) {
        spawnCore();
        state.coreTimer = rand(0.42, 0.78);
      }
      state.hazardTimer -= dt;
      if (state.hazardTimer <= 0) {
        spawnWarning();
        state.hazardTimer = hazardInterval();
      }
      state.enemyTimer -= dt;
      if (state.enemyTimer <= 0) {
        const pressure = Math.min(elapsed() / 80, 0.18);
        if (Math.random() < (state.mobile ? 0.46 + pressure : 0.84 + pressure)) {
          spawnEnemy();
        }
        state.enemyTimer = enemyInterval();
      }

      for (const warning of state.warnings) warning.age += dt;
      const readyWarnings = state.warnings.filter((warning) => warning.age >= warning.duration);
      readyWarnings.forEach(materializeSpike);
      state.warnings = state.warnings.filter((warning) => warning.age < warning.duration);

      for (const core of state.cores) {
        if (activeSkill === "magnet") {
          const dx = state.player.x - core.x;
          const dy = state.player.y - core.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < (state.mobile ? 220 : 300)) {
            const strength = (1 - distance / (state.mobile ? 220 : 300)) * 420;
            core.x += (dx / distance) * strength * dt;
            core.y += (dy / distance) * strength * dt;
            core.pulse += dt * 9;
          }
        }
        core.life -= dt;
        core.pulse += dt * 5;
      }
      for (let i = state.cores.length - 1; i >= 0; i -= 1) {
        const core = state.cores[i];
        if (Math.hypot(state.player.x - core.x, state.player.y - core.y) < state.player.r + core.r) {
          state.cores.splice(i, 1);
          state.score += (state.mobile ? 12 : 15) * state.combo;
          state.combo = Math.min(6, state.combo + 1);
          state.comboTimer = 0;
          burst(core.x, core.y, "#e68445", 14);
          postGameMessage("pixel-rush", "SCORE_UPDATE", { score: state.score });
        }
      }
      state.cores = state.cores.filter((core) => core.life > 0);

      for (const spike of state.spikes) {
        spike.x += spike.vx * dt * slowFactor;
        spike.y += spike.vy * dt * slowFactor;
        if (Math.hypot(state.player.x - spike.x, state.player.y - spike.y) < state.player.r + spike.size * 0.48) {
          hitHazard(spike);
        }
      }
      state.spikes = state.spikes.filter(
        (spike) =>
          !spike.dead &&
          spike.x > -120 &&
          spike.x < state.width + 120 &&
          spike.y > -120 &&
          spike.y < state.height + 120,
      );

      for (const enemy of state.enemies) {
        const frozen =
          activeSkill === "stunner" &&
          Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y) < 180;
        enemy.angle += enemy.spin * dt * (frozen ? 0 : slowFactor);
        if (frozen) continue;
        if (enemy.chaseTime > 0) {
          enemy.chaseTime -= dt;
          const dx = state.player.x - enemy.x;
          const dy = state.player.y - enemy.y;
          const distance = Math.hypot(dx, dy) || 1;
          const accel = enemy.variant === "drifter" ? (state.mobile ? 42 : 58) : (state.mobile ? 118 : 150);
          enemy.vx += (dx / distance) * accel * dt * slowFactor;
          enemy.vy += (dy / distance) * accel * dt * slowFactor;
          const speed = Math.hypot(enemy.vx, enemy.vy) || 1;
          const cap = enemy.variant === "drifter" ? (state.mobile ? 92 : 126) : (state.mobile ? 152 : 205);
          if (speed > cap) {
            enemy.vx = (enemy.vx / speed) * cap;
            enemy.vy = (enemy.vy / speed) * cap;
          }
        } else if (enemy.variant === "anchor") {
          enemy.fadeTime += dt;
          enemy.vx = 0;
          enemy.vy = 0;
          const t = clamp(enemy.fadeTime / 2.4, 0, 1);
          enemy.size = enemy.baseSize * (1 - t * 0.82);
          enemy.alpha = 1 - t;
          if (t >= 1) enemy.dead = true;
        } else {
          enemy.fadeTime += dt;
          enemy.vx *= 0.997;
          enemy.vy *= 0.997;
          enemy.alpha = Math.max(0, 1 - enemy.fadeTime / 3.4);
          if (enemy.alpha <= 0.02) enemy.dead = true;
        }
        enemy.x += enemy.vx * dt * slowFactor;
        enemy.y += enemy.vy * dt * slowFactor;
        const contact = state.player.r + enemy.size * (state.mobile ? 0.48 : 0.56);
        if (!enemy.dead && enemy.alpha > 0.18 && Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y) < contact) {
          hitHazard(enemy);
        }
      }
      state.enemies = state.enemies.filter(
        (enemy) =>
          !enemy.dead &&
          enemy.x > -140 &&
          enemy.x < state.width + 140 &&
          enemy.y > -140 &&
          enemy.y < state.height + 140,
      );

      state.particles = state.particles.filter((particle) => {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= 0.94;
        particle.vy *= 0.94;
        return particle.life > 0;
      });
      state.comboTimer += dt;
      if (state.comboTimer > 2.6) state.combo = 1;
      state.shake = Math.max(0, state.shake - dt);
      state.invulnerable = Math.max(0, state.invulnerable - dt);
      syncHud(nowMs);
    }

    function drawWarning(warning: Warning) {
      const ctx = context;
      const pulse = Math.sin(warning.age * 22) * 0.5 + 0.5;
      ctx.save();
      ctx.globalAlpha = 0.35 + pulse * 0.45;
      ctx.strokeStyle = "#f05f57";
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (warning.side === 0 || warning.side === 1) {
        ctx.moveTo(0, warning.lane);
        ctx.lineTo(state.width, warning.lane);
      } else {
        ctx.moveTo(warning.lane, 0);
        ctx.lineTo(warning.lane, state.height);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawSpike(spike: Spike) {
      const ctx = context;
      ctx.save();
      ctx.translate(spike.x, spike.y);
      ctx.rotate(spike.angle);
      ctx.fillStyle = "#f05f57";
      ctx.shadowColor = "rgba(240,95,87,.42)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, -spike.size * 0.72);
      ctx.lineTo(spike.size * 0.62, spike.size * 0.58);
      ctx.lineTo(-spike.size * 0.62, spike.size * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(248,246,242,.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    function drawEnemy(enemy: Enemy) {
      const ctx = context;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      ctx.globalAlpha = enemy.alpha;
      const chasing = enemy.chaseTime > 0;
      ctx.fillStyle = chasing ? (enemy.variant === "drifter" ? "#5f78ff" : "#865cff") : "#504a71";
      ctx.shadowColor = chasing ? "rgba(111,91,255,.38)" : "rgba(105,185,176,.2)";
      ctx.shadowBlur = 16;
      ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(248,246,242,.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
      ctx.restore();
    }

    function drawSkillEffect(effect: SkillEffect | null, now: number) {
      if (!effect) return;
      const ctx = context;
      const x = state.player.x;
      const y = state.player.y;
      const color = skillColor(effect);
      const remaining = clamp((state.skillActiveUntil - now) / Math.max(1, skillRef.current?.durationMs ?? 1), 0, 1);
      const pulse = Math.sin(now / 95) * 0.5 + 0.5;

      ctx.save();
      ctx.globalAlpha = 0.26 + remaining * 0.46;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;

      if (effect === "boost") {
        const angle = state.pointer ? Math.atan2(state.pointer.y - y, state.pointer.x - x) : -Math.PI / 2;
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI);
        for (let i = 0; i < 4; i += 1) {
          const offset = 24 + i * 15 + pulse * 8;
          ctx.globalAlpha = (0.44 - i * 0.075) * remaining;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(offset, -10 - i * 2);
          ctx.lineTo(offset + 20, 0);
          ctx.lineTo(offset, 10 + i * 2);
          ctx.stroke();
        }
      }

      if (effect === "shield") {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, state.player.r + 16 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.12 + remaining * 0.14;
        ctx.beginPath();
        ctx.arc(x, y, state.player.r + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect === "magnet") {
        const radius = state.mobile ? 220 : 300;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.24 + pulse * 8, 0.18 * Math.PI, 1.74 * Math.PI);
        ctx.stroke();
        for (const core of state.cores) {
          const distance = Math.hypot(x - core.x, y - core.y);
          if (distance > radius) continue;
          ctx.globalAlpha = (1 - distance / radius) * 0.42 * remaining;
          ctx.beginPath();
          ctx.moveTo(core.x, core.y);
          ctx.quadraticCurveTo((core.x + x) / 2, (core.y + y) / 2 - 18, x, y);
          ctx.stroke();
        }
      }

      if (effect === "stunner") {
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.42 * remaining;
        ctx.beginPath();
        ctx.arc(x, y, 182 + pulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.16 * remaining;
        ctx.beginPath();
        ctx.arc(x, y, 182, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect === "slowmo") {
        ctx.globalAlpha = 0.1 * remaining;
        ctx.fillRect(0, 0, state.width, state.height);
        ctx.globalAlpha = 0.48 * remaining;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 70 + pulse * 8, -Math.PI / 2, Math.PI * 1.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(now / 420) * 34, y + Math.sin(now / 420) * 34);
        ctx.stroke();
      }

      ctx.restore();
    }

    function draw(now: number) {
      const ctx = context;
      ctx.save();
      if (state.shake) ctx.translate(rand(-6, 6), rand(-6, 6));
      ctx.clearRect(-10, -10, state.width + 20, state.height + 20);
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#f8f6f2";
      ctx.lineWidth = 1;
      for (let x = 0; x < state.width; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, state.height);
        ctx.stroke();
      }
      for (let y = 0; y < state.height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(state.width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      state.warnings.forEach(drawWarning);
      for (const core of state.cores) {
        const scale = 1 + Math.sin(core.pulse) * 0.12;
        ctx.beginPath();
        ctx.fillStyle = "#e68445";
        ctx.shadowColor = "rgba(230,132,69,.55)";
        ctx.shadowBlur = 18;
        ctx.arc(core.x, core.y, core.r * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      state.spikes.forEach(drawSpike);
      state.enemies.forEach(drawEnemy);
      for (const particle of state.particles) {
        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = state.invulnerable > 0 ? 0.55 + Math.sin(now / 55) * 0.25 : 1;
      const activeSkill =
        skillRef.current && state.skillActiveUntil > now ? skillRef.current.effect : null;
      drawSkillEffect(activeSkill, now);
      drawPlayerAvatar(ctx, appearanceRef.current, state.player.x, state.player.y, state.player.r, now);
      ctx.globalAlpha = 1;
      if (state.paused && state.running) {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(0, 0, state.width, state.height);
      }
      ctx.restore();
    }

    let frameId = 0;
    function frame(now: number) {
      const dt = Math.min(0.033, (now - state.lastTime) / 1000 || 0);
      state.lastTime = now;
      update(dt);
      draw(now);
      frameId = requestAnimationFrame(frame);
    }

    function onKeyDown(event: KeyboardEvent) {
      state.keys.add(event.key);
      if ((event.key === " " || event.key === "Spacebar") && state.running) {
        event.preventDefault();
        activateSkill();
      }
      if ((event.key === " " || event.key === "Enter") && !state.running) reset();
    }
    function onKeyUp(event: KeyboardEvent) {
      state.keys.delete(event.key);
    }
    function onPointerMove(event: PointerEvent) {
      state.pointer = { x: event.clientX, y: event.clientY };
    }
    function onPointerDown(event: PointerEvent) {
      state.pointer = { x: event.clientX, y: event.clientY };
      if (!state.running && !state.ended) reset();
      else if (event.button === 0) activateSkill();
    }
    function onPointerUp(event: PointerEvent) {
      if (event.pointerType !== "mouse") state.pointer = null;
    }
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "PLATFORM_PAUSE") state.paused = true;
      if (event.data?.type === "PLATFORM_RESUME") {
        state.paused = false;
        state.lastTime = performance.now();
      }
    }
    function onStartEvent() {
      reset();
    }

    function activateSkill() {
      const currentSkill = canUseSkillInMode(skillRef.current, "singleplayer")
        ? skillRef.current
        : null;
      const now = performance.now();
      if (!currentSkill || state.skillCooldownUntil > now || !state.running) return;
      state.skillActiveUntil = now + currentSkill.durationMs;
      state.skillCooldownUntil = now + currentSkill.cooldownMs;
      burst(state.player.x, state.player.y, skillColor(currentSkill.effect), 22);
      syncHud(now);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("message", onMessage);
    window.addEventListener("pixel-rush:start", onStartEvent);
    window.addEventListener("pixel-rush:skill", activateSkill);

    resize();
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pixel-rush:start", onStartEvent);
      window.removeEventListener("pixel-rush:skill", activateSkill);
    };
  }, []);

  return (
    <GameSurface className="font-mono">
      <canvas
        ref={canvasRef}
        aria-label="Pixel Rush game canvas"
        className="block h-full w-full touch-none bg-[radial-gradient(circle_at_25%_20%,rgba(230,132,69,.13),transparent_26rem),radial-gradient(circle_at_80%_75%,rgba(105,185,176,.12),transparent_24rem),linear-gradient(180deg,#151519_0%,#0f1013_100%)]"
      />
      <GameHud
        columns={4}
        stats={[
          ["Score", hud.score.toLocaleString()],
          ["Combo", `x${hud.combo}`],
          ["Lives", String(hud.lives)],
          ["Time", String(hud.time)],
        ]}
      />
      {started && (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("pixel-rush:skill"))}
          className="fixed bottom-4 right-4 z-20 min-h-11 rounded-md border border-white/10 bg-black/55 px-4 text-sm font-semibold text-white/80 backdrop-blur"
        >
          {hud.skillActive
            ? `${hud.skill} active`
            : hud.skillReady
              ? hud.skill
              : `${hud.skill} charging`}
        </button>
      )}
      {!started && (
        <GameStartOverlay
          title="Pixel Rush"
          description="Collect bright cores, dodge sharp hazards, and survive the full run."
          buttonLabel="Start run"
          accentClassName="bg-[#e68445]"
          chips={["mouse follows", "WASD / arrows", "3 lives"]}
          onStart={() => window.dispatchEvent(new Event("pixel-rush:start"))}
        />
      )}
    </GameSurface>
  );
}

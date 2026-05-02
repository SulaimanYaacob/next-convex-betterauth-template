"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CosmeticType, getCosmeticMeta } from "@/lib/cosmetics";

interface TrailDot {
  id: number;
  x: number;
  y: number;
}

export function CosmeticsApplicator() {
  const inventory = useQuery(api.store.getViewerInventory);
  const [dots, setDots] = useState<TrailDot[]>([]);
  const nextDot = useRef(0);

  const equipped = (inventory?.equipped ?? {}) as Partial<
    Record<CosmeticType, string>
  >;
  const cursor = getCosmeticMeta(equipped.cursor_skin);
  const trail = getCosmeticMeta(equipped.cursor_trail);
  const theme = getCosmeticMeta(equipped.ui_theme);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (cursor?.cursor) {
      root.style.cursor = cursor.cursor;
      body.style.cursor = cursor.cursor;
      root.dataset.cursorSkin = cursor.slug;
    } else {
      root.style.removeProperty("cursor");
      body.style.removeProperty("cursor");
      delete root.dataset.cursorSkin;
    }

    return () => {
      root.style.removeProperty("cursor");
      body.style.removeProperty("cursor");
      delete root.dataset.cursorSkin;
    };
  }, [cursor]);

  useEffect(() => {
    const root = document.documentElement;
    const keys = [
      "background",
      "foreground",
      "primary",
      "secondary",
      "muted",
      "accent",
      "border",
    ] as const;

    if (theme?.theme) {
      root.dataset.theme = theme.slug;
      for (const key of keys) {
        root.style.setProperty(`--${key}`, theme.theme[key]);
      }
      root.style.setProperty("--card", theme.theme.background);
      root.style.setProperty("--popover", theme.theme.background);
      root.style.setProperty("--input", theme.theme.border);
      root.style.setProperty("--ring", theme.theme.primary);
    } else if (root.dataset.theme) {
      delete root.dataset.theme;
      for (const key of keys) root.style.removeProperty(`--${key}`);
      root.style.removeProperty("--card");
      root.style.removeProperty("--popover");
      root.style.removeProperty("--input");
      root.style.removeProperty("--ring");
    }
  }, [theme]);

  useEffect(() => {
    if (!trail?.trail) {
      setDots([]);
      return;
    }

    function onPointerMove(event: PointerEvent) {
      const id = nextDot.current++;
      setDots((current) =>
        [...current.slice(-7), { id, x: event.clientX, y: event.clientY }],
      );
      window.setTimeout(() => {
        setDots((current) => current.filter((dot) => dot.id !== id));
      }, 420);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [trail]);

  if (!trail?.trail || dots.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {dots.map((dot, index) => (
        <span
          key={dot.id}
          className="absolute rounded-full transition-opacity duration-500"
          style={{
            width: trail.trail?.size,
            height: trail.trail?.size,
            left: dot.x,
            top: dot.y,
            transform: "translate(-50%, -50%)",
            background: trail.trail?.color,
            boxShadow: trail.trail?.shadow,
            opacity: (index + 1) / dots.length,
          }}
        />
      ))}
    </div>
  );
}

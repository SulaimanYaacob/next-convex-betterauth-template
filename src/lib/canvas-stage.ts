export type CanvasStage = {
  width: number;
  height: number;
  dpr: number;
  mobile: boolean;
};

export function resizeCanvasToViewport(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): CanvasStage {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const mobile =
    width <= 640 ||
    height <= 520 ||
    window.matchMedia("(pointer: coarse)").matches;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width, height, dpr, mobile };
}

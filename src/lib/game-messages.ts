export type GameId = "pixel-rush" | "mind-maze" | "duel-dash";

export type PlatformGameMessage =
  | { type: "GAME_STARTED"; gameId: GameId }
  | { type: "SCORE_UPDATE"; gameId: GameId; score: number }
  | { type: "GAME_OVER"; gameId: GameId; score: number }
  | { type: "GAME_PAUSE_TOGGLE"; gameId: GameId };

export function postGameMessage(
  gameId: GameId,
  type: PlatformGameMessage["type"],
  payload: Record<string, unknown> = {},
) {
  window.parent.postMessage({ type, gameId, ...payload }, "*");
}

export function isPlatformPauseMessage(event: MessageEvent) {
  return event.data?.type === "PLATFORM_PAUSE";
}

export function isPlatformResumeMessage(event: MessageEvent) {
  return event.data?.type === "PLATFORM_RESUME";
}

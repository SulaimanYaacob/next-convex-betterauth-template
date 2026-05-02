export class SignalClashRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.players = new Map();
    this.match = {
      phase: "waiting",
      countdownEndsAt: 0,
      startedAt: 0,
      endsAt: 0,
      signal: randomSignal(),
      hazards: randomHazards(),
    };
  }

  async fetch(request) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Signal Clash room expects WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, server);

    server.addEventListener("message", (event) => {
      void this.handleMessage(sessionId, event.data);
    });
    server.addEventListener("close", () => this.leave(sessionId));
    server.addEventListener("error", () => this.leave(sessionId));
    server.send(JSON.stringify({ type: "hello", sessionId }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async handleMessage(sessionId, raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.type === "join") {
      const payload = await this.verifyTicket(message.ticket);
      if (!payload) {
        this.sessions.get(sessionId)?.send(JSON.stringify({ type: "error", reason: "invalid_ticket" }));
        this.sessions.get(sessionId)?.close(1008, "Invalid Signal Clash ticket");
        return;
      }

      this.players.set(sessionId, {
        id: payload.userId,
        displayName: payload.displayName ?? "Player",
        x: 0.5,
        y: 0.7,
        score: 0,
        recovery: 0,
        downed: false,
        lastSeen: Date.now(),
        skillPrimary: payload.skillPrimary,
        playerShape: payload.playerShape,
        playerColor: payload.playerColor,
        playerEffect: payload.playerEffect,
      });
      this.maybeStart();
      this.broadcastState();
      return;
    }

    const player = this.players.get(sessionId);
    if (!player) return;

    if (message.type === "move" && !player.downed && this.match.phase === "playing") {
      player.lastSeen = Date.now();
      player.x = clamp(message.x, 0.04, 0.96);
      player.y = clamp(message.y, 0.12, 0.94);
      const signalRange =
        player.skillUntil > Date.now() && player.skillEffect === "magnet" ? 0.13 : 0.055;
      if (distance(player, this.match.signal) < signalRange) {
        player.score += this.match.signal.value;
        this.match.signal = randomSignal();
      } else if (player.skillUntil > Date.now() && player.skillEffect === "magnet") {
        const dx = player.x - this.match.signal.x;
        const dy = player.y - this.match.signal.y;
        const pullDistance = Math.hypot(dx, dy) || 1;
        if (pullDistance < 0.34) {
          this.match.signal = {
            ...this.match.signal,
            x: clamp(this.match.signal.x + (dx / pullDistance) * 0.018, 0.08, 0.92),
            y: clamp(this.match.signal.y + (dy / pullDistance) * 0.018, 0.18, 0.9),
          };
        }
      }
      const protectedBySkill =
        player.skillUntil > Date.now() &&
        (player.skillEffect === "shield" || player.skillEffect === "stunner");
      for (const hazard of this.match.hazards) {
        if (distance(player, hazard) < hazard.r + 0.03 && !protectedBySkill) {
          player.downed = true;
          player.recovery = 0;
          break;
        }
      }
      this.broadcastState();
      return;
    }

    if (message.type === "recover" && player.downed) {
      player.lastSeen = Date.now();
      player.recovery = Math.min(1, player.recovery + 0.18);
      if (player.recovery >= 1) {
        player.downed = false;
        player.recovery = 0;
      }
      this.broadcastState();
      return;
    }

    if (message.type === "skill" && !player.downed) {
      player.lastSeen = Date.now();
      player.skillEffect = message.effect;
      player.skillUntil = Date.now() + Math.min(3500, message.durationMs ?? 2000);
      this.broadcastState();
    }
  }

  async verifyTicket(ticket) {
    if (typeof ticket !== "string") return null;
    const [encodedPayload, signature] = ticket.split(".");
    if (!encodedPayload || !signature) return null;

    const secret = this.env.SIGNAL_CLASH_TICKET_SECRET ?? "dev-signal-clash";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
    if (!timingSafeEqual(base64ToBytes(signature), new Uint8Array(expected))) return null;

    try {
      const payload = JSON.parse(atob(encodedPayload));
      if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }

  maybeStart() {
    const now = Date.now();
    if (this.players.size < 2 || this.match.phase !== "waiting") return;
    this.match.phase = "countdown";
    this.match.countdownEndsAt = now + 3500;
    setTimeout(() => {
      if (this.players.size < 2) {
        this.match.phase = "waiting";
      } else {
        this.match.phase = "playing";
        this.match.startedAt = Date.now();
        this.match.endsAt = this.match.startedAt + 60000;
      }
      this.broadcastState();
    }, 3500);
  }

  leave(sessionId) {
    this.sessions.delete(sessionId);
    this.players.delete(sessionId);
    if (this.players.size < 2 && this.match.phase !== "waiting") {
      this.match.phase = "waiting";
    }
    this.broadcastState();
  }

  broadcastState() {
    const now = Date.now();
    if (this.match.phase === "playing" && now >= this.match.endsAt) {
      this.match.phase = "ended";
    }

    const payload = JSON.stringify({
      type: "state",
      now,
      match: this.match,
      players: [...this.players.values()],
    });
    for (const socket of this.sessions.values()) {
      socket.send(payload);
    }
  }
}

export default {
  async fetch(request, env) {
    const id = env.SIGNAL_CLASH_ROOM.idFromName("global");
    return env.SIGNAL_CLASH_ROOM.get(id).fetch(request);
  },
};

function randomSignal() {
  return { x: Math.random() * 0.82 + 0.09, y: Math.random() * 0.72 + 0.18, value: 10 };
}

function randomHazards() {
  return Array.from({ length: 5 }, () => ({
    x: Math.random() * 0.8 + 0.1,
    y: Math.random() * 0.64 + 0.22,
    r: Math.random() * 0.012 + 0.026,
  }));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Eye, Skull, Activity } from "lucide-react";

type TerrainType = "plains" | "forest" | "mountain" | "ruins";
type ZombieAIState = "wandering" | "chasing" | "investigating" | "returning";

interface Vec2 { x: number; y: number; }
interface Tile { terrain: TerrainType; }

interface SandboxSurvivor {
  id: number; pos: Vec2; dead: boolean; speed: number;
  targetPos: Vec2 | null;
}

interface SandboxZombie {
  id: number; pos: Vec2; dead: boolean;
  vel: Vec2; alertRadius: number;
  zombieState: ZombieAIState;
  chaseTicks: number;
  patrolTarget: Vec2 | null;
  homePos: Vec2;
  lastSeenTarget: Vec2 | null;
  alertedByNoise: boolean;
  noiseTarget: Vec2 | null;
  tier: number;
  ticksUntilMove: number;
}

interface NoiseEvent { pos: Vec2; radius: number; ticksLeft: number; maxTicks: number; }
interface LogEntry { tick: number; text: string; }

const MAP_SIZE = 20;
const TILE_PX = 28;
const ZOMBIE_ALERT = 9;
const PATROL_RADIUS = 8;
const PATROL_SPEED_MULT = 0.6;
const CHASE_LOSE_TICKS = 120;
const FOREST_LOS_RANGE = 5;
const PATROL_PAUSE_MIN = 30;
const PATROL_PAUSE_MAX = 80;

const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains: "#5a8c3a", forest: "#2a5e2a", mountain: "#7a6a5a", ruins: "#5a5a5a",
};

function generateSandboxMap(): Tile[][] {
  const tiles: Tile[][] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      let terrain: TerrainType = "plains";
      if ((x >= 8 && x <= 9 && y >= 3 && y <= 8) ||
          (x >= 14 && x <= 15 && y >= 10 && y <= 16)) terrain = "mountain";
      else if ((x >= 4 && x <= 6 && y >= 12 && y <= 15)) terrain = "ruins";
      else if ((x >= 11 && x <= 14 && y >= 2 && y <= 5) ||
               (x >= 2 && x <= 4 && y >= 6 && y <= 9)) terrain = "forest";
      tiles[y][x] = { terrain };
    }
  }
  return tiles;
}

function hasLineOfSight(from: Vec2, to: Vec2, tiles: Tile[][]): boolean {
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return true;
  const steps = Math.ceil(dist * 2);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const cx = from.x + dx * t, cy = from.y + dy * t;
    const tx = Math.floor(cx), ty = Math.floor(cy);
    if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
    const terrain = tiles[ty][tx].terrain;
    if (terrain === "mountain" || terrain === "ruins") return false;
    if (terrain === "forest" && dist > FOREST_LOS_RANGE) return false;
  }
  return true;
}

function pickPatrolTarget(home: Vec2): Vec2 {
  const angle = Math.random() * Math.PI * 2;
  const r = 2 + Math.random() * (PATROL_RADIUS - 2);
  return {
    x: Math.max(1, Math.min(MAP_SIZE - 1, home.x + Math.cos(angle) * r)),
    y: Math.max(1, Math.min(MAP_SIZE - 1, home.y + Math.sin(angle) * r)),
  };
}

interface SandboxState {
  tick: number;
  tiles: Tile[][];
  survivors: SandboxSurvivor[];
  zombies: SandboxZombie[];
  noiseEvents: NoiseEvent[];
  log: LogEntry[];
  paused: boolean;
  showLOS: boolean;
}

function createInitialState(): SandboxState {
  const tiles = generateSandboxMap();
  const survivors: SandboxSurvivor[] = [
    { id: 1, pos: { x: 3, y: 3 }, dead: false, speed: 0.04, targetPos: null },
    { id: 2, pos: { x: 16, y: 16 }, dead: false, speed: 0.035, targetPos: null },
  ];
  const zombies: SandboxZombie[] = [
    {
      id: 10, pos: { x: 10, y: 10 }, dead: false, vel: { x: 0, y: 0 },
      alertRadius: ZOMBIE_ALERT, zombieState: "wandering", chaseTicks: 0,
      patrolTarget: null, homePos: { x: 10, y: 10 }, lastSeenTarget: null,
      alertedByNoise: false, noiseTarget: null, tier: 0, ticksUntilMove: 0,
    },
    {
      id: 11, pos: { x: 5, y: 15 }, dead: false, vel: { x: 0, y: 0 },
      alertRadius: ZOMBIE_ALERT, zombieState: "wandering", chaseTicks: 0,
      patrolTarget: null, homePos: { x: 5, y: 15 }, lastSeenTarget: null,
      alertedByNoise: false, noiseTarget: null, tier: 0, ticksUntilMove: 0,
    },
    {
      id: 12, pos: { x: 17, y: 4 }, dead: false, vel: { x: 0, y: 0 },
      alertRadius: ZOMBIE_ALERT + 2, zombieState: "wandering", chaseTicks: 0,
      patrolTarget: null, homePos: { x: 17, y: 4 }, lastSeenTarget: null,
      alertedByNoise: false, noiseTarget: null, tier: 2, ticksUntilMove: 0,
    },
  ];
  return { tick: 0, tiles, survivors, zombies, noiseEvents: [], log: [], paused: true, showLOS: true };
}

function tickSandbox(state: SandboxState): SandboxState {
  const tick = state.tick + 1;
  const noise = state.noiseEvents.map(n => ({ ...n, ticksLeft: n.ticksLeft - 1 })).filter(n => n.ticksLeft > 0);
  const log = [...state.log];
  const addLog = (text: string) => { if (log.length > 60) log.pop(); log.unshift({ tick, text }); };

  const survivors = state.survivors.map(s => {
    if (s.dead) return s;
    s = { ...s, pos: { ...s.pos } };
    if (!s.targetPos || Math.hypot(s.targetPos.x - s.pos.x, s.targetPos.y - s.pos.y) < 0.5) {
      s.targetPos = {
        x: 2 + Math.random() * (MAP_SIZE - 4),
        y: 2 + Math.random() * (MAP_SIZE - 4),
      };
    }
    const dx = s.targetPos.x - s.pos.x, dy = s.targetPos.y - s.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.3) {
      s.pos.x += (dx / dist) * s.speed;
      s.pos.y += (dy / dist) * s.speed;
    }
    s.pos.x = Math.max(0.5, Math.min(MAP_SIZE - 0.5, s.pos.x));
    s.pos.y = Math.max(0.5, Math.min(MAP_SIZE - 0.5, s.pos.y));
    return s;
  });

  const zombies = state.zombies.map(z => {
    if (z.dead) return z;
    z = { ...z, pos: { ...z.pos }, vel: { ...z.vel }, homePos: { ...z.homePos } };
    if (z.patrolTarget) z.patrolTarget = { ...z.patrolTarget };
    if (z.noiseTarget) z.noiseTarget = { ...z.noiseTarget };
    if (z.lastSeenTarget) z.lastSeenTarget = { ...z.lastSeenTarget };

    if (z.ticksUntilMove > 0) { z.ticksUntilMove--; return z; }
    z.ticksUntilMove = 1;

    const prevState = z.zombieState;

    if (!z.alertedByNoise) {
      for (const n of noise) {
        if (Math.hypot(n.pos.x - z.pos.x, n.pos.y - z.pos.y) < n.radius) {
          z.alertedByNoise = true;
          z.noiseTarget = { ...n.pos };
          if (z.zombieState === "wandering") {
            z.zombieState = "investigating";
          }
          break;
        }
      }
    }

    let nearest: SandboxSurvivor | null = null, nearestDist = Infinity;
    for (const s of survivors) {
      if (s.dead) continue;
      const dist = Math.hypot(s.pos.x - z.pos.x, s.pos.y - z.pos.y);
      if (dist < z.alertRadius && dist < nearestDist) {
        if (hasLineOfSight(z.pos, s.pos, state.tiles)) {
          nearestDist = dist;
          nearest = s;
        }
      }
    }

    const chaseThreshold = CHASE_LOSE_TICKS + z.tier * 30;
    const speed = 0.028;

    if (nearest) {
      z.zombieState = "chasing";
      z.chaseTicks = 0;
      z.alertedByNoise = false;
      z.noiseTarget = null;
      z.patrolTarget = null;
      z.lastSeenTarget = { ...nearest.pos };
      const dx = nearest.pos.x - z.pos.x, dy = nearest.pos.y - z.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.4) { z.pos.x += (dx / dist) * speed; z.pos.y += (dy / dist) * speed; }
    } else if (z.zombieState === "chasing") {
      z.chaseTicks++;
      if (z.chaseTicks >= chaseThreshold) {
        z.zombieState = "returning";
        z.chaseTicks = 0;
        z.patrolTarget = { ...z.homePos };
        z.lastSeenTarget = null;
      } else if (z.lastSeenTarget) {
        const dx = z.lastSeenTarget.x - z.pos.x, dy = z.lastSeenTarget.y - z.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.5) {
          z.pos.x += (dx / dist) * speed * 0.7;
          z.pos.y += (dy / dist) * speed * 0.7;
        }
      }
    } else if (z.alertedByNoise && z.noiseTarget) {
      z.zombieState = "investigating";
      const dx = z.noiseTarget.x - z.pos.x, dy = z.noiseTarget.y - z.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) { z.pos.x += (dx / dist) * speed; z.pos.y += (dy / dist) * speed; }
      else { z.alertedByNoise = false; z.noiseTarget = null; z.zombieState = "wandering"; }
    } else if (z.zombieState === "returning") {
      const dx = z.homePos.x - z.pos.x, dy = z.homePos.y - z.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1.5) {
        z.pos.x += (dx / dist) * speed * PATROL_SPEED_MULT;
        z.pos.y += (dy / dist) * speed * PATROL_SPEED_MULT;
      } else {
        z.zombieState = "wandering";
        z.patrolTarget = null;
      }
    } else {
      z.zombieState = "wandering";
      if (!z.patrolTarget) {
        z.patrolTarget = pickPatrolTarget(z.homePos);
        z.ticksUntilMove = PATROL_PAUSE_MIN + Math.floor(Math.random() * (PATROL_PAUSE_MAX - PATROL_PAUSE_MIN));
        z.pos.x = Math.max(0.5, Math.min(MAP_SIZE - 0.5, z.pos.x));
        z.pos.y = Math.max(0.5, Math.min(MAP_SIZE - 0.5, z.pos.y));
        return z;
      }
      const dx = z.patrolTarget.x - z.pos.x, dy = z.patrolTarget.y - z.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        const patrolSpeed = speed * PATROL_SPEED_MULT;
        z.pos.x += (dx / dist) * patrolSpeed;
        z.pos.y += (dy / dist) * patrolSpeed;
      } else {
        z.patrolTarget = null;
      }
    }

    if (z.zombieState !== prevState) {
      if (z.zombieState === "chasing" && prevState !== "chasing") {
        addLog(`Z${z.id} spotted a survivor!`);
      } else if (z.zombieState === "investigating" && prevState !== "investigating") {
        addLog(`Z${z.id} investigating noise`);
      } else if (z.zombieState === "returning" && prevState === "chasing") {
        addLog(`Z${z.id} lost interest, gave up chase`);
      } else if (z.zombieState === "wandering" && prevState === "returning") {
        addLog(`Z${z.id} returned to patrol`);
      } else if (z.zombieState === "wandering" && prevState === "investigating") {
        addLog(`Z${z.id} found nothing, resuming patrol`);
      }
    }

    z.pos.x = Math.max(0.5, Math.min(MAP_SIZE - 0.5, z.pos.x));
    z.pos.y = Math.max(0.5, Math.min(MAP_SIZE - 0.5, z.pos.y));
    return z;
  });

  return { ...state, tick, survivors, zombies, noiseEvents: noise, log };
}

const STATE_COLORS: Record<ZombieAIState, string> = {
  wandering: "#88ff88",
  chasing: "#ff4444",
  investigating: "#ffaa00",
  returning: "#4488ff",
};

const ZombieAISandbox: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<SandboxState>(createInitialState);
  const animRef = useRef<number>(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const tick = useCallback(() => {
    if (!stateRef.current.paused) {
      setState(prev => tickSandbox(prev));
    }
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / TILE_PX;
    const y = (e.clientY - rect.top) / TILE_PX;
    setState(prev => ({
      ...prev,
      noiseEvents: [
        ...prev.noiseEvents,
        { pos: { x, y }, radius: 12, ticksLeft: 60, maxTicks: 60 },
      ],
      log: [{ tick: prev.tick, text: `Noise created at (${x.toFixed(1)}, ${y.toFixed(1)})` }, ...prev.log].slice(0, 60),
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = MAP_SIZE * TILE_PX, H = MAP_SIZE * TILE_PX;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    for (let ty = 0; ty < MAP_SIZE; ty++) {
      for (let tx = 0; tx < MAP_SIZE; tx++) {
        const tile = state.tiles[ty][tx];
        ctx.fillStyle = TERRAIN_COLORS[tile.terrain];
        ctx.fillRect(tx * TILE_PX, ty * TILE_PX, TILE_PX, TILE_PX);
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx * TILE_PX, ty * TILE_PX, TILE_PX, TILE_PX);
      }
    }

    for (const n of state.noiseEvents) {
      const px = n.pos.x * TILE_PX, py = n.pos.y * TILE_PX;
      const prog = 1 - n.ticksLeft / n.maxTicks;
      ctx.beginPath();
      ctx.arc(px, py, n.radius * prog * TILE_PX, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,200,50,${(1 - prog) * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (state.showLOS) {
      for (const z of state.zombies) {
        if (z.dead) continue;
        ctx.beginPath();
        ctx.arc(z.pos.x * TILE_PX, z.pos.y * TILE_PX, z.alertRadius * TILE_PX, 0, Math.PI * 2);
        ctx.strokeStyle = `${STATE_COLORS[z.zombieState]}44`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const s of state.survivors) {
          if (s.dead) continue;
          const dist = Math.hypot(s.pos.x - z.pos.x, s.pos.y - z.pos.y);
          if (dist < z.alertRadius) {
            const los = hasLineOfSight(z.pos, s.pos, state.tiles);
            ctx.beginPath();
            ctx.moveTo(z.pos.x * TILE_PX, z.pos.y * TILE_PX);
            ctx.lineTo(s.pos.x * TILE_PX, s.pos.y * TILE_PX);
            ctx.strokeStyle = los ? "rgba(255,0,0,0.5)" : "rgba(255,255,0,0.3)";
            ctx.lineWidth = los ? 2 : 1;
            ctx.setLineDash(los ? [] : [3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        if (z.patrolTarget) {
          ctx.beginPath();
          ctx.moveTo(z.pos.x * TILE_PX, z.pos.y * TILE_PX);
          ctx.lineTo(z.patrolTarget.x * TILE_PX, z.patrolTarget.y * TILE_PX);
          ctx.strokeStyle = "rgba(136,255,136,0.3)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    for (const z of state.zombies) {
      if (z.dead) continue;
      const px = z.pos.x * TILE_PX, py = z.pos.y * TILE_PX;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = STATE_COLORS[z.zombieState];
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#fff";
      ctx.fillText(z.zombieState.slice(0, 3).toUpperCase(), px, py - 10);
      if (z.zombieState === "chasing") {
        ctx.fillStyle = "#ffaaaa";
        ctx.fillText(`${z.chaseTicks}/${CHASE_LOSE_TICKS + z.tier * 30}`, px, py - 19);
      }

      ctx.beginPath();
      ctx.arc(z.homePos.x * TILE_PX, z.homePos.y * TILE_PX, 4, 0, Math.PI * 2);
      ctx.fillStyle = `${STATE_COLORS[z.zombieState]}66`;
      ctx.fill();
    }

    for (const s of state.survivors) {
      if (s.dead) continue;
      const px = s.pos.x * TILE_PX, py = s.pos.y * TILE_PX;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#00ccff";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#aaffff";
      ctx.fillText(`S${s.id}`, px, py - 10);
    }
  }, [state]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="shrink-0 bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-3">
        <span className="font-bold text-sm">Zombie AI Sandbox</span>
        <button
          onClick={() => setState(prev => ({ ...prev, paused: !prev.paused }))}
          className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
        >
          {state.paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          {state.paused ? "Play" : "Pause"}
        </button>
        <button
          onClick={() => setState(createInitialState)}
          className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={() => setState(prev => ({ ...prev, showLOS: !prev.showLOS }))}
          className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${state.showLOS ? 'bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          <Eye className="w-3 h-3" /> LOS
        </button>
        <span className="text-xs text-gray-500 ml-2">Tick: {state.tick}</span>
        <span className="text-xs text-gray-500">Click map to create noise</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-gray-700 cursor-crosshair"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        <div className="w-72 shrink-0 border-l border-gray-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <div className="text-xs font-bold mb-2 flex items-center gap-1"><Skull className="w-3 h-3" /> Zombies</div>
            {state.zombies.map(z => (
              <div key={z.id} className="text-xs mb-1 p-1.5 bg-gray-800 rounded flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: STATE_COLORS[z.zombieState] }} />
                <span>Z{z.id} T{z.tier}</span>
                <span className="font-mono" style={{ color: STATE_COLORS[z.zombieState] }}>
                  {z.zombieState}
                </span>
                {z.zombieState === "chasing" && (
                  <span className="text-red-400 ml-auto">
                    {z.chaseTicks}/{CHASE_LOSE_TICKS + z.tier * 30}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-b border-gray-700">
            <div className="text-xs font-bold mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Legend</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(Object.entries(STATE_COLORS) as [ZombieAIState, string][]).map(([s, c]) => (
                <div key={s} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  {s}
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <div>Brown/Gray = Mountain/Ruins (blocks LOS)</div>
              <div>Dark Green = Forest (blocks LOS at range &gt;{FOREST_LOS_RANGE})</div>
              <div>Red line = LOS clear | Yellow dash = LOS blocked</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-bold mb-2">Log</div>
            {state.log.slice(0, 30).map((entry, i) => (
              <div key={i} className="text-xs text-gray-400 mb-0.5">
                <span className="text-gray-600">[{entry.tick}]</span> {entry.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZombieAISandbox;

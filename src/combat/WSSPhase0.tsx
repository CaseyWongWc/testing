import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipForward, RotateCcw, ZoomIn, ZoomOut,
  Eye, Crosshair, Move, Settings, ChevronDown, ChevronUp
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type TerrainType = "plains" | "forest" | "mountain" | "desert" | "swamp" | "ruins";
type FactionType = "PLAYER_TEAM" | "HOSTILE" | "NEUTRAL";
type CameraMode = "observer" | "survivor" | "free";
type BrainType = "balanced" | "aggressive" | "cautious" | "survivalist" | "money";
type EntityKind = "survivor" | "zombie" | "nest" | "portal";

interface Tile {
  terrain: TerrainType;
  elevation: number;
  fogState: "hidden" | "explored" | "visible";
}

interface Vec2 { x: number; y: number; }

interface Entity {
  id: number;
  kind: EntityKind;
  pos: Vec2;
  health: number;
  maxHealth: number;
  faction: FactionType;
}

interface Survivor extends Entity {
  kind: "survivor";
  brain: BrainType;
  stamina: number;
  hunger: number;
  thirst: number;
  vel: Vec2;
  targetPos: Vec2 | null;
  ticksUntilNewTarget: number;
  name: string;
}

interface Zombie extends Entity {
  kind: "zombie";
  vel: Vec2;
  alertRadius: number;
  ticksUntilMove: number;
}

interface CorruptionNest extends Entity {
  kind: "nest";
  spawnCooldown: number;
  maxCooldown: number;
}

interface RiftPortal extends Entity {
  kind: "portal";
  sealed: boolean;
  objectivesNeeded: number;
  objectivesComplete: number;
}

type AnyEntity = Survivor | Zombie | CorruptionNest | RiftPortal;

interface GameSettings {
  seed: number;
  mapSize: 30 | 40 | 60;
  survivorCount: number;
  zombieCount: number;
  nestCount: number;
  speed: 0 | 1 | 2 | 4 | 8;
}

interface GameState {
  tick: number;
  tiles: Tile[][];
  entities: AnyEntity[];
  nextId: number;
  settings: GameSettings;
  running: boolean;
  log: string[];
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
  mode: CameraMode;
  followId: number | null;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TILE_SIZE = 18;
const SURVIVOR_RADIUS = 0.38;
const ZOMBIE_RADIUS = 0.35;
const NEST_RADIUS = 0.45;

const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains:   "#5a8c3a",
  forest:   "#2a5e2a",
  mountain: "#7a6a5a",
  desert:   "#c8a855",
  swamp:    "#3d5c38",
  ruins:    "#5a5a5a",
};

const TERRAIN_DARK: Record<TerrainType, string> = {
  plains:   "#3d6128",
  forest:   "#1a4a1a",
  mountain: "#5a4e42",
  desert:   "#a88a3a",
  swamp:    "#2a3f26",
  ruins:    "#3a3a3a",
};

const BRAIN_COLORS: Record<BrainType, string> = {
  balanced:    "#00ff88",
  aggressive:  "#ff6600",
  cautious:    "#00ccff",
  survivalist: "#ffff00",
  money:       "#ffcc00",
};

const BRAIN_NAMES: Record<BrainType, string> = {
  balanced:    "Balanced",
  aggressive:  "Aggressive",
  cautious:    "Cautious",
  survivalist: "Survivalist",
  money:       "Money",
};

const SURVIVOR_NAMES = [
  "Aria", "Boone", "Cal", "Dex", "Eva",
  "Finn", "Gray", "Hale", "Iris", "Jax"
];

const BRAINS: BrainType[] = ["balanced", "aggressive", "cautious", "survivalist", "money"];

// ─── SEEDED PRNG ──────────────────────────────────────────────────────────────

function makePRNG(seed: number) {
  let s = seed >>> 0;
  return function rand(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── MAP GENERATION ───────────────────────────────────────────────────────────

function generateMap(settings: GameSettings): Tile[][] {
  const { seed, mapSize } = settings;
  const rand = makePRNG(seed);
  const size = mapSize;

  // Create biome centers (Voronoi approach)
  const centerCount = Math.floor(size / 6);
  const centers: { x: number; y: number; terrain: TerrainType }[] = [];
  const terrains: TerrainType[] = ["plains", "forest", "mountain", "desert", "swamp", "ruins"];

  for (let i = 0; i < centerCount; i++) {
    centers.push({
      x: rand() * size,
      y: rand() * size,
      terrain: terrains[Math.floor(rand() * terrains.length)],
    });
  }

  const tiles: Tile[][] = [];
  for (let y = 0; y < size; y++) {
    tiles[y] = [];
    for (let x = 0; x < size; x++) {
      let minDist = Infinity;
      let chosenTerrain: TerrainType = "plains";
      for (const c of centers) {
        const dist = Math.hypot(x - c.x, y - c.y) + rand() * 3;
        if (dist < minDist) { minDist = dist; chosenTerrain = c.terrain; }
      }
      // Ruins are rare — override sometimes
      if (rand() < 0.015) chosenTerrain = "ruins";
      tiles[y][x] = {
        terrain: chosenTerrain,
        elevation: rand(),
        fogState: "hidden",
      };
    }
  }

  // Reveal starting area (center) so we can see survivors
  const half = Math.floor(size / 2);
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const tx = half + dx, ty = half + dy;
      if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
        tiles[ty][tx].fogState = "visible";
      }
    }
  }

  return tiles;
}

// ─── ENTITY SPAWNING ─────────────────────────────────────────────────────────

function spawnEntities(settings: GameSettings, rand: () => number): AnyEntity[] {
  const { mapSize, survivorCount, zombieCount, nestCount } = settings;
  const size = mapSize;
  const half = size / 2;
  const entities: AnyEntity[] = [];
  let nextId = 1;

  // Survivors spawn center
  for (let i = 0; i < survivorCount; i++) {
    const angle = (i / survivorCount) * Math.PI * 2;
    const r = 1.5 + rand() * 1.5;
    const survivor: Survivor = {
      id: nextId++,
      kind: "survivor",
      faction: "PLAYER_TEAM",
      pos: { x: half + Math.cos(angle) * r, y: half + Math.sin(angle) * r },
      health: 100, maxHealth: 100,
      stamina: 100, hunger: 100, thirst: 100,
      brain: BRAINS[i % BRAINS.length],
      vel: { x: 0, y: 0 },
      targetPos: null,
      ticksUntilNewTarget: 0,
      name: SURVIVOR_NAMES[i % SURVIVOR_NAMES.length],
    };
    entities.push(survivor);
  }

  // Rift portal — center, sealed
  const portal: RiftPortal = {
    id: nextId++, kind: "portal", faction: "NEUTRAL",
    pos: { x: half, y: half },
    health: 999, maxHealth: 999,
    sealed: true, objectivesNeeded: 3, objectivesComplete: 0,
  };
  entities.push(portal);

  // Corruption Nests — scattered edges
  for (let i = 0; i < nestCount; i++) {
    const side = Math.floor(rand() * 4);
    const margin = 3;
    let nx: number, ny: number;
    if (side === 0) { nx = margin + rand() * (size - margin * 2); ny = margin; }
    else if (side === 1) { nx = size - margin; ny = margin + rand() * (size - margin * 2); }
    else if (side === 2) { nx = margin + rand() * (size - margin * 2); ny = size - margin; }
    else { nx = margin; ny = margin + rand() * (size - margin * 2); }
    const nest: CorruptionNest = {
      id: nextId++, kind: "nest", faction: "HOSTILE",
      pos: { x: nx, y: ny }, health: 80, maxHealth: 80,
      spawnCooldown: Math.floor(rand() * 200),
      maxCooldown: 300 + Math.floor(rand() * 200),
    };
    entities.push(nest);
  }

  // Initial zombies — near nests or scattered edges
  for (let i = 0; i < zombieCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = size * 0.3 + rand() * size * 0.15;
    const zombie: Zombie = {
      id: nextId++, kind: "zombie", faction: "HOSTILE",
      pos: { x: half + Math.cos(angle) * r, y: half + Math.sin(angle) * r },
      health: 40 + Math.floor(rand() * 20), maxHealth: 60,
      vel: { x: 0, y: 0 }, alertRadius: 8 + rand() * 4,
      ticksUntilMove: Math.floor(rand() * 30),
    };
    entities.push(zombie);
  }

  return entities;
}

// ─── ENTITY AI ───────────────────────────────────────────────────────────────

function tickSurvivor(s: Survivor, state: GameState): Survivor {
  s = { ...s, pos: { ...s.pos }, vel: { ...s.vel }, targetPos: s.targetPos ? { ...s.targetPos } : null };
  const size = state.settings.mapSize;

  s.ticksUntilNewTarget--;
  if (s.ticksUntilNewTarget <= 0 || !s.targetPos) {
    // Pick a new random target near center (Phase 0 random walk)
    const half = size / 2;
    const range = size * 0.35;
    s.targetPos = {
      x: Math.max(1, Math.min(size - 1, half + (Math.random() - 0.5) * range * 2)),
      y: Math.max(1, Math.min(size - 1, half + (Math.random() - 0.5) * range * 2)),
    };
    s.ticksUntilNewTarget = 60 + Math.floor(Math.random() * 120);
  }

  if (s.targetPos) {
    const dx = s.targetPos.x - s.pos.x;
    const dy = s.targetPos.y - s.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.3) {
      const speed = 0.03;
      s.pos.x += (dx / dist) * speed;
      s.pos.y += (dy / dist) * speed;
    } else {
      s.targetPos = null;
    }
  }

  s.pos.x = Math.max(0.5, Math.min(size - 0.5, s.pos.x));
  s.pos.y = Math.max(0.5, Math.min(size - 0.5, s.pos.y));

  // Drain stats slowly
  s.hunger = Math.max(0, s.hunger - 0.002);
  s.thirst = Math.max(0, s.thirst - 0.003);
  return s;
}

function tickZombie(z: Zombie, state: GameState): Zombie {
  z = { ...z, pos: { ...z.pos }, vel: { ...z.vel } };
  const size = state.settings.mapSize;

  if (z.ticksUntilMove > 0) { z.ticksUntilMove--; return z; }
  z.ticksUntilMove = 2;

  // Find nearest survivor
  let nearest: Survivor | null = null;
  let nearestDist = Infinity;
  for (const e of state.entities) {
    if (e.kind !== "survivor") continue;
    const dist = Math.hypot(e.pos.x - z.pos.x, e.pos.y - z.pos.y);
    if (dist < nearestDist) { nearestDist = dist; nearest = e as Survivor; }
  }

  const speed = 0.015;
  if (nearest && nearestDist < z.alertRadius) {
    const dx = nearest.pos.x - z.pos.x;
    const dy = nearest.pos.y - z.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) {
      z.pos.x += (dx / dist) * speed;
      z.pos.y += (dy / dist) * speed;
    }
  } else {
    // Wander
    z.vel.x += (Math.random() - 0.5) * 0.1;
    z.vel.y += (Math.random() - 0.5) * 0.1;
    const vlen = Math.hypot(z.vel.x, z.vel.y);
    if (vlen > 0.03) { z.vel.x = (z.vel.x / vlen) * 0.03; z.vel.y = (z.vel.y / vlen) * 0.03; }
    z.pos.x += z.vel.x;
    z.pos.y += z.vel.y;
  }

  z.pos.x = Math.max(0.5, Math.min(size - 0.5, z.pos.x));
  z.pos.y = Math.max(0.5, Math.min(size - 0.5, z.pos.y));
  return z;
}

function tickNest(nest: CorruptionNest, state: GameState): [CorruptionNest, Zombie | null] {
  nest = { ...nest };
  nest.spawnCooldown--;
  if (nest.spawnCooldown <= 0) {
    nest.spawnCooldown = nest.maxCooldown;
    // Count zombies — cap at 20
    const zombieCount = state.entities.filter(e => e.kind === "zombie").length;
    if (zombieCount < 20) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 2;
      const zombie: Zombie = {
        id: state.nextId,
        kind: "zombie", faction: "HOSTILE",
        pos: { x: nest.pos.x + Math.cos(angle) * r, y: nest.pos.y + Math.sin(angle) * r },
        health: 40, maxHealth: 40,
        vel: { x: 0, y: 0 }, alertRadius: 8,
        ticksUntilMove: 10,
      };
      return [nest, zombie];
    }
  }
  return [nest, null];
}

// ─── FOG UPDATE ───────────────────────────────────────────────────────────────

function updateFog(tiles: Tile[][], entities: AnyEntity[], mapSize: number): Tile[][] {
  const newTiles = tiles.map(row => row.map(t => ({
    ...t,
    fogState: t.fogState === "visible" ? ("explored" as const) : t.fogState,
  })));

  const visionRadius = 6;
  for (const e of entities) {
    if (e.faction !== "PLAYER_TEAM") continue;
    const cx = Math.floor(e.pos.x);
    const cy = Math.floor(e.pos.y);
    for (let dy = -visionRadius; dy <= visionRadius; dy++) {
      for (let dx = -visionRadius; dx <= visionRadius; dx++) {
        if (dx * dx + dy * dy > visionRadius * visionRadius) continue;
        const tx = cx + dx, ty = cy + dy;
        if (tx >= 0 && tx < mapSize && ty >= 0 && ty < mapSize) {
          newTiles[ty][tx].fogState = "visible";
        }
      }
    }
  }
  return newTiles;
}

// ─── GAME TICK ────────────────────────────────────────────────────────────────

function runTick(state: GameState): GameState {
  const newEntities: AnyEntity[] = [];
  let nextId = state.nextId;
  const newState = { ...state, entities: state.entities };

  for (const e of state.entities) {
    if (e.kind === "survivor") {
      newEntities.push(tickSurvivor(e as Survivor, newState));
    } else if (e.kind === "zombie") {
      newEntities.push(tickZombie(e as Zombie, newState));
    } else if (e.kind === "nest") {
      const [newNest, spawned] = tickNest(e as CorruptionNest, { ...newState, nextId });
      newEntities.push(newNest);
      if (spawned) { spawned.id = nextId++; newEntities.push(spawned); }
    } else {
      newEntities.push({ ...e });
    }
  }

  const updatedTiles = updateFog(state.tiles, newEntities, state.settings.mapSize);

  return {
    ...state,
    tick: state.tick + 1,
    entities: newEntities,
    tiles: updatedTiles,
    nextId,
  };
}

// ─── CANVAS RENDERER ─────────────────────────────────────────────────────────

function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  canvasW: number,
  canvasH: number
) {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const ts = TILE_SIZE * camera.zoom;
  const mapSize = state.settings.mapSize;

  // Camera follow
  let camX = camera.x;
  let camY = camera.y;
  if (camera.mode === "survivor" && camera.followId !== null) {
    const target = state.entities.find(e => e.id === camera.followId);
    if (target) {
      camX = target.pos.x - canvasW / (2 * ts);
      camY = target.pos.y - canvasH / (2 * ts);
    }
  }

  const startX = Math.max(0, Math.floor(camX));
  const startY = Math.max(0, Math.floor(camY));
  const endX = Math.min(mapSize, Math.ceil(camX + canvasW / ts) + 1);
  const endY = Math.min(mapSize, Math.ceil(camY + canvasH / ts) + 1);

  // Draw tiles
  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const tile = state.tiles[ty]?.[tx];
      if (!tile) continue;
      const sx = (tx - camX) * ts;
      const sy = (ty - camY) * ts;

      if (tile.fogState === "hidden") {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(sx, sy, ts + 1, ts + 1);
        continue;
      }

      const baseColor = tile.fogState === "visible" ? TERRAIN_COLORS[tile.terrain] : TERRAIN_DARK[tile.terrain];
      ctx.fillStyle = baseColor;
      ctx.fillRect(sx, sy, ts + 1, ts + 1);

      // Subtle grid lines
      if (ts > 6) {
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, ts, ts);
      }
    }
  }

  // Draw entities
  for (const e of state.entities) {
    const tile = state.tiles[Math.floor(e.pos.y)]?.[Math.floor(e.pos.x)];
    if (!tile || tile.fogState === "hidden") continue;

    const sx = (e.pos.x - camX) * ts;
    const sy = (e.pos.y - camY) * ts;

    if (e.kind === "portal") {
      const portal = e as RiftPortal;
      const r = NEST_RADIUS * ts;
      // Pulsing portal effect
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
      ctx.beginPath();
      ctx.arc(sx, sy, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = portal.sealed ? `rgba(60,60,120,${pulse * 0.3})` : `rgba(100,220,255,${pulse * 0.4})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = portal.sealed ? "#334" : "#88ffff";
      ctx.fill();
      ctx.strokeStyle = portal.sealed ? "#668" : "#aaffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      if (ts > 8) {
        ctx.fillStyle = portal.sealed ? "#88a" : "#fff";
        ctx.font = `bold ${Math.max(7, ts * 0.35)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(portal.sealed ? "🔒" : "✦", sx, sy);
      }
    } else if (e.kind === "nest") {
      const r = NEST_RADIUS * ts;
      // Corruption aura
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 600);
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,0,200,${pulse * 0.15})`;
      ctx.fill();
      // Nest body
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#5500bb";
      ctx.fill();
      ctx.strokeStyle = "#aa44ff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Health bar
      if (ts > 10) drawHealthBar(ctx, sx, sy, r, e.health, e.maxHealth, "#aa44ff");
    } else if (e.kind === "zombie") {
      const r = ZOMBIE_RADIUS * ts;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      const hp = e.health / e.maxHealth;
      ctx.fillStyle = hp > 0.5 ? "#cc2222" : "#882222";
      ctx.fill();
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (e.kind === "survivor") {
      const surv = e as Survivor;
      const r = SURVIVOR_RADIUS * ts;
      const color = BRAIN_COLORS[surv.brain];
      // Survivor glow
      ctx.beginPath();
      ctx.arc(sx, sy, r * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = color + "33";
      ctx.fill();
      // Survivor body
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Name tag
      if (ts > 12) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.max(8, ts * 0.38)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(surv.name, sx, sy - r - 1);
      }
      // Health bar
      if (ts > 8) drawHealthBar(ctx, sx, sy, r, e.health, e.maxHealth, color);
    }
  }
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, r: number,
  hp: number, maxHp: number, color: string
) {
  const w = r * 2.2;
  const h = 3;
  const bx = sx - w / 2;
  const by = sy + r + 2;
  ctx.fillStyle = "#333";
  ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, w * (hp / maxHp), h);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

function initGame(settings: GameSettings): GameState {
  const rand = makePRNG(settings.seed);
  const tiles = generateMap(settings);
  const entities = spawnEntities(settings, rand);
  return {
    tick: 0,
    tiles,
    entities,
    nextId: entities.length + 10,
    settings,
    running: false,
    log: ["World generated. Survivors ready."],
  };
}

const DEFAULT_SETTINGS: GameSettings = {
  seed: 12345,
  mapSize: 30,
  survivorCount: 3,
  zombieCount: 8,
  nestCount: 3,
  speed: 1,
};

const WSSPhase0: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGame(DEFAULT_SETTINGS));
  const cameraRef = useRef<Camera>({ x: 8, y: 8, zoom: 1.0, mode: "observer", followId: null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  const [uiSettings, setUiSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [entityCounts, setEntityCounts] = useState({ survivors: 0, zombies: 0, nests: 0 });
  const [cameraMode, setCameraMode] = useState<CameraMode>("observer");
  const [zoom, setZoom] = useState(1.0);
  const [showSettings, setShowSettings] = useState(true);
  const [selectedSurvivorIdx, setSelectedSurvivorIdx] = useState(0);
  const [seedInput, setSeedInput] = useState("12345");

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderWorld(ctx, stateRef.current, cameraRef.current, canvas.width, canvas.height);
    animRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Sync camera mode & zoom to ref
  useEffect(() => {
    cameraRef.current.mode = cameraMode;
    cameraRef.current.zoom = zoom;
    if (cameraMode === "survivor") {
      const survivors = stateRef.current.entities.filter(e => e.kind === "survivor");
      if (survivors.length > 0) {
        cameraRef.current.followId = survivors[selectedSurvivorIdx % survivors.length]?.id ?? null;
      }
    } else {
      cameraRef.current.followId = null;
    }
  }, [cameraMode, zoom, selectedSurvivorIdx]);

  // Game tick loop
  const startLoop = useCallback((speed: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (speed === 0) return;
    const ms = Math.max(1, Math.round(1000 / (60 * speed)));
    const ticksPerInterval = speed >= 4 ? speed : 1;
    intervalRef.current = setInterval(() => {
      let s = stateRef.current;
      for (let i = 0; i < ticksPerInterval; i++) s = runTick(s);
      stateRef.current = s;
      setTick(s.tick);
      const survivors = s.entities.filter(e => e.kind === "survivor").length;
      const zombies = s.entities.filter(e => e.kind === "zombie").length;
      const nests = s.entities.filter(e => e.kind === "nest").length;
      setEntityCounts({ survivors, zombies, nests });
    }, ms);
  }, []);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const handlePlayPause = () => {
    if (isRunning) {
      stopLoop();
      stateRef.current = { ...stateRef.current, running: false };
      setIsRunning(false);
    } else {
      stateRef.current = { ...stateRef.current, running: true };
      startLoop(uiSettings.speed || 1);
      setIsRunning(true);
    }
  };

  const handleSpeedChange = (speed: 0 | 1 | 2 | 4 | 8) => {
    setUiSettings(s => ({ ...s, speed }));
    if (isRunning) {
      stopLoop();
      startLoop(speed);
    }
  };

  const handleReset = () => {
    stopLoop();
    setIsRunning(false);
    const settings = { ...uiSettings, seed: parseInt(seedInput) || uiSettings.seed };
    const newState = initGame(settings);
    stateRef.current = newState;
    setUiSettings(settings);
    setTick(0);
    const s = newState.entities.filter(e => e.kind === "survivor").length;
    const z = newState.entities.filter(e => e.kind === "zombie").length;
    const n = newState.entities.filter(e => e.kind === "nest").length;
    setEntityCounts({ survivors: s, zombies: z, nests: n });
    // Reset camera to center
    const half = settings.mapSize / 2;
    const canvas = canvasRef.current;
    const ts = TILE_SIZE * cameraRef.current.zoom;
    cameraRef.current = {
      x: half - (canvas ? canvas.width / (2 * ts) : 10),
      y: half - (canvas ? canvas.height / (2 * ts) : 10),
      zoom: cameraRef.current.zoom,
      mode: cameraRef.current.mode,
      followId: null,
    };
  };

  const handleStepOnce = () => {
    if (isRunning) return;
    stateRef.current = runTick(stateRef.current);
    setTick(stateRef.current.tick);
  };

  // Canvas mouse drag (free cam pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const ts = TILE_SIZE * cameraRef.current.zoom;
    const dx = (e.clientX - dragStart.current.x) / ts;
    const dy = (e.clientY - dragStart.current.y) / ts;
    cameraRef.current.x = dragStart.current.camX - dx;
    cameraRef.current.y = dragStart.current.camY - dy;
  };
  const handleMouseUp = () => { isDragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(4, cameraRef.current.zoom * factor));
    cameraRef.current.zoom = newZoom;
    setZoom(newZoom);
  };

  // Count on mount
  useEffect(() => {
    const s = stateRef.current;
    setEntityCounts({
      survivors: s.entities.filter(e => e.kind === "survivor").length,
      zombies: s.entities.filter(e => e.kind === "zombie").length,
      nests: s.entities.filter(e => e.kind === "nest").length,
    });
    // Center camera
    const half = DEFAULT_SETTINGS.mapSize / 2;
    cameraRef.current.x = half - 15;
    cameraRef.current.y = half - 10;
  }, []);

  const survivors = stateRef.current.entities.filter(e => e.kind === "survivor") as Survivor[];
  const portal = stateRef.current.entities.find(e => e.kind === "portal") as RiftPortal | undefined;
  const speedOptions: (0 | 1 | 2 | 4 | 8)[] = [0, 1, 2, 4, 8];

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
        <span className="text-red-400 font-bold text-sm tracking-widest">◈ A FORGOTTEN PLACE</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400 text-xs">PHASE 0</span>
        <span className="text-gray-600">|</span>
        <span className="text-yellow-400 text-xs">TICK {tick.toLocaleString()}</span>
        <div className="flex-1" />

        {/* Speed buttons */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs mr-1">SPEED</span>
          {speedOptions.map(s => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                uiSettings.speed === s && (s === 0 ? !isRunning : isRunning)
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {s === 0 ? "—" : `${s}x`}
            </button>
          ))}
        </div>

        <span className="text-gray-600">|</span>

        {/* Play/Pause/Step */}
        <button
          onClick={handlePlayPause}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border transition-colors ${
            isRunning
              ? "bg-yellow-700 border-yellow-500 hover:bg-yellow-600 text-yellow-100"
              : "bg-green-800 border-green-500 hover:bg-green-700 text-green-100"
          }`}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isRunning ? "PAUSE" : "RUN"}
        </button>

        <button
          onClick={handleStepOnce}
          disabled={isRunning}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-30"
          title="Step one tick"
        >
          <SkipForward className="w-3 h-3" />
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 text-orange-300"
          title="Reset world"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <span className="text-gray-600">|</span>

        {/* Camera */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">CAM</span>
          {(["observer", "survivor", "free"] as CameraMode[]).map(m => (
            <button
              key={m}
              onClick={() => setCameraMode(m)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                cameraMode === m
                  ? "bg-purple-700 border-purple-400 text-white"
                  : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {m === "observer" ? <Eye className="w-3 h-3" /> : m === "survivor" ? <Crosshair className="w-3 h-3" /> : <Move className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.min(4, +(z * 1.25).toFixed(2)))} className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600">
          <ZoomIn className="w-3 h-3" />
        </button>
        <span className="text-gray-400 text-xs">{(zoom * 100).toFixed(0)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.3, +(z * 0.8).toFixed(2)))} className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600">
          <ZoomOut className="w-3 h-3" />
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-52 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto">

          {/* Settings panel */}
          <div className="border-b border-gray-700">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              onClick={() => setShowSettings(s => !s)}
            >
              <span className="flex items-center gap-1"><Settings className="w-3 h-3" /> SETTINGS</span>
              {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showSettings && (
              <div className="px-3 pb-3 space-y-2">
                <label className="block text-xs text-gray-500">
                  Seed
                  <input
                    type="text"
                    value={seedInput}
                    onChange={e => setSeedInput(e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200 text-xs"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Map Size
                  <select
                    value={uiSettings.mapSize}
                    onChange={e => setUiSettings(s => ({ ...s, mapSize: Number(e.target.value) as 30 | 40 | 60 }))}
                    className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200 text-xs"
                  >
                    <option value={30}>30 × 30</option>
                    <option value={40}>40 × 40</option>
                    <option value={60}>60 × 60</option>
                  </select>
                </label>
                <label className="block text-xs text-gray-500">
                  Survivors: {uiSettings.survivorCount}
                  <input type="range" min={1} max={5} value={uiSettings.survivorCount}
                    onChange={e => setUiSettings(s => ({ ...s, survivorCount: Number(e.target.value) }))}
                    className="w-full mt-1"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Zombies: {uiSettings.zombieCount}
                  <input type="range" min={0} max={20} value={uiSettings.zombieCount}
                    onChange={e => setUiSettings(s => ({ ...s, zombieCount: Number(e.target.value) }))}
                    className="w-full mt-1"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Nests: {uiSettings.nestCount}
                  <input type="range" min={0} max={8} value={uiSettings.nestCount}
                    onChange={e => setUiSettings(s => ({ ...s, nestCount: Number(e.target.value) }))}
                    className="w-full mt-1"
                  />
                </label>
                <button
                  onClick={handleReset}
                  className="w-full py-1 text-xs bg-orange-900 hover:bg-orange-800 border border-orange-600 rounded text-orange-200 mt-1"
                >
                  Generate World
                </button>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-xs text-gray-500 mb-2">ENTITIES</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                <span className="text-gray-300">Survivors ({entityCounts.survivors})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-gray-300">Zombies ({entityCounts.zombies})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                <span className="text-gray-300">Nests ({entityCounts.nests})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-300 inline-block" />
                <span className="text-gray-300">Rift Portal</span>
              </div>
            </div>
          </div>

          {/* Terrain legend */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-xs text-gray-500 mb-2">TERRAIN</div>
            <div className="space-y-1 text-xs">
              {(Object.entries(TERRAIN_COLORS) as [TerrainType, string][]).map(([t, c]) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="w-3 h-3 inline-block rounded-sm" style={{ backgroundColor: c }} />
                  <span className="text-gray-400 capitalize">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Survivor list */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-500 mb-2">SURVIVORS</div>
            <div className="space-y-2">
              {survivors.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSurvivorIdx(i); if (cameraMode === "survivor") { cameraRef.current.followId = s.id; } }}
                  className={`p-2 rounded cursor-pointer border text-xs transition-colors ${
                    selectedSurvivorIdx === i && cameraMode === "survivor"
                      ? "border-purple-500 bg-purple-900/30"
                      : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAIN_COLORS[s.brain] }} />
                    <span className="text-gray-200 font-bold">{s.name}</span>
                    <span className="text-gray-500 ml-auto">{BRAIN_NAMES[s.brain].slice(0, 3).toUpperCase()}</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-6">HP</span>
                      <div className="flex-1 bg-gray-700 rounded h-1.5">
                        <div className="bg-red-500 h-1.5 rounded" style={{ width: `${(s.health / s.maxHealth) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-6">🍖</span>
                      <div className="flex-1 bg-gray-700 rounded h-1.5">
                        <div className="bg-yellow-500 h-1.5 rounded" style={{ width: `${s.hunger}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-6">💧</span>
                      <div className="flex-1 bg-gray-700 rounded h-1.5">
                        <div className="bg-blue-400 h-1.5 rounded" style={{ width: `${s.thirst}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CANVAS ── */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            style={{ cursor: cameraMode === "free" ? "grab" : "crosshair" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* ── HUD OVERLAY ── */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
            {/* Portal status */}
            <div className={`px-3 py-2 rounded border text-xs font-bold backdrop-blur-sm ${
              portal?.sealed
                ? "bg-gray-900/80 border-gray-600 text-gray-400"
                : "bg-cyan-900/80 border-cyan-400 text-cyan-300 animate-pulse"
            }`}>
              {portal?.sealed ? "🔒 PORTAL SEALED" : "✦ PORTAL OPEN"}
            </div>
            {/* Stats */}
            <div className="bg-gray-900/80 border border-gray-700 rounded px-3 py-2 text-xs space-y-1 backdrop-blur-sm">
              <div className="text-gray-500">TICK {tick.toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-300">{entityCounts.survivors} survivors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-300">{entityCounts.zombies} zombies</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-300">{entityCounts.nests} nests</span>
              </div>
            </div>
            {/* Camera info */}
            <div className="bg-gray-900/80 border border-gray-700 rounded px-3 py-1 text-xs text-gray-500 backdrop-blur-sm">
              {cameraMode.toUpperCase()} CAM · {(zoom * 100).toFixed(0)}%
            </div>
          </div>

          {/* Camera hint */}
          {cameraMode === "free" && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 pointer-events-none">
              drag to pan · scroll to zoom
            </div>
          )}
          {cameraMode === "survivor" && survivors.length > 0 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-500 pointer-events-none">
              following {survivors[selectedSurvivorIdx % survivors.length]?.name} — click survivor in sidebar to switch
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WSSPhase0;

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipForward, RotateCcw, ZoomIn, ZoomOut,
  Eye, Crosshair, Move, Settings, ChevronDown, ChevronUp,
  Skull, Activity, Shield, Zap
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type TerrainType = "plains" | "forest" | "mountain" | "desert" | "swamp" | "ruins";
type FactionType = "PLAYER_TEAM" | "HOSTILE" | "NEUTRAL";
type CameraMode = "observer" | "survivor" | "free";
type BrainType = "balanced" | "aggressive" | "cautious" | "survivalist" | "money";
type EntityKind = "survivor" | "zombie" | "nest" | "portal";
type WeaponClass = "fists" | "melee" | "gun";
type AIState = "fighting" | "fleeing" | "scavenging" | "idle";

interface Vec2 { x: number; y: number; }

interface Weapon {
  name: string;
  class: WeaponClass;
  damage: number;
  range: number;
  attackSpeedTicks: number;
  noiseTiles: number;
  ammo: number | null;
  maxAmmo: number | null;
  durability: number | null;
  maxDurability: number | null;
}

interface Tile {
  terrain: TerrainType;
  elevation: number;
  fogState: "hidden" | "explored" | "visible";
}

interface Entity {
  id: number;
  kind: EntityKind;
  pos: Vec2;
  health: number;
  maxHealth: number;
  faction: FactionType;
  dead: boolean;
  armor: number;
}

interface Survivor extends Entity {
  kind: "survivor";
  brain: BrainType;
  name: string;
  stamina: number;
  hunger: number;
  thirst: number;
  weapon: Weapon;
  attackCooldown: number;
  vel: Vec2;
  targetPos: Vec2 | null;
  ticksUntilNewTarget: number;
  aiState: AIState;
  kills: number;
}

interface Zombie extends Entity {
  kind: "zombie";
  vel: Vec2;
  alertRadius: number;
  ticksUntilMove: number;
  attackCooldown: number;
  alertedByNoise: boolean;
  noiseTarget: Vec2 | null;
}

interface CorruptionNest extends Entity {
  kind: "nest";
  spawnCooldown: number;
  maxCooldown: number;
}

interface RiftPortal extends Entity {
  kind: "portal";
  sealed: boolean;
}

type AnyEntity = Survivor | Zombie | CorruptionNest | RiftPortal;

interface NoiseEvent {
  pos: Vec2;
  radius: number;
  ticksLeft: number;
  maxTicks: number;
}

interface AttackEffect {
  from: Vec2;
  to: Vec2;
  color: string;
  ticksLeft: number;
  class: WeaponClass;
}

interface LogEntry {
  tick: number;
  text: string;
  type: "combat" | "death" | "spawn" | "info" | "warn";
}

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
  noiseEvents: NoiseEvent[];
  attackEffects: AttackEffect[];
  log: LogEntry[];
  nextId: number;
  settings: GameSettings;
  gameOver: boolean;
  gameOverReason: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TILE_SIZE = 18;
const SURVIVOR_RADIUS = 0.38;
const ZOMBIE_RADIUS = 0.35;
const NEST_RADIUS = 0.45;
const VISION_RADIUS = 6;
const MAX_LOG = 40;
const MAX_ZOMBIES = 25;

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

const BRAIN_COLOR: Record<BrainType, string> = {
  balanced:    "#00ff88",
  aggressive:  "#ff6600",
  cautious:    "#00ccff",
  survivalist: "#ffff00",
  money:       "#ffcc00",
};

const BRAIN_LABEL: Record<BrainType, string> = {
  balanced: "BAL", aggressive: "AGG", cautious: "CAU", survivalist: "SRV", money: "MNY",
};

const SURVIVOR_NAMES = ["Aria", "Boone", "Cal", "Dex", "Eva", "Finn", "Gray", "Hale", "Iris", "Jax"];
const BRAINS: BrainType[] = ["balanced", "aggressive", "cautious", "survivalist", "money"];

// ─── WEAPONS ─────────────────────────────────────────────────────────────────

const FISTS: Weapon = {
  name: "Fists", class: "fists",
  damage: 5, range: 0.9, attackSpeedTicks: 20, noiseTiles: 0,
  ammo: null, maxAmmo: null, durability: null, maxDurability: null,
};

const WEAPONS: Record<string, Weapon> = {
  fists:     FISTS,
  bat:       { name: "Bat",      class: "melee", damage: 18, range: 1.1, attackSpeedTicks: 25, noiseTiles: 1,  ammo: null, maxAmmo: null, durability: 80, maxDurability: 80 },
  machete:   { name: "Machete",  class: "melee", damage: 25, range: 1.0, attackSpeedTicks: 20, noiseTiles: 1,  ammo: null, maxAmmo: null, durability: 60, maxDurability: 60 },
  knife:     { name: "Knife",    class: "melee", damage: 12, range: 0.9, attackSpeedTicks: 15, noiseTiles: 0,  ammo: null, maxAmmo: null, durability: 100, maxDurability: 100 },
  pistol:    { name: "Pistol",   class: "gun",   damage: 30, range: 6.0, attackSpeedTicks: 30, noiseTiles: 12, ammo: 15, maxAmmo: 15, durability: null, maxDurability: null },
  shotgun:   { name: "Shotgun",  class: "gun",   damage: 55, range: 3.5, attackSpeedTicks: 50, noiseTiles: 18, ammo: 8,  maxAmmo: 8,  durability: null, maxDurability: null },
  rifle:     { name: "Rifle",    class: "gun",   damage: 45, range: 9.0, attackSpeedTicks: 45, noiseTiles: 20, ammo: 20, maxAmmo: 20, durability: null, maxDurability: null },
};

function brainWeapon(brain: BrainType): Weapon {
  const map: Record<BrainType, string> = {
    aggressive:  "shotgun",
    balanced:    "pistol",
    cautious:    "knife",
    survivalist: "bat",
    money:       "rifle",
  };
  return { ...WEAPONS[map[brain]] };
}

// ─── SEEDED PRNG ──────────────────────────────────────────────────────────────

function makePRNG(seed: number) {
  let s = seed >>> 0;
  return function (): number {
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
  const terrains: TerrainType[] = ["plains", "forest", "mountain", "desert", "swamp", "ruins"];
  const centerCount = Math.floor(size / 6);
  const centers = Array.from({ length: centerCount }, () => ({
    x: rand() * size, y: rand() * size,
    terrain: terrains[Math.floor(rand() * terrains.length)],
  }));

  const tiles: Tile[][] = [];
  for (let y = 0; y < size; y++) {
    tiles[y] = [];
    for (let x = 0; x < size; x++) {
      let minDist = Infinity, chosenTerrain: TerrainType = "plains";
      for (const c of centers) {
        const dist = Math.hypot(x - c.x, y - c.y) + rand() * 3;
        if (dist < minDist) { minDist = dist; chosenTerrain = c.terrain; }
      }
      if (rand() < 0.015) chosenTerrain = "ruins";
      tiles[y][x] = { terrain: chosenTerrain, elevation: rand(), fogState: "hidden" };
    }
  }

  // Reveal center area
  const half = Math.floor(size / 2);
  for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
    const tx = half + dx, ty = half + dy;
    if (tx >= 0 && tx < size && ty >= 0 && ty < size)
      tiles[ty][tx].fogState = "visible";
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

  // Rift portal
  entities.push({
    id: nextId++, kind: "portal", faction: "NEUTRAL",
    pos: { x: half, y: half }, health: 999, maxHealth: 999,
    dead: false, armor: 0, sealed: true,
  } as RiftPortal);

  // Survivors (spawn slightly offset from center)
  for (let i = 0; i < survivorCount; i++) {
    const angle = (i / survivorCount) * Math.PI * 2;
    const r = 1.5 + rand() * 1.5;
    const brain = BRAINS[i % BRAINS.length];
    entities.push({
      id: nextId++, kind: "survivor", faction: "PLAYER_TEAM",
      pos: { x: half + Math.cos(angle) * r, y: half + Math.sin(angle) * r },
      health: 100, maxHealth: 100, dead: false,
      brain, name: SURVIVOR_NAMES[i % SURVIVOR_NAMES.length],
      stamina: 100, hunger: 100, thirst: 100,
      armor: brain === "cautious" ? 15 : brain === "aggressive" ? 10 : 5,
      weapon: brainWeapon(brain),
      attackCooldown: 0, vel: { x: 0, y: 0 },
      targetPos: null, ticksUntilNewTarget: 0,
      aiState: "scavenging", kills: 0,
    } as Survivor);
  }

  // Corruption Nests (edges)
  for (let i = 0; i < nestCount; i++) {
    const side = Math.floor(rand() * 4);
    const margin = 3;
    let nx: number, ny: number;
    if (side === 0)      { nx = margin + rand() * (size - margin * 2); ny = margin; }
    else if (side === 1) { nx = size - margin; ny = margin + rand() * (size - margin * 2); }
    else if (side === 2) { nx = margin + rand() * (size - margin * 2); ny = size - margin; }
    else                 { nx = margin; ny = margin + rand() * (size - margin * 2); }
    entities.push({
      id: nextId++, kind: "nest", faction: "HOSTILE",
      pos: { x: nx, y: ny }, health: 100, maxHealth: 100, dead: false, armor: 5,
      spawnCooldown: Math.floor(rand() * 150), maxCooldown: 250 + Math.floor(rand() * 200),
    } as CorruptionNest);
  }

  // Initial zombies
  for (let i = 0; i < zombieCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = size * 0.3 + rand() * size * 0.15;
    entities.push({
      id: nextId++, kind: "zombie", faction: "HOSTILE",
      pos: { x: half + Math.cos(angle) * r, y: half + Math.sin(angle) * r },
      health: 40 + Math.floor(rand() * 20), maxHealth: 60, dead: false, armor: 0,
      vel: { x: 0, y: 0 }, alertRadius: 8 + rand() * 4,
      ticksUntilMove: Math.floor(rand() * 30),
      attackCooldown: 0, alertedByNoise: false, noiseTarget: null,
    } as Zombie);
  }

  return entities;
}

// ─── BRAIN AI — FIGHT / FLEE / SCAVENGE ──────────────────────────────────────

const FLEE_THRESHOLDS: Record<BrainType, number> = {
  aggressive: 0.15, balanced: 0.35, cautious: 0.5, survivalist: 0.4, money: 0.3,
};
const THREAT_DISTANCES: Record<BrainType, number> = {
  aggressive: 999, balanced: 8, cautious: 12, survivalist: 10, money: 8,
};

function chooseSurvivorAI(
  s: Survivor, enemies: AnyEntity[], size: number
): { state: AIState; target: Vec2 | null } {
  const fleeThresh = FLEE_THRESHOLDS[s.brain];
  const threatDist = THREAT_DISTANCES[s.brain];
  const hp = s.health / s.maxHealth;

  // Find enemies sorted by distance
  const visibleEnemies = enemies.filter(e =>
    !e.dead && e.faction === "HOSTILE" && e.kind !== "nest" &&
    Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y) < threatDist
  );
  const nearestEnemy = visibleEnemies.reduce<AnyEntity | null>((best, e) => {
    if (!best) return e;
    return Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y) <
           Math.hypot(best.pos.x - s.pos.x, best.pos.y - s.pos.y) ? e : best;
  }, null);

  const distToNearest = nearestEnemy
    ? Math.hypot(nearestEnemy.pos.x - s.pos.x, nearestEnemy.pos.y - s.pos.y)
    : Infinity;

  // FLEE: overwhelmed or low HP
  if (hp < fleeThresh && visibleEnemies.length > 0) {
    // Flee away from center of enemy mass
    const cx = visibleEnemies.reduce((a, e) => a + e.pos.x, 0) / visibleEnemies.length;
    const cy = visibleEnemies.reduce((a, e) => a + e.pos.y, 0) / visibleEnemies.length;
    const dx = s.pos.x - cx, dy = s.pos.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return {
      state: "fleeing",
      target: {
        x: Math.max(1, Math.min(size - 1, s.pos.x + (dx / len) * 10)),
        y: Math.max(1, Math.min(size - 1, s.pos.y + (dy / len) * 10)),
      },
    };
  }

  // FIGHT: enemy in weapon range or nearby
  if (nearestEnemy && distToNearest <= Math.max(s.weapon.range, threatDist)) {
    return { state: "fighting", target: { ...nearestEnemy.pos } };
  }

  // SCAVENGE: move toward map edge / explore (simple random walk for Phase 1)
  return { state: "scavenging", target: null };
}

// ─── COMBAT RESOLUTION ───────────────────────────────────────────────────────

function resolveCombat(
  state: GameState,
  addLog: (text: string, type: LogEntry["type"]) => void
): { entities: AnyEntity[]; effects: AttackEffect[]; noiseEvents: NoiseEvent[] } {
  const entities = state.entities.map(e => ({ ...e, pos: { ...e.pos } })) as AnyEntity[];
  const effects: AttackEffect[] = [...state.attackEffects];
  const noiseEvents: NoiseEvent[] = [...state.noiseEvents];

  // Survivor attacks
  for (const e of entities) {
    if (e.kind !== "survivor" || e.dead) continue;
    const s = e as Survivor;
    if (s.attackCooldown > 0) { s.attackCooldown--; continue; }

    // Find nearest hostile in range
    let nearest: AnyEntity | null = null;
    let nearestDist = Infinity;
    for (const t of entities) {
      if (t.dead || t.faction !== "HOSTILE") continue;
      const dist = Math.hypot(t.pos.x - s.pos.x, t.pos.y - s.pos.y);
      if (dist <= s.weapon.range && dist < nearestDist) {
        nearestDist = dist; nearest = t;
      }
    }

    if (nearest) {
      s.attackCooldown = s.weapon.attackSpeedTicks;
      const rawDmg = s.weapon.damage;
      const actualDmg = Math.max(1, rawDmg - nearest.armor);
      nearest.health -= actualDmg;

      effects.push({
        from: { ...s.pos }, to: { ...nearest.pos },
        color: s.weapon.class === "gun" ? "#ffff44" : s.weapon.class === "melee" ? "#ff8800" : "#ff4444",
        ticksLeft: 8, class: s.weapon.class,
      });

      // Ammo consumption
      if (s.weapon.ammo !== null) {
        s.weapon = { ...s.weapon, ammo: Math.max(0, s.weapon.ammo - 1) };
        // Generate noise
        noiseEvents.push({ pos: { ...s.pos }, radius: s.weapon.noiseTiles, ticksLeft: 60, maxTicks: 60 });
      }
      // Melee durability
      if (s.weapon.durability !== null) {
        s.weapon = { ...s.weapon, durability: Math.max(0, s.weapon.durability - 1) };
        if (s.weapon.durability === 0) {
          addLog(`${s.name}'s ${s.weapon.name} broke!`, "warn");
          s.weapon = { ...FISTS };
        }
      }

      addLog(`${s.name} → ${nearest.kind === "zombie" ? "zombie" : nearest.kind} [-${actualDmg}hp]`, "combat");

      // Check kill
      if (nearest.health <= 0) {
        nearest.dead = true;
        s.kills++;
        addLog(`${s.name} killed a ${nearest.kind === "zombie" ? "zombie" : nearest.kind}!`, "death");
      }
    }
  }

  // Zombie attacks
  for (const e of entities) {
    if (e.kind !== "zombie" || e.dead) continue;
    const z = e as Zombie;
    if (z.attackCooldown > 0) { z.attackCooldown--; continue; }

    for (const t of entities) {
      if (t.dead || t.faction !== "PLAYER_TEAM") continue;
      const dist = Math.hypot(t.pos.x - z.pos.x, t.pos.y - z.pos.y);
      if (dist <= 0.9) {
        z.attackCooldown = 25;
        const dmg = Math.max(1, 12 - t.armor);
        t.health -= dmg;
        effects.push({
          from: { ...z.pos }, to: { ...t.pos }, color: "#ff0000", ticksLeft: 6, class: "fists",
        });
        addLog(`Zombie hit ${(t as Survivor).name ?? "target"} [-${dmg}hp]`, "combat");
        if (t.health <= 0) {
          t.dead = true;
          addLog(`💀 ${(t as Survivor).name ?? "Survivor"} has DIED!`, "death");
        }
        break;
      }
    }
  }

  return { entities, effects, noiseEvents };
}

// ─── ENTITY AI TICK ──────────────────────────────────────────────────────────

function tickSurvivor(s: Survivor, state: GameState): Survivor {
  s = { ...s, pos: { ...s.pos }, vel: { ...s.vel }, weapon: { ...s.weapon } };
  if (s.dead) return s;
  const size = state.settings.mapSize;

  const { state: aiState, target } = chooseSurvivorAI(
    s, state.entities.filter(e => e.kind === "zombie" || (e.kind === "nest")), size
  );
  s.aiState = aiState;

  if (target) {
    s.targetPos = target;
  } else {
    // Scavenge: random walk
    s.ticksUntilNewTarget--;
    if (s.ticksUntilNewTarget <= 0 || !s.targetPos) {
      const half = size / 2;
      const range = size * 0.4;
      s.targetPos = {
        x: Math.max(1, Math.min(size - 1, half + (Math.random() - 0.5) * range * 2)),
        y: Math.max(1, Math.min(size - 1, half + (Math.random() - 0.5) * range * 2)),
      };
      s.ticksUntilNewTarget = 80 + Math.floor(Math.random() * 120);
    }
  }

  // Move toward target
  if (s.targetPos && aiState !== "fighting") {
    const dx = s.targetPos.x - s.pos.x;
    const dy = s.targetPos.y - s.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.3) {
      const baseSpeed = aiState === "fleeing" ? 0.05 : 0.03;
      const speed = s.stamina < 20 ? baseSpeed * 0.5 : baseSpeed;
      s.pos.x += (dx / dist) * speed;
      s.pos.y += (dy / dist) * speed;
      // Stamina drain when moving
      s.stamina = Math.max(0, s.stamina - (aiState === "fleeing" ? 0.015 : 0.005));
    } else if (aiState === "scavenging") {
      s.targetPos = null;
    }
  }

  // Stamina recharge when not fleeing
  if (aiState !== "fleeing" && s.stamina < 100) {
    s.stamina = Math.min(100, s.stamina + 0.008);
  }

  // Low stamina drains hunger/thirst faster
  const hungerRate = s.stamina < 30 ? 0.005 : 0.002;
  const thirstRate = s.stamina < 30 ? 0.007 : 0.003;
  s.hunger = Math.max(0, s.hunger - hungerRate);
  s.thirst = Math.max(0, s.thirst - thirstRate);

  // Starvation damage
  if (s.hunger <= 0 || s.thirst <= 0) {
    s.health = Math.max(0, s.health - 0.05);
  }

  s.pos.x = Math.max(0.5, Math.min(size - 0.5, s.pos.x));
  s.pos.y = Math.max(0.5, Math.min(size - 0.5, s.pos.y));
  return s;
}

function tickZombie(z: Zombie, state: GameState): Zombie {
  z = { ...z, pos: { ...z.pos }, vel: { ...z.vel } };
  if (z.dead) return z;
  const size = state.settings.mapSize;

  if (z.ticksUntilMove > 0) { z.ticksUntilMove--; return z; }
  z.ticksUntilMove = 2;

  // Check noise alerts
  if (!z.alertedByNoise) {
    for (const noise of state.noiseEvents) {
      if (Math.hypot(noise.pos.x - z.pos.x, noise.pos.y - z.pos.y) < noise.radius) {
        z.alertedByNoise = true;
        z.noiseTarget = { ...noise.pos };
        break;
      }
    }
  }

  // Find nearest survivor
  let nearest: AnyEntity | null = null;
  let nearestDist = Infinity;
  for (const e of state.entities) {
    if (e.dead || e.kind !== "survivor") continue;
    const dist = Math.hypot(e.pos.x - z.pos.x, e.pos.y - z.pos.y);
    if (dist < nearestDist) { nearestDist = dist; nearest = e; }
  }

  const speed = 0.018;
  if (nearest && nearestDist < z.alertRadius) {
    // Chase survivor
    z.alertedByNoise = false; z.noiseTarget = null;
    const dx = nearest.pos.x - z.pos.x, dy = nearest.pos.y - z.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.4) { z.pos.x += (dx / dist) * speed; z.pos.y += (dy / dist) * speed; }
  } else if (z.alertedByNoise && z.noiseTarget) {
    // Move toward noise
    const dx = z.noiseTarget.x - z.pos.x, dy = z.noiseTarget.y - z.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) { z.pos.x += (dx / dist) * speed; z.pos.y += (dy / dist) * speed; }
    else { z.alertedByNoise = false; z.noiseTarget = null; }
  } else {
    // Wander
    z.vel.x += (Math.random() - 0.5) * 0.12;
    z.vel.y += (Math.random() - 0.5) * 0.12;
    const vlen = Math.hypot(z.vel.x, z.vel.y);
    if (vlen > 0.035) { z.vel.x = (z.vel.x / vlen) * 0.035; z.vel.y = (z.vel.y / vlen) * 0.035; }
    z.pos.x += z.vel.x; z.pos.y += z.vel.y;
  }

  z.pos.x = Math.max(0.5, Math.min(size - 0.5, z.pos.x));
  z.pos.y = Math.max(0.5, Math.min(size - 0.5, z.pos.y));
  return z;
}

function tickNest(
  nest: CorruptionNest, state: GameState
): [CorruptionNest, Zombie | null] {
  nest = { ...nest };
  nest.spawnCooldown--;
  if (nest.spawnCooldown <= 0) {
    nest.spawnCooldown = nest.maxCooldown;
    const zombieCount = state.entities.filter(e => e.kind === "zombie" && !e.dead).length;
    if (zombieCount < MAX_ZOMBIES) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 1.5;
      return [nest, {
        id: state.nextId, kind: "zombie", faction: "HOSTILE",
        pos: { x: nest.pos.x + Math.cos(angle) * r, y: nest.pos.y + Math.sin(angle) * r },
        health: 40, maxHealth: 40, dead: false, armor: 0,
        vel: { x: 0, y: 0 }, alertRadius: 8, ticksUntilMove: 5,
        attackCooldown: 0, alertedByNoise: false, noiseTarget: null,
      } as Zombie];
    }
  }
  return [nest, null];
}

// ─── FOG UPDATE ───────────────────────────────────────────────────────────────

function updateFog(tiles: Tile[][], entities: AnyEntity[], mapSize: number): Tile[][] {
  const out = tiles.map(row => row.map(t => ({
    ...t, fogState: t.fogState === "visible" ? ("explored" as const) : t.fogState,
  })));
  for (const e of entities) {
    if (e.dead || e.faction !== "PLAYER_TEAM") continue;
    const cx = Math.floor(e.pos.x), cy = Math.floor(e.pos.y);
    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
      for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
        if (dx * dx + dy * dy > VISION_RADIUS * VISION_RADIUS) continue;
        const tx = cx + dx, ty = cy + dy;
        if (tx >= 0 && tx < mapSize && ty >= 0 && ty < mapSize)
          out[ty][tx].fogState = "visible";
      }
    }
  }
  return out;
}

// ─── GAME TICK ────────────────────────────────────────────────────────────────

function runTick(state: GameState): GameState {
  if (state.gameOver) return state;

  const pendingLog: LogEntry[] = [];
  const addLog = (text: string, type: LogEntry["type"]) => {
    pendingLog.push({ tick: state.tick, text, type });
  };

  // Decay attack effects
  const effects = state.attackEffects
    .map(ef => ({ ...ef, ticksLeft: ef.ticksLeft - 1 }))
    .filter(ef => ef.ticksLeft > 0);

  // Decay noise
  const noise = state.noiseEvents
    .map(n => ({ ...n, ticksLeft: n.ticksLeft - 1 }))
    .filter(n => n.ticksLeft > 0);

  // Run combat
  const { entities: postCombat, effects: newEffects, noiseEvents: newNoise } =
    resolveCombat({ ...state, noiseEvents: noise, attackEffects: effects }, addLog);

  const combatNoise = [...newNoise];

  // Move entities
  const moved: AnyEntity[] = [];
  let nextId = state.nextId;
  for (const e of postCombat) {
    if (e.dead) continue;
    if (e.kind === "survivor") {
      moved.push(tickSurvivor(e as Survivor, { ...state, entities: postCombat, noiseEvents: noise }));
    } else if (e.kind === "zombie") {
      moved.push(tickZombie(e as Zombie, { ...state, entities: postCombat, noiseEvents: noise }));
    } else if (e.kind === "nest") {
      const [newNest, spawned] = tickNest(e as CorruptionNest, { ...state, entities: postCombat, nextId });
      moved.push(newNest);
      if (spawned) {
        spawned.id = nextId++;
        moved.push(spawned);
        addLog("A Corruption Nest spawned a zombie!", "spawn");
      }
    } else {
      moved.push({ ...e });
    }
  }

  // Update fog
  const tiles = updateFog(state.tiles, moved, state.settings.mapSize);

  // Win/Lose check
  const aliveSurvivors = moved.filter(e => e.kind === "survivor" && !e.dead).length;
  let gameOver = false, gameOverReason = "";
  if (aliveSurvivors === 0) {
    gameOver = true;
    gameOverReason = "All survivors are dead.";
    addLog("💀 GAME OVER — All survivors eliminated.", "death");
  }

  const newLog = [...pendingLog, ...state.log].slice(0, MAX_LOG);

  return {
    ...state,
    tick: state.tick + 1,
    entities: moved,
    tiles,
    noiseEvents: [...combatNoise.filter(n => n.ticksLeft > 0)],
    attackEffects: [...newEffects.filter(ef => ef.ticksLeft > 0), ...effects],
    log: newLog,
    nextId,
    gameOver,
    gameOverReason,
  };
}

// ─── RENDERER ────────────────────────────────────────────────────────────────

function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: { x: number; y: number; zoom: number; mode: CameraMode; followId: number | null },
  canvasW: number,
  canvasH: number
) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const ts = TILE_SIZE * camera.zoom;
  const size = state.settings.mapSize;

  let camX = camera.x, camY = camera.y;
  if (camera.mode === "survivor" && camera.followId !== null) {
    const target = state.entities.find(e => e.id === camera.followId);
    if (target) {
      camX = target.pos.x - canvasW / (2 * ts);
      camY = target.pos.y - canvasH / (2 * ts);
    }
  }

  const sx0 = Math.max(0, Math.floor(camX));
  const sy0 = Math.max(0, Math.floor(camY));
  const sx1 = Math.min(size, Math.ceil(camX + canvasW / ts) + 1);
  const sy1 = Math.min(size, Math.ceil(camY + canvasH / ts) + 1);

  // Tiles
  for (let ty = sy0; ty < sy1; ty++) {
    for (let tx = sx0; tx < sx1; tx++) {
      const tile = state.tiles[ty]?.[tx];
      if (!tile) continue;
      const px = (tx - camX) * ts, py = (ty - camY) * ts;
      if (tile.fogState === "hidden") {
        ctx.fillStyle = "#080808";
        ctx.fillRect(px, py, ts + 1, ts + 1);
        continue;
      }
      ctx.fillStyle = tile.fogState === "visible" ? TERRAIN_COLORS[tile.terrain] : TERRAIN_DARK[tile.terrain];
      ctx.fillRect(px, py, ts + 1, ts + 1);
      if (ts > 6) {
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, ts, ts);
      }
    }
  }

  // Noise rings
  for (const noise of state.noiseEvents) {
    const px = (noise.pos.x - camX) * ts, py = (noise.pos.y - camY) * ts;
    const progress = 1 - noise.ticksLeft / noise.maxTicks;
    const currentRadius = noise.radius * progress * ts;
    const alpha = (1 - progress) * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,200,50,${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Attack effects
  for (const ef of state.attackEffects) {
    const fx = (ef.from.x - camX) * ts, fy = (ef.from.y - camY) * ts;
    const tx2 = (ef.to.x - camX) * ts, ty2 = (ef.to.y - camY) * ts;
    const alpha = ef.ticksLeft / 8;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx2, ty2);
    ctx.strokeStyle = ef.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
    ctx.lineWidth = ef.class === "gun" ? 2 : 3;
    ctx.stroke();
    // Muzzle flash for guns
    if (ef.class === "gun" && ef.ticksLeft > 5) {
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffaa";
      ctx.fill();
    }
  }

  // Entities
  for (const e of state.entities) {
    if (e.dead) continue;
    const tile = state.tiles[Math.floor(e.pos.y)]?.[Math.floor(e.pos.x)];
    if (!tile || tile.fogState === "hidden") continue;
    const px = (e.pos.x - camX) * ts, py = (e.pos.y - camY) * ts;

    if (e.kind === "portal") {
      const portal = e as RiftPortal;
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
      const r = NEST_RADIUS * ts;
      ctx.beginPath(); ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = portal.sealed ? `rgba(60,60,120,${pulse * 0.3})` : `rgba(100,220,255,${pulse * 0.4})`;
      ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = portal.sealed ? "#334" : "#88ffff";
      ctx.fill();
      ctx.strokeStyle = portal.sealed ? "#668" : "#aaffff";
      ctx.lineWidth = 2; ctx.stroke();

    } else if (e.kind === "nest") {
      const r = NEST_RADIUS * ts;
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 700);
      ctx.beginPath(); ctx.arc(px, py, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,0,200,${pulse * 0.12})`; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = "#5500bb"; ctx.fill();
      ctx.strokeStyle = "#aa44ff"; ctx.lineWidth = 1.5; ctx.stroke();
      drawBar(ctx, px, py, r, e.health, e.maxHealth, "#aa44ff", 0);

    } else if (e.kind === "zombie") {
      const r = ZOMBIE_RADIUS * ts;
      const hp = e.health / e.maxHealth;
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = hp > 0.5 ? "#cc2222" : "#882222"; ctx.fill();
      ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 1; ctx.stroke();

    } else if (e.kind === "survivor") {
      const s = e as Survivor;
      const r = SURVIVOR_RADIUS * ts;
      const color = BRAIN_COLOR[s.brain];

      // State ring
      const stateRingColor = s.aiState === "fighting" ? "#ff4400"
        : s.aiState === "fleeing" ? "#ffff00"
        : s.aiState === "scavenging" ? "#44ff88"
        : "#888888";
      ctx.beginPath(); ctx.arc(px, py, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = stateRingColor + "33"; ctx.fill();
      ctx.strokeStyle = stateRingColor + "88";
      ctx.lineWidth = 1; ctx.stroke();

      // Body
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();

      // Name + weapon
      if (ts > 12) {
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(7, ts * 0.36)}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(s.name, px, py - r - 1);
        ctx.font = `${Math.max(6, ts * 0.28)}px monospace`;
        ctx.fillStyle = "#aaa";
        ctx.fillText(s.weapon.name, px, py - r - 1 + Math.max(7, ts * 0.36) + 1);
      }

      // HP bar
      drawBar(ctx, px, py, r, e.health, e.maxHealth, "#ff4444", 0);
      // Armor bar
      if (s.armor > 0) drawBar(ctx, px, py, r, s.armor, 20, "#4488ff", 5);
      // Stamina bar
      drawBar(ctx, px, py, r, s.stamina, 100, "#ffffaa", 10);
    }
  }
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, r: number,
  val: number, max: number, color: string, yOffset: number
) {
  const w = r * 2.4, h = 3;
  const bx = px - w / 2, by = py + r + 2 + yOffset;
  ctx.fillStyle = "#222"; ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = color; ctx.fillRect(bx, by, w * Math.max(0, val / max), h);
}

// ─── GAME INIT ────────────────────────────────────────────────────────────────

function initGame(settings: GameSettings): GameState {
  const rand = makePRNG(settings.seed);
  const tiles = generateMap(settings);
  const entities = spawnEntities(settings, rand);
  return {
    tick: 0, tiles, entities,
    noiseEvents: [], attackEffects: [],
    log: [{ tick: 0, text: "World generated. Survivors ready.", type: "info" }],
    nextId: entities.length + 10,
    settings, gameOver: false, gameOverReason: "",
  };
}

const DEFAULT: GameSettings = {
  seed: 12345, mapSize: 30, survivorCount: 3, zombieCount: 8, nestCount: 3, speed: 1,
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const WSSPhase1: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGame(DEFAULT));
  const cameraRef = useRef({ x: 6, y: 6, zoom: 1.0, mode: "observer" as CameraMode, followId: null as number | null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  const [settings, setSettings] = useState<GameSettings>(DEFAULT);
  const [seedInput, setSeedInput] = useState("12345");
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>("observer");
  const [zoom, setZoom] = useState(1.0);
  const [showSettings, setShowSettings] = useState(true);
  const [showLog, setShowLog] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [uiLog, setUiLog] = useState<LogEntry[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [counts, setCounts] = useState({ survivors: 0, zombies: 0, nests: 0 });
  const [survivors, setSurvivors] = useState<Survivor[]>([]);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setTick(s.tick);
    setUiLog([...s.log].slice(0, 20));
    setGameOver(s.gameOver);
    const surv = s.entities.filter(e => e.kind === "survivor" && !e.dead) as Survivor[];
    setSurvivors(surv);
    setCounts({
      survivors: surv.length,
      zombies: s.entities.filter(e => e.kind === "zombie" && !e.dead).length,
      nests: s.entities.filter(e => e.kind === "nest" && !e.dead).length,
    });
  }, []);

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

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const p = canvas.parentElement;
      if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight; }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Camera sync
  useEffect(() => {
    cameraRef.current.mode = cameraMode;
    cameraRef.current.zoom = zoom;
    if (cameraMode === "survivor") {
      const survs = stateRef.current.entities.filter(e => e.kind === "survivor" && !e.dead);
      cameraRef.current.followId = survs[selectedIdx % Math.max(1, survs.length)]?.id ?? null;
    } else {
      cameraRef.current.followId = null;
    }
  }, [cameraMode, zoom, selectedIdx]);

  const startLoop = useCallback((speed: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (speed === 0) return;
    const tpi = speed >= 4 ? speed : 1;
    const ms = Math.max(1, Math.round(16 / (speed >= 4 ? 1 : speed)));
    intervalRef.current = setInterval(() => {
      if (stateRef.current.gameOver) { clearInterval(intervalRef.current!); setIsRunning(false); return; }
      let s = stateRef.current;
      for (let i = 0; i < tpi; i++) s = runTick(s);
      stateRef.current = s;
      syncUI();
    }, ms);
  }, [syncUI]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const handlePlayPause = () => {
    if (stateRef.current.gameOver) return;
    if (isRunning) { stopLoop(); setIsRunning(false); }
    else { startLoop(settings.speed || 1); setIsRunning(true); }
  };

  const handleReset = () => {
    stopLoop(); setIsRunning(false);
    const s: GameSettings = { ...settings, seed: parseInt(seedInput) || settings.seed };
    const g = initGame(s);
    stateRef.current = g;
    setSettings(s);
    const half = s.mapSize / 2;
    const canvas = canvasRef.current;
    const ts = TILE_SIZE * cameraRef.current.zoom;
    cameraRef.current = {
      x: half - (canvas ? canvas.width / (2 * ts) : 10),
      y: half - (canvas ? canvas.height / (2 * ts) : 10),
      zoom: cameraRef.current.zoom, mode: cameraRef.current.mode, followId: null,
    };
    syncUI();
  };

  const handleStep = () => { if (!isRunning && !stateRef.current.gameOver) { stateRef.current = runTick(stateRef.current); syncUI(); } };

  const handleSpeedChange = (speed: 0 | 1 | 2 | 4 | 8) => {
    setSettings(s => ({ ...s, speed }));
    if (isRunning) { stopLoop(); startLoop(speed); }
  };

  // Canvas input
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const ts = TILE_SIZE * cameraRef.current.zoom;
    cameraRef.current.x = dragStart.current.camX - (e.clientX - dragStart.current.x) / ts;
    cameraRef.current.y = dragStart.current.camY - (e.clientY - dragStart.current.y) / ts;
  };
  const onMouseUp = () => { isDragging.current = false; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const nz = Math.max(0.3, Math.min(4, cameraRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    cameraRef.current.zoom = nz; setZoom(nz);
  };

  useEffect(() => { syncUI(); }, [syncUI]);

  const portal = stateRef.current.entities.find(e => e.kind === "portal") as RiftPortal | undefined;
  const logColors: Record<LogEntry["type"], string> = {
    combat: "text-yellow-400", death: "text-red-400",
    spawn: "text-purple-400", info: "text-gray-400", warn: "text-orange-400",
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden select-none">

      {/* TOP BAR */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-700 shrink-0 flex-wrap">
        <span className="text-red-400 font-bold text-xs tracking-widest">◈ A FORGOTTEN PLACE</span>
        <span className="text-gray-700">│</span>
        <span className="text-blue-400 text-xs">PHASE 1</span>
        <span className="text-gray-700">│</span>
        <span className="text-yellow-400 text-xs">T:{tick.toLocaleString()}</span>

        <div className="flex-1" />

        {/* Speed */}
        <div className="flex items-center gap-1">
          {([0, 1, 2, 4, 8] as const).map(sp => (
            <button key={sp} onClick={() => handleSpeedChange(sp)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${settings.speed === sp ? "bg-blue-700 border-blue-400 text-white" : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}>
              {sp === 0 ? "—" : `${sp}x`}
            </button>
          ))}
        </div>
        <span className="text-gray-700">│</span>

        {/* Controls */}
        <button onClick={handlePlayPause} disabled={gameOver}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border transition-colors disabled:opacity-30 ${isRunning ? "bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700" : "bg-green-900 border-green-500 text-green-100 hover:bg-green-800"}`}>
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isRunning ? "PAUSE" : "RUN"}
        </button>
        <button onClick={handleStep} disabled={isRunning || gameOver}
          className="px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-30">
          <SkipForward className="w-3 h-3" />
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 text-orange-300">
          <RotateCcw className="w-3 h-3" />
        </button>
        <span className="text-gray-700">│</span>

        {/* Camera */}
        <div className="flex items-center gap-1">
          {(["observer", "survivor", "free"] as CameraMode[]).map(m => (
            <button key={m} onClick={() => setCameraMode(m)}
              className={`px-2 py-1 rounded text-xs border transition-colors ${cameraMode === m ? "bg-purple-800 border-purple-400 text-white" : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}>
              {m === "observer" ? <Eye className="w-3 h-3" /> : m === "survivor" ? <Crosshair className="w-3 h-3" /> : <Move className="w-3 h-3" />}
            </button>
          ))}
        </div>
        <button onClick={() => { const nz = Math.min(4, +(zoom * 1.25).toFixed(2)); setZoom(nz); cameraRef.current.zoom = nz; }}
          className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600"><ZoomIn className="w-3 h-3" /></button>
        <span className="text-gray-500 text-xs">{(zoom * 100).toFixed(0)}%</span>
        <button onClick={() => { const nz = Math.max(0.3, +(zoom * 0.8).toFixed(2)); setZoom(nz); cameraRef.current.zoom = nz; }}
          className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600"><ZoomOut className="w-3 h-3" /></button>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="w-52 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto text-xs">

          {/* Settings */}
          <div className="border-b border-gray-700">
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              onClick={() => setShowSettings(s => !s)}>
              <span className="flex items-center gap-1"><Settings className="w-3 h-3" /> SETTINGS</span>
              {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showSettings && (
              <div className="px-3 pb-3 space-y-2">
                <label className="block text-gray-500">Seed
                  <input value={seedInput} onChange={e => setSeedInput(e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200" />
                </label>
                <label className="block text-gray-500">Map Size
                  <select value={settings.mapSize} onChange={e => setSettings(s => ({ ...s, mapSize: Number(e.target.value) as 30 | 40 | 60 }))}
                    className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200">
                    <option value={30}>30×30</option>
                    <option value={40}>40×40</option>
                    <option value={60}>60×60</option>
                  </select>
                </label>
                <label className="block text-gray-500">Survivors: {settings.survivorCount}
                  <input type="range" min={1} max={5} value={settings.survivorCount}
                    onChange={e => setSettings(s => ({ ...s, survivorCount: Number(e.target.value) }))}
                    className="w-full mt-1" />
                </label>
                <label className="block text-gray-500">Zombies: {settings.zombieCount}
                  <input type="range" min={0} max={20} value={settings.zombieCount}
                    onChange={e => setSettings(s => ({ ...s, zombieCount: Number(e.target.value) }))}
                    className="w-full mt-1" />
                </label>
                <label className="block text-gray-500">Nests: {settings.nestCount}
                  <input type="range" min={0} max={8} value={settings.nestCount}
                    onChange={e => setSettings(s => ({ ...s, nestCount: Number(e.target.value) }))}
                    className="w-full mt-1" />
                </label>
                <button onClick={handleReset}
                  className="w-full py-1 bg-orange-900 hover:bg-orange-800 border border-orange-600 rounded text-orange-200 mt-1">
                  Generate World
                </button>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-500 mb-1.5">ENTITIES</div>
            <div className="space-y-1">
              {[
                { color: "#00ff88", label: `Survivors (${counts.survivors})` },
                { color: "#cc2222", label: `Zombies (${counts.zombies})` },
                { color: "#5500bb", label: `Nests (${counts.nests})` },
                { color: "#88ccff", label: "Rift Portal" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI State legend */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-500 mb-1.5">AI STATE RING</div>
            <div className="space-y-1">
              {[
                { color: "#ff4400", label: "Fighting" },
                { color: "#ffff00", label: "Fleeing" },
                { color: "#44ff88", label: "Scavenging" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border shrink-0" style={{ borderColor: color }} />
                  <span className="text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Survivor cards */}
          <div className="px-3 py-2 flex-1">
            <div className="text-gray-500 mb-1.5">SURVIVORS</div>
            <div className="space-y-2">
              {survivors.map((s, i) => (
                <div key={s.id} onClick={() => { setSelectedIdx(i); if (cameraMode === "survivor") cameraRef.current.followId = s.id; }}
                  className={`p-2 rounded border cursor-pointer transition-colors ${selectedIdx === i && cameraMode === "survivor" ? "border-purple-500 bg-purple-900/30" : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAIN_COLOR[s.brain] }} />
                    <span className="text-gray-200 font-bold">{s.name}</span>
                    <span className="ml-auto text-gray-500">{BRAIN_LABEL[s.brain]}</span>
                  </div>
                  <div className="text-gray-500 mb-1">{s.weapon.name}
                    {s.weapon.ammo !== null && <span className="ml-1 text-yellow-600">[{s.weapon.ammo}/{s.weapon.maxAmmo}]</span>}
                    {s.weapon.durability !== null && <span className="ml-1 text-orange-600">[{s.weapon.durability}dur]</span>}
                  </div>
                  <div className="text-gray-500 mb-1">
                    <span className={s.aiState === "fighting" ? "text-red-400" : s.aiState === "fleeing" ? "text-yellow-400" : "text-green-400"}>
                      {s.aiState.toUpperCase()}
                    </span>
                    <span className="ml-1 text-gray-600">· {s.kills}k</span>
                  </div>
                  {[
                    { label: "HP", val: s.health, max: s.maxHealth, color: "bg-red-500" },
                    { label: "AR", val: s.armor, max: 20, color: "bg-blue-500" },
                    { label: "ST", val: s.stamina, max: 100, color: "bg-yellow-400" },
                    { label: "🍖", val: s.hunger, max: 100, color: "bg-orange-500" },
                    { label: "💧", val: s.thirst, max: 100, color: "bg-blue-400" },
                  ].map(({ label, val, max, color }) => (
                    <div key={label} className="flex items-center gap-1 mt-0.5">
                      <span className="w-5 text-gray-600 shrink-0">{label}</span>
                      <div className="flex-1 bg-gray-700 rounded h-1.5">
                        <div className={`${color} h-1.5 rounded`} style={{ width: `${Math.max(0, (val / max) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {survivors.length === 0 && (
                <div className="text-red-500 text-center py-2">— All dead —</div>
              )}
            </div>
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <canvas ref={canvasRef} className="block w-full h-full"
            style={{ cursor: cameraMode === "free" ? "grab" : "crosshair" }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp} onWheel={onWheel} />

          {/* Game over overlay */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
              <div className="text-center border border-red-700 bg-gray-950/90 px-10 py-8 rounded-lg">
                <div className="text-4xl mb-3">💀</div>
                <div className="text-red-400 text-2xl font-bold mb-2">GAME OVER</div>
                <div className="text-gray-400 text-sm mb-4">{stateRef.current.gameOverReason}</div>
                <div className="text-gray-500 text-xs">Tick {tick.toLocaleString()} · Click Reset to try again</div>
              </div>
            </div>
          )}

          {/* HUD top-right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
            <div className={`px-3 py-1.5 rounded border text-xs font-bold backdrop-blur-sm ${portal?.sealed ? "bg-gray-900/80 border-gray-600 text-gray-400" : "bg-cyan-900/80 border-cyan-400 text-cyan-300"}`}>
              {portal?.sealed ? "🔒 PORTAL SEALED" : "✦ PORTAL OPEN"}
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded px-3 py-2 text-xs space-y-1 backdrop-blur-sm">
              {[
                { icon: <Activity className="w-3 h-3 text-green-400" />, label: `${counts.survivors} alive` },
                { icon: <Skull className="w-3 h-3 text-red-400" />, label: `${counts.zombies} zombies` },
                { icon: <Zap className="w-3 h-3 text-purple-400" />, label: `${counts.nests} nests` },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-gray-300">{icon}{label}</div>
              ))}
            </div>
          </div>

          {/* Combat log bottom-right */}
          <div className="absolute bottom-3 right-3 w-72 pointer-events-none">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600 text-xs">COMBAT LOG</span>
            </div>
            <div className="bg-gray-950/85 border border-gray-700 rounded p-2 backdrop-blur-sm max-h-44 overflow-hidden flex flex-col gap-0.5">
              {uiLog.slice(0, 12).map((entry, i) => (
                <div key={i} className={`text-xs leading-tight ${logColors[entry.type]}`}>
                  <span className="text-gray-600 mr-1">[{entry.tick}]</span>{entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WSSPhase1;

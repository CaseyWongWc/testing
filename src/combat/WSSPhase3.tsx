import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipForward, RotateCcw, ZoomIn, ZoomOut,
  Eye, Crosshair, Move, Settings, ChevronDown, ChevronUp,
  Skull, Activity, Zap, Navigation, CheckCircle2, Circle,
  Package, Heart
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type TerrainType   = "plains" | "forest" | "mountain" | "desert" | "swamp" | "ruins";
type FactionType   = "PLAYER_TEAM" | "HOSTILE" | "NEUTRAL";
type CameraMode    = "observer" | "survivor" | "free";
type BrainType     = "balanced" | "aggressive" | "cautious" | "survivalist" | "money";
type EntityKind    = "survivor" | "zombie" | "nest" | "portal" | "switch" | "loot";
type WeaponClass   = "fists" | "melee" | "gun";
type LootType      = "health" | "ammo";
type AIState       = "fighting" | "fleeing" | "activating" | "evacuating" | "scavenging";
type WinState      = "playing" | "won" | "lost";

interface Vec2 { x: number; y: number; }

interface Weapon {
  name: string; class: WeaponClass;
  damage: number; range: number; attackSpeedTicks: number; noiseTiles: number;
  ammo: number | null; maxAmmo: number | null;
  durability: number | null; maxDurability: number | null;
}

interface Tile {
  terrain: TerrainType; elevation: number;
  fogState: "hidden" | "explored" | "visible";
}

interface BaseEntity {
  id: number; kind: EntityKind; pos: Vec2;
  health: number; maxHealth: number;
  faction: FactionType; dead: boolean; armor: number;
}

interface Survivor extends BaseEntity {
  kind: "survivor"; brain: BrainType; name: string;
  stamina: number; hunger: number; thirst: number;
  weapon: Weapon;
  primaryWeapon: Weapon | null;  // saved gun when auto-switched to fists
  attackCooldown: number;
  vel: Vec2; targetPos: Vec2 | null; ticksUntilNewTarget: number;
  aiState: AIState; kills: number; evacuated: boolean;
}

interface Zombie extends BaseEntity {
  kind: "zombie"; vel: Vec2;
  alertRadius: number; ticksUntilMove: number; attackCooldown: number;
  alertedByNoise: boolean; noiseTarget: Vec2 | null;
  nestId: number;
}

interface CorruptionNest extends BaseEntity {
  kind: "nest"; spawnCooldown: number; maxCooldown: number;
}

interface RiftPortal extends BaseEntity {
  kind: "portal"; sealed: boolean; openTick: number;
}

interface ObjectiveSwitch extends BaseEntity {
  kind: "switch"; idx: number;
  activated: boolean; holdProgress: number; holdRequired: number;
}

interface LootItem extends BaseEntity {
  kind: "loot"; lootType: LootType; amount: number;
}

type AnyEntity = Survivor | Zombie | CorruptionNest | RiftPortal | ObjectiveSwitch | LootItem;

interface NoiseEvent { pos: Vec2; radius: number; ticksLeft: number; maxTicks: number; }
interface AttackEffect { from: Vec2; to: Vec2; color: string; ticksLeft: number; class: WeaponClass; }
interface LogEntry { tick: number; text: string; type: "combat"|"damage"|"death"|"spawn"|"info"|"warn"|"objective"|"loot"; }

interface GameSettings {
  seed: number; mapSize: 30 | 40 | 60;
  survivorCount: number; zombieCount: number; nestCount: number;
  speed: 0 | 1 | 2 | 4 | 8;
}

interface GameState {
  tick: number; tiles: Tile[][]; entities: AnyEntity[];
  noiseEvents: NoiseEvent[]; attackEffects: AttackEffect[]; log: LogEntry[];
  nextId: number; settings: GameSettings;
  currentObjectiveIdx: number; objectivesTotal: number;
  winState: WinState; winTick: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TILE_SIZE      = 18;
const VISION_RADIUS  = 6;
const MAX_LOG        = 120;
const MAX_ZOMBIES    = 20;
const PER_NEST_MAX   = 4;
const NEST_COOLDOWN  = 320;
const HOLD_REQUIRED  = 60;
const HOLD_RADIUS    = 1.8;
const EVAC_RADIUS    = 1.6;
const ZOMBIE_ALERT   = 9;
const PICKUP_RADIUS  = 1.0;
const LOOT_COUNT_MIN = 8;
const LOOT_COUNT_MAX = 12;

// Phase 3 balance tuning
const SURVIVOR_BASE_HP  = 80;   // -20% from Phase 2's 100
const ZOMBIE_DAMAGE     = 20;   // Raised from 14 — high armor was reducing to 1
const NEST_HP           = 60;   // Nests now have meaningful HP

const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains: "#5a8c3a", forest: "#2a5e2a", mountain: "#7a6a5a",
  desert: "#c8a855", swamp: "#3d5c38", ruins: "#5a5a5a",
};
const TERRAIN_DARK: Record<TerrainType, string> = {
  plains: "#3d6128", forest: "#1a4a1a", mountain: "#5a4e42",
  desert: "#a88a3a", swamp: "#2a3f26", ruins: "#3a3a3a",
};
const BRAIN_COLOR: Record<BrainType, string> = {
  balanced: "#00ff88", aggressive: "#ff6600",
  cautious: "#00ccff", survivalist: "#ffff00", money: "#ffcc00",
};
const BRAIN_LABEL: Record<BrainType, string> = {
  balanced: "BAL", aggressive: "AGG", cautious: "CAU", survivalist: "SRV", money: "MNY",
};
const SURVIVOR_NAMES = ["Aria","Boone","Cal","Dex","Eva","Finn","Gray","Hale","Iris","Jax"];
const BRAINS: BrainType[] = ["balanced","aggressive","cautious","survivalist","money"];
const OBJ_COLORS = ["#ff9900", "#ff4488", "#44ffff"];

// ─── WEAPONS ─────────────────────────────────────────────────────────────────

const FISTS: Weapon = {
  name:"Fists", class:"fists", damage:5, range:0.9, attackSpeedTicks:20,
  noiseTiles:0, ammo:null, maxAmmo:null, durability:null, maxDurability:null,
};
const WEAPONS: Record<string, Weapon> = {
  fists:   FISTS,
  bat:     { name:"Bat",     class:"melee", damage:18, range:1.1, attackSpeedTicks:25, noiseTiles:1,  ammo:null, maxAmmo:null, durability:80,  maxDurability:80  },
  knife:   { name:"Knife",   class:"melee", damage:12, range:0.9, attackSpeedTicks:15, noiseTiles:0,  ammo:null, maxAmmo:null, durability:100, maxDurability:100 },
  pistol:  { name:"Pistol",  class:"gun",   damage:30, range:6.0, attackSpeedTicks:30, noiseTiles:12, ammo:15,  maxAmmo:15,  durability:null, maxDurability:null },
  shotgun: { name:"Shotgun", class:"gun",   damage:55, range:3.5, attackSpeedTicks:50, noiseTiles:18, ammo:8,   maxAmmo:8,   durability:null, maxDurability:null },
  rifle:   { name:"Rifle",   class:"gun",   damage:45, range:9.0, attackSpeedTicks:45, noiseTiles:20, ammo:20,  maxAmmo:20,  durability:null, maxDurability:null },
};
const brainWeapon = (b: BrainType): Weapon => ({ ...WEAPONS[{ aggressive:"shotgun", balanced:"pistol", cautious:"knife", survivalist:"bat", money:"rifle" }[b]] });

// ─── SEEDED PRNG ──────────────────────────────────────────────────────────────

function makePRNG(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── MAP GENERATION ───────────────────────────────────────────────────────────

function generateMap(settings: GameSettings): Tile[][] {
  const { seed, mapSize: size } = settings;
  const rand = makePRNG(seed);
  const terrains: TerrainType[] = ["plains","forest","mountain","desert","swamp","ruins"];
  const centers = Array.from({ length: Math.floor(size / 6) }, () => ({
    x: rand() * size, y: rand() * size,
    terrain: terrains[Math.floor(rand() * terrains.length)],
  }));
  const tiles: Tile[][] = [];
  for (let y = 0; y < size; y++) {
    tiles[y] = [];
    for (let x = 0; x < size; x++) {
      let minD = Infinity, terrain: TerrainType = "plains";
      for (const c of centers) {
        const d = Math.hypot(x - c.x, y - c.y) + rand() * 3;
        if (d < minD) { minD = d; terrain = c.terrain; }
      }
      if (rand() < 0.015) terrain = "ruins";
      tiles[y][x] = { terrain, elevation: rand(), fogState: "hidden" };
    }
  }
  const half = Math.floor(size / 2);
  for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
    const tx = half + dx, ty = half + dy;
    if (tx >= 0 && tx < size && ty >= 0 && ty < size)
      tiles[ty][tx].fogState = "visible";
  }
  return tiles;
}

// ─── PLACEMENT HELPERS ───────────────────────────────────────────────────────

function placeObjectives(size: number, rand: () => number): Vec2[] {
  const half = size / 2;
  const positions: Vec2[] = [];
  let attempts = 0;
  while (positions.length < 3 && attempts < 2000) {
    attempts++;
    const x = 4 + rand() * (size - 8);
    const y = 4 + rand() * (size - 8);
    if (Math.hypot(x - half, y - half) < 8) continue;
    if (positions.some(p => Math.hypot(p.x - x, p.y - y) < 6)) continue;
    positions.push({ x, y });
  }
  return positions;
}

function spawnLoot(size: number, rand: () => number, startId: number): LootItem[] {
  const half = size / 2;
  const count = LOOT_COUNT_MIN + Math.floor(rand() * (LOOT_COUNT_MAX - LOOT_COUNT_MIN + 1));
  const items: LootItem[] = [];
  for (let i = 0; i < count; i++) {
    const isHealth = rand() < 0.4; // 40% health, 60% ammo
    let x: number, y: number;
    // Cluster ~60% near ruins/structures, rest scattered
    if (rand() < 0.6) {
      const angle = rand() * Math.PI * 2;
      const r = 4 + rand() * (size * 0.35);
      x = Math.max(1.5, Math.min(size - 1.5, half + Math.cos(angle) * r));
      y = Math.max(1.5, Math.min(size - 1.5, half + Math.sin(angle) * r));
    } else {
      x = 2 + rand() * (size - 4);
      y = 2 + rand() * (size - 4);
    }
    items.push({
      id: startId + i, kind: "loot", faction: "NEUTRAL", dead: false, armor: 0,
      pos: { x, y }, health: 1, maxHealth: 1,
      lootType: isHealth ? "health" : "ammo",
      amount: isHealth ? 30 : 8,
    } as LootItem);
  }
  return items;
}

// ─── ENTITY SPAWNING ─────────────────────────────────────────────────────────

function spawnEntities(settings: GameSettings, rand: () => number): [AnyEntity[], number] {
  const { mapSize: size, survivorCount, zombieCount, nestCount } = settings;
  const half = size / 2;
  const entities: AnyEntity[] = [];
  let nextId = 1;

  // Portal (sealed)
  entities.push({
    id: nextId++, kind: "portal", faction: "NEUTRAL", dead: false, armor: 0,
    pos: { x: half, y: half }, health: 999, maxHealth: 999, sealed: true, openTick: 0,
  } as RiftPortal);

  // Survivors
  for (let i = 0; i < survivorCount; i++) {
    const angle = (i / survivorCount) * Math.PI * 2;
    const r = 1.5 + rand() * 1.5;
    const brain = BRAINS[i % BRAINS.length];
    entities.push({
      id: nextId++, kind: "survivor", faction: "PLAYER_TEAM", dead: false,
      pos: { x: half + Math.cos(angle) * r, y: half + Math.sin(angle) * r },
      health: SURVIVOR_BASE_HP, maxHealth: SURVIVOR_BASE_HP,
      brain, name: SURVIVOR_NAMES[i % SURVIVOR_NAMES.length],
      stamina: 100, hunger: 100, thirst: 100,
      armor: brain === "cautious" ? 8 : brain === "aggressive" ? 5 : brain === "survivalist" ? 6 : 3,
      weapon: brainWeapon(brain),
      primaryWeapon: null,
      attackCooldown: 0, vel: { x: 0, y: 0 },
      targetPos: null, ticksUntilNewTarget: 0,
      aiState: "scavenging", kills: 0, evacuated: false,
    } as Survivor);
  }

  // Objective switches
  const objPositions = placeObjectives(size, rand);
  for (let i = 0; i < objPositions.length; i++) {
    entities.push({
      id: nextId++, kind: "switch", faction: "NEUTRAL", dead: false, armor: 0,
      pos: objPositions[i], health: 999, maxHealth: 999,
      idx: i, activated: false, holdProgress: 0, holdRequired: HOLD_REQUIRED,
    } as ObjectiveSwitch);
  }

  // Corruption Nests
  const nestIds: number[] = [];
  for (let i = 0; i < nestCount; i++) {
    const side = Math.floor(rand() * 4);
    const margin = 3;
    let nx = 0, ny = 0;
    if (side === 0)      { nx = margin + rand() * (size - margin * 2); ny = margin; }
    else if (side === 1) { nx = size - margin; ny = margin + rand() * (size - margin * 2); }
    else if (side === 2) { nx = margin + rand() * (size - margin * 2); ny = size - margin; }
    else                 { nx = margin; ny = margin + rand() * (size - margin * 2); }
    const nestId = nextId++;
    nestIds.push(nestId);
    entities.push({
      id: nestId, kind: "nest", faction: "HOSTILE", dead: false, armor: 5,
      pos: { x: nx, y: ny }, health: NEST_HP, maxHealth: NEST_HP,
      spawnCooldown: Math.floor(rand() * 100),
      maxCooldown: NEST_COOLDOWN + Math.floor(rand() * 100),
    } as CorruptionNest);
  }

  // Initial zombies — 13+ tiles from center (outside alertRadius)
  const minSpawnDist = ZOMBIE_ALERT + 4;
  for (let i = 0; i < zombieCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.max(minSpawnDist, Math.min(size * 0.48, minSpawnDist + rand() * (size * 0.5 - minSpawnDist - 2)));
    entities.push({
      id: nextId++, kind: "zombie", faction: "HOSTILE", dead: false, armor: 0,
      pos: {
        x: Math.max(1, Math.min(size - 1, half + Math.cos(angle) * r)),
        y: Math.max(1, Math.min(size - 1, half + Math.sin(angle) * r)),
      },
      health: 65 + Math.floor(rand() * 25), maxHealth: 90,
      vel: { x: 0, y: 0 }, alertRadius: ZOMBIE_ALERT,
      ticksUntilMove: Math.floor(rand() * 30),
      attackCooldown: 0, alertedByNoise: false, noiseTarget: null,
      nestId: nestIds[Math.floor(rand() * Math.max(1, nestIds.length))] ?? 0,
    } as Zombie);
  }

  // Loot items
  const loot = spawnLoot(size, rand, nextId);
  nextId += loot.length;
  entities.push(...loot);

  return [entities, nextId];
}

// ─── AMMO HELPERS ────────────────────────────────────────────────────────────

function hasEffectiveAmmo(s: Survivor): boolean {
  // Survivor can fight effectively if they have a ranged/melee weapon (not empty-handed after running out)
  return s.weapon.class !== "fists" || s.primaryWeapon === null;
}

function isOutOfAmmo(s: Survivor): boolean {
  // True if they were forced to switch to fists due to empty gun
  return s.weapon.class === "fists" && s.primaryWeapon !== null;
}

function nearestLoot(s: Survivor, entities: AnyEntity[]): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDist = Infinity;
  for (const e of entities) {
    if (e.kind !== "loot" || e.dead) continue;
    const loot = e as LootItem;
    // Only target health if we need healing; only target ammo if out of ammo
    const wantHealth = s.health < s.maxHealth * 0.7;
    const wantAmmo   = isOutOfAmmo(s) || (s.weapon.ammo !== null && s.weapon.ammo < (s.weapon.maxAmmo ?? 1) * 0.3);
    if (loot.lootType === "health" && !wantHealth) continue;
    if (loot.lootType === "ammo" && !wantAmmo) continue;
    const dist = Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y);
    if (dist < nearestDist) { nearestDist = dist; nearest = { ...e.pos }; }
  }
  return nearest;
}

// ─── BRAIN AI ─────────────────────────────────────────────────────────────────

const FLEE_THRESH: Record<BrainType, number> = {
  aggressive:0.12, balanced:0.3, cautious:0.5, survivalist:0.35, money:0.28,
};
const THREAT_DIST: Record<BrainType, number> = {
  aggressive:999, balanced:9, cautious:12, survivalist:10, money:9,
};
const NO_AMMO_FLEE_COUNT: Record<BrainType, number> = {
  aggressive:4, balanced:2, cautious:1, survivalist:2, money:2,
};

function chooseSurvivorAI(
  s: Survivor, allEntities: AnyEntity[], size: number,
  currentObjPos: Vec2 | null, portalPos: Vec2, portalOpen: boolean
): { state: AIState; target: Vec2 | null } {
  const hp = s.health / s.maxHealth;
  const noAmmo = isOutOfAmmo(s);
  const enemies = allEntities.filter(e =>
    !e.dead && e.faction === "HOSTILE" && e.kind === "zombie" &&
    Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y) < THREAT_DIST[s.brain]
  );
  const nearest = enemies.reduce<AnyEntity | null>((best, e) =>
    !best || Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y) < Math.hypot(best.pos.x - s.pos.x, best.pos.y - s.pos.y)
    ? e : best, null
  );

  // 1 — FLEE: low HP, OR out of ammo and too many enemies
  const shouldFlee = hp < FLEE_THRESH[s.brain] ||
    (noAmmo && enemies.length >= NO_AMMO_FLEE_COUNT[s.brain]);
  if (shouldFlee && enemies.length > 0) {
    const cx = enemies.reduce((a, e) => a + e.pos.x, 0) / enemies.length;
    const cy = enemies.reduce((a, e) => a + e.pos.y, 0) / enemies.length;
    const dx = s.pos.x - cx, dy = s.pos.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return { state:"fleeing", target:{
      x: Math.max(1, Math.min(size-1, s.pos.x + (dx/len) * 10)),
      y: Math.max(1, Math.min(size-1, s.pos.y + (dy/len) * 10)),
    }};
  }

  // 2 — EVACUATE: portal open — takes priority over combat so survivors don't get stuck fighting
  if (portalOpen && !s.evacuated) {
    return { state:"evacuating", target:{ ...portalPos } };
  }

  // 3 — FIGHT: has effective weapon and enemy is close
  if (nearest && hasEffectiveAmmo(s) &&
      Math.hypot(nearest.pos.x - s.pos.x, nearest.pos.y - s.pos.y) <= Math.max(s.weapon.range, THREAT_DIST[s.brain])) {
    return { state:"fighting", target:{ ...nearest.pos } };
  }

  // 4 — SCAVENGE: seek loot when low HP or low/no ammo
  const needsLoot = noAmmo || hp < 0.5 || (s.weapon.ammo !== null && s.weapon.ammo < (s.weapon.maxAmmo ?? 1) * 0.25);
  if (needsLoot) {
    const lootTarget = nearestLoot(s, allEntities);
    if (lootTarget) return { state:"scavenging", target: lootTarget };
  }

  // 5 — ACTIVATE objective
  if (currentObjPos && !portalOpen) {
    return { state:"activating", target:{ ...currentObjPos } };
  }

  // 6 — WANDER
  return { state:"scavenging", target:null };
}

// ─── SURVIVOR TICK ────────────────────────────────────────────────────────────

function tickSurvivor(
  s: Survivor, state: GameState,
  currentObjPos: Vec2 | null, portalPos: Vec2, portalOpen: boolean
): Survivor {
  s = { ...s, pos:{...s.pos}, vel:{...s.vel}, weapon:{...s.weapon} };
  if (s.dead || s.evacuated) return s;
  const size = state.settings.mapSize;

  const { state: aiState, target } = chooseSurvivorAI(
    s, state.entities, size, currentObjPos, portalPos, portalOpen
  );
  s.aiState = aiState;

  if (target) {
    s.targetPos = target;
    s.ticksUntilNewTarget = 0;
  } else {
    s.ticksUntilNewTarget--;
    if (s.ticksUntilNewTarget <= 0 || !s.targetPos) {
      const half = size / 2;
      const range = size * 0.4;
      s.targetPos = {
        x: Math.max(1, Math.min(size-1, half + (Math.random()-0.5) * range * 2)),
        y: Math.max(1, Math.min(size-1, half + (Math.random()-0.5) * range * 2)),
      };
      s.ticksUntilNewTarget = 80 + Math.floor(Math.random() * 120);
    }
  }

  // Melee fighters (range ≤ 1.5) must move toward enemy to close gap; ranged hold position
  if (s.targetPos && (aiState !== "fighting" || s.weapon.range <= 1.5)) {
    const dx = s.targetPos.x - s.pos.x;
    const dy = s.targetPos.y - s.pos.y;
    const dist = Math.hypot(dx, dy);
    const stopDist = (aiState === "activating" || aiState === "evacuating" || aiState === "scavenging") ? 0.5 : 0.3;
    if (dist > stopDist) {
      const baseSpeed = aiState === "fleeing" ? 0.05 : aiState === "evacuating" ? 0.04 : 0.032;
      const speed = s.stamina < 20 ? baseSpeed * 0.5 : baseSpeed;
      s.pos.x += (dx / dist) * speed;
      s.pos.y += (dy / dist) * speed;
      s.stamina = Math.max(0, s.stamina - (aiState === "fleeing" ? 0.015 : 0.005));
    }
  }

  if (aiState !== "fleeing" && s.stamina < 100)
    s.stamina = Math.min(100, s.stamina + 0.008);

  const drainMult = s.stamina < 30 ? 2.5 : 1;
  s.hunger = Math.max(0, s.hunger - 0.002 * drainMult);
  s.thirst = Math.max(0, s.thirst - 0.003 * drainMult);
  if (s.hunger <= 0 || s.thirst <= 0) s.health = Math.max(0, s.health - 0.04);
  if (s.health <= 0) { s.dead = true; return s; }

  s.pos.x = Math.max(0.5, Math.min(size-0.5, s.pos.x));
  s.pos.y = Math.max(0.5, Math.min(size-0.5, s.pos.y));
  return s;
}

// ─── ZOMBIE TICK ─────────────────────────────────────────────────────────────

function tickZombie(z: Zombie, state: GameState): Zombie {
  z = { ...z, pos:{...z.pos}, vel:{...z.vel} };
  if (z.dead) return z;
  const size = state.settings.mapSize;
  if (z.ticksUntilMove > 0) { z.ticksUntilMove--; return z; }
  z.ticksUntilMove = 1;

  if (!z.alertedByNoise) {
    for (const n of state.noiseEvents) {
      if (Math.hypot(n.pos.x - z.pos.x, n.pos.y - z.pos.y) < n.radius) {
        z.alertedByNoise = true; z.noiseTarget = { ...n.pos }; break;
      }
    }
  }

  let nearest: AnyEntity | null = null, nearestDist = Infinity;
  for (const e of state.entities) {
    if (e.dead || e.kind !== "survivor") continue;
    const dist = Math.hypot(e.pos.x - z.pos.x, e.pos.y - z.pos.y);
    if (dist < z.alertRadius && dist < nearestDist) { nearestDist = dist; nearest = e; }
  }

  const speed = 0.028;
  if (nearest) {
    z.alertedByNoise = false; z.noiseTarget = null;
    const dx = nearest.pos.x - z.pos.x, dy = nearest.pos.y - z.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.4) { z.pos.x += (dx / dist) * speed; z.pos.y += (dy / dist) * speed; }
  } else if (z.alertedByNoise && z.noiseTarget) {
    const dx = z.noiseTarget.x - z.pos.x, dy = z.noiseTarget.y - z.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.5) { z.pos.x += (dx / dist) * speed; z.pos.y += (dy / dist) * speed; }
    else { z.alertedByNoise = false; z.noiseTarget = null; }
  } else {
    z.vel.x += (Math.random() - 0.5) * 0.14;
    z.vel.y += (Math.random() - 0.5) * 0.14;
    const vlen = Math.hypot(z.vel.x, z.vel.y);
    if (vlen > 0.04) { z.vel.x = (z.vel.x/vlen)*0.04; z.vel.y = (z.vel.y/vlen)*0.04; }
    z.pos.x += z.vel.x; z.pos.y += z.vel.y;
  }

  z.pos.x = Math.max(0.5, Math.min(size-0.5, z.pos.x));
  z.pos.y = Math.max(0.5, Math.min(size-0.5, z.pos.y));
  return z;
}

// ─── NEST TICK ───────────────────────────────────────────────────────────────

function tickNest(nest: CorruptionNest, state: GameState): [CorruptionNest, Zombie | null] {
  nest = { ...nest };
  nest.spawnCooldown--;
  if (nest.spawnCooldown <= 0) {
    nest.spawnCooldown = nest.maxCooldown;
    const totalZombies = state.entities.filter(e => e.kind === "zombie" && !e.dead).length;
    const nestZombies  = state.entities.filter(
      e => e.kind === "zombie" && !e.dead && (e as Zombie).nestId === nest.id
    ).length;
    if (totalZombies < MAX_ZOMBIES && nestZombies < PER_NEST_MAX) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 1.5;
      return [nest, {
        id: state.nextId, kind:"zombie", faction:"HOSTILE", dead:false, armor:0,
        pos:{ x:nest.pos.x+Math.cos(angle)*r, y:nest.pos.y+Math.sin(angle)*r },
        health:65, maxHealth:65, vel:{x:0,y:0},
        alertRadius:ZOMBIE_ALERT, ticksUntilMove:3,
        attackCooldown:0, alertedByNoise:false, noiseTarget:null,
        nestId:nest.id,
      } as Zombie];
    }
  }
  return [nest, null];
}

// ─── COMBAT RESOLUTION ────────────────────────────────────────────────────────

function resolveCombat(
  state: GameState,
  addLog: (text:string, type:LogEntry["type"]) => void
): { entities:AnyEntity[]; effects:AttackEffect[]; noiseEvents:NoiseEvent[]; droppedLoot:LootItem[] } {
  const entities = state.entities.map(e=>({...e, pos:{...e.pos}})) as AnyEntity[];
  const effects: AttackEffect[]  = [...state.attackEffects];
  const noiseEvents: NoiseEvent[] = [...state.noiseEvents];
  const droppedLoot: LootItem[]   = [];

  // Survivor attacks — can now target nests too
  for (const e of entities) {
    if (e.kind !== "survivor" || e.dead) continue;
    const s = e as Survivor;
    if (s.attackCooldown > 0) { s.attackCooldown--; continue; }
    let best: AnyEntity | null = null, bestDist = Infinity;
    for (const t of entities) {
      if (t.dead || t.faction !== "HOSTILE") continue;
      const d = Math.hypot(t.pos.x - s.pos.x, t.pos.y - s.pos.y);
      if (d <= s.weapon.range && d < bestDist) { bestDist=d; best=t; }
    }
    if (best) {
      s.attackCooldown = s.weapon.attackSpeedTicks;
      const dmg = Math.max(1, s.weapon.damage - best.armor);
      best.health -= dmg;
      effects.push({
        from:{...s.pos}, to:{...best.pos},
        color: s.weapon.class==="gun"?"#ffff44":s.weapon.class==="melee"?"#ff8800":"#ff4444",
        ticksLeft:8, class:s.weapon.class,
      });
      if (s.weapon.class === "gun" && s.weapon.ammo !== null) {
        const newAmmo = Math.max(0, s.weapon.ammo - 1);
        s.weapon = { ...s.weapon, ammo: newAmmo };
        noiseEvents.push({ pos:{...s.pos}, radius:s.weapon.noiseTiles, ticksLeft:60, maxTicks:60 });
        if (newAmmo === 0) {
          // Auto-switch to fists, save primary weapon
          s.primaryWeapon = { ...s.weapon };
          s.weapon = { ...FISTS };
          addLog(`⚠ ${s.name} is out of ammo!`, "warn");
        }
      }
      if (s.weapon.class === "melee" && s.weapon.durability !== null) {
        s.weapon = { ...s.weapon, durability: Math.max(0, s.weapon.durability - 1) };
        if (s.weapon.durability === 0) {
          addLog(`${s.name}'s ${s.weapon.name} broke!`, "warn");
          s.weapon = { ...FISTS };
        }
      }

      if (best.health <= 0) {
        best.dead = true;
        if (best.kind === "zombie") {
          s.kills++;
          addLog(`${s.name} killed a zombie.`, "death");
        } else if (best.kind === "nest") {
          s.kills++;
          addLog(`🔥 Nest destroyed! Loot dropped.`, "objective");
          const drops = 1 + Math.floor(Math.random() * 2);
          for (let d = 0; d < drops; d++) {
            const offset = (Math.random() - 0.5) * 1.5;
            droppedLoot.push({
              id: 0, kind:"loot", faction:"NEUTRAL", dead:false, armor:0,
              pos:{ x:best.pos.x + offset, y:best.pos.y + offset },
              health:1, maxHealth:1,
              lootType: Math.random() < 0.5 ? "health" : "ammo",
              amount: Math.random() < 0.5 ? 30 : 8,
            } as LootItem);
          }
        }
      }
    }
  }

  // Zombie attacks
  for (const e of entities) {
    if (e.kind !== "zombie" || e.dead) continue;
    const z = e as Zombie;
    if (z.attackCooldown > 0) { z.attackCooldown--; continue; }
    for (const t of entities) {
      if (t.dead || t.faction !== "PLAYER_TEAM" || t.kind !== "survivor" || (t as Survivor).evacuated) continue;
      const d = Math.hypot(t.pos.x - z.pos.x, t.pos.y - z.pos.y);
      if (d <= 1.3) {
        z.attackCooldown = 25;
        const dmg = Math.max(1, ZOMBIE_DAMAGE - t.armor);
        t.health -= dmg;
        effects.push({ from:{...z.pos}, to:{...t.pos}, color:"#ff0000", ticksLeft:6, class:"fists" });
        const surv = t as Survivor;
        addLog(`🧟 zombie → ${surv.name} [-${dmg}hp] (${Math.max(0,Math.round(t.health))}hp left)`, "damage");
        if (t.health <= 0) { t.dead = true; addLog(`💀 ${surv.name} has DIED!`, "death"); }
        break;
      }
    }
  }

  return { entities, effects, noiseEvents, droppedLoot };
}

// ─── PICKUP SYSTEM ────────────────────────────────────────────────────────────

function resolvePickups(
  entities: AnyEntity[], tick: number,
  addLog: (text:string, type:LogEntry["type"]) => void
): AnyEntity[] {
  const out = entities.map(e => ({...e, pos:{...e.pos}}) ) as AnyEntity[];
  for (const e of out) {
    if (e.kind !== "survivor" || e.dead) continue;
    const s = e as Survivor;
    for (const l of out) {
      if (l.kind !== "loot" || l.dead) continue;
      const loot = l as LootItem;
      const dist = Math.hypot(s.pos.x - loot.pos.x, s.pos.y - loot.pos.y);
      if (dist <= PICKUP_RADIUS) {
        loot.dead = true; // remove from world
        if (loot.lootType === "health") {
          s.health = Math.min(s.maxHealth, s.health + loot.amount);
          addLog(`💊 ${s.name} picked up HealthPack (+${loot.amount} HP)`, "loot");
        } else {
          // Ammo pickup: restore primary gun if was switched to fists
          if (s.primaryWeapon !== null && s.primaryWeapon.class === "gun") {
            s.weapon = {
              ...s.primaryWeapon,
              ammo: Math.min(s.primaryWeapon.maxAmmo!, s.primaryWeapon.ammo! + loot.amount),
            };
            s.primaryWeapon = null;
            addLog(`📦 ${s.name} grabbed ammo — back to ${s.weapon.name}!`, "loot");
          } else if (s.weapon.class === "gun" && s.weapon.ammo !== null) {
            s.weapon = { ...s.weapon, ammo: Math.min(s.weapon.maxAmmo!, s.weapon.ammo + loot.amount) };
            addLog(`📦 ${s.name} picked up AmmoCrate (+${loot.amount})`, "loot");
          } else {
            // Has fists naturally or melee — give them a pistol
            s.weapon = { ...WEAPONS.pistol, ammo: loot.amount };
            addLog(`📦 ${s.name} found ammo — equipped a Pistol!`, "loot");
          }
        }
      }
    }
  }
  return out;
}

// ─── FOG UPDATE ───────────────────────────────────────────────────────────────

function updateFog(tiles: Tile[][], entities: AnyEntity[], size: number): Tile[][] {
  const out = tiles.map(row => row.map(t => ({
    ...t, fogState: t.fogState === "visible" ? ("explored" as const) : t.fogState,
  })));
  for (const e of entities) {
    if (e.dead || e.faction !== "PLAYER_TEAM") continue;
    const cx = Math.floor(e.pos.x), cy = Math.floor(e.pos.y);
    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
      if (dx*dx + dy*dy > VISION_RADIUS*VISION_RADIUS) continue;
      const tx = cx+dx, ty = cy+dy;
      if (tx >= 0 && tx < size && ty >= 0 && ty < size) out[ty][tx].fogState = "visible";
    }
  }
  return out;
}

// ─── GAME TICK ────────────────────────────────────────────────────────────────

function runTick(state: GameState): GameState {
  if (state.winState !== "playing") return state;

  const pendingLog: LogEntry[] = [];
  const addLog = (text: string, type: LogEntry["type"]) =>
    pendingLog.push({ tick: state.tick, text, type });

  const effects = state.attackEffects.map(ef=>({...ef, ticksLeft:ef.ticksLeft-1})).filter(ef=>ef.ticksLeft>0);
  const noise   = state.noiseEvents.map(n=>({...n, ticksLeft:n.ticksLeft-1})).filter(n=>n.ticksLeft>0);

  const {entities:postCombat, effects:newEffects, noiseEvents:newNoise, droppedLoot} =
    resolveCombat({...state, noiseEvents:noise, attackEffects:effects}, addLog);

  // Assign IDs to dropped loot
  let nextId = state.nextId;
  for (const l of droppedLoot) { l.id = nextId++; postCombat.push(l); }

  // Pickup pass
  const afterPickup = resolvePickups(postCombat, state.tick, addLog);

  // Gather refs
  const portal = afterPickup.find(e=>e.kind==="portal") as RiftPortal;
  const portalOpen = !portal.sealed;
  const switches = afterPickup.filter(e=>e.kind==="switch") as ObjectiveSwitch[];
  const currentSwitch = switches.find(s=>s.idx === state.currentObjectiveIdx && !s.activated) ?? null;
  const currentObjPos = currentSwitch ? { ...currentSwitch.pos } : null;

  // Objective hold progress
  let currentObjIdx = state.currentObjectiveIdx;
  for (const sw of switches) {
    if (sw.activated || sw.idx !== currentObjIdx) continue;
    const holdersNearby = afterPickup.filter(e =>
      e.kind === "survivor" && !e.dead &&
      Math.hypot(e.pos.x - sw.pos.x, e.pos.y - sw.pos.y) < HOLD_RADIUS
    ).length;
    if (holdersNearby > 0) {
      sw.holdProgress = Math.min(sw.holdRequired, sw.holdProgress + 1);
      if (sw.holdProgress >= sw.holdRequired) {
        sw.activated = true;
        addLog(`✅ Objective ${sw.idx + 1} activated!`, "objective");
        const allDone = switches.every(s2 => s2.activated || s2.idx === sw.idx);
        if (allDone) {
          const p = afterPickup.find(e=>e.kind==="portal") as RiftPortal;
          if (p) { p.sealed = false; p.openTick = state.tick; }
          addLog("✦ RIFT PORTAL UNSEALED — Evacuate now!", "objective");
        } else {
          currentObjIdx = sw.idx + 1;
          const nextSw = switches.find(s2 => s2.idx === currentObjIdx);
          if (nextSw) addLog(`➡ Objective ${currentObjIdx+1} is now active.`, "objective");
        }
      }
    }
  }

  // Move entities
  const moved: AnyEntity[] = [];
  const stateForTick = { ...state, entities:afterPickup, noiseEvents:noise, nextId };
  const portalEntity = afterPickup.find(e=>e.kind==="portal") as RiftPortal;

  for (const e of afterPickup) {
    if (e.dead) {
      // Keep dead survivors in state so game-over stats can read their kill counts
      if (e.kind === "survivor") moved.push(e);
      continue;
    }
    if (e.kind === "survivor") {
      moved.push(tickSurvivor(e as Survivor, stateForTick, currentObjPos, {
        x: portalEntity?.pos.x ?? 15,
        y: portalEntity?.pos.y ?? 15,
      }, portalOpen));
    } else if (e.kind === "zombie") {
      moved.push(tickZombie(e as Zombie, stateForTick));
    } else if (e.kind === "nest") {
      const [newNest, spawned] = tickNest(e as CorruptionNest, {...stateForTick, nextId});
      moved.push(newNest);
      if (spawned) { spawned.id = nextId++; moved.push(spawned); }
    } else {
      moved.push({ ...e });
    }
  }

  // Evacuation check
  const finalPortal = moved.find(e=>e.kind==="portal") as RiftPortal;
  if (finalPortal && !finalPortal.sealed) {
    for (const e of moved) {
      if (e.kind !== "survivor" || e.dead) continue;
      const s = e as Survivor;
      if (!s.evacuated && Math.hypot(s.pos.x - finalPortal.pos.x, s.pos.y - finalPortal.pos.y) < EVAC_RADIUS) {
        s.evacuated = true;
        addLog(`🌀 ${s.name} evacuated through the portal!`, "objective");
      }
    }
  }

  // Loot respawn — per design doc: respawn ON by default, cap at 8 loot items on map
  const lootOnMap = moved.filter(e=>e.kind==="loot" && !e.dead).length;
  if (state.tick > 0 && state.tick % 500 === 0 && lootOnMap < 8) {
    const sz = state.settings.mapSize, half2 = sz / 2;
    const angle = Math.random() * Math.PI * 2;
    const r2 = 4 + Math.random() * (sz * 0.4);
    const isH = Math.random() < 0.4;
    moved.push({
      id: nextId++, kind:"loot", faction:"NEUTRAL", dead:false, armor:0,
      pos:{ x:Math.max(1.5, Math.min(sz-1.5, half2+Math.cos(angle)*r2)),
            y:Math.max(1.5, Math.min(sz-1.5, half2+Math.sin(angle)*r2)) },
      health:1, maxHealth:1, lootType: isH ? "health" : "ammo", amount: isH ? 30 : 8,
    } as LootItem);
  }

  // Win / Lose
  const aliveSurvivors = moved.filter(e=>e.kind==="survivor" && !e.dead) as Survivor[];
  let winState: WinState = "playing";
  if (aliveSurvivors.length === 0) {
    winState = "lost";
    addLog("💀 GAME OVER — All survivors eliminated.", "death");
  } else if (aliveSurvivors.every(s=>s.evacuated) && !finalPortal.sealed) {
    winState = "won";
    addLog("🏆 ALL SURVIVORS EVACUATED! Mission complete.", "objective");
  }

  const tiles = updateFog(state.tiles, moved, state.settings.mapSize);
  const newLog = [...pendingLog, ...state.log].slice(0, MAX_LOG);

  return {
    ...state,
    tick: state.tick + 1,
    tiles, entities: moved,
    noiseEvents: [...newNoise.filter(n=>n.ticksLeft>0)],
    attackEffects: [...newEffects.filter(ef=>ef.ticksLeft>0), ...effects],
    log: newLog, nextId,
    currentObjectiveIdx: currentObjIdx,
    winState,
    winTick: winState !== "playing" ? state.tick : state.winTick,
  };
}

// ─── RENDERER ────────────────────────────────────────────────────────────────

function drawCompassArrow(
  ctx: CanvasRenderingContext2D,
  from: Vec2, to: Vec2, camX: number, camY: number, ts: number, color: string
) {
  const fx=(from.x-camX)*ts, fy=(from.y-camY)*ts;
  const tx=(to.x-camX)*ts,   ty=(to.y-camY)*ts;
  const angle = Math.atan2(ty-fy, tx-fx);
  const arrowLen = ts * 1.4;
  const ex = fx + Math.cos(angle) * arrowLen;
  const ey = fy + Math.sin(angle) * arrowLen;
  const hl = 8, ha = 0.45;
  ctx.beginPath();
  ctx.moveTo(fx, fy); ctx.lineTo(ex, ey);
  ctx.moveTo(ex, ey); ctx.lineTo(ex - hl*Math.cos(angle-ha), ey - hl*Math.sin(angle-ha));
  ctx.moveTo(ex, ey); ctx.lineTo(ex - hl*Math.cos(angle+ha), ey - hl*Math.sin(angle+ha));
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
}

function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: { x:number; y:number; zoom:number; mode:CameraMode; followId:number|null },
  canvasW: number, canvasH: number
) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const ts = TILE_SIZE * camera.zoom;
  const size = state.settings.mapSize;
  const now = Date.now();

  let camX = camera.x, camY = camera.y;
  if (camera.mode === "survivor" && camera.followId !== null) {
    const t = state.entities.find(e=>e.id===camera.followId);
    if (t) { camX = t.pos.x - canvasW/(2*ts); camY = t.pos.y - canvasH/(2*ts); }
  }

  const sx0=Math.max(0,Math.floor(camX)), sy0=Math.max(0,Math.floor(camY));
  const sx1=Math.min(size,Math.ceil(camX+canvasW/ts)+1);
  const sy1=Math.min(size,Math.ceil(camY+canvasH/ts)+1);

  // Tiles
  for (let ty=sy0;ty<sy1;ty++) for (let tx=sx0;tx<sx1;tx++) {
    const tile=state.tiles[ty]?.[tx]; if(!tile) continue;
    const px=(tx-camX)*ts, py=(ty-camY)*ts;
    if (tile.fogState==="hidden") { ctx.fillStyle="#080808"; ctx.fillRect(px,py,ts+1,ts+1); continue; }
    ctx.fillStyle=tile.fogState==="visible"?TERRAIN_COLORS[tile.terrain]:TERRAIN_DARK[tile.terrain];
    ctx.fillRect(px,py,ts+1,ts+1);
    if (ts>6) { ctx.strokeStyle="rgba(0,0,0,0.12)"; ctx.lineWidth=0.5; ctx.strokeRect(px,py,ts,ts); }
  }

  // Noise rings
  for (const n of state.noiseEvents) {
    const px=(n.pos.x-camX)*ts, py=(n.pos.y-camY)*ts;
    const prog=1-n.ticksLeft/n.maxTicks;
    ctx.beginPath(); ctx.arc(px,py,n.radius*prog*ts,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,200,50,${(1-prog)*0.4})`; ctx.lineWidth=2; ctx.stroke();
  }

  // Attack effects
  for (const ef of state.attackEffects) {
    const fx=(ef.from.x-camX)*ts, fy=(ef.from.y-camY)*ts;
    const tx2=(ef.to.x-camX)*ts,  ty2=(ef.to.y-camY)*ts;
    const a=ef.ticksLeft/8;
    ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(tx2,ty2);
    ctx.strokeStyle=ef.color+(Math.floor(a*255).toString(16).padStart(2,"0"));
    ctx.lineWidth=ef.class==="gun"?2:3; ctx.stroke();
    if (ef.class==="gun"&&ef.ticksLeft>5) {
      ctx.beginPath(); ctx.arc(fx,fy,4,0,Math.PI*2); ctx.fillStyle="#ffffaa"; ctx.fill();
    }
  }

  const portal = state.entities.find(e=>e.kind==="portal") as RiftPortal|undefined;
  const portalOpen = portal && !portal.sealed;
  const switches = state.entities.filter(e=>e.kind==="switch") as ObjectiveSwitch[];
  const currentSwitch = switches.find(s=>s.idx===state.currentObjectiveIdx&&!s.activated);

  // Compass arrows on survivors
  if (currentSwitch || portalOpen) {
    for (const e of state.entities) {
      if (e.kind!=="survivor"||e.dead) continue;
      const s=e as Survivor;
      if (s.evacuated) continue;
      const tile=state.tiles[Math.floor(e.pos.y)]?.[Math.floor(e.pos.x)];
      if (!tile||tile.fogState==="hidden") continue;
      const targetPos = portalOpen ? portal!.pos : currentSwitch!.pos;
      const color = portalOpen ? "#88ffff" : OBJ_COLORS[state.currentObjectiveIdx%OBJ_COLORS.length];
      drawCompassArrow(ctx, e.pos, targetPos, camX, camY, ts, color);
    }
  }

  // Entities
  for (const e of state.entities) {
    if (e.dead) continue;
    const tile=state.tiles[Math.floor(e.pos.y)]?.[Math.floor(e.pos.x)];
    if (!tile||tile.fogState==="hidden") continue;
    const px=(e.pos.x-camX)*ts, py=(e.pos.y-camY)*ts;

    if (e.kind === "loot") {
      const loot=e as LootItem;
      const isHealth=loot.lootType==="health";
      const r=Math.max(4, ts*0.28);
      const pulse=0.8+0.2*Math.sin(now/600+e.id);
      // Glow
      ctx.beginPath(); ctx.arc(px,py,r*2.2,0,Math.PI*2);
      ctx.fillStyle=isHealth?`rgba(0,200,80,${pulse*0.15})`:`rgba(220,180,0,${pulse*0.15})`; ctx.fill();
      // Body
      ctx.beginPath();
      if (isHealth) {
        ctx.rect(px-r*0.8,py-r*0.8,r*1.6,r*1.6);
      } else {
        ctx.rect(px-r*0.9,py-r*0.6,r*1.8,r*1.2);
      }
      ctx.fillStyle=isHealth?"#22cc55":"#ddaa00"; ctx.fill();
      ctx.strokeStyle=isHealth?"#44ff88":"#ffdd44"; ctx.lineWidth=1.5; ctx.stroke();
      // Symbol
      if (ts>10) {
        ctx.font=`bold ${Math.max(7,r*1.4)}px sans-serif`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle="#fff";
        ctx.fillText(isHealth?"+":"A", px, py);
      }

    } else if (e.kind === "switch") {
      const sw=e as ObjectiveSwitch;
      const objColor=OBJ_COLORS[sw.idx%OBJ_COLORS.length];
      const isActive=sw.idx===state.currentObjectiveIdx&&!sw.activated;
      const r=ts*0.42;
      const pulse=0.7+0.3*Math.sin(now/350+sw.idx);
      if (isActive) {
        ctx.beginPath(); ctx.arc(px,py,r*2.5,0,Math.PI*2);
        ctx.fillStyle=objColor+(Math.floor(pulse*0.3*255).toString(16).padStart(2,"0")); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2);
      ctx.fillStyle=sw.activated?"#44aa44":isActive?objColor:"#555"; ctx.fill();
      ctx.strokeStyle=sw.activated?"#88ff88":isActive?objColor:"#888"; ctx.lineWidth=2; ctx.stroke();
      if (ts>8) {
        ctx.font=`bold ${Math.max(8,ts*0.35)}px monospace`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle=sw.activated?"#fff":isActive?"#fff":"#aaa";
        ctx.fillText(sw.activated?"✓":`${sw.idx+1}`, px, py);
      }
      if (isActive&&sw.holdProgress>0) {
        const bw=r*2.8,bh=4,bx=px-bw/2,by=py+r+3;
        ctx.fillStyle="#222"; ctx.fillRect(bx,by,bw,bh);
        ctx.fillStyle=objColor; ctx.fillRect(bx,by,bw*(sw.holdProgress/sw.holdRequired),bh);
      }
      if (ts>10&&isActive) {
        ctx.font=`${Math.max(7,ts*0.3)}px monospace`;
        ctx.fillStyle=objColor; ctx.textBaseline="bottom";
        ctx.fillText(`OBJ ${sw.idx+1}`, px, py-r-2);
      }

    } else if (e.kind === "portal") {
      const p=e as RiftPortal;
      const r=ts*0.45;
      const pulse=0.7+0.3*Math.sin(now/350);
      const pulse2=0.6+0.4*Math.sin(now/220);
      if (!p.sealed) {
        for (let ring=3;ring>=1;ring--) {
          ctx.beginPath(); ctx.arc(px,py,r*ring*1.1,0,Math.PI*2);
          ctx.fillStyle=`rgba(100,220,255,${pulse*0.08*ring})`; ctx.fill();
        }
        const spinAngle=(now/800)%(Math.PI*2);
        ctx.beginPath(); ctx.arc(px,py,r*1.6,spinAngle,spinAngle+Math.PI*1.2);
        ctx.strokeStyle=`rgba(150,240,255,${pulse2*0.8})`; ctx.lineWidth=2; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(px,py,r*1.8,0,Math.PI*2);
        ctx.fillStyle=`rgba(60,60,120,${pulse*0.3})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2);
      ctx.fillStyle=p.sealed?"#334":"#88ffff"; ctx.fill();
      ctx.strokeStyle=p.sealed?"#668":"#aaffff"; ctx.lineWidth=2; ctx.stroke();
      if (ts>8) {
        ctx.font=`bold ${Math.max(7,ts*0.38)}px monospace`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle=p.sealed?"#88a":"#fff";
        ctx.fillText(p.sealed?"🔒":"✦", px, py);
      }

    } else if (e.kind === "nest") {
      const r=ts*0.45;
      const pulse=0.6+0.4*Math.sin(now/700);
      const hpFrac=e.health/e.maxHealth;
      ctx.beginPath(); ctx.arc(px,py,r*2.2,0,Math.PI*2);
      ctx.fillStyle=`rgba(120,0,200,${pulse*0.12})`; ctx.fill();
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2);
      ctx.fillStyle=hpFrac>0.5?"#5500bb":"#330077"; ctx.fill();
      ctx.strokeStyle="#aa44ff"; ctx.lineWidth=1.5; ctx.stroke();
      const bw=r*2.4,bh=3,bx=px-bw/2,by=py+r+2;
      ctx.fillStyle="#333"; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle="#aa44ff"; ctx.fillRect(bx,by,bw*hpFrac,bh);

    } else if (e.kind === "zombie") {
      const r=ts*0.35;
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2);
      ctx.fillStyle=e.health/e.maxHealth>0.5?"#cc2222":"#882222"; ctx.fill();
      ctx.strokeStyle="#ff4444"; ctx.lineWidth=1; ctx.stroke();

    } else if (e.kind === "survivor") {
      const s=e as Survivor;
      if (s.evacuated) continue;
      const r=ts*0.38;
      const color=BRAIN_COLOR[s.brain];
      const stateColor=s.aiState==="fighting"?"#ff4400":s.aiState==="fleeing"?"#ffff00":s.aiState==="activating"?"#ff9900":s.aiState==="evacuating"?"#88ffff":s.aiState==="scavenging"&&s.targetPos?"#ff88ff":"#44ff88";
      ctx.beginPath(); ctx.arc(px,py,r*1.5,0,Math.PI*2);
      ctx.fillStyle=stateColor+"33"; ctx.fill();
      ctx.strokeStyle=stateColor+"88"; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2);
      ctx.fillStyle=color; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
      // No-ammo indicator
      if (isOutOfAmmo(s)) {
        ctx.beginPath(); ctx.arc(px,py-r-3,3,0,Math.PI*2);
        ctx.fillStyle="#ff0000"; ctx.fill();
      }
      if (ts>12) {
        ctx.font=`bold ${Math.max(7,ts*0.36)}px monospace`;
        ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="bottom";
        ctx.fillText(s.name, px, py-r-1);
      }
      const bw=r*2.4,bh=3,bx=px-bw/2,by=py+r+2;
      ctx.fillStyle="#222"; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=color; ctx.fillRect(bx,by,bw*(Math.max(0,s.health/s.maxHealth)),bh);
    }
  }

  // Evacuated count on portal
  const evacuatedCount=state.entities.filter(e=>e.kind==="survivor"&&!e.dead&&(e as Survivor).evacuated).length;
  if (evacuatedCount>0&&portal) {
    const ppx=(portal.pos.x-camX)*ts, ppy=(portal.pos.y-camY)*ts;
    const tile2=state.tiles[Math.floor(portal.pos.y)]?.[Math.floor(portal.pos.x)];
    if (tile2&&tile2.fogState!=="hidden") {
      ctx.font=`${Math.max(8,ts*0.4)}px monospace`;
      ctx.textAlign="center"; ctx.textBaseline="top";
      ctx.fillStyle="#aaffff"; ctx.fillText(`+${evacuatedCount}✦`, ppx, ppy+ts*0.5);
    }
  }
}

// ─── INIT ────────────────────────────────────────────────────────────────────

function initGame(settings: GameSettings): GameState {
  const rand = makePRNG(settings.seed);
  const tiles = generateMap(settings);
  const [entities, nextId] = spawnEntities(settings, rand);
  return {
    tick:0, tiles, entities,
    noiseEvents:[], attackEffects:[],
    log:[{tick:0, text:"World generated. Scavenge loot, activate objectives, evacuate.", type:"info"}],
    nextId,
    settings,
    currentObjectiveIdx:0, objectivesTotal:3,
    winState:"playing", winTick:0,
  };
}

const DEFAULT: GameSettings = {
  seed:12345, mapSize:30, survivorCount:3, zombieCount:8, nestCount:3, speed:1,
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const WSSPhase3: React.FC = () => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stateRef    = useRef<GameState>(initGame(DEFAULT));
  const cameraRef   = useRef({ x:6, y:6, zoom:1.0, mode:"observer" as CameraMode, followId:null as number|null });
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const animRef     = useRef<number>(0);
  const isDragging  = useRef(false);
  const dragStart   = useRef({x:0,y:0,camX:0,camY:0});

  const [settings,    setSettings]    = useState<GameSettings>(DEFAULT);
  const [seedInput,   setSeedInput]   = useState("12345");
  const [isRunning,   setIsRunning]   = useState(false);
  const [tick,        setTick]        = useState(0);
  const [cameraMode,  setCameraMode]  = useState<CameraMode>("observer");
  const [zoom,        setZoom]        = useState(1.0);
  const [showSettings,setShowSettings]= useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [uiLog,       setUiLog]       = useState<LogEntry[]>([]);
  const [winState,    setWinState]    = useState<WinState>("playing");
  const [counts,      setCounts]      = useState({survivors:0,zombies:0,nests:0,loot:0,evacuated:0,teamAmmo:0});
  const [survivors,   setSurvivors]   = useState<Survivor[]>([]);
  const [objState,    setObjState]    = useState({currentIdx:0,switches:[] as ObjectiveSwitch[],portalOpen:false});

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setTick(s.tick);
    setUiLog([...s.log].slice(0,20));
    setWinState(s.winState);
    const surv = s.entities.filter(e=>e.kind==="survivor"&&!e.dead) as Survivor[];
    setSurvivors(surv);
    const teamAmmo = surv.reduce((sum, sv) => {
      if (sv.weapon.class==="gun"&&sv.weapon.ammo!==null) return sum+sv.weapon.ammo;
      if (sv.primaryWeapon?.class==="gun"&&sv.primaryWeapon.ammo!==null) return sum+sv.primaryWeapon.ammo;
      return sum;
    }, 0);
    setCounts({
      survivors: surv.length,
      zombies:   s.entities.filter(e=>e.kind==="zombie"&&!e.dead).length,
      nests:     s.entities.filter(e=>e.kind==="nest"&&!e.dead).length,
      loot:      s.entities.filter(e=>e.kind==="loot"&&!e.dead).length,
      evacuated: surv.filter(sv=>sv.evacuated).length,
      teamAmmo,
    });
    const portal = s.entities.find(e=>e.kind==="portal") as RiftPortal|undefined;
    const sws = s.entities.filter(e=>e.kind==="switch") as ObjectiveSwitch[];
    setObjState({currentIdx:s.currentObjectiveIdx,switches:sws,portalOpen:portal?!portal.sealed:false});
  },[]);

  const render = useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    renderWorld(ctx,stateRef.current,cameraRef.current,canvas.width,canvas.height);
    animRef.current=requestAnimationFrame(render);
  },[]);

  useEffect(()=>{ animRef.current=requestAnimationFrame(render); return()=>cancelAnimationFrame(animRef.current); },[render]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const resize=()=>{const p=canvas.parentElement;if(p){canvas.width=p.clientWidth;canvas.height=p.clientHeight;}};
    resize(); window.addEventListener("resize",resize); return()=>window.removeEventListener("resize",resize);
  },[]);

  useEffect(()=>{
    cameraRef.current.mode=cameraMode; cameraRef.current.zoom=zoom;
    if(cameraMode==="survivor"){
      const survs=stateRef.current.entities.filter(e=>e.kind==="survivor"&&!e.dead);
      cameraRef.current.followId=survs[selectedIdx%Math.max(1,survs.length)]?.id??null;
    } else cameraRef.current.followId=null;
  },[cameraMode,zoom,selectedIdx]);

  const startLoop=useCallback((speed:number)=>{
    if(intervalRef.current) clearInterval(intervalRef.current);
    if(speed===0) return;
    const tpi=speed>=4?speed:1;
    const ms=Math.max(1,Math.round(16/(speed>=4?1:speed)));
    intervalRef.current=setInterval(()=>{
      if(stateRef.current.winState!=="playing"){clearInterval(intervalRef.current!);setIsRunning(false);return;}
      let s=stateRef.current;
      for(let i=0;i<tpi;i++) s=runTick(s);
      stateRef.current=s; syncUI();
    },ms);
  },[syncUI]);

  const stopLoop=useCallback(()=>{if(intervalRef.current){clearInterval(intervalRef.current);intervalRef.current=null;}},[]);

  const handlePlayPause=()=>{
    if(stateRef.current.winState!=="playing") return;
    if(isRunning){stopLoop();setIsRunning(false);}
    else{startLoop(settings.speed||1);setIsRunning(true);}
  };
  const handleReset=()=>{
    stopLoop(); setIsRunning(false);
    const s:GameSettings={...settings,seed:parseInt(seedInput)||settings.seed};
    const g=initGame(s); stateRef.current=g; setSettings(s);
    const half=s.mapSize/2;
    const canvas=canvasRef.current;
    const ts=TILE_SIZE*cameraRef.current.zoom;
    cameraRef.current={...cameraRef.current,x:half-(canvas?canvas.width/(2*ts):10),y:half-(canvas?canvas.height/(2*ts):10),followId:null};
    syncUI();
  };
  const handleStep=()=>{if(!isRunning&&stateRef.current.winState==="playing"){stateRef.current=runTick(stateRef.current);syncUI();}};
  const handleSpeed=(sp:0|1|2|4|8)=>{setSettings(s=>({...s,speed:sp}));if(isRunning){stopLoop();startLoop(sp);}};

  const onMD=(e:React.MouseEvent)=>{isDragging.current=true;dragStart.current={x:e.clientX,y:e.clientY,camX:cameraRef.current.x,camY:cameraRef.current.y};};
  const onMM=(e:React.MouseEvent)=>{
    if(!isDragging.current) return;
    const ts=TILE_SIZE*cameraRef.current.zoom;
    cameraRef.current.x=dragStart.current.camX-(e.clientX-dragStart.current.x)/ts;
    cameraRef.current.y=dragStart.current.camY-(e.clientY-dragStart.current.y)/ts;
  };
  const onMU=()=>{isDragging.current=false;};
  const onWheel=(e:React.WheelEvent)=>{
    e.preventDefault();
    const nz=Math.max(0.3,Math.min(4,cameraRef.current.zoom*(e.deltaY>0?0.9:1.1)));
    cameraRef.current.zoom=nz; setZoom(nz);
  };

  useEffect(()=>{syncUI();},[syncUI]);

  const logColors:Record<LogEntry["type"],string>={
    combat:"text-yellow-400",damage:"text-red-300",death:"text-red-500 font-bold",
    spawn:"text-purple-400",info:"text-gray-400",warn:"text-orange-400",
    objective:"text-cyan-400",loot:"text-green-400",
  };
  const survivedCount=stateRef.current.entities.filter(e=>e.kind==="survivor"&&!e.dead).length;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden select-none">

      {/* TOP BAR */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-700 shrink-0 flex-wrap">
        <span className="text-red-400 font-bold text-xs tracking-widest">◈ A FORGOTTEN PLACE</span>
        <span className="text-gray-700">│</span>
        <span className="text-green-400 text-xs">PHASE 3</span>
        <span className="text-gray-700">│</span>
        <span className="text-yellow-400 text-xs">T:{tick.toLocaleString()}</span>
        <span className="text-gray-700">│</span>

        {/* Objective progress */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">OBJ</span>
          {objState.switches.sort((a,b)=>a.idx-b.idx).map(sw=>(
            <div key={sw.idx} className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${sw.activated?"bg-green-700 border-green-400 text-white":sw.idx===objState.currentIdx?"border-yellow-400 text-yellow-300":"border-gray-600 text-gray-600"}`}>
              {sw.activated?"✓":sw.idx+1}
            </div>
          ))}
          {objState.portalOpen&&<span className="text-cyan-400 text-xs font-bold ml-1">▶ EVAC!</span>}
        </div>

        <div className="flex-1"/>

        {/* Speed */}
        <div className="flex items-center gap-1">
          {([0,1,2,4,8] as const).map(sp=>(
            <button key={sp} onClick={()=>handleSpeed(sp)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${settings.speed===sp?"bg-blue-700 border-blue-400 text-white":"bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}>
              {sp===0?"—":`${sp}x`}
            </button>
          ))}
        </div>
        <span className="text-gray-700">│</span>
        <button onClick={handlePlayPause} disabled={winState!=="playing"}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border disabled:opacity-30 ${isRunning?"bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700":"bg-green-900 border-green-500 text-green-100 hover:bg-green-800"}`}>
          {isRunning?<Pause className="w-3 h-3"/>:<Play className="w-3 h-3"/>}
          {isRunning?"PAUSE":"RUN"}
        </button>
        <button onClick={handleStep} disabled={isRunning||winState!=="playing"}
          className="px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-30">
          <SkipForward className="w-3 h-3"/>
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 text-orange-300">
          <RotateCcw className="w-3 h-3"/>
        </button>
        <span className="text-gray-700">│</span>
        <div className="flex items-center gap-1">
          {(["observer","survivor","free"] as CameraMode[]).map(m=>(
            <button key={m} onClick={()=>setCameraMode(m)}
              className={`px-2 py-1 rounded text-xs border ${cameraMode===m?"bg-purple-800 border-purple-400 text-white":"bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}>
              {m==="observer"?<Eye className="w-3 h-3"/>:m==="survivor"?<Crosshair className="w-3 h-3"/>:<Move className="w-3 h-3"/>}
            </button>
          ))}
        </div>
        <button onClick={()=>{const nz=Math.min(4,+(zoom*1.25).toFixed(2));setZoom(nz);cameraRef.current.zoom=nz;}}
          className="px-1 py-1 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700"><ZoomIn className="w-3 h-3"/></button>
        <span className="text-gray-500 text-xs">{(zoom*100).toFixed(0)}%</span>
        <button onClick={()=>{const nz=Math.max(0.3,+(zoom*0.8).toFixed(2));setZoom(nz);cameraRef.current.zoom=nz;}}
          className="px-1 py-1 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700"><ZoomOut className="w-3 h-3"/></button>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-52 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto text-xs">

          {/* Settings */}
          <div className="border-b border-gray-700">
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              onClick={()=>setShowSettings(s=>!s)}>
              <span className="flex items-center gap-1"><Settings className="w-3 h-3"/> SETTINGS</span>
              {showSettings?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
            </button>
            {showSettings&&(
              <div className="px-3 pb-3 space-y-2">
                <label className="block text-gray-500">Seed
                  <input value={seedInput} onChange={e=>setSeedInput(e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200"/>
                </label>
                <label className="block text-gray-500">Map Size
                  <select value={settings.mapSize} onChange={e=>setSettings(s=>({...s,mapSize:Number(e.target.value) as 30|40|60}))}
                    className="w-full mt-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200">
                    <option value={30}>30×30</option><option value={40}>40×40</option><option value={60}>60×60</option>
                  </select>
                </label>
                <label className="block text-gray-500">Survivors: {settings.survivorCount}
                  <input type="range" min={1} max={5} value={settings.survivorCount}
                    onChange={e=>setSettings(s=>({...s,survivorCount:Number(e.target.value)}))} className="w-full mt-1"/>
                </label>
                <label className="block text-gray-500">Zombies: {settings.zombieCount}
                  <input type="range" min={0} max={20} value={settings.zombieCount}
                    onChange={e=>setSettings(s=>({...s,zombieCount:Number(e.target.value)}))} className="w-full mt-1"/>
                </label>
                <label className="block text-gray-500">Nests: {settings.nestCount}
                  <input type="range" min={0} max={8} value={settings.nestCount}
                    onChange={e=>setSettings(s=>({...s,nestCount:Number(e.target.value)}))} className="w-full mt-1"/>
                </label>
                <button onClick={handleReset}
                  className="w-full py-1 bg-orange-900 hover:bg-orange-800 border border-orange-600 rounded text-orange-200">
                  Generate World
                </button>
              </div>
            )}
          </div>

          {/* Objectives */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-500 mb-1.5 flex items-center gap-1"><Navigation className="w-3 h-3"/> OBJECTIVES</div>
            <div className="space-y-1.5">
              {objState.switches.sort((a,b)=>a.idx-b.idx).map(sw=>(
                <div key={sw.idx}
                  className={`flex items-center gap-2 p-1.5 rounded border ${sw.activated?"border-green-700 bg-green-900/20":sw.idx===objState.currentIdx?"border-yellow-600 bg-yellow-900/20":"border-gray-700"}`}>
                  {sw.activated
                    ?<CheckCircle2 className="w-3 h-3 text-green-400 shrink-0"/>
                    :<Circle className={`w-3 h-3 shrink-0 ${sw.idx===objState.currentIdx?"text-yellow-400":"text-gray-600"}`}/>
                  }
                  <div className="flex-1 min-w-0">
                    <div className={sw.activated?"text-green-300":sw.idx===objState.currentIdx?"text-yellow-300":"text-gray-500"}>
                      Switch {sw.idx+1} {sw.idx===objState.currentIdx&&!sw.activated?"← ACTIVE":""}
                    </div>
                    {sw.idx===objState.currentIdx&&!sw.activated&&sw.holdProgress>0&&(
                      <div className="mt-1 h-1.5 bg-gray-700 rounded">
                        <div className="h-1.5 rounded" style={{width:`${(sw.holdProgress/sw.holdRequired)*100}%`,backgroundColor:OBJ_COLORS[sw.idx%OBJ_COLORS.length]}}/>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {objState.portalOpen&&(
                <div className="flex items-center gap-2 p-1.5 rounded border border-cyan-500 bg-cyan-900/20">
                  <Zap className="w-3 h-3 text-cyan-400 shrink-0"/>
                  <span className="text-cyan-300 font-bold">PORTAL OPEN — EVAC!</span>
                </div>
              )}
            </div>
          </div>

          {/* Entity counts */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-500 mb-1.5">WORLD</div>
            <div className="space-y-1">
              {[
                {color:"#00ff88",label:`Survivors (${counts.survivors})`},
                {color:"#88ffff",label:`Evacuated (${counts.evacuated})`},
                {color:"#cc2222",label:`Zombies (${counts.zombies})`},
                {color:"#5500bb",label:`Nests (${counts.nests})`},
                {color:"#22cc55",label:`Loot on map (${counts.loot})`},
              ].map(({color,label})=>(
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:color}}/>
                  <span className="text-gray-300">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-700">
                <Package className="w-3 h-3 text-yellow-400 shrink-0"/>
                <span className={`font-bold ${counts.teamAmmo===0?"text-red-400":counts.teamAmmo<10?"text-orange-400":"text-yellow-300"}`}>
                  Team Ammo: {counts.teamAmmo}
                </span>
              </div>
            </div>
          </div>

          {/* Survivor cards */}
          <div className="px-3 py-2 flex-1">
            <div className="text-gray-500 mb-1.5">SURVIVORS</div>
            <div className="space-y-2">
              {survivors.map((s,i)=>{
                const noAmmo = isOutOfAmmo(s);
                const ammoVal = s.weapon.class==="gun"&&s.weapon.ammo!==null ? s.weapon.ammo : s.primaryWeapon?.ammo ?? null;
                const ammoMax = s.weapon.class==="gun"&&s.weapon.maxAmmo!==null ? s.weapon.maxAmmo : s.primaryWeapon?.maxAmmo ?? null;
                const ammoColor = noAmmo ? "text-red-500" : ammoVal !== null && ammoMax !== null && ammoVal < ammoMax * 0.25 ? "text-orange-400" : "text-yellow-400";
                return (
                  <div key={s.id}
                    onClick={()=>{setSelectedIdx(i);if(cameraMode==="survivor")cameraRef.current.followId=s.id;}}
                    className={`p-2 rounded border cursor-pointer transition-colors ${s.evacuated?"border-cyan-700 bg-cyan-900/20":selectedIdx===i&&cameraMode==="survivor"?"border-purple-500 bg-purple-900/30":"border-gray-700 bg-gray-800/50 hover:bg-gray-800"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor:BRAIN_COLOR[s.brain]}}/>
                      <span className="text-gray-200 font-bold">{s.name}</span>
                      {s.evacuated&&<span className="ml-auto text-cyan-400 text-xs">✦EVA</span>}
                      {!s.evacuated&&<span className="ml-auto text-gray-500">{BRAIN_LABEL[s.brain]}</span>}
                    </div>
                    {!s.evacuated&&<>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <span>{noAmmo ? "⚠ "+s.primaryWeapon?.name+" (EMPTY)" : s.weapon.name}</span>
                        {ammoVal!==null&&ammoMax!==null&&(
                          <span className={`ml-auto font-bold ${ammoColor}`}>[{ammoVal}/{ammoMax}]</span>
                        )}
                      </div>
                      <div className={`text-xs mb-1 ${s.aiState==="fighting"?"text-red-400":s.aiState==="fleeing"?"text-yellow-400":s.aiState==="activating"?"text-orange-400":s.aiState==="evacuating"?"text-cyan-400":"text-pink-400"}`}>
                        {noAmmo?"⚠ NO AMMO — ":""}{s.aiState.toUpperCase()} · {s.kills}k
                      </div>
                      {[
                        {lbl:"HP", val:s.health, max:s.maxHealth, cls:s.health<s.maxHealth*0.3?"bg-red-600":"bg-red-500"},
                        {lbl:"ST", val:s.stamina, max:100, cls:"bg-yellow-400"},
                        {lbl:"🍖", val:s.hunger,  max:100, cls:"bg-orange-500"},
                        {lbl:"💧", val:s.thirst,  max:100, cls:"bg-blue-400"},
                      ].map(({lbl,val,max,cls})=>(
                        <div key={lbl} className="flex items-center gap-1 mt-0.5">
                          <span className="w-5 text-gray-600 shrink-0">{lbl}</span>
                          <div className="flex-1 bg-gray-700 rounded h-1.5">
                            <div className={`${cls} h-1.5 rounded`} style={{width:`${Math.max(0,(val/max)*100)}%`}}/>
                          </div>
                        </div>
                      ))}
                    </>}
                  </div>
                );
              })}
              {survivors.length===0&&<div className="text-red-500 text-center py-2">— All dead —</div>}
            </div>
          </div>
        </div>

        {/* CANVAS */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <canvas ref={canvasRef} className="block w-full h-full"
            style={{cursor:cameraMode==="free"?"grab":"crosshair"}}
            onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWheel}/>

          {/* WIN */}
          {winState==="won"&&(
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-10">
              <div className="text-center border border-cyan-500 bg-gray-950/95 px-12 py-10 rounded-2xl shadow-2xl">
                <div className="text-5xl mb-4">🏆</div>
                <div className="text-cyan-300 text-3xl font-bold mb-2">MISSION COMPLETE</div>
                <div className="text-gray-400 text-sm mb-6">All survivors evacuated through the Rift Portal</div>
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div className="bg-gray-800 rounded p-3"><div className="text-cyan-300 text-xl font-bold">{survivedCount}</div><div className="text-gray-500 text-xs">Survived</div></div>
                  <div className="bg-gray-800 rounded p-3"><div className="text-yellow-400 text-xl font-bold">{tick.toLocaleString()}</div><div className="text-gray-500 text-xs">Ticks</div></div>
                  <div className="bg-gray-800 rounded p-3"><div className="text-green-400 text-xl font-bold">3/3</div><div className="text-gray-500 text-xs">Objectives</div></div>
                </div>
                <button onClick={handleReset} className="px-8 py-3 bg-cyan-800 hover:bg-cyan-700 border border-cyan-400 rounded-lg text-cyan-100 font-bold text-sm transition-colors">Play Again</button>
              </div>
            </div>
          )}

          {/* LOSS */}
          {winState==="lost"&&(
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-10">
              <div className="text-center border border-red-700 bg-gray-950/95 px-12 py-10 rounded-2xl shadow-2xl">
                <div className="text-5xl mb-4">💀</div>
                <div className="text-red-400 text-3xl font-bold mb-2">GAME OVER</div>
                <div className="text-gray-400 text-sm mb-6">All survivors eliminated · Tick {tick.toLocaleString()}</div>
                <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                  <div className="bg-gray-800 rounded p-3"><div className="text-green-400 text-xl font-bold">{objState.switches.filter(s=>s.activated).length}/3</div><div className="text-gray-500 text-xs">Objectives done</div></div>
                  <div className="bg-gray-800 rounded p-3"><div className="text-red-400 text-xl font-bold">{(stateRef.current.entities.filter(e=>e.kind==="survivor") as Survivor[]).reduce((a,s)=>a+s.kills,0)}</div><div className="text-gray-500 text-xs">Total kills</div></div>
                </div>
                <button onClick={handleReset} className="px-8 py-3 bg-red-900 hover:bg-red-800 border border-red-500 rounded-lg text-red-100 font-bold text-sm transition-colors">Play Again</button>
              </div>
            </div>
          )}

          {/* HUD top-right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
            <div className={`px-3 py-1.5 rounded border text-xs font-bold backdrop-blur-sm ${objState.portalOpen?"bg-cyan-900/80 border-cyan-400 text-cyan-300 animate-pulse":"bg-gray-900/80 border-gray-600 text-gray-400"}`}>
              {objState.portalOpen?"✦ PORTAL OPEN — EVACUATE!":"🔒 PORTAL SEALED"}
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded px-3 py-2 text-xs space-y-1 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-gray-300"><Activity className="w-3 h-3 text-green-400"/>{counts.survivors} alive · {counts.evacuated} evac'd</div>
              <div className="flex items-center gap-1.5 text-gray-300"><Skull className="w-3 h-3 text-red-400"/>{counts.zombies} zombies · {counts.nests} nests</div>
              <div className="flex items-center gap-1.5">
                <Package className="w-3 h-3 text-yellow-400"/>
                <span className={`font-bold ${counts.teamAmmo===0?"text-red-400":counts.teamAmmo<8?"text-orange-400":"text-yellow-300"}`}>
                  Team Ammo: {counts.teamAmmo}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Heart className="w-3 h-3 text-green-400"/>
                {counts.loot} loot on map
              </div>
            </div>
          </div>

          {/* Combat log */}
          <div className="absolute bottom-3 right-3 w-72 pointer-events-none">
            <div className="bg-gray-950/85 border border-gray-700 rounded p-2 backdrop-blur-sm max-h-44 overflow-hidden flex flex-col gap-0.5">
              {uiLog.slice(0,12).map((entry,i)=>(
                <div key={i} className={`text-xs leading-tight ${logColors[entry.type]}`}>
                  <span className="text-gray-600 mr-1">[{entry.tick}]</span>{entry.text}
                </div>
              ))}
            </div>
          </div>

          {winState==="playing"&&!objState.portalOpen&&(
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 pointer-events-none">
              Green + = HealthPack · Yellow A = AmmoCrate · Follow arrows → Objective {objState.currentIdx+1}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WSSPhase3;

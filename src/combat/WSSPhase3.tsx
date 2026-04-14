import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipForward, RotateCcw, ZoomIn, ZoomOut,
  Eye, Crosshair, Move, Settings, ChevronDown, ChevronUp,
  Skull, Activity, Zap, Navigation, CheckCircle2, Circle,
  Package, Heart, Shield, Target, Clock, Trophy, AlertTriangle
} from "lucide-react";

type TerrainType   = "plains" | "forest" | "mountain" | "desert" | "swamp" | "ruins";
type FactionType   = "PLAYER_TEAM" | "HOSTILE" | "NEUTRAL";
type CameraMode    = "observer" | "survivor" | "free";
type BrainType     = "balanced" | "aggressive" | "cautious" | "survivalist" | "money";
type EntityKind    = "survivor" | "zombie" | "nest" | "portal" | "switch" | "loot" | "rescue";
type WeaponClass   = "fists" | "melee" | "gun";
type LootType      = "health" | "ammo" | "armor" | "stimpack";
type AIState       = "fighting" | "fleeing" | "activating" | "evacuating" | "scavenging" | "rescuing";
type WinState      = "playing" | "won" | "lost";
type ObjectiveType = "ActivateSwitch" | "DestroyNests" | "Survive" | "Collect" | "Rescue";
type GradeType     = "S" | "A" | "B" | "C" | "D" | "F";

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
  primaryWeapon: Weapon | null;
  attackCooldown: number;
  vel: Vec2; targetPos: Vec2 | null; ticksUntilNewTarget: number;
  aiState: AIState; kills: number; evacuated: boolean;
  itemsCollected: number; rescuesMade: number;
  damageDealt: number; damageTaken: number;
}

interface Zombie extends BaseEntity {
  kind: "zombie"; vel: Vec2;
  alertRadius: number; ticksUntilMove: number; attackCooldown: number;
  alertedByNoise: boolean; noiseTarget: Vec2 | null;
  nestId: number;
  tier: number;
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

interface RescueTarget extends BaseEntity {
  kind: "rescue"; rescued: boolean; rescueProgress: number; rescueRequired: number;
  targetName: string;
}

type AnyEntity = Survivor | Zombie | CorruptionNest | RiftPortal | ObjectiveSwitch | LootItem | RescueTarget;

interface Objective {
  type: ObjectiveType;
  label: string;
  description: string;
  completed: boolean;
  progress: number;
  required: number;
  idx: number;
  activatedAtTick: number;
  trackStart: number;
}

interface NoiseEvent { pos: Vec2; radius: number; ticksLeft: number; maxTicks: number; }
interface AttackEffect { from: Vec2; to: Vec2; color: string; ticksLeft: number; class: WeaponClass; }
interface LogEntry { tick: number; text: string; type: "combat"|"damage"|"death"|"spawn"|"info"|"warn"|"objective"|"loot"|"grade"|"escalation"; }

interface EscalationState {
  level: number;
  zombieHpMult: number;
  zombieDamageMult: number;
  nestSpeedMult: number;
  lastEscalationTick: number;
}

interface GameSettings {
  seed: number; mapSize: 30 | 40 | 60;
  survivorCount: number; zombieCount: number; nestCount: number;
  speed: 0 | 1 | 2 | 4 | 8;
}

interface GameState {
  tick: number; tiles: Tile[][]; entities: AnyEntity[];
  noiseEvents: NoiseEvent[]; attackEffects: AttackEffect[]; log: LogEntry[];
  nextId: number; settings: GameSettings;
  objectives: Objective[];
  winState: WinState; winTick: number;
  escalation: EscalationState;
  score: number;
  nestsDestroyed: number;
  totalCollected: number;
  totalRescued: number;
  mapRound: number;
}

const TILE_SIZE      = 18;
const VISION_RADIUS  = 6;
const MAX_LOG        = 120;
const MAX_ZOMBIES    = 24;
const PER_NEST_MAX   = 5;
const NEST_COOLDOWN  = 300;
const HOLD_REQUIRED  = 60;
const HOLD_RADIUS    = 1.8;
const EVAC_RADIUS    = 1.6;
const ZOMBIE_ALERT   = 9;
const PICKUP_RADIUS  = 1.0;
const RESCUE_RADIUS  = 1.5;
const RESCUE_HOLD    = 45;
const LOOT_COUNT_MIN = 10;
const LOOT_COUNT_MAX = 16;

const SURVIVOR_BASE_HP  = 80;
const ZOMBIE_BASE_DAMAGE = 20;
const NEST_HP           = 60;

const ESCALATION_INTERVAL = 400;
const ESCALATION_HP_MULT  = 0.08;
const ESCALATION_DMG_MULT = 0.05;
const ESCALATION_SPEED_MULT = 0.06;

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
const RESCUE_NAMES = ["Milo","Nora","Otto","Pip","Quinn","Rosa","Sven","Tara","Uri","Vera"];
const BRAINS: BrainType[] = ["balanced","aggressive","cautious","survivalist","money"];
const OBJ_COLORS = ["#ff9900", "#ff4488", "#44ffff", "#88ff44", "#ff44ff", "#ffff44"];

const OBJ_TYPE_ICON: Record<ObjectiveType, string> = {
  ActivateSwitch: "⚡", DestroyNests: "🔥", Survive: "⏱",
  Collect: "📦", Rescue: "🆘",
};

const GRADE_COLORS: Record<GradeType, string> = {
  S: "#ffd700", A: "#00ff88", B: "#44aaff",
  C: "#ffaa00", D: "#ff6644", F: "#ff2222",
};
const GRADE_LABELS: Record<GradeType, string> = {
  S: "PERFECT", A: "EXCELLENT", B: "GREAT",
  C: "AVERAGE", D: "POOR", F: "FAILED",
};

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

function makePRNG(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

function placeObjectivePositions(size: number, rand: () => number, count: number): Vec2[] {
  const half = size / 2;
  const positions: Vec2[] = [];
  let attempts = 0;
  while (positions.length < count && attempts < 2000) {
    attempts++;
    const x = 4 + rand() * (size - 8);
    const y = 4 + rand() * (size - 8);
    if (Math.hypot(x - half, y - half) < 8) continue;
    if (positions.some(p => Math.hypot(p.x - x, p.y - y) < 6)) continue;
    positions.push({ x, y });
  }
  return positions;
}

function generateObjectives(rand: () => number, nestCount: number): Objective[] {
  let types: ObjectiveType[] = ["ActivateSwitch", "Survive", "Collect", "Rescue"];
  if (nestCount >= 2) types.push("DestroyNests");
  const shuffled = types.sort(() => rand() - 0.5);
  const count = 2 + (rand() < 0.4 ? 1 : 0);
  const selected = shuffled.slice(0, count);

  return selected.map((type, idx) => {
    switch (type) {
      case "ActivateSwitch":
        return { type, label: "Activate Switch", description: "Hold position near the switch to activate it", completed: false, progress: 0, required: 1, idx, activatedAtTick: -1, trackStart: 0 };
      case "DestroyNests":
        const nestReq = Math.min(nestCount, 2 + Math.floor(rand() * 2));
        return { type, label: "Destroy Nests", description: `Destroy ${nestReq} Corruption Nests`, completed: false, progress: 0, required: nestReq, idx, activatedAtTick: -1, trackStart: 0 };
      case "Survive":
        const survTicks = 300 + Math.floor(rand() * 200);
        return { type, label: "Survive", description: `Survive for ${survTicks} ticks`, completed: false, progress: 0, required: survTicks, idx, activatedAtTick: -1, trackStart: 0 };
      case "Collect":
        const collectReq = 4 + Math.floor(rand() * 4);
        return { type, label: "Collect Supplies", description: `Collect ${collectReq} supply items`, completed: false, progress: 0, required: collectReq, idx, activatedAtTick: -1, trackStart: 0 };
      case "Rescue":
        const rescueReq = 1 + Math.floor(rand() * 2);
        return { type, label: "Rescue Survivors", description: `Rescue ${rescueReq} stranded survivors`, completed: false, progress: 0, required: rescueReq, idx, activatedAtTick: -1, trackStart: 0 };
      default:
        return { type: "ActivateSwitch" as ObjectiveType, label: "Activate Switch", description: "Hold position near the switch", completed: false, progress: 0, required: 1, idx, activatedAtTick: -1, trackStart: 0 };
    }
  });
}

function spawnLoot(size: number, rand: () => number, startId: number): LootItem[] {
  const half = size / 2;
  const count = LOOT_COUNT_MIN + Math.floor(rand() * (LOOT_COUNT_MAX - LOOT_COUNT_MIN + 1));
  const items: LootItem[] = [];
  for (let i = 0; i < count; i++) {
    const roll = rand();
    let lootType: LootType;
    let amount: number;
    if (roll < 0.35) { lootType = "health"; amount = 25 + Math.floor(rand() * 15); }
    else if (roll < 0.65) { lootType = "ammo"; amount = 6 + Math.floor(rand() * 6); }
    else if (roll < 0.85) { lootType = "armor"; amount = 3 + Math.floor(rand() * 5); }
    else { lootType = "stimpack"; amount = 15 + Math.floor(rand() * 10); }
    let x: number, y: number;
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
      pos: { x, y }, health: 1, maxHealth: 1, lootType, amount,
    } as LootItem);
  }
  return items;
}

function spawnRescueTargets(size: number, rand: () => number, startId: number, count: number): RescueTarget[] {
  const half = size / 2;
  const targets: RescueTarget[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const r = 10 + rand() * (size * 0.3);
    targets.push({
      id: startId + i, kind: "rescue", faction: "NEUTRAL", dead: false, armor: 0,
      pos: {
        x: Math.max(2, Math.min(size - 2, half + Math.cos(angle) * r)),
        y: Math.max(2, Math.min(size - 2, half + Math.sin(angle) * r)),
      },
      health: 30, maxHealth: 30,
      rescued: false, rescueProgress: 0, rescueRequired: RESCUE_HOLD,
      targetName: RESCUE_NAMES[i % RESCUE_NAMES.length],
    } as RescueTarget);
  }
  return targets;
}

function spawnEntities(settings: GameSettings, rand: () => number, objectives: Objective[]): [AnyEntity[], number] {
  const { mapSize: size, survivorCount, zombieCount, nestCount } = settings;
  const half = size / 2;
  const entities: AnyEntity[] = [];
  let nextId = 1;

  entities.push({
    id: nextId++, kind: "portal", faction: "NEUTRAL", dead: false, armor: 0,
    pos: { x: half, y: half }, health: 999, maxHealth: 999, sealed: true, openTick: 0,
  } as RiftPortal);

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
      itemsCollected: 0, rescuesMade: 0,
      damageDealt: 0, damageTaken: 0,
    } as Survivor);
  }

  const hasSwitchObj = objectives.some(o => o.type === "ActivateSwitch");
  if (hasSwitchObj) {
    const switchPositions = placeObjectivePositions(size, rand, 1);
    for (let i = 0; i < switchPositions.length; i++) {
      entities.push({
        id: nextId++, kind: "switch", faction: "NEUTRAL", dead: false, armor: 0,
        pos: switchPositions[i], health: 999, maxHealth: 999,
        idx: objectives.findIndex(o => o.type === "ActivateSwitch"),
        activated: false, holdProgress: 0, holdRequired: HOLD_REQUIRED,
      } as ObjectiveSwitch);
    }
  }

  const hasRescueObj = objectives.find(o => o.type === "Rescue");
  if (hasRescueObj) {
    const rescueTargets = spawnRescueTargets(size, rand, nextId, hasRescueObj.required);
    nextId += rescueTargets.length;
    entities.push(...rescueTargets);
  }

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
      tier: 0,
    } as Zombie);
  }

  const loot = spawnLoot(size, rand, nextId);
  nextId += loot.length;
  entities.push(...loot);

  return [entities, nextId];
}

function hasEffectiveAmmo(s: Survivor): boolean {
  return s.weapon.class !== "fists" || s.primaryWeapon === null;
}

function isOutOfAmmo(s: Survivor): boolean {
  return s.weapon.class === "fists" && s.primaryWeapon !== null;
}

function nearestLoot(s: Survivor, entities: AnyEntity[]): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDist = Infinity;
  for (const e of entities) {
    if (e.kind !== "loot" || e.dead) continue;
    const loot = e as LootItem;
    const wantHealth = s.health < s.maxHealth * 0.7;
    const wantAmmo   = isOutOfAmmo(s) || (s.weapon.ammo !== null && s.weapon.ammo < (s.weapon.maxAmmo ?? 1) * 0.3);
    const wantArmor  = s.armor < 5;
    const wantStim   = s.stamina < 40;
    if (loot.lootType === "health" && !wantHealth) continue;
    if (loot.lootType === "ammo" && !wantAmmo) continue;
    if (loot.lootType === "armor" && !wantArmor) continue;
    if (loot.lootType === "stimpack" && !wantStim && !wantHealth) continue;
    const dist = Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y);
    if (dist < nearestDist) { nearestDist = dist; nearest = { ...e.pos }; }
  }
  return nearest;
}

function nearestRescue(s: Survivor, entities: AnyEntity[]): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDist = Infinity;
  for (const e of entities) {
    if (e.kind !== "rescue" || e.dead) continue;
    const rt = e as RescueTarget;
    if (rt.rescued) continue;
    const dist = Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y);
    if (dist < nearestDist) { nearestDist = dist; nearest = { ...e.pos }; }
  }
  return nearest;
}

const FLEE_THRESH: Record<BrainType, number> = {
  aggressive:0.12, balanced:0.3, cautious:0.5, survivalist:0.35, money:0.28,
};
const THREAT_DIST: Record<BrainType, number> = {
  aggressive:999, balanced:9, cautious:12, survivalist:10, money:9,
};
const NO_AMMO_FLEE_COUNT: Record<BrainType, number> = {
  aggressive:4, balanced:2, cautious:1, survivalist:2, money:2,
};

function getActiveObjective(objectives: Objective[]): Objective | null {
  return objectives.find(o => !o.completed) ?? null;
}

function chooseSurvivorAI(
  s: Survivor, allEntities: AnyEntity[], size: number,
  activeObj: Objective | null,
  currentObjPos: Vec2 | null, portalPos: Vec2, portalOpen: boolean,
  hasRescueTarget: boolean
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

  if (portalOpen && !s.evacuated) {
    return { state:"evacuating", target:{ ...portalPos } };
  }

  if (nearest && hasEffectiveAmmo(s) &&
      Math.hypot(nearest.pos.x - s.pos.x, nearest.pos.y - s.pos.y) <= Math.max(s.weapon.range, THREAT_DIST[s.brain])) {
    return { state:"fighting", target:{ ...nearest.pos } };
  }

  const needsLoot = noAmmo || hp < 0.5 || (s.weapon.ammo !== null && s.weapon.ammo < (s.weapon.maxAmmo ?? 1) * 0.25);
  if (needsLoot) {
    const lootTarget = nearestLoot(s, allEntities);
    if (lootTarget) return { state:"scavenging", target: lootTarget };
  }

  if (activeObj && !activeObj.completed) {
    if (activeObj.type === "Rescue" && hasRescueTarget) {
      const rescuePos = nearestRescue(s, allEntities);
      if (rescuePos) return { state: "rescuing", target: rescuePos };
    }
    if (activeObj.type === "DestroyNests") {
      const nearestNest = allEntities
        .filter(e => e.kind === "nest" && !e.dead)
        .reduce<AnyEntity | null>((best, e) =>
          !best || Math.hypot(e.pos.x - s.pos.x, e.pos.y - s.pos.y) < Math.hypot(best.pos.x - s.pos.x, best.pos.y - s.pos.y) ? e : best, null);
      if (nearestNest) return { state: "fighting", target: { ...nearestNest.pos } };
    }
    if (activeObj.type === "Collect") {
      let nearestAnyLoot: Vec2 | null = null;
      let nearestAnyDist = Infinity;
      for (const le of allEntities) {
        if (le.kind !== "loot" || le.dead) continue;
        const ld = Math.hypot(le.pos.x - s.pos.x, le.pos.y - s.pos.y);
        if (ld < nearestAnyDist) { nearestAnyDist = ld; nearestAnyLoot = { ...le.pos }; }
      }
      if (nearestAnyLoot) return { state: "scavenging", target: nearestAnyLoot };
    }
    if (activeObj.type === "ActivateSwitch" && currentObjPos && !portalOpen) {
      return { state:"activating", target:{ ...currentObjPos } };
    }
  }

  return { state:"scavenging", target:null };
}

function tickSurvivor(
  s: Survivor, state: GameState,
  currentObjPos: Vec2 | null, portalPos: Vec2, portalOpen: boolean
): Survivor {
  s = { ...s, pos:{...s.pos}, vel:{...s.vel}, weapon:{...s.weapon} };
  if (s.dead || s.evacuated) return s;
  const size = state.settings.mapSize;

  const activeObj = getActiveObjective(state.objectives);
  const hasRescueTarget = state.entities.some(e => e.kind === "rescue" && !e.dead && !(e as RescueTarget).rescued);

  const { state: aiState, target } = chooseSurvivorAI(
    s, state.entities, size, activeObj, currentObjPos, portalPos, portalOpen, hasRescueTarget
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

  if (s.targetPos && (aiState !== "fighting" || s.weapon.range <= 1.5 || Math.hypot(s.targetPos.x - s.pos.x, s.targetPos.y - s.pos.y) > s.weapon.range * 0.85)) {
    const dx = s.targetPos.x - s.pos.x;
    const dy = s.targetPos.y - s.pos.y;
    const dist = Math.hypot(dx, dy);
    const stopDist = (aiState === "activating" || aiState === "evacuating" || aiState === "scavenging" || aiState === "rescuing") ? 0.5 : 0.3;
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

  const speed = 0.028 + state.escalation.level * 0.002;
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

function tickNest(nest: CorruptionNest, state: GameState): [CorruptionNest, Zombie | null] {
  nest = { ...nest };
  const speedMult = state.escalation.nestSpeedMult;
  nest.spawnCooldown -= (1 + (speedMult - 1) * 0.5);
  if (nest.spawnCooldown <= 0) {
    nest.spawnCooldown = nest.maxCooldown;
    const totalZombies = state.entities.filter(e => e.kind === "zombie" && !e.dead).length;
    const nestZombies  = state.entities.filter(
      e => e.kind === "zombie" && !e.dead && (e as Zombie).nestId === nest.id
    ).length;
    if (totalZombies < MAX_ZOMBIES && nestZombies < PER_NEST_MAX) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.random() * 1.5;
      const tier = state.escalation.level;
      const baseHp = 65 + tier * 10;
      return [nest, {
        id: state.nextId, kind:"zombie", faction:"HOSTILE", dead:false, armor: Math.floor(tier * 1.5),
        pos:{ x:nest.pos.x+Math.cos(angle)*r, y:nest.pos.y+Math.sin(angle)*r },
        health: Math.floor(baseHp * state.escalation.zombieHpMult),
        maxHealth: Math.floor(baseHp * state.escalation.zombieHpMult),
        vel:{x:0,y:0},
        alertRadius: ZOMBIE_ALERT + Math.min(3, tier * 0.5),
        ticksUntilMove:3,
        attackCooldown:0, alertedByNoise:false, noiseTarget:null,
        nestId:nest.id, tier,
      } as Zombie];
    }
  }
  return [nest, null];
}

function resolveCombat(
  state: GameState,
  addLog: (text:string, type:LogEntry["type"]) => void
): { entities:AnyEntity[]; effects:AttackEffect[]; noiseEvents:NoiseEvent[]; droppedLoot:LootItem[]; nestsKilled:number; scoreGain:number } {
  const entities = state.entities.map(e=>({...e, pos:{...e.pos}})) as AnyEntity[];
  const effects: AttackEffect[]  = [...state.attackEffects];
  const noiseEvents: NoiseEvent[] = [...state.noiseEvents];
  const droppedLoot: LootItem[]   = [];
  let nestsKilled = 0;
  let scoreGain = 0;

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
      s.damageDealt += dmg;
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
          s.primaryWeapon = { ...s.weapon };
          s.weapon = { ...FISTS };
          addLog(`${s.name} is out of ammo!`, "warn");
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
          scoreGain += 10 + (best as Zombie).tier * 5;
          addLog(`${s.name} killed a zombie.`, "death");
        } else if (best.kind === "nest") {
          s.kills++;
          nestsKilled++;
          scoreGain += 50;
          addLog(`Nest destroyed! Loot dropped.`, "objective");
          const drops = 1 + Math.floor(Math.random() * 2);
          for (let d = 0; d < drops; d++) {
            const offset = (Math.random() - 0.5) * 1.5;
            const roll = Math.random();
            droppedLoot.push({
              id: 0, kind:"loot", faction:"NEUTRAL", dead:false, armor:0,
              pos:{ x:best.pos.x + offset, y:best.pos.y + offset },
              health:1, maxHealth:1,
              lootType: roll < 0.4 ? "health" : roll < 0.7 ? "ammo" : roll < 0.9 ? "armor" : "stimpack",
              amount: roll < 0.4 ? 30 : roll < 0.7 ? 8 : roll < 0.9 ? 4 : 20,
            } as LootItem);
          }
        }
      }
    }
  }

  const zombieDmg = Math.floor(ZOMBIE_BASE_DAMAGE * state.escalation.zombieDamageMult);
  for (const e of entities) {
    if (e.kind !== "zombie" || e.dead) continue;
    const z = e as Zombie;
    if (z.attackCooldown > 0) { z.attackCooldown--; continue; }
    for (const t of entities) {
      if (t.dead || t.faction !== "PLAYER_TEAM" || t.kind !== "survivor" || (t as Survivor).evacuated) continue;
      const d = Math.hypot(t.pos.x - z.pos.x, t.pos.y - z.pos.y);
      if (d <= 1.3) {
        z.attackCooldown = 25;
        const dmg = Math.max(1, zombieDmg - t.armor);
        t.health -= dmg;
        (t as Survivor).damageTaken += dmg;
        effects.push({ from:{...z.pos}, to:{...t.pos}, color:"#ff0000", ticksLeft:6, class:"fists" });
        const surv = t as Survivor;
        addLog(`zombie hit ${surv.name} [-${dmg}hp] (${Math.max(0,Math.round(t.health))}hp)`, "damage");
        if (t.health <= 0) { t.dead = true; addLog(`${surv.name} has DIED!`, "death"); }
        break;
      }
    }
  }

  return { entities, effects, noiseEvents, droppedLoot, nestsKilled, scoreGain };
}

function resolvePickups(
  entities: AnyEntity[], tick: number,
  addLog: (text:string, type:LogEntry["type"]) => void
): { entities: AnyEntity[]; collected: number } {
  const out = entities.map(e => ({...e, pos:{...e.pos}}) ) as AnyEntity[];
  let collected = 0;
  for (const e of out) {
    if (e.kind !== "survivor" || e.dead) continue;
    const s = e as Survivor;
    for (const l of out) {
      if (l.kind !== "loot" || l.dead) continue;
      const loot = l as LootItem;
      const dist = Math.hypot(s.pos.x - loot.pos.x, s.pos.y - loot.pos.y);
      if (dist <= PICKUP_RADIUS) {
        loot.dead = true;
        collected++;
        s.itemsCollected++;
        if (loot.lootType === "health") {
          s.health = Math.min(s.maxHealth, s.health + loot.amount);
          addLog(`${s.name} picked up HealthPack (+${loot.amount} HP)`, "loot");
        } else if (loot.lootType === "ammo") {
          if (s.primaryWeapon !== null && s.primaryWeapon.class === "gun") {
            s.weapon = {
              ...s.primaryWeapon,
              ammo: Math.min(s.primaryWeapon.maxAmmo!, s.primaryWeapon.ammo! + loot.amount),
            };
            s.primaryWeapon = null;
            addLog(`${s.name} grabbed ammo — back to ${s.weapon.name}!`, "loot");
          } else if (s.weapon.class === "gun" && s.weapon.ammo !== null) {
            s.weapon = { ...s.weapon, ammo: Math.min(s.weapon.maxAmmo!, s.weapon.ammo + loot.amount) };
            addLog(`${s.name} picked up AmmoCrate (+${loot.amount})`, "loot");
          } else {
            s.weapon = { ...WEAPONS.pistol, ammo: loot.amount };
            addLog(`${s.name} found ammo — equipped a Pistol!`, "loot");
          }
        } else if (loot.lootType === "armor") {
          s.armor = Math.min(15, s.armor + loot.amount);
          addLog(`${s.name} equipped ArmorPlate (+${loot.amount} armor)`, "loot");
        } else if (loot.lootType === "stimpack") {
          s.stamina = Math.min(100, s.stamina + loot.amount);
          s.health = Math.min(s.maxHealth, s.health + Math.floor(loot.amount * 0.5));
          addLog(`${s.name} used Stimpack (+${loot.amount} stam, +${Math.floor(loot.amount * 0.5)} HP)`, "loot");
        }
      }
    }
  }
  return { entities: out, collected };
}

function resolveRescues(
  entities: AnyEntity[], tick: number,
  addLog: (text:string, type:LogEntry["type"]) => void
): { entities: AnyEntity[]; rescued: number } {
  const out = entities.map(e => ({...e, pos:{...e.pos}}) ) as AnyEntity[];
  let rescued = 0;
  for (const e of out) {
    if (e.kind !== "rescue" || e.dead) continue;
    const rt = e as RescueTarget;
    if (rt.rescued) continue;
    const nearSurvivors = out.filter(s =>
      s.kind === "survivor" && !s.dead && !(s as Survivor).evacuated &&
      Math.hypot(s.pos.x - rt.pos.x, s.pos.y - rt.pos.y) < RESCUE_RADIUS
    );
    if (nearSurvivors.length > 0) {
      rt.rescueProgress = Math.min(rt.rescueRequired, rt.rescueProgress + 1);
      if (rt.rescueProgress >= rt.rescueRequired) {
        rt.rescued = true;
        rescued++;
        const rescuer = nearSurvivors[0] as Survivor;
        rescuer.rescuesMade++;
        addLog(`${rescuer.name} rescued ${rt.targetName}!`, "objective");
      }
    }
  }
  return { entities: out, rescued };
}

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

function updateEscalation(esc: EscalationState, tick: number, addLog: (text:string, type:LogEntry["type"]) => void): EscalationState {
  if (tick - esc.lastEscalationTick < ESCALATION_INTERVAL) return esc;
  const newLevel = esc.level + 1;
  addLog(`ESCALATION ${newLevel} — Enemies grow stronger!`, "escalation");
  return {
    level: newLevel,
    zombieHpMult: 1 + newLevel * ESCALATION_HP_MULT,
    zombieDamageMult: 1 + newLevel * ESCALATION_DMG_MULT,
    nestSpeedMult: 1 + newLevel * ESCALATION_SPEED_MULT,
    lastEscalationTick: tick,
  };
}

function calculateGrade(state: GameState): GradeType {
  if (state.winState === "lost") return "F";
  const allSurvivors = state.entities.filter(e => e.kind === "survivor") as Survivor[];
  const alive = allSurvivors.filter(s => !s.dead);
  const evacuated = alive.filter(s => s.evacuated);
  const survivalRate = alive.length / Math.max(1, allSurvivors.length);
  const evacRate = evacuated.length / Math.max(1, allSurvivors.length);
  const totalKills = allSurvivors.reduce((a, s) => a + s.kills, 0);
  const objDone = state.objectives.filter(o => o.completed).length;
  const objTotal = state.objectives.length;
  const tickPar = 2000;
  const timeBonus = Math.max(0, 1 - (state.tick / tickPar) * 0.3);

  let score = 0;
  score += evacRate * 40;
  score += survivalRate * 15;
  score += (objDone / Math.max(1, objTotal)) * 20;
  score += Math.min(15, totalKills * 0.3);
  score += timeBonus * 10;

  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  if (score >= 25) return "D";
  return "F";
}

function runTick(state: GameState): GameState {
  if (state.winState !== "playing") return state;

  const pendingLog: LogEntry[] = [];
  const addLog = (text: string, type: LogEntry["type"]) =>
    pendingLog.push({ tick: state.tick, text, type });

  const effects = state.attackEffects.map(ef=>({...ef, ticksLeft:ef.ticksLeft-1})).filter(ef=>ef.ticksLeft>0);
  const noise   = state.noiseEvents.map(n=>({...n, ticksLeft:n.ticksLeft-1})).filter(n=>n.ticksLeft>0);

  const escalation = updateEscalation(state.escalation, state.tick, addLog);

  const {entities:postCombat, effects:newEffects, noiseEvents:newNoise, droppedLoot, nestsKilled, scoreGain} =
    resolveCombat({...state, noiseEvents:noise, attackEffects:effects, escalation}, addLog);

  let nextId = state.nextId;
  for (const l of droppedLoot) { l.id = nextId++; postCombat.push(l); }

  const { entities: afterPickup, collected } = resolvePickups(postCombat, state.tick, addLog);
  const { entities: afterRescue, rescued } = resolveRescues(afterPickup, state.tick, addLog);

  const portal = afterRescue.find(e=>e.kind==="portal") as RiftPortal;
  const switches = afterRescue.filter(e=>e.kind==="switch") as ObjectiveSwitch[];

  let objectives = state.objectives.map(o => ({ ...o }));
  let totalCollected = state.totalCollected + collected;
  let totalRescued = state.totalRescued + rescued;
  let nestsDestroyed = state.nestsDestroyed + nestsKilled;
  let score = state.score + scoreGain + collected * 5 + rescued * 25;

  const activeObjIdx = objectives.findIndex(o => !o.completed);
  if (activeObjIdx >= 0) {
    const obj = objectives[activeObjIdx];
    if (obj.activatedAtTick < 0) {
      obj.activatedAtTick = state.tick;
      obj.trackStart = obj.type === "DestroyNests" ? nestsDestroyed :
                        obj.type === "Collect" ? totalCollected :
                        obj.type === "Rescue" ? totalRescued : 0;
    }
    switch (obj.type) {
      case "ActivateSwitch": {
        const sw = switches.find(s => s.idx === activeObjIdx && !s.activated);
        if (sw) {
          const holdersNearby = afterRescue.filter(e =>
            e.kind === "survivor" && !e.dead &&
            Math.hypot(e.pos.x - sw.pos.x, e.pos.y - sw.pos.y) < HOLD_RADIUS
          ).length;
          if (holdersNearby > 0) {
            sw.holdProgress = Math.min(sw.holdRequired, sw.holdProgress + 1);
            if (sw.holdProgress >= sw.holdRequired) {
              sw.activated = true;
              obj.completed = true;
              obj.progress = obj.required;
              score += 100;
              addLog(`Objective ${activeObjIdx + 1} complete: Switch activated!`, "objective");
            }
          }
        }
        obj.progress = sw ? sw.holdProgress / sw.holdRequired : 0;
        break;
      }
      case "DestroyNests": {
        const sinceActive = nestsDestroyed - obj.trackStart;
        obj.progress = sinceActive;
        if (sinceActive >= obj.required) {
          obj.completed = true;
          score += 100;
          addLog(`Objective ${activeObjIdx + 1} complete: Nests destroyed!`, "objective");
        }
        break;
      }
      case "Survive": {
        obj.progress = Math.min(obj.required, obj.progress + 1);
        if (obj.progress >= obj.required) {
          obj.completed = true;
          score += 100;
          addLog(`Objective ${activeObjIdx + 1} complete: Survived!`, "objective");
        }
        break;
      }
      case "Collect": {
        const sinceActive = totalCollected - obj.trackStart;
        obj.progress = sinceActive;
        if (sinceActive >= obj.required) {
          obj.completed = true;
          score += 100;
          addLog(`Objective ${activeObjIdx + 1} complete: Supplies collected!`, "objective");
        }
        break;
      }
      case "Rescue": {
        const sinceActive = totalRescued - obj.trackStart;
        obj.progress = sinceActive;
        if (sinceActive >= obj.required) {
          obj.completed = true;
          score += 100;
          addLog(`Objective ${activeObjIdx + 1} complete: Survivors rescued!`, "objective");
        }
        break;
      }
    }
  }

  const allObjDone = objectives.every(o => o.completed);
  if (allObjDone && portal.sealed) {
    portal.sealed = false;
    portal.openTick = state.tick;
    addLog("RIFT PORTAL UNSEALED — Evacuate now!", "objective");
  }

  if (!allObjDone) {
    const newActiveIdx = objectives.findIndex(o => !o.completed);
    if (newActiveIdx >= 0 && newActiveIdx !== activeObjIdx) {
      addLog(`Objective ${newActiveIdx + 1} is now active: ${objectives[newActiveIdx].label}`, "objective");
    }
  }

  const currentSwitch = switches.find(s => s.idx === activeObjIdx && !s.activated) ?? null;
  const currentObjPos = currentSwitch ? { ...currentSwitch.pos } : null;
  const portalOpen = !portal.sealed;

  const moved: AnyEntity[] = [];
  const stateForTick = { ...state, entities:afterRescue, noiseEvents:noise, nextId, escalation, objectives };
  const portalEntity = afterRescue.find(e=>e.kind==="portal") as RiftPortal;

  for (const e of afterRescue) {
    if (e.dead) {
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

  const finalPortal = moved.find(e=>e.kind==="portal") as RiftPortal;
  if (finalPortal && !finalPortal.sealed) {
    for (const e of moved) {
      if (e.kind !== "survivor" || e.dead) continue;
      const s = e as Survivor;
      if (!s.evacuated && Math.hypot(s.pos.x - finalPortal.pos.x, s.pos.y - finalPortal.pos.y) < EVAC_RADIUS) {
        s.evacuated = true;
        score += 200;
        addLog(`${s.name} evacuated through the portal!`, "objective");
      }
    }
  }

  const lootOnMap = moved.filter(e=>e.kind==="loot" && !e.dead).length;
  if (state.tick > 0 && state.tick % 400 === 0 && lootOnMap < 8) {
    const sz = state.settings.mapSize, half2 = sz / 2;
    const angle = Math.random() * Math.PI * 2;
    const r2 = 4 + Math.random() * (sz * 0.4);
    const roll = Math.random();
    let lt: LootType, amt: number;
    if (roll < 0.35) { lt = "health"; amt = 25; }
    else if (roll < 0.65) { lt = "ammo"; amt = 8; }
    else if (roll < 0.85) { lt = "armor"; amt = 3; }
    else { lt = "stimpack"; amt = 15; }
    moved.push({
      id: nextId++, kind:"loot", faction:"NEUTRAL", dead:false, armor:0,
      pos:{ x:Math.max(1.5, Math.min(sz-1.5, half2+Math.cos(angle)*r2)),
            y:Math.max(1.5, Math.min(sz-1.5, half2+Math.sin(angle)*r2)) },
      health:1, maxHealth:1, lootType: lt, amount: amt,
    } as LootItem);
  }

  const aliveSurvivors = moved.filter(e=>e.kind==="survivor" && !e.dead) as Survivor[];
  let winState: WinState = "playing";
  if (aliveSurvivors.length === 0) {
    winState = "lost";
    addLog("GAME OVER — All survivors eliminated.", "death");
  } else if (aliveSurvivors.every(s=>s.evacuated) && !finalPortal.sealed) {
    winState = "won";
    addLog("ALL SURVIVORS EVACUATED! Mission complete.", "objective");
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
    objectives,
    winState,
    winTick: winState !== "playing" ? state.tick : state.winTick,
    escalation,
    score,
    nestsDestroyed,
    totalCollected,
    totalRescued,
    mapRound: state.mapRound,
  };
}

function drawCompassArrow(
  ctx: CanvasRenderingContext2D,
  from: Vec2, to: Vec2, camX: number, camY: number, ts: number, color: string, label?: string
) {
  const fx=(from.x-camX)*ts, fy=(from.y-camY)*ts;
  const tx=(to.x-camX)*ts,   ty=(to.y-camY)*ts;
  const angle = Math.atan2(ty-fy, tx-fx);
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
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
  if (label && ts > 8) {
    ctx.font = `bold ${Math.max(7, ts * 0.28)}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(`${label} (${Math.round(dist)})`, ex, ey - 4);
  }
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

  for (let ty=sy0;ty<sy1;ty++) for (let tx=sx0;tx<sx1;tx++) {
    const tile=state.tiles[ty]?.[tx]; if(!tile) continue;
    const px=(tx-camX)*ts, py=(ty-camY)*ts;
    if (tile.fogState==="hidden") { ctx.fillStyle="#080808"; ctx.fillRect(px,py,ts+1,ts+1); continue; }
    ctx.fillStyle=tile.fogState==="visible"?TERRAIN_COLORS[tile.terrain]:TERRAIN_DARK[tile.terrain];
    ctx.fillRect(px,py,ts+1,ts+1);
    if (ts>6) { ctx.strokeStyle="rgba(0,0,0,0.12)"; ctx.lineWidth=0.5; ctx.strokeRect(px,py,ts,ts); }
  }

  for (const n of state.noiseEvents) {
    const px=(n.pos.x-camX)*ts, py=(n.pos.y-camY)*ts;
    const prog=1-n.ticksLeft/n.maxTicks;
    ctx.beginPath(); ctx.arc(px,py,n.radius*prog*ts,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,200,50,${(1-prog)*0.4})`; ctx.lineWidth=2; ctx.stroke();
  }

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
  const activeObj = getActiveObjective(state.objectives);
  const switches = state.entities.filter(e=>e.kind==="switch") as ObjectiveSwitch[];
  const currentSwitch = activeObj?.type === "ActivateSwitch" ? switches.find(s => s.idx === activeObj.idx && !s.activated) : undefined;

  if (currentSwitch || portalOpen || (activeObj && (activeObj.type === "DestroyNests" || activeObj.type === "Rescue" || activeObj.type === "Collect"))) {
    for (const e of state.entities) {
      if (e.kind!=="survivor"||e.dead) continue;
      const s=e as Survivor;
      if (s.evacuated) continue;
      const tile=state.tiles[Math.floor(e.pos.y)]?.[Math.floor(e.pos.x)];
      if (!tile||tile.fogState==="hidden") continue;

      if (portalOpen && portal) {
        drawCompassArrow(ctx, e.pos, portal.pos, camX, camY, ts, "#88ffff", "EVAC");
      } else if (currentSwitch) {
        const color = OBJ_COLORS[activeObj!.idx % OBJ_COLORS.length];
        drawCompassArrow(ctx, e.pos, currentSwitch.pos, camX, camY, ts, color, "OBJ");
      } else if (activeObj?.type === "DestroyNests") {
        const nearestNest = state.entities
          .filter(ne => ne.kind === "nest" && !ne.dead)
          .reduce<AnyEntity | null>((best, ne) =>
            !best || Math.hypot(ne.pos.x - s.pos.x, ne.pos.y - s.pos.y) < Math.hypot(best.pos.x - s.pos.x, best.pos.y - s.pos.y) ? ne : best, null);
        if (nearestNest) drawCompassArrow(ctx, e.pos, nearestNest.pos, camX, camY, ts, "#ff4488", "NEST");
      } else if (activeObj?.type === "Rescue") {
        const nearestRT = state.entities
          .filter(ne => ne.kind === "rescue" && !ne.dead && !(ne as RescueTarget).rescued)
          .reduce<AnyEntity | null>((best, ne) =>
            !best || Math.hypot(ne.pos.x - s.pos.x, ne.pos.y - s.pos.y) < Math.hypot(best.pos.x - s.pos.x, best.pos.y - s.pos.y) ? ne : best, null);
        if (nearestRT) drawCompassArrow(ctx, e.pos, nearestRT.pos, camX, camY, ts, "#ff8844", "SOS");
      } else if (activeObj?.type === "Collect") {
        const nearestLootE = state.entities
          .filter(ne => ne.kind === "loot" && !ne.dead)
          .reduce<AnyEntity | null>((best, ne) =>
            !best || Math.hypot(ne.pos.x - s.pos.x, ne.pos.y - s.pos.y) < Math.hypot(best.pos.x - s.pos.x, best.pos.y - s.pos.y) ? ne : best, null);
        if (nearestLootE) drawCompassArrow(ctx, e.pos, nearestLootE.pos, camX, camY, ts, "#22cc55", "LOOT");
      }
    }
  }

  for (const e of state.entities) {
    if (e.dead) continue;
    const tile=state.tiles[Math.floor(e.pos.y)]?.[Math.floor(e.pos.x)];
    if (!tile||tile.fogState==="hidden") continue;
    const px=(e.pos.x-camX)*ts, py=(e.pos.y-camY)*ts;

    if (e.kind === "rescue") {
      const rt = e as RescueTarget;
      if (rt.rescued) continue;
      const r = Math.max(5, ts * 0.35);
      const pulse = 0.6 + 0.4 * Math.sin(now / 400 + e.id);
      ctx.beginPath(); ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 136, 68, ${pulse * 0.15})`; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ff8844"; ctx.fill();
      ctx.strokeStyle = "#ffaa66"; ctx.lineWidth = 2; ctx.stroke();
      if (ts > 8) {
        ctx.font = `bold ${Math.max(7, ts * 0.35)}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText("SOS", px, py);
      }
      if (ts > 10) {
        ctx.font = `${Math.max(7, ts * 0.28)}px monospace`;
        ctx.fillStyle = "#ffaa66"; ctx.textBaseline = "bottom";
        ctx.fillText(rt.targetName, px, py - r - 2);
      }
      if (rt.rescueProgress > 0) {
        const bw = r * 2.8, bh = 4, bx = px - bw / 2, by = py + r + 3;
        ctx.fillStyle = "#222"; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#ff8844"; ctx.fillRect(bx, by, bw * (rt.rescueProgress / rt.rescueRequired), bh);
      }
    } else if (e.kind === "loot") {
      const loot = e as LootItem;
      const r = Math.max(4, ts * 0.28);
      const pulse = 0.8 + 0.2 * Math.sin(now / 600 + e.id);
      const colors: Record<LootType, { bg: string; glow: string; border: string; sym: string }> = {
        health:   { bg: "#22cc55", glow: "rgba(0,200,80,",   border: "#44ff88", sym: "+" },
        ammo:     { bg: "#ddaa00", glow: "rgba(220,180,0,",  border: "#ffdd44", sym: "A" },
        armor:    { bg: "#4488ff", glow: "rgba(68,136,255,", border: "#66aaff", sym: "S" },
        stimpack: { bg: "#ff44aa", glow: "rgba(255,68,170,", border: "#ff88cc", sym: "!" },
      };
      const c = colors[loot.lootType];
      ctx.beginPath(); ctx.arc(px, py, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = c.glow + `${pulse * 0.15})`; ctx.fill();
      ctx.beginPath();
      if (loot.lootType === "health") ctx.rect(px - r * 0.8, py - r * 0.8, r * 1.6, r * 1.6);
      else if (loot.lootType === "armor") {
        ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px + r * 0.7, py + r);
        ctx.lineTo(px - r * 0.7, py + r); ctx.lineTo(px - r, py); ctx.closePath();
      } else ctx.rect(px - r * 0.9, py - r * 0.6, r * 1.8, r * 1.2);
      ctx.fillStyle = c.bg; ctx.fill();
      ctx.strokeStyle = c.border; ctx.lineWidth = 1.5; ctx.stroke();
      if (ts > 10) {
        ctx.font = `bold ${Math.max(7, r * 1.4)}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(c.sym, px, py);
      }

    } else if (e.kind === "switch") {
      const sw = e as ObjectiveSwitch;
      const objColor = OBJ_COLORS[sw.idx % OBJ_COLORS.length];
      const isActive = activeObj?.type === "ActivateSwitch" && sw.idx === activeObj.idx && !sw.activated;
      const r = ts * 0.42;
      const pulse = 0.7 + 0.3 * Math.sin(now / 350 + sw.idx);
      if (isActive) {
        ctx.beginPath(); ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = objColor + (Math.floor(pulse * 0.3 * 255).toString(16).padStart(2, "0")); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = sw.activated ? "#44aa44" : isActive ? objColor : "#555"; ctx.fill();
      ctx.strokeStyle = sw.activated ? "#88ff88" : isActive ? objColor : "#888"; ctx.lineWidth = 2; ctx.stroke();
      if (ts > 8) {
        ctx.font = `bold ${Math.max(8, ts * 0.35)}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = sw.activated ? "#fff" : isActive ? "#fff" : "#aaa";
        ctx.fillText(sw.activated ? "✓" : `${sw.idx + 1}`, px, py);
      }
      if (isActive && sw.holdProgress > 0) {
        const bw = r * 2.8, bh = 4, bx = px - bw / 2, by = py + r + 3;
        ctx.fillStyle = "#222"; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = objColor; ctx.fillRect(bx, by, bw * (sw.holdProgress / sw.holdRequired), bh);
      }
      if (ts > 10 && isActive) {
        ctx.font = `${Math.max(7, ts * 0.3)}px monospace`;
        ctx.fillStyle = objColor; ctx.textBaseline = "bottom";
        ctx.fillText(`OBJ`, px, py - r - 2);
      }

    } else if (e.kind === "portal") {
      const p = e as RiftPortal;
      const r = ts * 0.45;
      const pulse = 0.7 + 0.3 * Math.sin(now / 350);
      const pulse2 = 0.6 + 0.4 * Math.sin(now / 220);
      if (!p.sealed) {
        for (let ring = 3; ring >= 1; ring--) {
          ctx.beginPath(); ctx.arc(px, py, r * ring * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100,220,255,${pulse * 0.08 * ring})`; ctx.fill();
        }
        const spinAngle = (now / 800) % (Math.PI * 2);
        ctx.beginPath(); ctx.arc(px, py, r * 1.6, spinAngle, spinAngle + Math.PI * 1.2);
        ctx.strokeStyle = `rgba(150,240,255,${pulse2 * 0.8})`; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60,60,120,${pulse * 0.3})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = p.sealed ? "#334" : "#88ffff"; ctx.fill();
      ctx.strokeStyle = p.sealed ? "#668" : "#aaffff"; ctx.lineWidth = 2; ctx.stroke();
      if (ts > 8) {
        ctx.font = `bold ${Math.max(7, ts * 0.38)}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = p.sealed ? "#88a" : "#fff";
        ctx.fillText(p.sealed ? "X" : "*", px, py);
      }

    } else if (e.kind === "nest") {
      const r = ts * 0.45;
      const pulse = 0.6 + 0.4 * Math.sin(now / 700);
      const hpFrac = e.health / e.maxHealth;
      ctx.beginPath(); ctx.arc(px, py, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,0,200,${pulse * 0.12})`; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = hpFrac > 0.5 ? "#5500bb" : "#330077"; ctx.fill();
      ctx.strokeStyle = "#aa44ff"; ctx.lineWidth = 1.5; ctx.stroke();
      const bw = r * 2.4, bh = 3, bx = px - bw / 2, by = py + r + 2;
      ctx.fillStyle = "#333"; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#aa44ff"; ctx.fillRect(bx, by, bw * hpFrac, bh);

    } else if (e.kind === "zombie") {
      const z = e as Zombie;
      const r = ts * 0.35;
      const tierColor = z.tier >= 3 ? "#ff2222" : z.tier >= 2 ? "#dd4422" : z.tier >= 1 ? "#cc3333" : "#cc2222";
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = e.health / e.maxHealth > 0.5 ? tierColor : "#882222"; ctx.fill();
      ctx.strokeStyle = z.tier >= 2 ? "#ff6644" : "#ff4444"; ctx.lineWidth = z.tier >= 1 ? 1.5 : 1; ctx.stroke();
      if (z.tier >= 2 && ts > 8) {
        ctx.font = `bold ${Math.max(6, ts * 0.25)}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffaa44";
        ctx.fillText(`T${z.tier}`, px, py);
      }

    } else if (e.kind === "survivor") {
      const s = e as Survivor;
      if (s.evacuated) continue;
      const r = ts * 0.38;
      const color = BRAIN_COLOR[s.brain];
      const stateColor = s.aiState === "fighting" ? "#ff4400" : s.aiState === "fleeing" ? "#ffff00" : s.aiState === "activating" ? "#ff9900" : s.aiState === "evacuating" ? "#88ffff" : s.aiState === "rescuing" ? "#ff8844" : s.aiState === "scavenging" && s.targetPos ? "#ff88ff" : "#44ff88";
      ctx.beginPath(); ctx.arc(px, py, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = stateColor + "33"; ctx.fill();
      ctx.strokeStyle = stateColor + "88"; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
      if (isOutOfAmmo(s)) {
        ctx.beginPath(); ctx.arc(px, py - r - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ff0000"; ctx.fill();
      }
      if (s.armor > 5) {
        ctx.beginPath(); ctx.arc(px, py, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#4488ff44"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (ts > 12) {
        ctx.font = `bold ${Math.max(7, ts * 0.36)}px monospace`;
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(s.name, px, py - r - 1);
      }
      const bw = r * 2.4, bh = 3, bx = px - bw / 2, by = py + r + 2;
      ctx.fillStyle = "#222"; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = color; ctx.fillRect(bx, by, bw * (Math.max(0, s.health / s.maxHealth)), bh);
    }
  }

  const evacuatedCount = state.entities.filter(e => e.kind === "survivor" && !e.dead && (e as Survivor).evacuated).length;
  if (evacuatedCount > 0 && portal) {
    const ppx = (portal.pos.x - camX) * ts, ppy = (portal.pos.y - camY) * ts;
    const tile2 = state.tiles[Math.floor(portal.pos.y)]?.[Math.floor(portal.pos.x)];
    if (tile2 && tile2.fogState !== "hidden") {
      ctx.font = `${Math.max(8, ts * 0.4)}px monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = "#aaffff"; ctx.fillText(`+${evacuatedCount}*`, ppx, ppy + ts * 0.5);
    }
  }
}

function initGame(settings: GameSettings): GameState {
  const rand = makePRNG(settings.seed);
  const tiles = generateMap(settings);
  const objectives = generateObjectives(rand, settings.nestCount);
  const [entities, nextId] = spawnEntities(settings, rand, objectives);
  const objLabels = objectives.map((o, i) => `${i + 1}. ${o.label}`).join(", ");
  return {
    tick: 0, tiles, entities,
    noiseEvents: [], attackEffects: [],
    log: [{ tick: 0, text: `Map generated. Objectives: ${objLabels}. Complete all to unseal the portal.`, type: "info" }],
    nextId,
    settings,
    objectives,
    winState: "playing", winTick: 0,
    escalation: { level: 0, zombieHpMult: 1, zombieDamageMult: 1, nestSpeedMult: 1, lastEscalationTick: 0 },
    score: 0,
    nestsDestroyed: 0,
    totalCollected: 0,
    totalRescued: 0,
    mapRound: 1,
  };
}

const DEFAULT: GameSettings = {
  seed: 12345, mapSize: 30, survivorCount: 3, zombieCount: 8, nestCount: 3, speed: 1,
};

const WSSPhase3: React.FC = () => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stateRef    = useRef<GameState>(initGame(DEFAULT));
  const cameraRef   = useRef({ x: 6, y: 6, zoom: 1.0, mode: "observer" as CameraMode, followId: null as number | null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef     = useRef<number>(0);
  const isDragging  = useRef(false);
  const dragStart   = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

  const [settings,    setSettings]    = useState<GameSettings>(DEFAULT);
  const [seedInput,   setSeedInput]   = useState("12345");
  const [isRunning,   setIsRunning]   = useState(false);
  const [tick,        setTick]        = useState(0);
  const [cameraMode,  setCameraMode]  = useState<CameraMode>("observer");
  const [zoom,        setZoom]        = useState(1.0);
  const [showSettings, setShowSettings] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [uiLog,       setUiLog]       = useState<LogEntry[]>([]);
  const [winState,    setWinState]    = useState<WinState>("playing");
  const [counts,      setCounts]      = useState({ survivors: 0, zombies: 0, nests: 0, loot: 0, evacuated: 0, teamAmmo: 0 });
  const [survivors,   setSurvivors]   = useState<Survivor[]>([]);
  const [objectives,  setObjectives]  = useState<Objective[]>([]);
  const [portalOpen,  setPortalOpen]  = useState(false);
  const [escalation,  setEscalation]  = useState<EscalationState>({ level: 0, zombieHpMult: 1, zombieDamageMult: 1, nestSpeedMult: 1, lastEscalationTick: 0 });
  const [score,       setScore]       = useState(0);
  const [grade,       setGrade]       = useState<GradeType | null>(null);

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setTick(s.tick);
    setUiLog([...s.log].slice(0, 20));
    setWinState(s.winState);
    setObjectives([...s.objectives]);
    setEscalation({ ...s.escalation });
    setScore(s.score);
    const surv = s.entities.filter(e => e.kind === "survivor" && !e.dead) as Survivor[];
    setSurvivors(surv);
    const teamAmmo = surv.reduce((sum, sv) => {
      if (sv.weapon.class === "gun" && sv.weapon.ammo !== null) return sum + sv.weapon.ammo;
      if (sv.primaryWeapon?.class === "gun" && sv.primaryWeapon.ammo !== null) return sum + sv.primaryWeapon.ammo;
      return sum;
    }, 0);
    setCounts({
      survivors: surv.length,
      zombies:   s.entities.filter(e => e.kind === "zombie" && !e.dead).length,
      nests:     s.entities.filter(e => e.kind === "nest" && !e.dead).length,
      loot:      s.entities.filter(e => e.kind === "loot" && !e.dead).length,
      evacuated: surv.filter(sv => sv.evacuated).length,
      teamAmmo,
    });
    const portal = s.entities.find(e => e.kind === "portal") as RiftPortal | undefined;
    setPortalOpen(portal ? !portal.sealed : false);
    if (s.winState !== "playing") {
      setGrade(calculateGrade(s));
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    renderWorld(ctx, stateRef.current, cameraRef.current, canvas.width, canvas.height);
    animRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => { animRef.current = requestAnimationFrame(render); return () => cancelAnimationFrame(animRef.current); }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { const p = canvas.parentElement; if (p) { canvas.width = p.clientWidth; canvas.height = p.clientHeight; } };
    resize(); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    cameraRef.current.mode = cameraMode; cameraRef.current.zoom = zoom;
    if (cameraMode === "survivor") {
      const survs = stateRef.current.entities.filter(e => e.kind === "survivor" && !e.dead);
      cameraRef.current.followId = survs[selectedIdx % Math.max(1, survs.length)]?.id ?? null;
    } else cameraRef.current.followId = null;
  }, [cameraMode, zoom, selectedIdx]);

  const startLoop = useCallback((speed: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (speed === 0) return;
    const tpi = speed >= 4 ? speed : 1;
    const ms = Math.max(1, Math.round(16 / (speed >= 4 ? 1 : speed)));
    intervalRef.current = setInterval(() => {
      if (stateRef.current.winState !== "playing") { clearInterval(intervalRef.current!); setIsRunning(false); return; }
      let s = stateRef.current;
      for (let i = 0; i < tpi; i++) s = runTick(s);
      stateRef.current = s; syncUI();
    }, ms);
  }, [syncUI]);

  const stopLoop = useCallback(() => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } }, []);

  const handlePlayPause = () => {
    if (stateRef.current.winState !== "playing") return;
    if (isRunning) { stopLoop(); setIsRunning(false); }
    else { startLoop(settings.speed || 1); setIsRunning(true); }
  };
  const handleReset = () => {
    stopLoop(); setIsRunning(false); setGrade(null);
    const s: GameSettings = { ...settings, seed: parseInt(seedInput) || settings.seed };
    const g = initGame(s); stateRef.current = g; setSettings(s);
    const half = s.mapSize / 2;
    const canvas = canvasRef.current;
    const ts = TILE_SIZE * cameraRef.current.zoom;
    cameraRef.current = { ...cameraRef.current, x: half - (canvas ? canvas.width / (2 * ts) : 10), y: half - (canvas ? canvas.height / (2 * ts) : 10), followId: null };
    syncUI();
  };
  const handleStep = () => { if (!isRunning && stateRef.current.winState === "playing") { stateRef.current = runTick(stateRef.current); syncUI(); } };
  const handleSpeed = (sp: 0 | 1 | 2 | 4 | 8) => { setSettings(s => ({ ...s, speed: sp })); if (isRunning) { stopLoop(); startLoop(sp); } };

  const onMD = (e: React.MouseEvent) => { isDragging.current = true; dragStart.current = { x: e.clientX, y: e.clientY, camX: cameraRef.current.x, camY: cameraRef.current.y }; };
  const onMM = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const ts = TILE_SIZE * cameraRef.current.zoom;
    cameraRef.current.x = dragStart.current.camX - (e.clientX - dragStart.current.x) / ts;
    cameraRef.current.y = dragStart.current.camY - (e.clientY - dragStart.current.y) / ts;
  };
  const onMU = () => { isDragging.current = false; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const nz = Math.max(0.3, Math.min(4, cameraRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    cameraRef.current.zoom = nz; setZoom(nz);
  };

  useEffect(() => { syncUI(); }, [syncUI]);

  const logColors: Record<LogEntry["type"], string> = {
    combat: "text-yellow-400", damage: "text-red-300", death: "text-red-500 font-bold",
    spawn: "text-purple-400", info: "text-gray-400", warn: "text-orange-400",
    objective: "text-cyan-400", loot: "text-green-400", grade: "text-yellow-300",
    escalation: "text-red-400 font-bold",
  };

  const allSurvivorsForStats = stateRef.current.entities.filter(e => e.kind === "survivor") as Survivor[];
  const totalKills = allSurvivorsForStats.reduce((a, s) => a + s.kills, 0);
  const activeObj = getActiveObjective(objectives);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden select-none">

      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-700 shrink-0 flex-wrap">
        <span className="text-red-400 font-bold text-xs tracking-widest">A FORGOTTEN PLACE</span>
        <span className="text-gray-700">|</span>
        <span className="text-green-400 text-xs">PHASE 3</span>
        <span className="text-gray-700">|</span>
        <span className="text-yellow-400 text-xs">T:{tick.toLocaleString()}</span>
        <span className="text-gray-700">|</span>
        <span className="text-purple-400 text-xs">R:{stateRef.current.mapRound}</span>
        <span className="text-gray-700">|</span>
        <span className={`text-xs font-bold ${score > 500 ? "text-yellow-300" : score > 200 ? "text-green-400" : "text-gray-400"}`}>
          SCORE: {score.toLocaleString()}
        </span>

        {escalation.level > 0 && (
          <>
            <span className="text-gray-700">|</span>
            <span className={`text-xs font-bold ${escalation.level >= 5 ? "text-red-400 animate-pulse" : escalation.level >= 3 ? "text-orange-400" : "text-yellow-500"}`}>
              ESC:{escalation.level}
            </span>
          </>
        )}

        <span className="text-gray-700">|</span>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">OBJ</span>
          {objectives.map((obj, i) => (
            <div key={i} title={`${obj.label}: ${obj.description}`}
              className={`w-6 h-5 rounded border flex items-center justify-center text-xs ${obj.completed ? "bg-green-700 border-green-400 text-white" : obj === activeObj ? "border-yellow-400 text-yellow-300 bg-yellow-900/30" : "border-gray-600 text-gray-600"}`}>
              {obj.completed ? "✓" : OBJ_TYPE_ICON[obj.type]}
            </div>
          ))}
          {portalOpen && <span className="text-cyan-400 text-xs font-bold ml-1 animate-pulse">EVAC!</span>}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {([0, 1, 2, 4, 8] as const).map(sp => (
            <button key={sp} onClick={() => handleSpeed(sp)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${settings.speed === sp ? "bg-blue-700 border-blue-400 text-white" : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}>
              {sp === 0 ? "—" : `${sp}x`}
            </button>
          ))}
        </div>
        <span className="text-gray-700">|</span>
        <button onClick={handlePlayPause} disabled={winState !== "playing"}
          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border disabled:opacity-30 ${isRunning ? "bg-yellow-800 border-yellow-500 text-yellow-100 hover:bg-yellow-700" : "bg-green-900 border-green-500 text-green-100 hover:bg-green-800"}`}>
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isRunning ? "PAUSE" : "RUN"}
        </button>
        <button onClick={handleStep} disabled={isRunning || winState !== "playing"}
          className="px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 disabled:opacity-30">
          <SkipForward className="w-3 h-3" />
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-600 bg-gray-800 hover:bg-gray-700 text-orange-300">
          <RotateCcw className="w-3 h-3" />
        </button>
        <span className="text-gray-700">|</span>
        <div className="flex items-center gap-1">
          {(["observer", "survivor", "free"] as CameraMode[]).map(m => (
            <button key={m} onClick={() => setCameraMode(m)}
              className={`px-2 py-1 rounded text-xs border ${cameraMode === m ? "bg-purple-800 border-purple-400 text-white" : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}>
              {m === "observer" ? <Eye className="w-3 h-3" /> : m === "survivor" ? <Crosshair className="w-3 h-3" /> : <Move className="w-3 h-3" />}
            </button>
          ))}
        </div>
        <button onClick={() => { const nz = Math.min(4, +(zoom * 1.25).toFixed(2)); setZoom(nz); cameraRef.current.zoom = nz; }}
          className="px-1 py-1 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700"><ZoomIn className="w-3 h-3" /></button>
        <span className="text-gray-500 text-xs">{(zoom * 100).toFixed(0)}%</span>
        <button onClick={() => { const nz = Math.max(0.3, +(zoom * 0.8).toFixed(2)); setZoom(nz); cameraRef.current.zoom = nz; }}
          className="px-1 py-1 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700"><ZoomOut className="w-3 h-3" /></button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        <div className="w-56 shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto text-xs">

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
                    <option value={30}>30x30</option><option value={40}>40x40</option><option value={60}>60x60</option>
                  </select>
                </label>
                <label className="block text-gray-500">Survivors: {settings.survivorCount}
                  <input type="range" min={1} max={5} value={settings.survivorCount}
                    onChange={e => setSettings(s => ({ ...s, survivorCount: Number(e.target.value) }))} className="w-full mt-1" />
                </label>
                <label className="block text-gray-500">Zombies: {settings.zombieCount}
                  <input type="range" min={0} max={20} value={settings.zombieCount}
                    onChange={e => setSettings(s => ({ ...s, zombieCount: Number(e.target.value) }))} className="w-full mt-1" />
                </label>
                <label className="block text-gray-500">Nests: {settings.nestCount}
                  <input type="range" min={0} max={8} value={settings.nestCount}
                    onChange={e => setSettings(s => ({ ...s, nestCount: Number(e.target.value) }))} className="w-full mt-1" />
                </label>
                <button onClick={handleReset}
                  className="w-full py-1 bg-orange-900 hover:bg-orange-800 border border-orange-600 rounded text-orange-200">
                  Generate World
                </button>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-500 mb-1.5 flex items-center gap-1"><Target className="w-3 h-3" /> OBJECTIVES</div>
            <div className="space-y-1.5">
              {objectives.map((obj, i) => {
                const isActive = obj === activeObj;
                const progressPct = obj.type === "ActivateSwitch"
                  ? obj.progress * 100
                  : Math.min(100, (obj.progress / Math.max(1, obj.required)) * 100);
                return (
                  <div key={i}
                    className={`p-1.5 rounded border ${obj.completed ? "border-green-700 bg-green-900/20" : isActive ? "border-yellow-600 bg-yellow-900/20" : "border-gray-700"}`}>
                    <div className="flex items-center gap-1.5">
                      {obj.completed
                        ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                        : <Circle className={`w-3 h-3 shrink-0 ${isActive ? "text-yellow-400" : "text-gray-600"}`} />
                      }
                      <span className={`font-bold ${obj.completed ? "text-green-300" : isActive ? "text-yellow-300" : "text-gray-500"}`}>
                        {OBJ_TYPE_ICON[obj.type]} {obj.label}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ml-5 ${obj.completed ? "text-green-500" : isActive ? "text-yellow-500" : "text-gray-600"}`}>
                      {obj.description}
                    </div>
                    {isActive && !obj.completed && (
                      <div className="mt-1 ml-5">
                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-0.5">
                          {obj.type === "Survive" ? `${Math.round(obj.progress)}/${obj.required} ticks` :
                           obj.type === "ActivateSwitch" ? `${Math.round(progressPct)}%` :
                           `${Math.round(obj.progress)}/${obj.required}`}
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded">
                          <div className="h-1.5 rounded transition-all" style={{ width: `${progressPct}%`, backgroundColor: OBJ_COLORS[i % OBJ_COLORS.length] }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {portalOpen && (
                <div className="flex items-center gap-2 p-1.5 rounded border border-cyan-500 bg-cyan-900/20 animate-pulse">
                  <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 font-bold">PORTAL OPEN</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-500 mb-1.5">WORLD</div>
            <div className="space-y-1">
              {[
                { color: "#00ff88", label: `Survivors (${counts.survivors})` },
                { color: "#88ffff", label: `Evacuated (${counts.evacuated})` },
                { color: "#cc2222", label: `Zombies (${counts.zombies})` },
                { color: "#5500bb", label: `Nests (${counts.nests})` },
                { color: "#22cc55", label: `Loot (${counts.loot})` },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-gray-300">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-700">
                <Package className="w-3 h-3 text-yellow-400 shrink-0" />
                <span className={`font-bold ${counts.teamAmmo === 0 ? "text-red-400" : counts.teamAmmo < 10 ? "text-orange-400" : "text-yellow-300"}`}>
                  Ammo: {counts.teamAmmo}
                </span>
              </div>
              {escalation.level > 0 && (
                <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-700">
                  <AlertTriangle className={`w-3 h-3 shrink-0 ${escalation.level >= 5 ? "text-red-400" : "text-orange-400"}`} />
                  <span className={`font-bold ${escalation.level >= 5 ? "text-red-400" : "text-orange-400"}`}>
                    Escalation: Lv.{escalation.level}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="px-3 py-2 flex-1">
            <div className="text-gray-500 mb-1.5">SURVIVORS</div>
            <div className="space-y-2">
              {survivors.map((s, i) => {
                const noAmmo = isOutOfAmmo(s);
                const ammoVal = s.weapon.class === "gun" && s.weapon.ammo !== null ? s.weapon.ammo : s.primaryWeapon?.ammo ?? null;
                const ammoMax = s.weapon.class === "gun" && s.weapon.maxAmmo !== null ? s.weapon.maxAmmo : s.primaryWeapon?.maxAmmo ?? null;
                const ammoColor = noAmmo ? "text-red-500" : ammoVal !== null && ammoMax !== null && ammoVal < ammoMax * 0.25 ? "text-orange-400" : "text-yellow-400";
                return (
                  <div key={s.id}
                    onClick={() => { setSelectedIdx(i); if (cameraMode === "survivor") cameraRef.current.followId = s.id; }}
                    className={`p-2 rounded border cursor-pointer transition-colors ${s.evacuated ? "border-cyan-700 bg-cyan-900/20" : selectedIdx === i && cameraMode === "survivor" ? "border-purple-500 bg-purple-900/30" : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAIN_COLOR[s.brain] }} />
                      <span className="text-gray-200 font-bold">{s.name}</span>
                      {s.evacuated && <span className="ml-auto text-cyan-400 text-xs">EVA</span>}
                      {!s.evacuated && <span className="ml-auto text-gray-500">{BRAIN_LABEL[s.brain]}</span>}
                    </div>
                    {!s.evacuated && <>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                        <span>{noAmmo ? s.primaryWeapon?.name + " (EMPTY)" : s.weapon.name}</span>
                        {ammoVal !== null && ammoMax !== null && (
                          <span className={`ml-auto font-bold ${ammoColor}`}>[{ammoVal}/{ammoMax}]</span>
                        )}
                      </div>
                      <div className={`text-xs mb-1 ${s.aiState === "fighting" ? "text-red-400" : s.aiState === "fleeing" ? "text-yellow-400" : s.aiState === "activating" ? "text-orange-400" : s.aiState === "evacuating" ? "text-cyan-400" : s.aiState === "rescuing" ? "text-orange-300" : "text-pink-400"}`}>
                        {noAmmo ? "NO AMMO - " : ""}{s.aiState.toUpperCase()} | {s.kills}k
                        {s.armor > 3 && <span className="text-blue-400 ml-1">+{s.armor}A</span>}
                      </div>
                      {[
                        { lbl: "HP", val: s.health, max: s.maxHealth, cls: s.health < s.maxHealth * 0.3 ? "bg-red-600" : "bg-red-500" },
                        { lbl: "ST", val: s.stamina, max: 100, cls: "bg-yellow-400" },
                      ].map(({ lbl, val, max, cls }) => (
                        <div key={lbl} className="flex items-center gap-1 mt-0.5">
                          <span className="w-5 text-gray-600 shrink-0">{lbl}</span>
                          <div className="flex-1 bg-gray-700 rounded h-1.5">
                            <div className={`${cls} h-1.5 rounded`} style={{ width: `${Math.max(0, (val / max) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </>}
                  </div>
                );
              })}
              {survivors.length === 0 && <div className="text-red-500 text-center py-2">All dead</div>}
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-black">
          <canvas ref={canvasRef} className="block w-full h-full"
            style={{ cursor: cameraMode === "free" ? "grab" : "crosshair" }}
            onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWheel} />

          {winState === "won" && grade && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-10">
              <div className="text-center border border-cyan-500 bg-gray-950/95 px-12 py-10 rounded-2xl shadow-2xl max-w-lg">
                <div className="text-6xl mb-2" style={{ color: GRADE_COLORS[grade] }}>{grade}</div>
                <div className="text-lg mb-1" style={{ color: GRADE_COLORS[grade] }}>{GRADE_LABELS[grade]}</div>
                <div className="text-cyan-300 text-2xl font-bold mb-2">MISSION COMPLETE</div>
                <div className="text-gray-400 text-sm mb-6">All survivors evacuated through the Rift Portal</div>
                <div className="grid grid-cols-4 gap-3 mb-6 text-center">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-yellow-400 text-xl font-bold">{score.toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">Score</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-cyan-300 text-xl font-bold">{counts.evacuated}/{settings.survivorCount}</div>
                    <div className="text-gray-500 text-xs">Evacuated</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-red-400 text-xl font-bold">{totalKills}</div>
                    <div className="text-gray-500 text-xs">Kills</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-green-400 text-xl font-bold">{objectives.filter(o => o.completed).length}/{objectives.length}</div>
                    <div className="text-gray-500 text-xs">Objectives</div>
                  </div>
                </div>
                <div className="text-gray-500 text-xs mb-4">
                  Tick {tick.toLocaleString()} | Escalation Lv.{escalation.level} | Nests destroyed: {stateRef.current.nestsDestroyed}
                </div>
                {allSurvivorsForStats.length > 0 && (
                  <div className="mb-4">
                    <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Survivor Breakdown</div>
                    <div className="grid gap-1.5">
                      {allSurvivorsForStats.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-gray-800/80 rounded px-3 py-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRAIN_COLOR[s.brain] }} />
                          <span className="text-gray-200 font-bold w-12 text-left">{s.name}</span>
                          <span className="text-red-400">{s.kills}k</span>
                          <span className="text-green-400">{s.itemsCollected}i</span>
                          {s.rescuesMade > 0 && <span className="text-orange-400">{s.rescuesMade}r</span>}
                          <span className="text-yellow-400 ml-auto">{s.damageDealt}dmg</span>
                          <span className="text-gray-500">|</span>
                          <span className={s.dead ? "text-red-500" : s.evacuated ? "text-cyan-400" : "text-gray-400"}>
                            {s.dead ? "KIA" : s.evacuated ? "EVAC" : "ALIVE"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={handleReset} className="px-8 py-3 bg-cyan-800 hover:bg-cyan-700 border border-cyan-400 rounded-lg text-cyan-100 font-bold text-sm transition-colors">Play Again</button>
              </div>
            </div>
          )}

          {winState === "lost" && grade && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-10">
              <div className="text-center border border-red-700 bg-gray-950/95 px-12 py-10 rounded-2xl shadow-2xl max-w-lg">
                <div className="text-6xl mb-2" style={{ color: GRADE_COLORS[grade] }}>{grade}</div>
                <div className="text-lg mb-1" style={{ color: GRADE_COLORS[grade] }}>{GRADE_LABELS[grade]}</div>
                <div className="text-red-400 text-2xl font-bold mb-2">GAME OVER</div>
                <div className="text-gray-400 text-sm mb-6">All survivors eliminated | Tick {tick.toLocaleString()}</div>
                <div className="grid grid-cols-4 gap-3 mb-6 text-center">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-yellow-400 text-xl font-bold">{score.toLocaleString()}</div>
                    <div className="text-gray-500 text-xs">Score</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-green-400 text-xl font-bold">{objectives.filter(o => o.completed).length}/{objectives.length}</div>
                    <div className="text-gray-500 text-xs">Objectives</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-red-400 text-xl font-bold">{totalKills}</div>
                    <div className="text-gray-500 text-xs">Kills</div>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-orange-400 text-xl font-bold">Lv.{escalation.level}</div>
                    <div className="text-gray-500 text-xs">Escalation</div>
                  </div>
                </div>
                {allSurvivorsForStats.length > 0 && (
                  <div className="mb-4">
                    <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider">Survivor Breakdown</div>
                    <div className="grid gap-1.5">
                      {allSurvivorsForStats.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-gray-800/80 rounded px-3 py-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRAIN_COLOR[s.brain] }} />
                          <span className="text-gray-200 font-bold w-12 text-left">{s.name}</span>
                          <span className="text-red-400">{s.kills}k</span>
                          <span className="text-green-400">{s.itemsCollected}i</span>
                          {s.rescuesMade > 0 && <span className="text-orange-400">{s.rescuesMade}r</span>}
                          <span className="text-yellow-400 ml-auto">{s.damageDealt}dmg</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-red-500">KIA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={handleReset} className="px-8 py-3 bg-red-900 hover:bg-red-800 border border-red-500 rounded-lg text-red-100 font-bold text-sm transition-colors">Play Again</button>
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-none">
            <div className={`px-3 py-1.5 rounded border text-xs font-bold backdrop-blur-sm ${portalOpen ? "bg-cyan-900/80 border-cyan-400 text-cyan-300 animate-pulse" : "bg-gray-900/80 border-gray-600 text-gray-400"}`}>
              {portalOpen ? "PORTAL OPEN — EVACUATE!" : "PORTAL SEALED"}
            </div>

            {activeObj && !portalOpen && (
              <div className="bg-gray-900/80 border border-yellow-700/50 rounded px-3 py-2 text-xs backdrop-blur-sm">
                <div className="text-yellow-400 font-bold mb-0.5">{OBJ_TYPE_ICON[activeObj.type]} {activeObj.label}</div>
                <div className="text-gray-400">{activeObj.description}</div>
                {activeObj.type !== "ActivateSwitch" && (
                  <div className="text-yellow-300 mt-1">{Math.round(activeObj.progress)}/{activeObj.required}</div>
                )}
              </div>
            )}

            <div className="bg-gray-900/80 border border-gray-700 rounded px-3 py-2 text-xs space-y-1 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-gray-300"><Activity className="w-3 h-3 text-green-400" />{counts.survivors} alive | {counts.evacuated} evac</div>
              <div className="flex items-center gap-1.5 text-gray-300"><Skull className="w-3 h-3 text-red-400" />{counts.zombies} zombies | {counts.nests} nests</div>
              <div className="flex items-center gap-1.5">
                <Package className="w-3 h-3 text-yellow-400" />
                <span className={`font-bold ${counts.teamAmmo === 0 ? "text-red-400" : counts.teamAmmo < 8 ? "text-orange-400" : "text-yellow-300"}`}>
                  Ammo: {counts.teamAmmo}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Heart className="w-3 h-3 text-green-400" />
                {counts.loot} loot
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Trophy className="w-3 h-3 text-yellow-400" />
                {totalKills} kills | {score.toLocaleString()} pts
              </div>
              {escalation.level > 0 && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-gray-700">
                  <Shield className={`w-3 h-3 ${escalation.level >= 5 ? "text-red-400" : "text-orange-400"}`} />
                  <span className={`font-bold ${escalation.level >= 5 ? "text-red-400" : "text-orange-400"}`}>
                    Escalation Lv.{escalation.level}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 right-3 w-72 pointer-events-none">
            <div className="bg-gray-950/85 border border-gray-700 rounded p-2 backdrop-blur-sm max-h-44 overflow-hidden flex flex-col gap-0.5">
              {uiLog.slice(0, 12).map((entry, i) => (
                <div key={i} className={`text-xs leading-tight ${logColors[entry.type]}`}>
                  <span className="text-gray-600 mr-1">[{entry.tick}]</span>{entry.text}
                </div>
              ))}
            </div>
          </div>

          {winState === "playing" && !portalOpen && activeObj && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-gray-600 pointer-events-none bg-gray-950/50 px-3 py-1 rounded">
              {activeObj.type === "ActivateSwitch" ? "Follow arrows to switch | Hold position to activate" :
               activeObj.type === "DestroyNests" ? "Destroy corruption nests to progress" :
               activeObj.type === "Survive" ? "Stay alive! Timer is counting down" :
               activeObj.type === "Collect" ? "Collect supply items scattered on the map" :
               activeObj.type === "Rescue" ? "Find and rescue stranded survivors (SOS beacons)" :
               "Complete objectives to unseal the portal"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WSSPhase3;

import { ReactNode } from 'react';

// Terrain types with movement modifiers and visual properties
export type TerrainType = 'grass' | 'dirt' | 'stone' | 'water' | 'blood' | 'ash';

export interface TerrainProperties {
  type: TerrainType;
  movementModifier: number; // Multiplier for movement speed (1.0 = normal, <1 = slower, >1 = faster)
  color: string; // Base color for the terrain
  dayColor: string; // Color during day
  nightColor: string; // Color during night
}

// Player state and properties
export type PlayerState = 'aggressive' | 'normal' | 'healing' | 'defending' | 'retreating' | 'searching' | 'trading' | 'deciding' | 'dead' | 'downed';

export interface PlayerStats {
  strength: number; // Affects melee damage
  accuracy: number; // Affects ranged weapon accuracy
  agility: number; // Affects movement speed and dodge chance
  resilience: number; // Affects damage resistance
  perception: number; // Affects detection range and critical hit chance
}

export interface Player {
  id: number;
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  ammo: {
    primary: number;
    secondary: number;
    maxPrimary: number;
    maxSecondary: number;
  };
  weapons: {
    primary: Weapon;
    secondary: Weapon;
    melee: Weapon;
    currentWeapon: 'primary' | 'secondary' | 'melee';
  };
  kills: number;
  visibilityRange: number;
  isHuman: boolean; // Is this player controlled by a human
  state: PlayerState;
  stateTime: number; // How long they've been in this state
  aiThoughts: string; // Text description of AI decision making
  logs: string[]; // Combat log entries
  progressionDecision?: 'exit' | 'continue'; // Decision to continue or extract
  currency: number; // Money earned from kills and loot
  isDowned: boolean; // Player is downed but not dead
  stats: PlayerStats; // Player stats that can be upgraded
  inventory: Item[]; // Items carried by the player
  type: string; // Class type (e.g., "medic", "assault", "scout")
}

// Enemy types and properties
export type EnemyType = 'melee' | 'ranged' | 'tank' | 'boss';
export type EnemyBehavior = 'aggressive' | 'defensive' | 'stationary' | 'patrol';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  type: EnemyType;
  behavior: EnemyBehavior;
  movementPattern?: {
    path: { x: number, y: number }[];
    currentPathIndex: number;
  };
  lastAttackTime: number;
  detectionRange: number;
  name: string;
  loot?: {
    currency: number;
    items: Item[];
  };
}

// Hostile AI players
export interface HostilePlayer extends Player {
  hostileAIType: 'hunter' | 'sniper' | 'rusher' | 'defender';
}

// Map cell definition
export interface Cell {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'cover' | 'ammo' | 'health' | 'spawner';
  terrain: TerrainType;
  visible: boolean;
  explored: boolean;
}

// Ammo cache for resupply
export interface AmmoCache {
  id: number;
  x: number;
  y: number;
  ammoType: 'primary' | 'secondary';
  amount: number;
}

// Game state tracking
export interface GameState {
  day: number;
  time: 'day' | 'night';
  timeElapsed: number;
  wave: number;
  enemiesKilled: number;
  waveTimer: number;
  gameStatus: 'preparing' | 'wave' | 'completed';
}

// Enemy spawner
export interface Spawner {
  id: number;
  x: number;
  y: number;
  active: boolean;
  enemyType: EnemyType;
  spawnRate: number; // enemies per minute
  lastSpawnTime: number;
  spawnType?: 'enemy' | 'hostileAI'; // What type of entity this spawner produces
}

// Weapon properties
export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type WeaponType = 'assault' | 'smg' | 'shotgun' | 'sniper' | 'pistol' | 'knife' | 'sword' | 'axe' | 'hammer' | 'heavy';

export interface Weapon {
  name: string;
  damage: number;
  range: number;
  fireRate: number; // shots per second
  reloadSpeed: number; // seconds to reload
  accuracy: number; // 0-1, percentage of shots that hit target
  currentAmmo: number; // current ammo in magazine
  maxAmmo: number; // max ammo in magazine
  isAutomatic: boolean;
  ammoType: 'primary' | 'secondary' | 'melee';
  lastFiredTime: number;
  icon: ReactNode;
  rarity: WeaponRarity;
  type: WeaponType;
  special?: {
    effect: 'fire' | 'ice' | 'poison' | 'electric' | 'explosive';
    damage?: number;
    duration?: number;
    radius?: number;
  };
}

// Items that can be picked up or purchased
export interface Item {
  id: number;
  name: string;
  description: string;
  value: number; // Currency value/cost
  type: 'health' | 'ammo' | 'weapon' | 'utility' | 'armor' | 'special';
  effect: {
    stat?: keyof PlayerStats;
    amount: number;
    duration?: number; // If temporary effect
  };
  rarity: WeaponRarity;
  icon: ReactNode;
}

// WebSocket message types
export interface GameUpdateMessage {
  type: 'game_update';
  players: Player[];
  enemies: Enemy[];
  gameState: GameState;
  map?: Cell[][];
}

export interface PlayerActionMessage {
  type: 'player_action';
  playerId: number;
  action: {
    type: 'move' | 'attack' | 'heal' | 'reload' | 'collect' | 'trade' | 'decision';
    target?: {
      x?: number;
      y?: number;
      id?: number;
    };
    weapon?: 'primary' | 'secondary' | 'melee';
    decision?: 'exit' | 'continue';
  };
}

export interface GameStatusMessage {
  type: 'game_status';
  status: 'start' | 'pause' | 'resume' | 'end';
  wave?: number;
  day?: number;
}
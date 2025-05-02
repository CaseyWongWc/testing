import { ReactNode } from 'react';

// Game state definition
export interface GameState {
  day: number;
  time: 'day' | 'night';
  timeElapsed: number;
  wave: number;
  enemiesKilled: number;
  waveTimer: number;
  gameStatus: 'preparing' | 'wave' | 'completed';
  mapLevel?: number;
  canTransition?: boolean;
}

// Player statistics
export interface PlayerStats {
  strength: number;
  defense: number;
  speed: number;
  accuracy: number;
  intelligence: number;
}

// Player state types
export type PlayerState = 'normal' | 'aggressive' | 'healing' | 'defending' | 'retreating' | 'searching' | 'trading' | 'deciding' | 'dead' | 'downed';

// Progression decision
export type ProgressionDecision = 'exit' | 'continue' | undefined;

// Player entity
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
  isAlive: boolean;
  isDowned?: boolean;
  isHuman: boolean;
  state: PlayerState;
  stateTime: number;
  progressionDecision?: ProgressionDecision;
  aiThoughts: string;
  logs: string[];
  currency: number;
  inventory: Item[];
  gameState: GameState;
  stats: PlayerStats;
  type: string;
}

// Hostile Player that can attack the player
export interface HostilePlayer extends Player {
  isDowned: boolean;
  state: PlayerState;
  stateTime: number;
  currency: number;
  stats: PlayerStats;
}

// Non-player character (allies, civilians)
export interface NonPlayerCharacter {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  role: 'ally' | 'civilian';
  behavior: 'follow' | 'defend' | 'explore';
  visibilityRange: number;
  status: string;
}

// Enemy entity
export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  type: 'melee' | 'ranged' | 'tank' | 'boss';
  behavior: 'aggressive' | 'defensive' | 'stationary' | 'patrol';
  movementPattern?: {
    path: { x: number, y: number }[];
    currentPathIndex: number;
  };
  lastAttackTime: number;
  detectionRange: number;
}

// Map cell definition
export interface Cell {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'cover' | 'ammo' | 'health' | 'spawner';
  terrain: 'grass' | 'dirt' | 'stone' | 'water' | 'blood' | 'ash';
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

// Enemy spawner
export interface Spawner {
  id: number;
  x: number;
  y: number;
  active: boolean;
  enemyType: 'melee' | 'ranged' | 'tank' | 'boss';
  spawnRate: number; // enemies per minute
  lastSpawnTime: number;
  spawnType?: 'enemy' | 'hostile';
}

// Hostile spawner for enemy players
export interface HostileSpawner extends Spawner {
  hostileAIType: 'normal' | 'elite' | 'boss';
  weapons: Weapon[];
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

// Settings for the game
export interface GameSettingsData {
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  playerCount: number;
  dayLength: number;
  nightLength: number;
  fogOfWar: boolean;
  friendlyFire: boolean;
  permadeath: boolean;
  showTutorial: boolean;
  soundVolume: number;
  musicVolume: number;
}
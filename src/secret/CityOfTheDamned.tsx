import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Shield, Zap, Target, Clock, Skull, Package2, Crosshair, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

// Types definition
interface Entity {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: string;
}

interface Player extends Entity {
  name: string;
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
  logs: string[];
  isHuman: boolean; // True if this player is controlled by a human, false if AI
  isAlive: boolean;
}

interface NonPlayerCharacter extends Entity {
  role: 'ally' | 'civilian';
  behavior: 'follow' | 'defend' | 'explore';
  visibilityRange: number;
  status: string;
  targetPlayerId?: number; // The player this NPC follows or defends
}

interface Enemy extends Entity {
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

interface Weapon {
  name: string;
  damage: number;
  range: number;
  fireRate: number; // shots per second
  isAutomatic: boolean;
  ammoType: 'primary' | 'secondary' | 'melee';
  lastFiredTime: number;
  icon: React.ReactNode;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  type: 'assault' | 'smg' | 'shotgun' | 'sniper' | 'pistol' | 'heavy' | 'knife' | 'axe' | 'sword' | 'hammer';
  special?: {
    effect: 'fire' | 'ice' | 'shock' | 'poison' | 'explosion';
    damage: number;
    duration: number;
  };
}

// Define hostile AI players (enemy survivors)
interface HostilePlayer extends Player {
  isHostile: true;
  spawnerId?: number;
  difficulty: 'normal' | 'elite' | 'boss';
  loot?: {
    weapons?: Weapon[];
    ammo?: number;
    health?: number;
  };
}

// Define boss types
interface Boss extends Enemy {
  bossType: 'butcher' | 'necromancer' | 'warlord' | 'sentinel' | 'hivemind';
  phase: number;
  totalPhases: number;
  specialAbilities: string[];
  minionsSpawned: number;
  isSummoning: boolean;
  summonCooldown: number;
  lastSummonTime: number;
}

// Define hostile AI spawner
interface HostileSpawner extends Spawner {
  spawnType: 'hostile-ai';
  hostileAIType: 'normal' | 'elite' | 'boss';
  weapons: Weapon[];
}

interface Cell {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'cover' | 'ammo' | 'health' | 'spawner';
  visible: boolean;
  explored: boolean;
}

interface AmmoCache {
  id: number;
  x: number;
  y: number;
  ammoType: 'primary' | 'secondary';
  amount: number;
}

interface GameState {
  day: number;
  time: 'day' | 'night';
  timeElapsed: number;
  wave: number;
  enemiesKilled: number;
  waveTimer: number;
  gameStatus: 'preparing' | 'wave' | 'completed' | 'transition';
  mapLevel: number;
  canTransition: boolean;
  transitionVotes: {[playerId: number]: 'exit' | 'continue'};
}

interface Spawner {
  id: number;
  x: number;
  y: number;
  active: boolean;
  enemyType: 'melee' | 'ranged' | 'tank' | 'boss';
  spawnRate: number; // enemies per minute
  lastSpawnTime: number;
}

// Main component
const CityOfTheDamned: React.FC = () => {
  // Configuration
  const mapWidth = 40;
  const mapHeight = 30;
  const cellSize = 16;

  // Game state
  const [map, setMap] = useState<Cell[][]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [globalLogs, setGlobalLogs] = useState<string[]>(['Welcome to City of the Damned. The survival begins.']);
  
  const [npcs, setNpcs] = useState<NonPlayerCharacter[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [ammoCaches, setAmmoCaches] = useState<AmmoCache[]>([]);
  const [spawners, setSpawners] = useState<Spawner[]>([]);
  
  // UI state
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState<boolean>(false);
  const [pendingPlayerName, setPendingPlayerName] = useState<string>('');

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    time: 'day',
    timeElapsed: 0,
    wave: 1,
    enemiesKilled: 0,
    waveTimer: 120, // 2 minutes until night
    gameStatus: 'preparing',
    mapLevel: 1,
    canTransition: false,
    transitionVotes: {}
  });
  
  // Game loop ref
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef<{x: number, y: number}>({x: 0, y: 0});
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Initialize game
  useEffect(() => {
    initializeGame();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Update active player when players change or index changes
  useEffect(() => {
    if (players.length > 0 && activePlayerIndex >= 0 && activePlayerIndex < players.length) {
      setActivePlayer(players[activePlayerIndex]);
    } else {
      setActivePlayer(null);
    }
  }, [players, activePlayerIndex]);

  // Game initialization
  const initializeGame = () => {
    generateMap();
    createInitialPlayer();
    setupSpawners();
    placeAmmoCaches();
    addGlobalLog('Game initialized. Wave 1 begins soon.');
  };
  
  // Create initial player
  const createInitialPlayer = () => {
    const newPlayer = createPlayer('Player 1', true, Math.floor(mapWidth / 2), Math.floor(mapHeight / 2));
    setPlayers([newPlayer]);
    
    // Create an ally NPC for the first player
    const newNPC: NonPlayerCharacter = {
      id: Date.now(),
      x: Math.floor(mapWidth / 2) - 2,
      y: Math.floor(mapHeight / 2) - 2,
      health: 80,
      maxHealth: 80,
      role: 'ally',
      behavior: 'follow',
      visibilityRange: 10,
      status: 'Following you',
      type: 'npc',
      targetPlayerId: newPlayer.id
    };
    
    setNpcs([newNPC]);
  };
  
  // Weapons database
  const weaponsDatabase: Record<string, Weapon> = {
    // Primary weapons
    assaultRifle: {
      name: 'Assault Rifle',
      damage: 15,
      range: 8,
      fireRate: 5,
      isAutomatic: true,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Crosshair size={16} />,
      rarity: 'common',
      type: 'assault'
    },
    tacticaRifle: {
      name: 'Tactical Rifle',
      damage: 22,
      range: 10,
      fireRate: 3,
      isAutomatic: false,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Crosshair size={16} />,
      rarity: 'uncommon',
      type: 'assault'
    },
    smg: {
      name: 'SMG',
      damage: 9,
      range: 6,
      fireRate: 8,
      isAutomatic: true,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Crosshair size={16} />,
      rarity: 'common',
      type: 'smg'
    },
    shotgun: {
      name: 'Shotgun',
      damage: 45,
      range: 4,
      fireRate: 1,
      isAutomatic: false,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Crosshair size={16} />,
      rarity: 'uncommon',
      type: 'shotgun'
    },
    sniperRifle: {
      name: 'Sniper Rifle',
      damage: 80,
      range: 15,
      fireRate: 0.5,
      isAutomatic: false,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Crosshair size={16} />,
      rarity: 'rare',
      type: 'sniper'
    },
    flamethrower: {
      name: 'Flamethrower',
      damage: 18,
      range: 5,
      fireRate: 7,
      isAutomatic: true,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'rare',
      type: 'heavy',
      special: {
        effect: 'fire',
        damage: 5,
        duration: 3
      }
    },
    
    // Secondary weapons
    pistol: {
      name: 'Pistol',
      damage: 25,
      range: 5,
      fireRate: 2,
      isAutomatic: false,
      ammoType: 'secondary',
      lastFiredTime: 0,
      icon: <Target size={16} />,
      rarity: 'common',
      type: 'pistol'
    },
    revolver: {
      name: 'Revolver',
      damage: 45,
      range: 6,
      fireRate: 1.2,
      isAutomatic: false,
      ammoType: 'secondary',
      lastFiredTime: 0,
      icon: <Target size={16} />,
      rarity: 'uncommon',
      type: 'pistol'
    },
    machineGun: {
      name: 'Machine Pistol',
      damage: 18,
      range: 4,
      fireRate: 6,
      isAutomatic: true,
      ammoType: 'secondary',
      lastFiredTime: 0,
      icon: <Target size={16} />,
      rarity: 'rare',
      type: 'pistol'
    },
    
    // Melee weapons
    combatKnife: {
      name: 'Combat Knife',
      damage: 40,
      range: 1,
      fireRate: 1.5,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'common',
      type: 'knife'
    },
    baseballBat: {
      name: 'Baseball Bat',
      damage: 55,
      range: 1.5,
      fireRate: 1,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'common',
      type: 'hammer'
    },
    machete: {
      name: 'Machete',
      damage: 60,
      range: 1.2,
      fireRate: 1.2,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'uncommon',
      type: 'sword'
    },
    fireaxe: {
      name: 'Fire Axe',
      damage: 75,
      range: 1.3,
      fireRate: 0.8,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'uncommon',
      type: 'axe'
    },
    katana: {
      name: 'Katana',
      damage: 70,
      range: 1.5,
      fireRate: 1.3,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'rare',
      type: 'sword'
    },
    sledgehammer: {
      name: 'Sledgehammer',
      damage: 100,
      range: 1.3,
      fireRate: 0.6,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'rare',
      type: 'hammer'
    },
    
    // Legendary weapons
    flamingKatana: {
      name: 'Flaming Katana',
      damage: 90,
      range: 1.5,
      fireRate: 1.4,
      isAutomatic: false,
      ammoType: 'melee',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'legendary',
      type: 'sword',
      special: {
        effect: 'fire',
        damage: 15,
        duration: 3
      }
    },
    pulseRifle: {
      name: 'Pulse Rifle',
      damage: 40,
      range: 12,
      fireRate: 4,
      isAutomatic: true,
      ammoType: 'primary',
      lastFiredTime: 0,
      icon: <Zap size={16} />,
      rarity: 'legendary',
      type: 'assault',
      special: {
        effect: 'shock',
        damage: 10,
        duration: 2
      }
    },
    toxinPistol: {
      name: 'Toxin Pistol',
      damage: 25,
      range: 6,
      fireRate: 2.5,
      isAutomatic: false,
      ammoType: 'secondary',
      lastFiredTime: 0,
      icon: <Skull size={16} />,
      rarity: 'legendary',
      type: 'pistol',
      special: {
        effect: 'poison',
        damage: 8,
        duration: 4
      }
    }
  };

  // Get random weapon by type and rarity
  const getRandomWeapon = (type: 'primary' | 'secondary' | 'melee', minRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common'): Weapon => {
    // Filter weapons by type and minimum rarity
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const minRarityIndex = rarityOrder.indexOf(minRarity);
    
    const eligibleWeapons = Object.values(weaponsDatabase).filter(weapon => {
      const rarityIndex = rarityOrder.indexOf(weapon.rarity);
      return weapon.ammoType === type && rarityIndex >= minRarityIndex;
    });
    
    // If no weapons match the criteria, return a default
    if (eligibleWeapons.length === 0) {
      if (type === 'primary') return weaponsDatabase.assaultRifle;
      if (type === 'secondary') return weaponsDatabase.pistol;
      return weaponsDatabase.combatKnife;
    }
    
    // Return a random weapon from the eligible ones
    return {...eligibleWeapons[Math.floor(Math.random() * eligibleWeapons.length)]};
  };

  // Create a new player
  const createPlayer = (name: string, isHuman: boolean, x?: number, y?: number): Player => {
    const playerX = x ?? Math.floor(Math.random() * (mapWidth - 6)) + 3;
    const playerY = y ?? Math.floor(Math.random() * (mapHeight - 6)) + 3;
    
    // Get random weapons based on wave level
    const waveLevel = gameState.wave;
    let primaryRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
    let secondaryRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
    let meleeRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
    
    // Higher wave = better weapons
    if (waveLevel >= 10) {
      primaryRarity = 'legendary';
      secondaryRarity = 'rare';
      meleeRarity = 'rare';
    } else if (waveLevel >= 7) {
      primaryRarity = 'rare';
      secondaryRarity = 'uncommon';
      meleeRarity = 'uncommon';
    } else if (waveLevel >= 4) {
      primaryRarity = 'uncommon';
      secondaryRarity = 'uncommon';
      meleeRarity = 'common';
    }
    
    const primaryWeapon = getRandomWeapon('primary', primaryRarity);
    const secondaryWeapon = getRandomWeapon('secondary', secondaryRarity);
    const meleeWeapon = getRandomWeapon('melee', meleeRarity);
    
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      x: playerX,
      y: playerY,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      ammo: {
        primary: 60,
        secondary: 30,
        maxPrimary: 120,
        maxSecondary: 60
      },
      weapons: {
        primary: primaryWeapon,
        secondary: secondaryWeapon,
        melee: meleeWeapon,
        currentWeapon: 'primary'
      },
      kills: 0,
      type: 'player',
      visibilityRange: 12,
      logs: [`${name} has entered the city.`],
      isHuman,
      isAlive: true
    };
  };

  // Add player
  const addNewPlayer = (name: string, isHuman: boolean = false) => {
    if (gameState.time === 'day') {
      const newPlayer = createPlayer(name, isHuman);
      setPlayers(prev => [...prev, newPlayer]);
      addGlobalLog(`${name} has joined the fight!`);
      
      // Create an ally NPC for the new player
      const newNPC: NonPlayerCharacter = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        x: newPlayer.x - 1,
        y: newPlayer.y - 1,
        health: 80,
        maxHealth: 80,
        role: 'ally',
        behavior: 'follow',
        visibilityRange: 10,
        status: 'Following player',
        type: 'npc',
        targetPlayerId: newPlayer.id
      };
      
      setNpcs(prev => [...prev, newNPC]);
      return true;
    } else {
      addGlobalLog("New survivors can only enter during daylight hours.");
      return false;
    }
  };
  
  // Switch to next player
  const nextPlayer = () => {
    const livingPlayers = players.filter(p => p.isAlive);
    if (livingPlayers.length === 0) return;
    
    const nextIndex = (activePlayerIndex + 1) % livingPlayers.length;
    setActivePlayerIndex(nextIndex);
  };
  
  // Switch to previous player
  const prevPlayer = () => {
    const livingPlayers = players.filter(p => p.isAlive);
    if (livingPlayers.length === 0) return;
    
    const prevIndex = (activePlayerIndex - 1 + livingPlayers.length) % livingPlayers.length;
    setActivePlayerIndex(prevIndex);
  };

  // Map generation with more varied terrain
  const generateMap = () => {
    const newMap: Cell[][] = [];
    
    // Initialize with floors
    for (let y = 0; y < mapHeight; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < mapWidth; x++) {
        // Border walls
        const isBorder = x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1;
        row.push({
          x,
          y,
          type: isBorder ? 'wall' : 'floor',
          visible: false,
          explored: false
        });
      }
      newMap.push(row);
    }
    
    // Define the safe center area (will have fewer obstacles and more resources)
    const centerX = Math.floor(mapWidth / 2);
    const centerY = Math.floor(mapHeight / 2);
    const centerRadius = 7; // Safe zone radius
    
    // Generate maze-like structures in some areas
    generateMazePatterns(newMap);
    
    // Generate larger open areas
    createOpenSpaces(newMap);
    
    // Generate jagged terrain formations
    createJaggedFormations(newMap);
    
    // Ensure the center is accessible
    clearCenterArea(newMap, centerX, centerY, centerRadius);
    
    // Add cover throughout the map
    addCoverElements(newMap);
    
    // Place weapon caches in the center area
    placeWeaponCaches(newMap, centerX, centerY, centerRadius);
    
    setMap(newMap);
  };
  
  // Create semi-regular maze patterns in various areas
  const generateMazePatterns = (mapData: Cell[][]) => {
    // We'll divide the map into sections and apply different maze densities
    const sectionSize = 10;
    const mazeDensities = [0.25, 0.4, 0.55]; // Different wall densities
    
    for (let sectionY = 1; sectionY < Math.floor(mapHeight / sectionSize); sectionY++) {
      for (let sectionX = 1; sectionX < Math.floor(mapWidth / sectionSize); sectionX++) {
        // Skip center section
        const isCenterSection = 
          sectionX === Math.floor(mapWidth / (2 * sectionSize)) && 
          sectionY === Math.floor(mapHeight / (2 * sectionSize));
        
        if (isCenterSection) continue;
        
        // Choose a random density for this section
        const density = mazeDensities[Math.floor(Math.random() * mazeDensities.length)];
        
        // Apply maze pattern to this section
        for (let y = sectionY * sectionSize; y < (sectionY + 1) * sectionSize && y < mapHeight - 1; y++) {
          for (let x = sectionX * sectionSize; x < (sectionX + 1) * sectionSize && x < mapWidth - 1; x++) {
            if (Math.random() < density) {
              // Create walls in patterns
              if ((x + y) % 2 === 0 || Math.random() < 0.3) {
                mapData[y][x].type = 'wall';
              }
            }
          }
        }
        
        // Create pathways through the maze
        if (Math.random() < 0.7) {
          const pathY = sectionY * sectionSize + Math.floor(Math.random() * sectionSize);
          for (let x = sectionX * sectionSize; x < (sectionX + 1) * sectionSize && x < mapWidth - 1; x++) {
            if (pathY < mapHeight - 1) {
              mapData[pathY][x].type = 'floor';
            }
          }
        }
        
        if (Math.random() < 0.7) {
          const pathX = sectionX * sectionSize + Math.floor(Math.random() * sectionSize);
          for (let y = sectionY * sectionSize; y < (sectionY + 1) * sectionSize && y < mapHeight - 1; y++) {
            if (pathX < mapWidth - 1) {
              mapData[y][pathX].type = 'floor';
            }
          }
        }
      }
    }
  };
  
  // Create larger open spaces
  const createOpenSpaces = (mapData: Cell[][]) => {
    // Create 3-5 open areas
    const numOpenAreas = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numOpenAreas; i++) {
      const areaX = 5 + Math.floor(Math.random() * (mapWidth - 15));
      const areaY = 5 + Math.floor(Math.random() * (mapHeight - 15));
      const areaWidth = 5 + Math.floor(Math.random() * 8);
      const areaHeight = 5 + Math.floor(Math.random() * 8);
      
      // Clear this area
      for (let y = areaY; y < areaY + areaHeight && y < mapHeight - 1; y++) {
        for (let x = areaX; x < areaX + areaWidth && x < mapWidth - 1; x++) {
          mapData[y][x].type = 'floor';
        }
      }
    }
  };
  
  // Create jagged terrain formations
  const createJaggedFormations = (mapData: Cell[][]) => {
    // Create 2-4 jagged formations
    const numFormations = 2 + Math.floor(Math.random() * 3);
    
    for (let formation = 0; formation < numFormations; formation++) {
      const startX = 3 + Math.floor(Math.random() * (mapWidth - 6));
      const startY = 3 + Math.floor(Math.random() * (mapHeight - 6));
      
      // Use a noise-based approach to create jagged formations
      const numPoints = 15 + Math.floor(Math.random() * 20);
      const points: {x: number, y: number}[] = [];
      
      // Generate points
      points.push({x: startX, y: startY});
      
      for (let i = 0; i < numPoints; i++) {
        const lastPoint = points[points.length - 1];
        const angle = Math.random() * Math.PI * 2;
        const distance = 1 + Math.floor(Math.random() * 3);
        
        const newX = Math.floor(lastPoint.x + Math.cos(angle) * distance);
        const newY = Math.floor(lastPoint.y + Math.sin(angle) * distance);
        
        // Keep within bounds
        if (newX > 1 && newX < mapWidth - 2 && newY > 1 && newY < mapHeight - 2) {
          points.push({x: newX, y: newY});
        }
      }
      
      // Create walls at these points and sometimes around them
      for (const point of points) {
        mapData[point.y][point.x].type = 'wall';
        
        // Sometimes extend the formation
        if (Math.random() < 0.7) {
          const dx = Math.random() < 0.5 ? 1 : -1;
          const dy = Math.random() < 0.5 ? 1 : -1;
          
          if (point.x + dx > 1 && point.x + dx < mapWidth - 2) {
            mapData[point.y][point.x + dx].type = 'wall';
          }
          
          if (point.y + dy > 1 && point.y + dy < mapHeight - 2) {
            mapData[point.y + dy][point.x].type = 'wall';
          }
        }
      }
    }
  };
  
  // Ensure the center area is clear and accessible
  const clearCenterArea = (mapData: Cell[][], centerX: number, centerY: number, radius: number) => {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        if (x >= 1 && x < mapWidth - 1 && y >= 1 && y < mapHeight - 1) {
          // Calculate distance from center
          const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          
          if (distanceFromCenter <= radius) {
            // Clear center area
            mapData[y][x].type = 'floor';
          }
        }
      }
    }
    
    // Add some strategic cover in the center area
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const distance = radius * 0.7;
      
      const coverX = Math.floor(centerX + Math.cos(angle) * distance);
      const coverY = Math.floor(centerY + Math.sin(angle) * distance);
      
      if (coverX >= 1 && coverX < mapWidth - 1 && coverY >= 1 && coverY < mapHeight - 1) {
        mapData[coverY][coverX].type = 'cover';
      }
    }
  };
  
  // Add cover elements throughout the map
  const addCoverElements = (mapData: Cell[][]) => {
    // Add cover in strategic places
    for (let y = 2; y < mapHeight - 2; y++) {
      for (let x = 2; x < mapWidth - 2; x++) {
        // Add cover near walls for tactical advantage
        if (mapData[y][x].type === 'floor') {
          const hasNearbyWall = 
            mapData[y-1][x].type === 'wall' || 
            mapData[y+1][x].type === 'wall' || 
            mapData[y][x-1].type === 'wall' || 
            mapData[y][x+1].type === 'wall';
          
          if (hasNearbyWall && Math.random() < 0.2) {
            mapData[y][x].type = 'cover';
          } 
          // Random cover
          else if (Math.random() < 0.03) {
            mapData[y][x].type = 'cover';
          }
        }
      }
    }
  };
  
  // Place weapon caches near the center
  const placeWeaponCaches = (mapData: Cell[][], centerX: number, centerY: number, radius: number) => {
    const numCaches = 3 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numCaches; i++) {
      const angle = (Math.PI * 2 / numCaches) * i;
      const distance = radius * 0.5;
      
      const cacheX = Math.floor(centerX + Math.cos(angle) * distance);
      const cacheY = Math.floor(centerY + Math.sin(angle) * distance);
      
      if (cacheX >= 1 && cacheX < mapWidth - 1 && cacheY >= 1 && cacheY < mapHeight - 1) {
        if (mapData[cacheY][cacheX].type === 'floor') {
          mapData[cacheY][cacheX].type = 'ammo';
        }
      }
    }
  };

  // Place ammo caches
  const placeAmmoCaches = () => {
    const caches: AmmoCache[] = [];
    
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(Math.random() * (mapWidth - 4)) + 2;
      const y = Math.floor(Math.random() * (mapHeight - 4)) + 2;
      
      caches.push({
        id: i + 1,
        x,
        y,
        ammoType: Math.random() > 0.5 ? 'primary' : 'secondary',
        amount: Math.random() > 0.5 ? 30 : 15
      });
    }
    
    setAmmoCaches(caches);
  };

  // Setup spawners
  const setupSpawners = () => {
    const newSpawners: (Spawner | HostileSpawner)[] = [];
    
    // Regular enemy spawners (4 of them)
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i;
      const distance = Math.min(mapWidth, mapHeight) * 0.4;
      
      const x = Math.floor(mapWidth / 2 + Math.cos(angle) * distance);
      const y = Math.floor(mapHeight / 2 + Math.sin(angle) * distance);
      
      newSpawners.push({
        id: i + 1,
        x,
        y,
        active: false,
        enemyType: ['melee', 'ranged', 'tank', 'boss'][Math.floor(Math.random() * 3)] as any,
        spawnRate: 3 + Math.random() * 2,
        lastSpawnTime: 0
      });
    }
    
    // Hostile AI spawners (will activate at higher wave levels)
    // These will spawn hostile AI players that use weapons
    for (let i = 0; i < 2; i++) {
      const angle = (Math.PI * 2 / 4) * (i + 0.5); // Offset from regular spawners
      const distance = Math.min(mapWidth, mapHeight) * 0.6; // Further away
      
      const x = Math.floor(mapWidth / 2 + Math.cos(angle) * distance);
      const y = Math.floor(mapHeight / 2 + Math.sin(angle) * distance);
      
      // Select random weapons for hostile AI spawner
      const hostileWeapons: Weapon[] = [
        getRandomWeapon('primary', 'uncommon'),
        getRandomWeapon('secondary', 'uncommon'),
        getRandomWeapon('melee', 'rare')
      ];
      
      newSpawners.push({
        id: i + 5, // Start after the regular spawners
        x,
        y,
        active: false,
        enemyType: 'tank', // Base type, but these will spawn hostile AIs
        spawnRate: 1 + Math.random(), // Slower spawn rate for hostiles
        lastSpawnTime: 0,
        spawnType: 'hostile-ai',
        hostileAIType: Math.random() < 0.2 ? 'elite' : 'normal',
        weapons: hostileWeapons
      });
    }
    
    // Boss spawner (appears at wave milestones)
    // Only activates at waves 5, 10, 15, etc.
    const bossAngle = Math.PI; // Opposite of starting position
    const bossDistance = Math.min(mapWidth, mapHeight) * 0.7; // Far from start
    
    const bossX = Math.floor(mapWidth / 2 + Math.cos(bossAngle) * bossDistance);
    const bossY = Math.floor(mapHeight / 2 + Math.sin(bossAngle) * bossDistance);
    
    newSpawners.push({
      id: 7, // Special ID for boss spawner
      x: bossX,
      y: bossY,
      active: false,
      enemyType: 'boss',
      spawnRate: 0.5, // Very slow spawn rate
      lastSpawnTime: 0
    });
    
    setSpawners(newSpawners);
  };

  // Update visibility
  const updateVisibility = () => {
    const newMap = JSON.parse(JSON.stringify(map)) as Cell[][];
    
    // Reset visibility
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        newMap[y][x].visible = false;
      }
    }
    
    // Update from players' view
    players.forEach(player => {
      if (player.isAlive) {
        updateEntityVisibility(newMap, player);
      }
    });
    
    // Update from NPCs' view
    npcs.forEach(npc => {
      updateEntityVisibility(newMap, npc);
    });
    
    setMap(newMap);
  };

  // Update entity visibility (for both players and NPCs)
  const updateEntityVisibility = (currentMap: Cell[][], entity: Player | NonPlayerCharacter) => {
    const { x, y, visibilityRange } = entity;
    const visibilityRangeSquared = visibilityRange * visibilityRange;
    
    // Simple circle-based visibility
    for (let cy = Math.max(0, y - visibilityRange); cy < Math.min(mapHeight, y + visibilityRange + 1); cy++) {
      for (let cx = Math.max(0, x - visibilityRange); cx < Math.min(mapWidth, x + visibilityRange + 1); cx++) {
        const distanceSquared = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        
        if (distanceSquared <= visibilityRangeSquared) {
          // Check if there's a wall blocking the view
          if (hasLineOfSight(currentMap, x, y, cx, cy)) {
            currentMap[cy][cx].visible = true;
            currentMap[cy][cx].explored = true;
          }
        }
      }
    }
  };

  // Line of sight check
  const hasLineOfSight = (currentMap: Cell[][], x1: number, y1: number, x2: number, y2: number): boolean => {
    // Using Bresenham's line algorithm
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let currentX = x1;
    let currentY = y1;
    
    while (!(currentX === x2 && currentY === y2)) {
      const e2 = 2 * err;
      
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
      
      // If we hit a wall, no line of sight
      if (
        currentX !== x1 && currentY !== y1 && // Don't check the start position
        currentX !== x2 && currentY !== y2 && // Don't check the end position
        currentMap[currentY][currentX].type === 'wall'
      ) {
        return false;
      }
    }
    
    return true;
  };

  // Handle keyboard input
  const handleKeyDown = (e: KeyboardEvent) => {
    keysPressed.current.add(e.key.toLowerCase());
    
    // Special key handling for player switching
    if (e.key.toLowerCase() === 'arrowright' || e.key.toLowerCase() === 'arrowleft') {
      if (e.key.toLowerCase() === 'arrowright') {
        nextPlayer();
      } else {
        prevPlayer();
      }
    }
    
    // ESC key to release control back to AI
    if (e.key === 'Escape' && activePlayer) {
      releaseControl(activePlayer);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
  };
  
  // Take control of a player
  const takeControl = (player: Player) => {
    if (!player.isAlive) return;
    
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          isHuman: true,
          logs: [...p.logs, "Human has taken control."]
        };
      }
      return p;
    }));
    
    addGlobalLog(`Human has taken control of ${player.name}.`);
  };
  
  // Release control back to AI
  const releaseControl = (player: Player) => {
    if (!player.isAlive) return;
    
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          isHuman: false,
          logs: [...p.logs, "AI has resumed control."]
        };
      }
      return p;
    }));
    
    addGlobalLog(`${player.name} is now controlled by AI.`);
  };
  
  // Handle mouse input for the canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !activePlayer) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    // Only process if player is human-controlled
    if (!activePlayer.isHuman) return;
    
    // Check if the click was inside the map
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
      // Handle different actions based on what's at that position
      const clickedEnemy = enemies.find(enemy => enemy.x === x && enemy.y === y);
      if (clickedEnemy) {
        fireWeaponAt(activePlayer, clickedEnemy);
      } else {
        // Move towards the clicked location
        movePlayerTowards(activePlayer, x, y);
      }
    }
  };
  
  // Handle mouse movement for aiming
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    mousePos.current = {
      x: Math.floor((e.clientX - rect.left) / cellSize),
      y: Math.floor((e.clientY - rect.top) / cellSize)
    };
  };

  // Move player
  const movePlayer = (player: Player, dx: number, dy: number) => {
    if (!player.isAlive) return false;
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    // Check if the player can move to the new position
    if (
      newX >= 0 && newX < mapWidth && 
      newY >= 0 && newY < mapHeight && 
      map[newY][newX].type !== 'wall'
    ) {
      setPlayers(prev => prev.map(p => {
        if (p.id === player.id) {
          return {
            ...p,
            x: newX,
            y: newY
          };
        }
        return p;
      }));
      
      // Check for ammo caches
      const ammoCache = ammoCaches.find(cache => cache.x === newX && cache.y === newY);
      if (ammoCache) {
        collectAmmo(player, ammoCache);
      }
      
      return true;
    }
    
    return false;
  };
  
  // Move player towards a target position (pathfinding simplified for this demo)
  const movePlayerTowards = (player: Player, targetX: number, targetY: number) => {
    if (!player.isAlive) return;
    
    // Simple direct movement - would be replaced with proper pathfinding
    const dx = Math.sign(targetX - player.x);
    const dy = Math.sign(targetY - player.y);
    
    // Try to move in the direction of the target
    const moved = movePlayer(player, dx, dy);
    
    // If can't move diagonally, try moving horizontally or vertically
    if (!moved) {
      movePlayer(player, dx, 0) || movePlayer(player, 0, dy);
    }
  };

  // Switch weapon
  const switchWeapon = (player: Player, weaponType: 'primary' | 'secondary' | 'melee') => {
    if (!player.isAlive) return;
    
    setPlayers(prev => {
      // Create updated player state
      const updatedPlayer = {
        ...player,
        weapons: {
          ...player.weapons,
          currentWeapon: weaponType
        }
      };
      
      // Log the weapon switch
      addPlayerLog(updatedPlayer, `Switched to ${updatedPlayer.weapons[weaponType].name}`);
      
      // Return updated players array
      return prev.map(p => p.id === player.id ? updatedPlayer : p);
    });
  };

  // Collect ammo
  const collectAmmo = (player: Player, cache: AmmoCache) => {
    if (!player.isAlive) return;
    
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        const newAmmo = {...p.ammo};
        
        if (cache.ammoType === 'primary') {
          newAmmo.primary = Math.min(p.ammo.primary + cache.amount, p.ammo.maxPrimary);
        } else {
          newAmmo.secondary = Math.min(p.ammo.secondary + cache.amount, p.ammo.maxSecondary);
        }
        
        return {
          ...p,
          ammo: newAmmo
        };
      }
      return p;
    }));
    
    setAmmoCaches(prev => prev.filter(c => c.id !== cache.id));
    addPlayerLog(player, `Collected ${cache.amount} ${cache.ammoType} ammo`);
  };

  // Fire weapon at nearby enemy
  const fireWeapon = (player: Player) => {
    if (!player.isAlive) return;
    
    const currentWeapon = player.weapons.currentWeapon;
    const weapon = player.weapons[currentWeapon];
    const now = Date.now();
    
    // Check cooldown
    if (now - weapon.lastFiredTime < 1000 / weapon.fireRate) {
      return;
    }
    
    // Check ammo
    if (weapon.ammoType !== 'melee' && player.ammo[weapon.ammoType] <= 0) {
      addPlayerLog(player, `Out of ${weapon.ammoType} ammo!`);
      return;
    }
    
    // Update weapon last fired time
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          weapons: {
            ...p.weapons,
            [currentWeapon]: {
              ...p.weapons[currentWeapon],
              lastFiredTime: now
            }
          },
          // Reduce ammo if not melee
          ammo: weapon.ammoType !== 'melee' ? {
            ...p.ammo,
            [weapon.ammoType]: p.ammo[weapon.ammoType] - 1
          } : p.ammo
        };
      }
      return p;
    }));
    
    // Find potential targets
    const targets = enemies.filter(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
      );
      
      return distance <= weapon.range && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
    });
    
    if (targets.length > 0) {
      // Find closest target
      const closest = targets.reduce((prev, current) => {
        const prevDistance = Math.sqrt(
          Math.pow(prev.x - player.x, 2) + Math.pow(prev.y - player.y, 2)
        );
        const currentDistance = Math.sqrt(
          Math.pow(current.x - player.x, 2) + Math.pow(current.y - player.y, 2)
        );
        
        return prevDistance < currentDistance ? prev : current;
      });
      
      // Apply damage
      hitEnemy(player, closest.id, weapon.damage);
      addPlayerLog(player, `Hit ${closest.type} for ${weapon.damage} damage`);
    } else {
      addPlayerLog(player, `Fired ${weapon.name} but missed!`);
    }
  };
  
  // Fire weapon at specific enemy
  const fireWeaponAt = (player: Player, enemy: Enemy) => {
    if (!player.isAlive) return;
    
    const currentWeapon = player.weapons.currentWeapon;
    const weapon = player.weapons[currentWeapon];
    const now = Date.now();
    
    // Check cooldown
    if (now - weapon.lastFiredTime < 1000 / weapon.fireRate) {
      return;
    }
    
    // Check ammo
    if (weapon.ammoType !== 'melee' && player.ammo[weapon.ammoType] <= 0) {
      addPlayerLog(player, `Out of ${weapon.ammoType} ammo!`);
      return;
    }
    
    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
    );
    
    // Check range and line of sight
    if (distance <= weapon.range && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y)) {
      // Update weapon last fired time
      setPlayers(prev => prev.map(p => {
        if (p.id === player.id) {
          return {
            ...p,
            weapons: {
              ...p.weapons,
              [currentWeapon]: {
                ...p.weapons[currentWeapon],
                lastFiredTime: now
              }
            },
            // Reduce ammo if not melee
            ammo: weapon.ammoType !== 'melee' ? {
              ...p.ammo,
              [weapon.ammoType]: p.ammo[weapon.ammoType] - 1
            } : p.ammo
          };
        }
        return p;
      }));
      
      // Apply damage
      hitEnemy(player, enemy.id, weapon.damage);
      addPlayerLog(player, `Hit ${enemy.type} for ${weapon.damage} damage`);
    } else {
      addPlayerLog(player, `Target out of range or no line of sight!`);
    }
  };

  // Hit enemy
  const hitEnemy = (player: Player, enemyId: number, damage: number) => {
    setEnemies(prev => {
      return prev.map(enemy => {
        if (enemy.id === enemyId) {
          const newHealth = Math.max(0, enemy.health - damage);
          
          if (newHealth === 0) {
            // Update player kills
            setPlayers(prevPlayers => prevPlayers.map(p => {
              if (p.id === player.id) {
                return {
                  ...p,
                  kills: p.kills + 1
                };
              }
              return p;
            }));
            
            // Update game state
            setGameState(gs => ({
              ...gs,
              enemiesKilled: gs.enemiesKilled + 1
            }));
            
            addPlayerLog(player, `Killed ${enemy.type} enemy!`);
          }
          
          return {
            ...enemy,
            health: newHealth
          };
        }
        return enemy;
      }).filter(enemy => enemy.health > 0);
    });
  };

  // Add log
  const addPlayerLog = (player: Player, message: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        const newLogs = [...p.logs, message];
        // Keep logs manageable
        const trimmedLogs = newLogs.length > 10 ? newLogs.slice(newLogs.length - 10) : newLogs;
        return {
          ...p,
          logs: trimmedLogs
        };
      }
      return p;
    }));
  };
  
  // Add global log
  const addGlobalLog = (message: string) => {
    setGlobalLogs(prev => {
      const newLogs = [...prev, message];
      if (newLogs.length > 20) {
        return newLogs.slice(newLogs.length - 20);
      }
      return newLogs;
    });
  };

  // Update AI
  const updateAI = (_deltaTime: number) => {
    // Update NPCs
    updateNPCs();
    
    // Update enemies
    updateEnemies();
    
    // Update spawners
    updateSpawners();
    
    // Update AI-controlled players
    updateAIPlayers();
  };
  
  // Update AI-controlled players
  const updateAIPlayers = () => {
    setPlayers(prev => prev.map(player => {
      // Skip human-controlled players and dead players
      if (player.isHuman || !player.isAlive) return player;
      
      // AI player logic
      // 1. Look for closest enemy
      const visibleEnemies = enemies.filter(enemy => {
        const distance = Math.sqrt(
          Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
        );
        return distance <= player.visibilityRange && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
      });
      
      if (visibleEnemies.length > 0) {
        // Find closest enemy
        const closestEnemy = visibleEnemies.reduce((prev, current) => {
          const prevDistance = Math.sqrt(
            Math.pow(prev.x - player.x, 2) + Math.pow(prev.y - player.y, 2)
          );
          const currentDistance = Math.sqrt(
            Math.pow(current.x - player.x, 2) + Math.pow(current.y - player.y, 2)
          );
          
          return prevDistance < currentDistance ? prev : current;
        });
        
        // Get distance to enemy
        const distance = Math.sqrt(
          Math.pow(closestEnemy.x - player.x, 2) + Math.pow(closestEnemy.y - player.y, 2)
        );
        
        // If enemy is within weapon range, attack it
        if (distance <= player.weapons[player.weapons.currentWeapon].range) {
          // Switch to appropriate weapon based on distance
          let newWeaponType = player.weapons.currentWeapon;
          if (distance <= 1) {
            newWeaponType = 'melee';
          } else if (distance <= 5) {
            newWeaponType = player.ammo.secondary > 0 ? 'secondary' : 'primary';
          } else {
            newWeaponType = player.ammo.primary > 0 ? 'primary' : 'secondary';
          }
          
          // Fire at enemy
          const now = Date.now();
          const weapon = player.weapons[newWeaponType];
          
          // Check cooldown and ammo
          if (now - weapon.lastFiredTime >= 1000 / weapon.fireRate &&
              (weapon.ammoType === 'melee' || player.ammo[weapon.ammoType] > 0)) {
            
            return {
              ...player,
              weapons: {
                ...player.weapons,
                currentWeapon: newWeaponType,
                [newWeaponType]: {
                  ...player.weapons[newWeaponType],
                  lastFiredTime: now
                }
              },
              // Reduce ammo if not melee
              ammo: weapon.ammoType !== 'melee' ? {
                ...player.ammo,
                [weapon.ammoType]: player.ammo[weapon.ammoType] - 1
              } : player.ammo,
              logs: [...player.logs, `Firing at ${closestEnemy.type}`]
            };
          }
        } else {
          // Move towards enemy
          const dx = Math.sign(closestEnemy.x - player.x);
          const dy = Math.sign(closestEnemy.y - player.y);
          
          // Try to move towards the enemy
          const newX = player.x + dx;
          const newY = player.y + dy;
          
          // Check if can move to new position
          if (
            newX >= 0 && newX < mapWidth && 
            newY >= 0 && newY < mapHeight && 
            map[newY][newX].type !== 'wall'
          ) {
            return {
              ...player,
              x: newX,
              y: newY,
              logs: [...player.logs, `Moving towards enemy`]
            };
          }
        }
      } else {
        // No enemies visible, explore or search for ammo/health
        const nearbyAmmo = ammoCaches.find(cache => {
          const distance = Math.sqrt(
            Math.pow(cache.x - player.x, 2) + Math.pow(cache.y - player.y, 2)
          );
          return distance <= 5 && hasLineOfSight(map, player.x, player.y, cache.x, cache.y);
        });
        
        if (nearbyAmmo) {
          // Move towards ammo
          const dx = Math.sign(nearbyAmmo.x - player.x);
          const dy = Math.sign(nearbyAmmo.y - player.y);
          
          // Try to move towards the ammo
          const newX = player.x + dx;
          const newY = player.y + dy;
          
          // Check if can move to new position
          if (
            newX >= 0 && newX < mapWidth && 
            newY >= 0 && newY < mapHeight && 
            map[newY][newX].type !== 'wall'
          ) {
            return {
              ...player,
              x: newX,
              y: newY,
              logs: [...player.logs, `Moving towards ammo`]
            };
          }
        } else {
          // Random exploration
          const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1}
          ];
          
          const direction = directions[Math.floor(Math.random() * directions.length)];
          const newX = player.x + direction.dx;
          const newY = player.y + direction.dy;
          
          // Check if can move to new position
          if (
            newX >= 0 && newX < mapWidth && 
            newY >= 0 && newY < mapHeight && 
            map[newY][newX].type !== 'wall'
          ) {
            return {
              ...player,
              x: newX,
              y: newY,
              logs: [...player.logs, `Exploring`]
            };
          }
        }
      }
      
      return player;
    }));
  };

  // Update NPCs
  const updateNPCs = () => {
    setNpcs(prev => {
      return prev.map(npc => {
        if (!npc.targetPlayerId) return npc;
        
        // Find the target player
        const targetPlayer = players.find(p => p.id === npc.targetPlayerId);
        if (!targetPlayer || !targetPlayer.isAlive) {
          // Target player is not found or dead, find a new target
          const alivePlayers = players.filter(p => p.isAlive);
          if (alivePlayers.length > 0) {
            const newTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            return {
              ...npc,
              targetPlayerId: newTarget.id,
              status: `Following ${newTarget.name}`
            };
          } else {
            // No alive players, just stay put
            return {
              ...npc,
              targetPlayerId: undefined,
              status: 'Waiting for survivors'
            };
          }
        }
        
        if (npc.behavior === 'follow') {
          // Follow player, but keep some distance
          const dx = targetPlayer.x - npc.x;
          const dy = targetPlayer.y - npc.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 3) {
            // Too far, move closer
            const moveX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
            const moveY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
            
            const newX = npc.x + moveX;
            const newY = npc.y + moveY;
            
            // Check if the NPC can move to the new position
            if (
              newX >= 0 && newX < mapWidth && 
              newY >= 0 && newY < mapHeight && 
              map[newY][newX].type !== 'wall'
            ) {
              return {
                ...npc,
                x: newX,
                y: newY,
                status: `Following ${targetPlayer.name}`
              };
            }
          } else if (distance < 2) {
            // Too close, move away
            const moveX = dx === 0 ? 0 : (dx > 0 ? -1 : 1);
            const moveY = dy === 0 ? 0 : (dy > 0 ? -1 : 1);
            
            const newX = npc.x + moveX;
            const newY = npc.y + moveY;
            
            // Check if the NPC can move to the new position
            if (
              newX >= 0 && newX < mapWidth && 
              newY >= 0 && newY < mapHeight && 
              map[newY][newX].type !== 'wall'
            ) {
              return {
                ...npc,
                x: newX,
                y: newY,
                status: 'Maintaining distance'
              };
            }
          }
        } else if (npc.behavior === 'defend') {
          // Look for nearby enemies and attack them
          const nearbyEnemy = enemies.find(enemy => {
            const distance = Math.sqrt(
              Math.pow(enemy.x - npc.x, 2) + Math.pow(enemy.y - npc.y, 2)
            );
            return distance <= 5 && hasLineOfSight(map, npc.x, npc.y, enemy.x, enemy.y);
          });
          
          if (nearbyEnemy) {
            // Simple attack logic - direct damage to enemy
            setEnemies(enemies => enemies.map(e => {
              if (e.id === nearbyEnemy.id) {
                const newHealth = Math.max(0, e.health - 10);
                return { ...e, health: newHealth };
              }
              return e;
            }).filter(e => e.health > 0));
            
            return {
              ...npc,
              status: 'Attacking enemy'
            };
          }
        }
        
        return npc;
      });
    });
  };

  // Update enemies
  const updateEnemies = () => {
    setEnemies(prev => {
      return prev.map(enemy => {
        // Skip dead enemies
        if (enemy.health <= 0) return enemy;
        
        const now = Date.now();
        let newX = enemy.x;
        let newY = enemy.y;
        let newBehavior = enemy.behavior;
        
        // Find closest alive player
        const alivePlayers = players.filter(p => p.isAlive);
        if (alivePlayers.length === 0) return enemy;
        
        const playerDistances = alivePlayers.map(player => {
          const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
          );
          return { player, distance };
        });
        
        const closestPlayer = playerDistances.reduce((prev, current) => {
          return prev.distance < current.distance ? prev : current;
        });
        
        // Check if enemy can see player
        const canSeePlayer = closestPlayer.distance <= enemy.detectionRange && 
                           hasLineOfSight(map, enemy.x, enemy.y, closestPlayer.player.x, closestPlayer.player.y);
        
        // Check if this is a boss enemy
        const isBoss = enemy.type === 'boss' && 'bossType' in enemy;
        
        // Special boss logic
        if (isBoss && 'bossType' in enemy) {
          const boss = enemy as Boss;
          
          // Boss special ability activation
          if (canSeePlayer && now - boss.lastSummonTime > boss.summonCooldown && !boss.isSummoning) {
            // Activate special ability
            const abilityIndex = Math.floor(Math.random() * boss.specialAbilities.length);
            const ability = boss.specialAbilities[abilityIndex];
            
            addGlobalLog(`Boss ${boss.bossType} is using ${ability}!`);
            
            // Different abilities based on boss type
            switch (boss.bossType) {
              case 'butcher':
                // Cleave attack that hits all nearby players
                if (ability === 'Cleave') {
                  const cleaveRange = boss.attackRange + 1;
                  
                  // Find all players in cleave range
                  const playersInRange = alivePlayers.filter(player => {
                    const distance = Math.sqrt(
                      Math.pow(player.x - boss.x, 2) + Math.pow(player.y - boss.y, 2)
                    );
                    return distance <= cleaveRange;
                  });
                  
                  // Deal damage to all players in range
                  setPlayers(players => players.map(p => {
                    if (playersInRange.some(rangePlayer => rangePlayer.id === p.id)) {
                      const cleaveDamage = Math.floor(boss.damage * 0.7); // Reduced cleave damage
                      const newHealth = Math.max(0, p.health - cleaveDamage);
                      addPlayerLog(p, `Hit by ${boss.bossType}'s Cleave for ${cleaveDamage} damage!`);
                      
                      if (newHealth === 0) {
                        addGlobalLog(`${p.name} has been cleaved to death!`);
                        return {
                          ...p,
                          health: 0,
                          isAlive: false,
                          logs: [...p.logs, 'You have been cleaved to death!']
                        };
                      }
                      
                      return {
                        ...p,
                        health: newHealth
                      };
                    }
                    return p;
                  }));
                }
                break;
                
              case 'necromancer':
                // Necromancer summons undead minions
                if (ability === 'Raise Dead') {
                  // Spawn 2-3 melee enemies around the boss
                  const spawnCount = 2 + Math.floor(Math.random() * 2);
                  const spawnPositions = [];
                  
                  // Find valid spawn positions around boss
                  for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 2; dy++) {
                      const spawnX = boss.x + dx;
                      const spawnY = boss.y + dy;
                      
                      if (
                        spawnX >= 0 && spawnX < mapWidth &&
                        spawnY >= 0 && spawnY < mapHeight &&
                        map[spawnY][spawnX].type !== 'wall' &&
                        !(dx === 0 && dy === 0) // Not on the boss
                      ) {
                        spawnPositions.push({ x: spawnX, y: spawnY });
                      }
                    }
                  }
                  
                  // Shuffle and take the positions we need
                  spawnPositions.sort(() => Math.random() - 0.5);
                  const actualSpawnCount = Math.min(spawnCount, spawnPositions.length);
                  
                  // Create minions
                  const minions: Enemy[] = [];
                  for (let i = 0; i < actualSpawnCount; i++) {
                    if (i < spawnPositions.length) {
                      const position = spawnPositions[i];
                      minions.push({
                        id: Date.now() + i + Math.floor(Math.random() * 1000),
                        x: position.x,
                        y: position.y,
                        health: 25,
                        maxHealth: 25,
                        damage: 8,
                        attackRange: 1,
                        attackSpeed: 1,
                        type: 'melee',
                        behavior: 'aggressive',
                        lastAttackTime: 0,
                        detectionRange: 10
                      });
                    }
                  }
                  
                  // Add minions to the enemies
                  setEnemies(prev => [...prev, ...minions]);
                  addGlobalLog(`${boss.bossType} has summoned ${actualSpawnCount} undead minions!`);
                }
                break;
                
              case 'warlord':
                // Warlord has a powerful charge attack
                if (ability === 'Charge') {
                  // Charge in the direction of the closest player
                  const chargeDistance = 4; // Charge up to 4 cells
                  const dx = Math.sign(closestPlayer.player.x - boss.x);
                  const dy = Math.sign(closestPlayer.player.y - boss.y);
                  
                  // Calculate charge path
                  const chargePath = [];
                  for (let i = 1; i <= chargeDistance; i++) {
                    const pathX = boss.x + (dx * i);
                    const pathY = boss.y + (dy * i);
                    
                    // Stop charging if we hit a wall
                    if (
                      pathX < 0 || pathX >= mapWidth ||
                      pathY < 0 || pathY >= mapHeight ||
                      map[pathY][pathX].type === 'wall'
                    ) {
                      break;
                    }
                    
                    chargePath.push({ x: pathX, y: pathY });
                  }
                  
                  // Deal damage to any player in charge path
                  if (chargePath.length > 0) {
                    const endPoint = chargePath[chargePath.length - 1];
                    const chargeDamage = boss.damage * 1.5; // Enhanced charge damage
                    
                    // Set boss position to end of charge
                    newX = endPoint.x;
                    newY = endPoint.y;
                    
                    // Check if any players are in the charge path
                    setPlayers(players => players.map(p => {
                      if (p.isAlive && chargePath.some(pos => pos.x === p.x && pos.y === p.y)) {
                        const newHealth = Math.max(0, p.health - chargeDamage);
                        addPlayerLog(p, `Hit by ${boss.bossType}'s Charge for ${chargeDamage} damage!`);
                        
                        if (newHealth === 0) {
                          addGlobalLog(`${p.name} was trampled by the Warlord's charge!`);
                          return {
                            ...p,
                            health: 0,
                            isAlive: false,
                            logs: [...p.logs, 'You were trampled by the Warlord\'s charge!']
                          };
                        }
                        
                        return {
                          ...p,
                          health: newHealth
                        };
                      }
                      return p;
                    }));
                  }
                }
                break;
                
              case 'sentinel':
                // Sentinel can fire a laser barrage
                if (ability === 'Laser Barrage') {
                  // Attack random players from range
                  const targetCount = Math.min(3, alivePlayers.length);
                  const targets = [...alivePlayers].sort(() => Math.random() - 0.5).slice(0, targetCount);
                  
                  const laserDamage = Math.floor(boss.damage * 1.2); // Enhanced laser damage
                  
                  // Deal damage to targeted players regardless of range/LOS (it's a special ability)
                  setPlayers(players => players.map(p => {
                    if (targets.some(target => target.id === p.id)) {
                      const newHealth = Math.max(0, p.health - laserDamage);
                      addPlayerLog(p, `Hit by ${boss.bossType}'s Laser Barrage for ${laserDamage} damage!`);
                      
                      if (newHealth === 0) {
                        addGlobalLog(`${p.name} was vaporized by the Sentinel's lasers!`);
                        return {
                          ...p,
                          health: 0,
                          isAlive: false,
                          logs: [...p.logs, 'You were vaporized by the Sentinel\'s lasers!']
                        };
                      }
                      
                      return {
                        ...p,
                        health: newHealth
                      };
                    }
                    return p;
                  }));
                }
                break;
                
              case 'hivemind':
                // Hivemind can mind control a player temporarily
                if (ability === 'Mind Control') {
                  // Find a random alive player to control
                  if (alivePlayers.length > 0) {
                    const targetIndex = Math.floor(Math.random() * alivePlayers.length);
                    const targetPlayer = alivePlayers[targetIndex];
                    
                    // Apply a status effect (in a real game, this would temporarily disable player control)
                    addPlayerLog(targetPlayer, 'You have been mind controlled by the Hivemind!');
                    addGlobalLog(`${targetPlayer.name} has been mind controlled by the Hivemind!`);
                    
                    // For this demo, just deal some psychic damage
                    const psychicDamage = Math.floor(boss.damage * 0.8);
                    setPlayers(players => players.map(p => {
                      if (p.id === targetPlayer.id) {
                        const newHealth = Math.max(0, p.health - psychicDamage);
                        
                        if (newHealth === 0) {
                          addGlobalLog(`${p.name}'s mind was crushed by the Hivemind!`);
                          return {
                            ...p,
                            health: 0,
                            isAlive: false,
                            logs: [...p.logs, 'Your mind was crushed by the Hivemind!']
                          };
                        }
                        
                        return {
                          ...p,
                          health: newHealth
                        };
                      }
                      return p;
                    }));
                  }
                }
                break;
            }
            
            // Update boss state after using special ability
            return {
              ...boss,
              lastSummonTime: now,
              minionsSpawned: boss.minionsSpawned + 1
            };
          }
        }
        
        // Normal enemy behavior (for both regular enemies and bosses when not using special abilities)
        if (canSeePlayer) {
          // Switch to aggressive mode if player spotted
          newBehavior = 'aggressive';
          
          // If in range, attack
          if (closestPlayer.distance <= enemy.attackRange) {
            // Check attack cooldown
            if (now - enemy.lastAttackTime > 1000 / enemy.attackSpeed) {
              // Attack player
              setPlayers(players => players.map(p => {
                if (p.id === closestPlayer.player.id) {
                  const newHealth = Math.max(0, p.health - enemy.damage);
                  addPlayerLog(p, `${enemy.type} enemy hit you for ${enemy.damage} damage!`);
                  
                  if (newHealth === 0) {
                    addPlayerLog(p, `You have died!`);
                    addGlobalLog(`${p.name} has died!`);
                    return {
                      ...p,
                      health: 0,
                      isAlive: false
                    };
                  }
                  
                  return {
                    ...p,
                    health: newHealth
                  };
                }
                return p;
              }));
              
              return {
                ...enemy,
                behavior: newBehavior,
                lastAttackTime: now
              };
            }
          } else {
            // Move towards player
            const dx = closestPlayer.player.x - enemy.x;
            const dy = closestPlayer.player.y - enemy.y;
            
            const moveX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
            const moveY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
            
            newX = enemy.x + moveX;
            newY = enemy.y + moveY;
            
            // Check if the enemy can move to the new position
            if (
              newX < 0 || newX >= mapWidth || 
              newY < 0 || newY >= mapHeight || 
              map[newY][newX].type === 'wall'
            ) {
              // Can't move there, try another direction
              newX = enemy.x;
              newY = enemy.y;
            }
          }
        } else if (enemy.behavior === 'patrol' && enemy.movementPattern) {
          // Continue patrol
          const targetPoint = enemy.movementPattern.path[enemy.movementPattern.currentPathIndex];
          
          // Move towards target point
          if (targetPoint.x !== enemy.x || targetPoint.y !== enemy.y) {
            const pathDx = targetPoint.x - enemy.x;
            const pathDy = targetPoint.y - enemy.y;
            
            const moveX = pathDx === 0 ? 0 : (pathDx > 0 ? 1 : -1);
            const moveY = pathDy === 0 ? 0 : (pathDy > 0 ? 1 : -1);
            
            newX = enemy.x + moveX;
            newY = enemy.y + moveY;
            
            // Check if the enemy can move to the new position
            if (
              newX < 0 || newX >= mapWidth || 
              newY < 0 || newY >= mapHeight || 
              map[newY][newX].type === 'wall'
            ) {
              // Can't move there, try another direction
              newX = enemy.x;
              newY = enemy.y;
            }
          } else {
            // Move to next patrol point
            const nextPathIndex = (enemy.movementPattern.currentPathIndex + 1) % enemy.movementPattern.path.length;
            
            return {
              ...enemy,
              movementPattern: {
                ...enemy.movementPattern,
                currentPathIndex: nextPathIndex
              }
            };
          }
        } else if (enemy.behavior === 'defensive') {
          // Find cover if possible
          // Simple implementation - move to nearest cover
          const nearestCover = findNearestCover(enemy.x, enemy.y);
          
          if (nearestCover) {
            const coverDx = nearestCover.x - enemy.x;
            const coverDy = nearestCover.y - enemy.y;
            
            if (Math.abs(coverDx) > 0 || Math.abs(coverDy) > 0) {
              const moveX = coverDx === 0 ? 0 : (coverDx > 0 ? 1 : -1);
              const moveY = coverDy === 0 ? 0 : (coverDy > 0 ? 1 : -1);
              
              newX = enemy.x + moveX;
              newY = enemy.y + moveY;
              
              // Check if the enemy can move to the new position
              if (
                newX < 0 || newX >= mapWidth || 
                newY < 0 || newY >= mapHeight || 
                map[newY][newX].type === 'wall'
              ) {
                // Can't move there, try another direction
                newX = enemy.x;
                newY = enemy.y;
              }
            }
          }
        }
        
        return {
          ...enemy,
          x: newX,
          y: newY,
          behavior: newBehavior
        };
      });
    });
  };

  // Find nearest cover
  const findNearestCover = (x: number, y: number): {x: number, y: number} | null => {
    let nearest = null;
    let nearestDistance = Infinity;
    
    for (let cy = 0; cy < mapHeight; cy++) {
      for (let cx = 0; cx < mapWidth; cx++) {
        if (map[cy][cx].type === 'cover') {
          const distance = Math.sqrt(
            Math.pow(cx - x, 2) + Math.pow(cy - y, 2)
          );
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = { x: cx, y: cy };
          }
        }
      }
    }
    
    return nearest;
  };

  // Create a boss enemy
  const createBoss = (x: number, y: number, wave: number): Boss => {
    // Boss types by wave
    const bossTypes: ('butcher' | 'necromancer' | 'warlord' | 'sentinel' | 'hivemind')[] = [
      'butcher',      // Wave 5
      'necromancer',  // Wave 10
      'warlord',      // Wave 15
      'sentinel',     // Wave 20
      'hivemind'      // Wave 25+
    ];
    
    const bossIndex = Math.min(Math.floor(wave / 5) - 1, bossTypes.length - 1);
    const bossType = bossTypes[bossIndex];
    
    // Boss scaling based on wave
    const waveScaling = 1 + (wave * 0.2);
    
    // Base boss stats
    const bossStats = {
      butcher: {
        health: 300,
        damage: 35,
        attackRange: 2,
        attackSpeed: 1.2,
        specialAbilities: ['Cleave', 'Blood Frenzy', 'Ground Slam'],
        detectionRange: 12
      },
      necromancer: {
        health: 200,
        damage: 15,
        attackRange: 8,
        attackSpeed: 0.8,
        specialAbilities: ['Raise Dead', 'Soul Drain', 'Death Bolt'],
        detectionRange: 14
      },
      warlord: {
        health: 400,
        damage: 25,
        attackRange: 1,
        attackSpeed: 1.5,
        specialAbilities: ['War Cry', 'Charge', 'Sweeping Strike'],
        detectionRange: 10
      },
      sentinel: {
        health: 350,
        damage: 30,
        attackRange: 6,
        attackSpeed: 1,
        specialAbilities: ['Energy Barrier', 'Laser Barrage', 'Overcharge'],
        detectionRange: 16
      },
      hivemind: {
        health: 500,
        damage: 20,
        attackRange: 4,
        attackSpeed: 2,
        specialAbilities: ['Spawn Swarm', 'Mind Control', 'Psychic Blast'],
        detectionRange: 20
      }
    };
    
    const stats = bossStats[bossType];
    
    // Boss creation with scaled stats
    const boss: Boss = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      x,
      y,
      health: stats.health * waveScaling,
      maxHealth: stats.health * waveScaling,
      damage: stats.damage * waveScaling,
      attackRange: stats.attackRange,
      attackSpeed: stats.attackSpeed,
      type: 'boss',
      behavior: 'aggressive',
      lastAttackTime: 0,
      detectionRange: stats.detectionRange,
      bossType,
      phase: 1,
      totalPhases: 3,
      specialAbilities: stats.specialAbilities,
      minionsSpawned: 0,
      isSummoning: false,
      summonCooldown: 20000, // 20 seconds between summons
      lastSummonTime: 0
    };
    
    // Boss announcement
    addGlobalLog(`WARNING: A ${bossType.charAt(0).toUpperCase() + bossType.slice(1)} has appeared! ${stats.specialAbilities[0]} ability detected!`);
    
    return boss;
  };
  
  // Create a hostile AI player
  const createHostileAIPlayer = (x: number, y: number, spawnerId: number, difficulty: 'normal' | 'elite' | 'boss', spawnerWeapons: Weapon[]): HostilePlayer => {
    // Generate a name for the hostile AI
    const names = ['Raider', 'Hunter', 'Marauder', 'Scavenger', 'Rogue', 'Bandit', 'Executioner', 'Survivor'];
    const adjectives = ['Ruthless', 'Deadly', 'Violent', 'Brutal', 'Savage', 'Merciless', 'Rogue', 'Hostile'];
    
    let name = '';
    if (difficulty === 'normal') {
      name = `${names[Math.floor(Math.random() * names.length)]}`;
    } else if (difficulty === 'elite') {
      name = `Elite ${names[Math.floor(Math.random() * names.length)]}`;
    } else {
      name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
    }
    
    // Scale stats based on difficulty
    let healthMultiplier = 1;
    let damageMultiplier = 1;
    
    if (difficulty === 'elite') {
      healthMultiplier = 1.5;
      damageMultiplier = 1.3;
    } else if (difficulty === 'boss') {
      healthMultiplier = 2.5;
      damageMultiplier = 1.8;
    }
    
    // Use spawner's weapons or generate better ones for elite/boss
    const primaryWeapon = {...(difficulty === 'normal' ? spawnerWeapons[0] : 
                          getRandomWeapon('primary', difficulty === 'elite' ? 'rare' : 'legendary'))};
    const secondaryWeapon = {...(difficulty === 'normal' ? spawnerWeapons[1] : 
                            getRandomWeapon('secondary', difficulty === 'elite' ? 'uncommon' : 'rare'))};
    const meleeWeapon = {...(difficulty === 'normal' ? spawnerWeapons[2] : 
                        getRandomWeapon('melee', difficulty === 'elite' ? 'uncommon' : 'rare'))};
    
    // Boost weapon damage
    primaryWeapon.damage *= damageMultiplier;
    secondaryWeapon.damage *= damageMultiplier;
    meleeWeapon.damage *= damageMultiplier;
    
    // Create the hostile player
    const hostilePlayer: HostilePlayer = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      x,
      y,
      health: 100 * healthMultiplier,
      maxHealth: 100 * healthMultiplier,
      energy: 100,
      maxEnergy: 100,
      ammo: {
        primary: 100,
        secondary: 50,
        maxPrimary: 200,
        maxSecondary: 100
      },
      weapons: {
        primary: primaryWeapon,
        secondary: secondaryWeapon,
        melee: meleeWeapon,
        currentWeapon: 'primary'
      },
      kills: 0,
      type: 'player',
      visibilityRange: 14, // Better vision than regular players
      logs: [`Hostile ${name} has entered the city.`],
      isHuman: false,
      isAlive: true,
      isHostile: true,
      spawnerId,
      difficulty,
      loot: {
        weapons: [primaryWeapon, secondaryWeapon, meleeWeapon],
        ammo: 50,
        health: 25
      }
    };
    
    // Announce hostile player
    addGlobalLog(`WARNING: Hostile survivor "${name}" detected! Armed and dangerous!`);
    
    return hostilePlayer;
  };

  // Update spawners
  const updateSpawners = () => {
    const now = Date.now();
    
    // Activate spawners at night
    const shouldActivate = gameState.time === 'night';
    
    // Special conditions for boss spawners
    const isBossWave = gameState.wave % 5 === 0 && gameState.wave > 0;
    
    // Hostile AI spawner activation (higher waves only)
    const hostileAIThreshold = 3; // Start spawning hostile AI after wave 3
    
    setSpawners(prev => {
      return prev.map(spawner => {
        // Check if this is a hostile AI spawner
        if ('spawnType' in spawner && spawner.spawnType === 'hostile-ai') {
          // Only activate hostile AI spawners after certain wave threshold and at night
          const shouldActivateHostile = shouldActivate && gameState.wave >= hostileAIThreshold;
          
          // If active and time to spawn
          if (shouldActivateHostile && spawner.active && now - spawner.lastSpawnTime > (60000 / spawner.spawnRate)) {
            // Create a hostile AI player
            const hostilePlayer = createHostileAIPlayer(
              spawner.x, 
              spawner.y, 
              spawner.id, 
              spawner.hostileAIType,
              spawner.weapons
            );
            
            // Add to players list
            setPlayers(prev => [...prev, hostilePlayer]);
            
            return {
              ...spawner,
              lastSpawnTime: now
            };
          }
          
          return {
            ...spawner,
            active: shouldActivateHostile
          };
        }
        // Boss spawner logic
        else if (spawner.enemyType === 'boss') {
          // Only activate boss spawner on boss waves and at night
          const shouldActivateBoss = shouldActivate && isBossWave;
          
          // If active, it's a boss wave, and time to spawn
          if (shouldActivateBoss && spawner.active && now - spawner.lastSpawnTime > (60000 / spawner.spawnRate)) {
            // Create a boss enemy
            const boss = createBoss(spawner.x, spawner.y, gameState.wave);
            
            // Add to enemies list
            setEnemies(prev => [...prev, boss]);
            
            return {
              ...spawner,
              lastSpawnTime: now,
              active: false // Deactivate after spawning a boss (one per wave)
            };
          }
          
          return {
            ...spawner,
            active: shouldActivateBoss
          };
        }
        // Regular enemy spawner logic
        else if (shouldActivate && spawner.active) {
          // Check if it's time to spawn
          if (now - spawner.lastSpawnTime > (60000 / spawner.spawnRate)) {
            // Spawn enemy
            const enemyTypes = {
              'melee': {
                damage: 10,
                attackRange: 1,
                attackSpeed: 1,
                detectionRange: 8,
                health: 50,
                maxHealth: 50
              },
              'ranged': {
                damage: 8,
                attackRange: 5,
                attackSpeed: 0.5,
                detectionRange: 10,
                health: 30,
                maxHealth: 30
              },
              'tank': {
                damage: 15,
                attackRange: 1,
                attackSpeed: 0.7,
                detectionRange: 7,
                health: 100,
                maxHealth: 100
              },
              'boss': {
                damage: 25,
                attackRange: 3,
                attackSpeed: 0.8,
                detectionRange: 12,
                health: 200,
                maxHealth: 200
              }
            };
            
            const enemyType = spawner.enemyType;
            const enemyData = enemyTypes[enemyType];
            
            // Create enemy with stats based on current wave/day
            const waveMultiplier = 1 + (gameState.wave - 1) * 0.2;
            const newEnemy: Enemy = {
              id: Date.now(),
              x: spawner.x,
              y: spawner.y,
              health: Math.floor(enemyData.health * waveMultiplier),
              maxHealth: Math.floor(enemyData.maxHealth * waveMultiplier),
              damage: Math.floor(enemyData.damage * waveMultiplier),
              attackRange: enemyData.attackRange,
              attackSpeed: enemyData.attackSpeed,
              type: enemyType,
              behavior: Math.random() < 0.7 ? 'aggressive' : 'defensive',
              lastAttackTime: 0,
              detectionRange: enemyData.detectionRange
            };
            
            // Add patrol behavior for some enemies
            if (Math.random() < 0.3) {
              newEnemy.behavior = 'patrol';
              newEnemy.movementPattern = {
                path: generatePatrolPath(spawner.x, spawner.y),
                currentPathIndex: 0
              };
            }
            
            setEnemies(prev => [...prev, newEnemy]);
            addGlobalLog(`${enemyType} enemy spawned!`);
            
            return {
              ...spawner,
              lastSpawnTime: now
            };
          }
        }
        
        return {
          ...spawner,
          active: shouldActivate
        };
      });
    });
  };

  // Generate patrol path
  const generatePatrolPath = (startX: number, startY: number): {x: number, y: number}[] => {
    const path: {x: number, y: number}[] = [];
    const pathLength = 4 + Math.floor(Math.random() * 4); // 4-7 points
    
    // Add start point
    path.push({ x: startX, y: startY });
    
    // Add random points
    for (let i = 1; i < pathLength; i++) {
      const prevPoint = path[i - 1];
      const distance = 3 + Math.floor(Math.random() * 5); // 3-7 cells
      const angle = Math.random() * Math.PI * 2;
      
      let newX = Math.floor(prevPoint.x + Math.cos(angle) * distance);
      let newY = Math.floor(prevPoint.y + Math.sin(angle) * distance);
      
      // Ensure point is within map
      newX = Math.max(1, Math.min(mapWidth - 2, newX));
      newY = Math.max(1, Math.min(mapHeight - 2, newY));
      
      path.push({ x: newX, y: newY });
    }
    
    // Complete the loop
    path.push({ x: startX, y: startY });
    
    return path;
  };

  // Update day/night cycle and handle map transitions
  const updateDayNightCycle = (deltaTime: number) => {
    setGameState(prev => {
      // If in transition state, don't update the cycle
      if (prev.gameStatus === 'transition') {
        return prev;
      }
      
      const newTimeElapsed = prev.timeElapsed + deltaTime;
      const cycleLength = 180; // 3 minute day/night cycle
      const dayLength = 120; // 2 minutes of day
      // const nightLength = 60; // 1 minute of night - calculated from cycle - day
      
      let newTime = prev.time;
      let newDay = prev.day;
      let newWave = prev.wave;
      let newWaveTimer = prev.waveTimer;
      let newGameStatus = prev.gameStatus;
      
      if (prev.time === 'day' && newTimeElapsed >= dayLength) {
        // Transition to night
        newTime = 'night';
        addGlobalLog('Night has fallen. Enemies are more dangerous now!');
        
        // Reposition spawners at night
        repositionSpawners();
      } else if (prev.time === 'night' && newTimeElapsed >= cycleLength) {
        // Transition to day
        newTime = 'day';
        newDay = prev.day + 1;
        newWave = prev.wave + 1;
        newWaveTimer = 120; // Reset wave timer
        
        // Check if we reached a map transition point (every 10 waves)
        if (newWave % 10 === 0 && newWave > 0) {
          addGlobalLog(`🌍 WAVE ${newWave} REACHED! The city has been cleared of threats temporarily.`);
          addGlobalLog(`Survivors must decide: Continue to a new area or escape with their lives?`);
          
          // Enter transition state
          newGameStatus = 'transition';
          
          return {
            ...prev,
            time: newTime,
            day: newDay,
            wave: newWave,
            timeElapsed: 0,
            waveTimer: newWaveTimer,
            gameStatus: newGameStatus,
            canTransition: true,
            transitionVotes: {} // Reset votes
          };
        }
        
        addGlobalLog(`Day ${newDay} has begun. Wave ${newWave} incoming!`);
        
        // Reset time elapsed
        return {
          ...prev,
          time: newTime,
          day: newDay,
          wave: newWave,
          timeElapsed: 0,
          waveTimer: newWaveTimer
        };
      }
      
      // Update wave timer
      if (prev.time === 'day') {
        newWaveTimer = Math.max(0, prev.waveTimer - deltaTime);
        
        if (prev.waveTimer > 0 && newWaveTimer === 0) {
          addGlobalLog('Night is coming soon. Prepare your defenses!');
        }
      }
      
      return {
        ...prev,
        time: newTime,
        day: newDay,
        wave: newWave,
        timeElapsed: newTimeElapsed,
        waveTimer: newWaveTimer
      };
    });
  };
  
  // Clear all enemies from the map
  const clearEnemies = () => {
    setEnemies([]);
  };
  
  // Handle player vote for map transition
  const handleTransitionVote = (playerId: number, vote: 'exit' | 'continue') => {
    if (!gameState.canTransition) return;
    
    setGameState(prev => {
      // Update votes
      const newVotes = {...prev.transitionVotes, [playerId]: vote};
      
      // Check if all living players have voted
      const livingPlayers = players.filter(p => p.isAlive);
      const allVoted = livingPlayers.every(p => p.id in newVotes);
      
      // Log the vote
      const player = players.find(p => p.id === playerId);
      if (player) {
        addGlobalLog(`${player.name} voted to ${vote === 'continue' ? 'continue to a new area' : 'escape the city'}.`);
      }
      
      if (allVoted) {
        // Count votes
        const continueVotes = Object.values(newVotes).filter(v => v === 'continue').length;
        const exitVotes = Object.values(newVotes).filter(v => v === 'exit').length;
        
        if (continueVotes > exitVotes) {
          // Majority wants to continue - generate new map
          addGlobalLog(`The survivors have decided to continue their journey to a new area!`);
          setTimeout(() => {
            transitionToNewMap();
          }, 2000);
        } else {
          // Majority wants to exit - end game
          addGlobalLog(`The survivors have decided to escape while they can. Game completed!`);
          setTimeout(() => {
            endGame(true);
          }, 2000);
        }
        
        return {
          ...prev,
          transitionVotes: newVotes,
          canTransition: false
        };
      }
      
      return {
        ...prev,
        transitionVotes: newVotes
      };
    });
  };
  
  // Transition to a new map
  const transitionToNewMap = () => {
    // Save current player stats
    const survivingPlayers = players.filter(p => p.isAlive).map(player => ({
      ...player,
      // Heal players for the new map
      health: player.maxHealth,
      energy: player.maxEnergy,
      // Replenish some ammo
      ammo: {
        ...player.ammo,
        primary: Math.min(player.ammo.primary + 30, player.ammo.maxPrimary),
        secondary: Math.min(player.ammo.secondary + 15, player.ammo.maxSecondary)
      },
      // Reset position for the new map
      x: 0,
      y: 0,
      logs: [...player.logs, `Entered a new area of the city.`]
    }));
    
    // Generate new map with different parameters
    const newMapLevel = gameState.mapLevel + 1;
    
    // Clear current game state
    setMap([]);
    setEnemies([]);
    setAmmoCaches([]);
    setSpawners([]);
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      mapLevel: newMapLevel,
      gameStatus: 'preparing',
      canTransition: false
    }));
    
    // Generate new map with players positioned in center
    generateMap();
    
    // Position players in the new map's center
    setPlayers(survivingPlayers.map(player => ({
      ...player,
      x: Math.floor(mapWidth / 2) + Math.floor(Math.random() * 5) - 2,
      y: Math.floor(mapHeight / 2) + Math.floor(Math.random() * 5) - 2
    })));
    
    // Setup new spawners
    setupSpawners();
    placeAmmoCaches();
    
    // Global announcement
    addGlobalLog(`Welcome to Area ${newMapLevel} of the City of the Damned!`);
    addGlobalLog(`The threats here are stronger, but so are the rewards...`);
  };
  
  // End the game
  const endGame = (survived: boolean) => {
    if (survived) {
      addGlobalLog(`VICTORY! The survivors have escaped the City of the Damned!`);
      
      // Display stats
      players.filter(p => p.isAlive).forEach(player => {
        addGlobalLog(`${player.name}: ${player.kills} kills, survived ${gameState.wave} waves`);
      });
    } else {
      addGlobalLog(`DEFEAT! All survivors have perished in the City of the Damned.`);
    }
    
    setGameState(prev => ({
      ...prev,
      gameStatus: 'completed'
    }));
  };

  // Reposition spawners
  const repositionSpawners = () => {
    setSpawners(prev => {
      return prev.map(spawner => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.min(mapWidth, mapHeight) * 0.3;
        
        const newX = Math.floor(mapWidth / 2 + Math.cos(angle) * distance);
        const newY = Math.floor(mapHeight / 2 + Math.sin(angle) * distance);
        
        return {
          ...spawner,
          x: Math.max(1, Math.min(mapWidth - 2, newX)),
          y: Math.max(1, Math.min(mapHeight - 2, newY))
        };
      });
    });
    
    addGlobalLog('Enemy spawners have relocated!');
  };

  // Auto-heal players during day
  const autoHealPlayers = (deltaTime: number) => {
    // Only heal during day
    if (gameState.time === 'day') {
      setPlayers(prev => prev.map(player => {
        if (player.isAlive && player.health < player.maxHealth) {
          return {
            ...player,
            health: Math.min(player.health + 3 * deltaTime, player.maxHealth)
          };
        }
        return player;
      }));
    }
  };

  // Main game loop
  const gameLoop = () => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
    lastUpdateTimeRef.current = now;
    
    // Process all players
    players.forEach(player => {
      // Process player input for human-controlled players
      if (player.isHuman && player.isAlive) {
        // If this is the active player, process keyboard input
        if (activePlayer && player.id === activePlayer.id) {
          if (keysPressed.current.has('w')) movePlayer(player, 0, -1);
          if (keysPressed.current.has('s')) movePlayer(player, 0, 1);
          if (keysPressed.current.has('a')) movePlayer(player, -1, 0);
          if (keysPressed.current.has('d')) movePlayer(player, 1, 0);
          if (keysPressed.current.has('1')) switchWeapon(player, 'primary');
          if (keysPressed.current.has('2')) switchWeapon(player, 'secondary');
          if (keysPressed.current.has('3')) switchWeapon(player, 'melee');
          if (keysPressed.current.has(' ')) fireWeapon(player);
        }
      }
    });
    
    // Update visibility
    updateVisibility();
    
    // Update AI for non-human players
    updateAI(deltaTime);
    
    // Update day/night cycle
    updateDayNightCycle(deltaTime);
    
    // Auto-heal players
    autoHealPlayers(deltaTime);
    
    // Update debug info
    setDebugInfo(`FPS: ${Math.round(1 / deltaTime)} | Enemies: ${enemies.length} | Wave: ${gameState.wave}`);
    
    // Continue game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // Render functions
  const renderCell = (cell: Cell, x: number, y: number) => {
    const playerAtCell = players.find(p => p.isAlive && p.x === x && p.y === y);
    const npcAtCell = npcs.find(npc => npc.x === x && npc.y === y);
    const enemyAtCell = enemies.find(enemy => enemy.x === x && enemy.y === y);
    const ammoCacheAtCell = ammoCaches.find(cache => cache.x === x && cache.y === y);
    const spawnerAtCell = spawners.find(spawner => spawner.x === x && spawner.y === y && spawner.active);
    
    // Default cell color
    let backgroundColor = 'bg-gray-800'; // Unexplored
    let content = null;
    
    if (cell.visible) {
      // Visible cells
      switch (cell.type) {
        case 'wall':
          backgroundColor = 'bg-gray-700';
          break;
        case 'floor':
          backgroundColor = gameState.time === 'day' ? 'bg-gray-200' : 'bg-gray-400';
          break;
        case 'cover':
          backgroundColor = 'bg-gray-500';
          break;
        default:
          backgroundColor = 'bg-gray-300';
      }
      
      // Render entities
      if (playerAtCell) {
        content = <div className="w-full h-full bg-blue-500 rounded-full"></div>;
      } else if (npcAtCell) {
        content = <div className="w-full h-full bg-green-500 rounded-full"></div>;
      } else if (enemyAtCell) {
        let enemyColor;
        switch(enemyAtCell.type) {
          case 'melee':
            enemyColor = 'bg-red-500';
            break;
          case 'ranged':
            enemyColor = 'bg-yellow-500';
            break;
          case 'tank':
            enemyColor = 'bg-orange-600';
            break;
          case 'boss':
            enemyColor = 'bg-purple-600';
            break;
          default:
            enemyColor = 'bg-red-500';
        }
        content = <div className={`w-full h-full ${enemyColor} rounded-full`}></div>;
      } else if (ammoCacheAtCell) {
        content = 
          <div className="w-full h-full flex items-center justify-center">
            <Package2 size={12} className="text-yellow-400" />
          </div>;
      } else if (spawnerAtCell) {
        content = 
          <div className="w-full h-full flex items-center justify-center">
            <Skull size={12} className="text-red-500" />
          </div>;
      }
    } else if (cell.explored) {
      // Explored but not visible
      switch (cell.type) {
        case 'wall':
          backgroundColor = 'bg-gray-700';
          break;
        case 'floor':
          backgroundColor = 'bg-gray-600';
          break;
        case 'cover':
          backgroundColor = 'bg-gray-500';
          break;
        default:
          backgroundColor = 'bg-gray-600';
      }
    }
    
    return (
      <div 
        key={`${x}-${y}`} 
        className={`w-${cellSize}px h-${cellSize}px ${backgroundColor} border border-gray-900`}
        style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
      >
        {content}
      </div>
    );
  };

  // Render health bar
  const renderHealthBar = (current: number, max: number, color: string) => {
    const percentage = (current / max) * 100;
    return (
      <div className="w-full h-2 bg-gray-300 rounded">
        <div
          className={`h-full ${color} rounded`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  // Handle add player form submission
  const handleAddPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pendingPlayerName.trim() === '') {
      alert('Please enter a name for the new player');
      return;
    }
    
    const success = addNewPlayer(pendingPlayerName.trim(), false);
    
    if (success) {
      setPendingPlayerName('');
      setShowAddPlayerModal(false);
    }
  };

  // Main render
  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header - Game status */}
      <div className="flex justify-between mb-4 items-center">
        <div className="flex items-center gap-2">
          {gameState.time === 'day' ? (
            <Sun className="text-yellow-500" />
          ) : (
            <Moon className="text-blue-300" />
          )}
          <span className="font-bold">Day {gameState.day}</span>
          {gameState.time === 'day' && (
            <span className="text-sm text-gray-600">
              Night in: {Math.floor(gameState.waveTimer)}s
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Clock className="text-gray-500" />
          <span>Wave {gameState.wave}</span>
          <span className="ml-2">Kills: {gameState.enemiesKilled}</span>
        </div>
      </div>
      
      {/* Main game area */}
      <div className="flex h-full">
        {/* Left section - Player list and game controls */}
        <div className="w-64 mr-4">
          <div className="bg-gray-100 p-3 rounded mb-4">
            <div className="text-lg font-bold mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="mr-2 text-blue-500" size={18} />
                Survivors ({players.filter(p => p.isAlive).length})
              </div>
              <button 
                onClick={() => setShowAddPlayerModal(true)}
                className="text-blue-500 hover:text-blue-700"
                title="Add AI Survivor"
              >
                <UserPlus size={18} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.filter(p => p.isAlive).map((player, index) => (
                <div 
                  key={player.id} 
                  className={`p-2 rounded ${activePlayerIndex === index ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-200'}`}
                  onClick={() => setActivePlayerIndex(index)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-xs">{player.isHuman ? '👤' : '🤖'}</span>
                  </div>
                  <div className="text-xs text-gray-600">HP: {Math.floor(player.health)}/{player.maxHealth}</div>
                  <div className="text-xs text-gray-600">Kills: {player.kills}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-between">
              <button 
                onClick={prevPlayer}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={nextPlayer}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          {/* Global combat log */}
          <div className="bg-gray-800 p-3 rounded text-white">
            <div className="mb-2 font-bold border-b border-gray-700 pb-1">
              <span>City Log</span>
            </div>
            <div className="text-sm max-h-48 overflow-y-auto">
              {globalLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Center - Game area */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            className="border border-gray-300 p-2 bg-gray-800 overflow-auto h-[600px]"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          >
            <div 
              className="grid grid-flow-row" 
              style={{ gridTemplateColumns: `repeat(${mapWidth}, ${cellSize}px)` }}
            >
              {map.map((row, y) => 
                row.map((cell, x) => renderCell(cell, x, y))
              )}
            </div>
          </div>
        </div>
        
        {/* Right side - Current player info */}
        <div className="w-64 ml-4">
          {activePlayer ? (
            <>
              {/* Player info */}
              <div className="bg-gray-100 p-3 rounded mb-4">
                <div className="text-lg font-bold mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="mr-2 text-blue-500" size={18} />
                    {activePlayer.name}
                  </div>
                  <div className="flex items-center text-sm">
                    <span className={`font-semibold ${activePlayer.isHuman ? 'text-blue-500' : 'text-green-500'}`}>
                      {activePlayer.isHuman ? 'Human' : 'AI'}
                    </span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Health:</span>
                    <span>{Math.floor(activePlayer.health)}/{activePlayer.maxHealth}</span>
                  </div>
                  {renderHealthBar(activePlayer.health, activePlayer.maxHealth, 'bg-red-500')}
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Energy:</span>
                    <span>{Math.floor(activePlayer.energy)}/{activePlayer.maxEnergy}</span>
                  </div>
                  {renderHealthBar(activePlayer.energy, activePlayer.maxEnergy, 'bg-blue-500')}
                </div>
                
                <div className="text-sm mb-1">Ammo:</div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Primary: {activePlayer.ammo.primary}/{activePlayer.ammo.maxPrimary}</span>
                  <span className="text-xs">Secondary: {activePlayer.ammo.secondary}/{activePlayer.ammo.maxSecondary}</span>
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold">Kills: {activePlayer.kills}</span>
                  {activePlayer.isHuman ? (
                    <button 
                      onClick={() => releaseControl(activePlayer)}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Release Control
                    </button>
                  ) : (
                    <button 
                      onClick={() => takeControl(activePlayer)}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Take Control
                    </button>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {activePlayer.isHuman ? 'Press ESC to return control to AI' : ''}
                </div>
              </div>
              
              {/* Weapon selection */}
              <div className="bg-gray-100 p-3 rounded mb-4">
                <div className="text-lg font-bold mb-2 flex items-center">
                  <Crosshair className="mr-2 text-gray-700" size={18} />
                  Weapons
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => activePlayer.isHuman && switchWeapon(activePlayer, 'primary')}
                    className={`flex items-center justify-between px-3 py-2 border rounded ${
                      activePlayer.weapons.currentWeapon === 'primary' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-200'
                    }`}
                    disabled={!activePlayer.isHuman}
                  >
                    <div className="flex items-center">
                      {activePlayer.weapons.primary.icon}
                      <span className="ml-2 text-sm">{activePlayer.weapons.primary.name}</span>
                    </div>
                    <span className="text-xs">{activePlayer.weapons.primary.damage} dmg</span>
                  </button>
                  
                  <button
                    onClick={() => activePlayer.isHuman && switchWeapon(activePlayer, 'secondary')}
                    className={`flex items-center justify-between px-3 py-2 border rounded ${
                      activePlayer.weapons.currentWeapon === 'secondary' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-200'
                    }`}
                    disabled={!activePlayer.isHuman}
                  >
                    <div className="flex items-center">
                      {activePlayer.weapons.secondary.icon}
                      <span className="ml-2 text-sm">{activePlayer.weapons.secondary.name}</span>
                    </div>
                    <span className="text-xs">{activePlayer.weapons.secondary.damage} dmg</span>
                  </button>
                  
                  <button
                    onClick={() => activePlayer.isHuman && switchWeapon(activePlayer, 'melee')}
                    className={`flex items-center justify-between px-3 py-2 border rounded ${
                      activePlayer.weapons.currentWeapon === 'melee' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-200'
                    }`}
                    disabled={!activePlayer.isHuman}
                  >
                    <div className="flex items-center">
                      {activePlayer.weapons.melee.icon}
                      <span className="ml-2 text-sm">{activePlayer.weapons.melee.name}</span>
                    </div>
                    <span className="text-xs">{activePlayer.weapons.melee.damage} dmg</span>
                  </button>
                </div>
              </div>
              
              {/* Player logs */}
              <div className="bg-gray-800 p-3 rounded text-white">
                <div className="mb-2 font-bold border-b border-gray-700 pb-1">
                  <span>{activePlayer.name}'s Log</span>
                </div>
                <div className="text-sm max-h-48 overflow-y-auto">
                  {activePlayer.logs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-100 p-3 rounded text-center">
              <p>No active player selected</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Game controls */}
      <div className="mt-4 flex justify-center gap-4">
        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
          <strong>Controls:</strong> WASD to move, 1-2-3 to switch weapons, Space to fire, Click to move/attack
        </div>
      </div>
      
      {/* Map transition UI */}
      {gameState.gameStatus === 'transition' && gameState.canTransition && activePlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-white max-w-lg">
            <h3 className="text-2xl font-bold mb-4 text-center">Wave {gameState.wave} Completed!</h3>
            <p className="mb-6 text-center">
              You've cleared wave {gameState.wave}. The path ahead leads deeper into the City of the Damned, 
              but you could also escape with your life while you have the chance.
            </p>
            
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Current Votes:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-900 p-3 rounded">
                  <p className="text-center font-bold">Continue</p>
                  <p className="text-center text-3xl">
                    {Object.values(gameState.transitionVotes).filter(v => v === 'continue').length}
                  </p>
                </div>
                <div className="bg-red-900 p-3 rounded">
                  <p className="text-center font-bold">Escape</p>
                  <p className="text-center text-3xl">
                    {Object.values(gameState.transitionVotes).filter(v => v === 'exit').length}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Check if player has already voted */}
            {activePlayer.id in gameState.transitionVotes ? (
              <div className="text-center p-3 bg-blue-700 rounded">
                <p>You voted to {gameState.transitionVotes[activePlayer.id] === 'continue' ? 'continue' : 'escape'}.</p>
                <p className="text-sm mt-2">Waiting for other survivors to vote...</p>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => handleTransitionVote(activePlayer.id, 'continue')}
                  className="px-6 py-3 bg-green-700 text-white rounded hover:bg-green-600 transition"
                >
                  Continue to Next Area
                </button>
                <button 
                  onClick={() => handleTransitionVote(activePlayer.id, 'exit')}
                  className="px-6 py-3 bg-red-700 text-white rounded hover:bg-red-600 transition"
                >
                  Escape with Your Life
                </button>
              </div>
            )}
            
            <p className="mt-4 text-sm text-gray-400 text-center">
              Decision will be based on majority vote. Players who have died cannot vote.
            </p>
          </div>
        </div>
      )}
      
      {/* Add player modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-4">Add AI Survivor</h3>
            <form onSubmit={handleAddPlayerSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={pendingPlayerName}
                  onChange={(e) => setPendingPlayerName(e.target.value)}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Debug info */}
      <div className="fixed bottom-0 left-0 text-xs text-gray-500 bg-white bg-opacity-50 px-2">
        {debugInfo}
      </div>
    </div>
  );
  
  // Spawn a regular enemy
  const spawnEnemy = (spawner: Spawner) => {
    // Define enemy types and base stats
    const enemyTypes = {
      'melee': {
        damage: 10,
        attackRange: 1,
        attackSpeed: 1,
        detectionRange: 8,
        health: 50,
        maxHealth: 50
      },
      'ranged': {
        damage: 8,
        attackRange: 5,
        attackSpeed: 0.5,
        detectionRange: 10,
        health: 30,
        maxHealth: 30
      },
      'tank': {
        damage: 15,
        attackRange: 1,
        attackSpeed: 0.7,
        detectionRange: 7,
        health: 100,
        maxHealth: 100
      },
      'boss': {
        damage: 25,
        attackRange: 3,
        attackSpeed: 0.8,
        detectionRange: 12,
        health: 200,
        maxHealth: 200
      }
    };
    
    const enemyType = spawner.enemyType;
    const enemyData = enemyTypes[enemyType];
    
    // Create enemy with stats based on current wave/day
    const waveMultiplier = 1 + (gameState.wave - 1) * 0.2;
    const newEnemy: Enemy = {
      id: Date.now(),
      x: spawner.x,
      y: spawner.y,
      health: Math.floor(enemyData.health * waveMultiplier),
      maxHealth: Math.floor(enemyData.maxHealth * waveMultiplier),
      damage: Math.floor(enemyData.damage * waveMultiplier),
      attackRange: enemyData.attackRange,
      attackSpeed: enemyData.attackSpeed,
      type: enemyType,
      behavior: Math.random() < 0.7 ? 'aggressive' : 'defensive',
      lastAttackTime: 0,
      detectionRange: enemyData.detectionRange
    };
    
    // Add patrol behavior for some enemies
    if (Math.random() < 0.3) {
      newEnemy.behavior = 'patrol';
      newEnemy.movementPattern = {
        path: generatePatrolPath(spawner.x, spawner.y),
        currentPathIndex: 0
      };
    }
    
    setEnemies(prev => [...prev, newEnemy]);
    addGlobalLog(`${enemyType} enemy spawned!`);
  };

  // Generate a patrol path for enemies
  const generatePatrolPath = (startX: number, startY: number): {x: number, y: number}[] => {
    const path: {x: number, y: number}[] = [];
    const pathLength = 4 + Math.floor(Math.random() * 4); // 4-7 points in path
    
    // Start with the spawner location
    path.push({x: startX, y: startY});
    
    // Generate random points around the start point
    for (let i = 0; i < pathLength; i++) {
      const lastPoint = path[path.length - 1];
      const radius = 3 + Math.floor(Math.random() * 5); // 3-7 distance
      const angle = (Math.PI * 2 / pathLength) * i;
      
      const newX = Math.floor(startX + Math.cos(angle) * radius);
      const newY = Math.floor(startY + Math.sin(angle) * radius);
      
      // Make sure point is within map bounds and not in a wall
      if (
        newX >= 1 && newX < mapWidth - 1 && 
        newY >= 1 && newY < mapHeight - 1 && 
        map[newY][newX].type !== 'wall'
      ) {
        path.push({x: newX, y: newY});
      } else {
        // If point is invalid, try a closer point
        const fallbackX = Math.floor(startX + Math.cos(angle) * 2);
        const fallbackY = Math.floor(startY + Math.sin(angle) * 2);
        
        if (
          fallbackX >= 1 && fallbackX < mapWidth - 1 && 
          fallbackY >= 1 && fallbackY < mapHeight - 1 && 
          map[fallbackY][fallbackX].type !== 'wall'
        ) {
          path.push({x: fallbackX, y: fallbackY});
        } else {
          // If all fails, just duplicate the last point
          path.push({...lastPoint});
        }
      }
    }
    
    // Close the loop by adding first point again
    path.push({x: startX, y: startY});
    
    return path;
  };

  // Spawn a boss enemy
  const spawnBossEnemy = (spawner: Spawner) => {
    const boss = createBoss(spawner.x, spawner.y, gameState.wave);
    setEnemies(prev => [...prev, boss as unknown as Enemy]);
    
    // Global announcement
    addGlobalLog(`⚠️ WARNING: BOSS APPEARED! The ${boss.bossType} has arrived!`);
    
    // Spawn minions around the boss
    const numMinions = Math.min(3, Math.floor(gameState.wave / 5));
    
    for (let i = 0; i < numMinions; i++) {
      const angle = (Math.PI * 2 / numMinions) * i;
      const distance = 2;
      
      const minionX = Math.floor(boss.x + Math.cos(angle) * distance);
      const minionY = Math.floor(boss.y + Math.sin(angle) * distance);
      
      // Check if position is valid
      if (
        minionX >= 1 && minionX < mapWidth - 1 && 
        minionY >= 1 && minionY < mapHeight - 1 && 
        map[minionY][minionX].type !== 'wall'
      ) {
        // Create a minion (weaker enemy)
        const minion: Enemy = {
          id: Date.now() + i + 1000,
          x: minionX,
          y: minionY,
          health: 30,
          maxHealth: 30,
          damage: 5,
          attackRange: 1,
          attackSpeed: 1,
          type: 'melee',
          behavior: 'aggressive',
          lastAttackTime: 0,
          detectionRange: 8
        };
        
        setEnemies(prev => [...prev, minion]);
      }
    }
  };

  // Spawn a hostile AI player
  const spawnHostileAI = (spawner: HostileSpawner) => {
    const typedSpawner = spawner as {
      x: number;
      y: number;
      id: number;
      hostileAIType: 'normal' | 'elite' | 'boss';
      weapons: Weapon[];
    };
    
    const hostilePlayer = createHostileAIPlayer(
      typedSpawner.x,
      typedSpawner.y,
      typedSpawner.id,
      typedSpawner.hostileAIType,
      typedSpawner.weapons
    );
    
    // Add to players array
    setPlayers(prev => [...prev, hostilePlayer]);
    
    // Announcement
    addGlobalLog(`⚠️ Hostile survivor ${hostilePlayer.name} spotted with a ${hostilePlayer.weapons.primary.name}!`);
  };
};

export default CityOfTheDamned;
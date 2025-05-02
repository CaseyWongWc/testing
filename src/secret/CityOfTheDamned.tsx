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
  gameStatus: 'preparing' | 'wave' | 'completed';
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
  const [selectedWeapon, setSelectedWeapon] = useState<'primary' | 'secondary' | 'melee'>('primary');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [playerNames] = useState<string[]>([
    'Alex', 'Bailey', 'Casey', 'Dakota', 'Ellis', 
    'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan'
  ]);
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
    gameStatus: 'preparing'
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
  
  // Create a new player
  const createPlayer = (name: string, isHuman: boolean, x?: number, y?: number): Player => {
    const playerX = x ?? Math.floor(Math.random() * (mapWidth - 6)) + 3;
    const playerY = y ?? Math.floor(Math.random() * (mapHeight - 6)) + 3;
    
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
        primary: {
          name: 'Assault Rifle',
          damage: 15,
          range: 8,
          fireRate: 5,
          isAutomatic: true,
          ammoType: 'primary',
          lastFiredTime: 0,
          icon: <Crosshair size={16} />
        },
        secondary: {
          name: 'Pistol',
          damage: 25,
          range: 5,
          fireRate: 2,
          isAutomatic: false,
          ammoType: 'secondary',
          lastFiredTime: 0,
          icon: <Target size={16} />
        },
        melee: {
          name: 'Combat Knife',
          damage: 40,
          range: 1,
          fireRate: 1.5,
          isAutomatic: false,
          ammoType: 'melee',
          lastFiredTime: 0,
          icon: <Zap size={16} />
        },
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

  // Map generation
  const generateMap = () => {
    const newMap: Cell[][] = [];
    
    // Initialize with floors
    for (let y = 0; y < mapHeight; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < mapWidth; x++) {
        const isWall = 
          x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1 || 
          (Math.random() < 0.08 && x > 5 && y > 5 && x < mapWidth - 5 && y < mapHeight - 5);
        
        row.push({
          x,
          y,
          type: isWall ? 'wall' : 'floor',
          visible: false,
          explored: false
        });
      }
      newMap.push(row);
    }
    
    // Add some cover
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(Math.random() * (mapWidth - 4)) + 2;
      const y = Math.floor(Math.random() * (mapHeight - 4)) + 2;
      
      if (newMap[y][x].type === 'floor') {
        newMap[y][x].type = 'cover';
      }
    }
    
    setMap(newMap);
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
    const newSpawners: Spawner[] = [];
    
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
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
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
    
    setPlayers(prev => prev.map(p => {
      if (p.id === player.id) {
        return {
          ...p,
          weapons: {
            ...p.weapons,
            currentWeapon: weaponType
          }
        };
      }
      return p;
    }));
    
    if (player.id === activePlayer?.id) {
      setSelectedWeapon(weaponType);
    }
    
    addPlayerLog(player, `Switched to ${player.weapons[weaponType].name}`);
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
      // Skip human players and dead players
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

  // Update spawners
  const updateSpawners = () => {
    const now = Date.now();
    
    // Activate spawners at night
    const shouldActivate = gameState.time === 'night';
    
    setSpawners(prev => {
      return prev.map(spawner => {
        if (shouldActivate && spawner.active) {
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

  // Update day/night cycle
  const updateDayNightCycle = (deltaTime: number) => {
    setGameState(prev => {
      const newTimeElapsed = prev.timeElapsed + deltaTime;
      const cycleLength = 180; // 3 minute day/night cycle
      const dayLength = 120; // 2 minutes of day
      // const nightLength = 60; // 1 minute of night - calculated from cycle - day
      
      let newTime = prev.time;
      let newDay = prev.day;
      let newWave = prev.wave;
      let newWaveTimer = prev.waveTimer;
      
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
    
    // Process player input for human player
    if (activePlayer?.isHuman && activePlayer?.isAlive) {
      if (keysPressed.current.has('w')) movePlayer(activePlayer, 0, -1);
      if (keysPressed.current.has('s')) movePlayer(activePlayer, 0, 1);
      if (keysPressed.current.has('a')) movePlayer(activePlayer, -1, 0);
      if (keysPressed.current.has('d')) movePlayer(activePlayer, 1, 0);
      if (keysPressed.current.has('1')) switchWeapon(activePlayer, 'primary');
      if (keysPressed.current.has('2')) switchWeapon(activePlayer, 'secondary');
      if (keysPressed.current.has('3')) switchWeapon(activePlayer, 'melee');
      if (keysPressed.current.has(' ')) fireWeapon(activePlayer);
    }
    
    // Update visibility
    updateVisibility();
    
    // Update AI
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
                <div className="text-lg font-bold mb-2 flex items-center">
                  <Shield className="mr-2 text-blue-500" size={18} />
                  {activePlayer.name}
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
                
                <div className="mt-3 text-sm font-semibold">Kills: {activePlayer.kills}</div>
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
};

export default CityOfTheDamned;
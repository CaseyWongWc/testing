import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Shield, Zap, Target, Clock, BarChart2, Skull, Package2, Crosshair } from 'lucide-react';

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
}

interface NonPlayerCharacter extends Entity {
  role: 'ally' | 'civilian';
  behavior: 'follow' | 'defend' | 'explore';
  visibilityRange: number;
  status: string;
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

// Component
const CombatInterface: React.FC = () => {
  // Map configuration
  const mapWidth = 50;
  const mapHeight = 40;
  const cellSize = 18;
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    time: 'day',
    timeElapsed: 0,
    wave: 1,
    enemiesKilled: 0,
    waveTimer: 120, // 2 minutes per wave
    gameStatus: 'preparing'
  });

  // Map generation
  const [map, setMap] = useState<Cell[][]>([]);
  
  // Entities
  const [player, setPlayer] = useState<Player>({
    id: 1,
    x: Math.floor(mapWidth / 2),
    y: Math.floor(mapHeight / 2),
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
    visibilityRange: 12
  });

  const [npcs, setNpcs] = useState<NonPlayerCharacter[]>([
    {
      id: 2,
      x: Math.floor(mapWidth / 2) - 2,
      y: Math.floor(mapHeight / 2) - 2,
      health: 80,
      maxHealth: 80,
      role: 'ally',
      behavior: 'follow',
      visibilityRange: 10,
      status: 'Following you',
      type: 'npc'
    }
  ]);

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [ammoCaches, setAmmoCaches] = useState<AmmoCache[]>([]);
  const [spawners, setSpawners] = useState<Spawner[]>([]);
  // Future implementation will use projectiles
  // const [projectiles, setProjectiles] = useState<any[]>([]);

  // UI state
  const [selectedWeapon, setSelectedWeapon] = useState<'primary' | 'secondary' | 'melee'>('primary');
  const [logs, setLogs] = useState<string[]>(['Combat initiated. Prepare for incoming waves.']);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Game loop ref
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const keysPressed = useRef<Set<string>>(new Set());

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

  // Game initialization
  const initializeGame = () => {
    generateMap();
    placeAmmoCaches();
    setupSpawners();
    addLog('Game initialized. Wave 1 begins soon.');
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
    updateVisibility(newMap, player, npcs);
  };

  // Place ammo caches
  const placeAmmoCaches = () => {
    const caches: AmmoCache[] = [];
    
    for (let i = 0; i < 8; i++) {
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
  const updateVisibility = (currentMap: Cell[][], currentPlayer: Player, currentNpcs: NonPlayerCharacter[]) => {
    const newMap = JSON.parse(JSON.stringify(currentMap)) as Cell[][];
    
    // Reset visibility
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        newMap[y][x].visible = false;
      }
    }
    
    // Update from player's view
    updateEntityVisibility(newMap, currentPlayer);
    
    // Update from NPCs' view
    currentNpcs.forEach(npc => {
      updateEntityVisibility(newMap, npc);
    });
    
    setMap(newMap);
  };

  // Update entity visibility (for both player and NPCs)
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
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysPressed.current.delete(e.key.toLowerCase());
  };

  // Move player
  const movePlayer = (dx: number, dy: number) => {
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    // Check if the player can move to the new position
    if (
      newX >= 0 && newX < mapWidth && 
      newY >= 0 && newY < mapHeight && 
      map[newY][newX].type !== 'wall'
    ) {
      setPlayer(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
      
      // Check for ammo caches
      const ammoCache = ammoCaches.find(cache => cache.x === newX && cache.y === newY);
      if (ammoCache) {
        collectAmmo(ammoCache);
      }
    }
  };

  // Switch weapon
  const switchWeapon = (weaponType: 'primary' | 'secondary' | 'melee') => {
    setPlayer(prev => ({
      ...prev,
      weapons: {
        ...prev.weapons,
        currentWeapon: weaponType
      }
    }));
    setSelectedWeapon(weaponType);
    addLog(`Switched to ${player.weapons[weaponType].name}`);
  };

  // Collect ammo
  const collectAmmo = (cache: AmmoCache) => {
    setPlayer(prev => {
      const newAmmo = {...prev.ammo};
      
      if (cache.ammoType === 'primary') {
        newAmmo.primary = Math.min(prev.ammo.primary + cache.amount, prev.ammo.maxPrimary);
      } else {
        newAmmo.secondary = Math.min(prev.ammo.secondary + cache.amount, prev.ammo.maxSecondary);
      }
      
      return {
        ...prev,
        ammo: newAmmo
      };
    });
    
    setAmmoCaches(prev => prev.filter(c => c.id !== cache.id));
    addLog(`Collected ${cache.amount} ${cache.ammoType} ammo`);
  };

  // Fire weapon
  const fireWeapon = () => {
    const currentWeapon = player.weapons.currentWeapon;
    const weapon = player.weapons[currentWeapon];
    const now = Date.now();
    
    // Check cooldown
    if (now - weapon.lastFiredTime < 1000 / weapon.fireRate) {
      return;
    }
    
    // Check ammo
    if (weapon.ammoType !== 'melee' && player.ammo[weapon.ammoType] <= 0) {
      addLog(`Out of ${weapon.ammoType} ammo!`);
      return;
    }
    
    // Update weapon last fired time
    setPlayer(prev => ({
      ...prev,
      weapons: {
        ...prev.weapons,
        [currentWeapon]: {
          ...prev.weapons[currentWeapon],
          lastFiredTime: now
        }
      },
      // Reduce ammo if not melee
      ammo: weapon.ammoType !== 'melee' ? {
        ...prev.ammo,
        [weapon.ammoType]: prev.ammo[weapon.ammoType] - 1
      } : prev.ammo
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
      hitEnemy(closest.id, weapon.damage);
      addLog(`Hit ${closest.type} for ${weapon.damage} damage`);
    } else {
      addLog(`Fired ${weapon.name} but missed!`);
    }
  };

  // Hit enemy
  const hitEnemy = (enemyId: number, damage: number) => {
    setEnemies(prev => {
      return prev.map(enemy => {
        if (enemy.id === enemyId) {
          const newHealth = Math.max(0, enemy.health - damage);
          
          if (newHealth === 0) {
            setPlayer(p => ({
              ...p,
              kills: p.kills + 1
            }));
            
            setGameState(gs => ({
              ...gs,
              enemiesKilled: gs.enemiesKilled + 1
            }));
            
            addLog(`Killed ${enemy.type} enemy!`);
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
  const addLog = (message: string) => {
    setLogs(prev => {
      const newLogs = [...prev, message];
      if (newLogs.length > 5) {
        return newLogs.slice(newLogs.length - 5);
      }
      return newLogs;
    });
  };

  // Update AI
  const updateAI = (deltaTime: number) => {
    // Update NPCs
    updateNPCs(deltaTime);
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Update spawners
    updateSpawners(deltaTime);
  };

  // Update NPCs
  const updateNPCs = (deltaTime: number) => {
    setNpcs(prev => {
      return prev.map(npc => {
        if (npc.behavior === 'follow') {
          // Follow player, but keep some distance
          const dx = player.x - npc.x;
          const dy = player.y - npc.y;
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
                status: 'Following player'
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
        }
        
        // Auto-healing for NPCs
        if (npc.health < npc.maxHealth) {
          return {
            ...npc,
            health: Math.min(npc.health + 5 * deltaTime, npc.maxHealth)
          };
        }
        
        return npc;
      });
    });
  };

  // Update enemies
  const updateEnemies = (_deltaTime: number) => {
    setEnemies(prev => {
      return prev.map(enemy => {
        // Skip dead enemies
        if (enemy.health <= 0) return enemy;
        
        const now = Date.now();
        let newX = enemy.x;
        let newY = enemy.y;
        let newBehavior = enemy.behavior;
        
        // Calculate distance to player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if enemy can see player
        const canSeePlayer = distance <= enemy.detectionRange && 
                            hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y);
        
        if (canSeePlayer) {
          // Switch to aggressive mode if player spotted
          newBehavior = 'aggressive';
          
          // If in range, attack
          if (distance <= enemy.attackRange) {
            // Check attack cooldown
            if (now - enemy.lastAttackTime > 1000 / enemy.attackSpeed) {
              // Attack player
              setPlayer(p => ({
                ...p,
                health: Math.max(0, p.health - enemy.damage)
              }));
              
              addLog(`${enemy.type} enemy hit you for ${enemy.damage} damage!`);
              
              return {
                ...enemy,
                behavior: newBehavior,
                lastAttackTime: now
              };
            }
          } else {
            // Move towards player
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
          // In a real game, this would be more sophisticated
          
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
  const updateSpawners = (_deltaTime: number) => {
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
            addLog(`${enemyType} enemy spawned!`);
            
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
        addLog('Night has fallen. Enemies are more dangerous now!');
        
        // Reposition spawners at night
        repositionSpawners();
      } else if (prev.time === 'night' && newTimeElapsed >= cycleLength) {
        // Transition to day
        newTime = 'day';
        newDay = prev.day + 1;
        newWave = prev.wave + 1;
        newWaveTimer = 120; // Reset wave timer
        
        addLog(`Day ${newDay} has begun. Wave ${newWave} incoming!`);
        
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
          addLog('Night is coming soon. Prepare your defenses!');
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
    
    addLog('Enemy spawners have relocated!');
  };

  // Auto-heal player
  const autoHealPlayer = (deltaTime: number) => {
    // Only heal during day
    if (gameState.time === 'day') {
      setPlayer(prev => {
        if (prev.health < prev.maxHealth) {
          return {
            ...prev,
            health: Math.min(prev.health + 5 * deltaTime, prev.maxHealth)
          };
        }
        return prev;
      });
    }
  };

  // Main game loop
  const gameLoop = () => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
    lastUpdateTimeRef.current = now;
    
    // Process player input
    if (keysPressed.current.has('w')) movePlayer(0, -1);
    if (keysPressed.current.has('s')) movePlayer(0, 1);
    if (keysPressed.current.has('a')) movePlayer(-1, 0);
    if (keysPressed.current.has('d')) movePlayer(1, 0);
    if (keysPressed.current.has('1')) switchWeapon('primary');
    if (keysPressed.current.has('2')) switchWeapon('secondary');
    if (keysPressed.current.has('3')) switchWeapon('melee');
    if (keysPressed.current.has(' ')) fireWeapon();
    
    // Update visibility
    updateVisibility(map, player, npcs);
    
    // Update AI
    updateAI(deltaTime);
    
    // Update day/night cycle
    updateDayNightCycle(deltaTime);
    
    // Auto-heal player
    autoHealPlayer(deltaTime);
    
    // Update debug info
    setDebugInfo(`FPS: ${Math.round(1 / deltaTime)} | Enemies: ${enemies.length} | Wave: ${gameState.wave}`);
    
    // Continue game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  // Render functions
  const renderCell = (cell: Cell, x: number, y: number) => {
    const playerAtCell = player.x === x && player.y === y;
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

  return (
    <div className="p-4 flex flex-col h-full">
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
      
      <div className="flex">
        {/* Left side - game area */}
        <div className="flex-1">
          <div className="border border-gray-300 p-2 bg-gray-800 overflow-auto">
            <div className="grid grid-flow-row" style={{ gridTemplateColumns: `repeat(${mapWidth}, ${cellSize}px)` }}>
              {map.map((row, y) => 
                row.map((cell, x) => renderCell(cell, x, y))
              )}
            </div>
          </div>
        </div>
        
        {/* Right side - UI */}
        <div className="w-64 ml-4">
          {/* Player info */}
          <div className="bg-gray-100 p-3 rounded mb-4">
            <div className="text-lg font-bold mb-2 flex items-center">
              <Shield className="mr-2 text-blue-500" size={18} />
              Player
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Health:</span>
                <span>{player.health}/{player.maxHealth}</span>
              </div>
              {renderHealthBar(player.health, player.maxHealth, 'bg-red-500')}
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Energy:</span>
                <span>{player.energy}/{player.maxEnergy}</span>
              </div>
              {renderHealthBar(player.energy, player.maxEnergy, 'bg-blue-500')}
            </div>
            
            <div className="text-sm mb-1">Ammo:</div>
            <div className="flex justify-between mb-1">
              <span className="text-xs">Primary: {player.ammo.primary}/{player.ammo.maxPrimary}</span>
              <span className="text-xs">Secondary: {player.ammo.secondary}/{player.ammo.maxSecondary}</span>
            </div>
            
            <div className="mt-3 text-sm font-semibold">Kills: {player.kills}</div>
          </div>
          
          {/* NPC info */}
          <div className="bg-gray-100 p-3 rounded mb-4">
            <div className="text-lg font-bold mb-2 flex items-center">
              <BarChart2 className="mr-2 text-green-500" size={18} />
              Allies
            </div>
            
            {npcs.map(npc => (
              <div key={npc.id} className="mb-3">
                <div className="text-sm font-semibold">{npc.role === 'ally' ? 'Combat Support' : 'Civilian'}</div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Health:</span>
                  <span>{npc.health}/{npc.maxHealth}</span>
                </div>
                {renderHealthBar(npc.health, npc.maxHealth, 'bg-green-500')}
                <div className="text-xs mt-1 text-gray-600">{npc.status}</div>
              </div>
            ))}
          </div>
          
          {/* Weapon selection */}
          <div className="bg-gray-100 p-3 rounded mb-4">
            <div className="text-lg font-bold mb-2 flex items-center">
              <Crosshair className="mr-2 text-gray-700" size={18} />
              Weapons
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => switchWeapon('primary')}
                className={`flex items-center justify-between px-3 py-2 border rounded ${
                  selectedWeapon === 'primary' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  {player.weapons.primary.icon}
                  <span className="ml-2 text-sm">{player.weapons.primary.name}</span>
                </div>
                <span className="text-xs">{player.weapons.primary.damage} dmg</span>
              </button>
              
              <button
                onClick={() => switchWeapon('secondary')}
                className={`flex items-center justify-between px-3 py-2 border rounded ${
                  selectedWeapon === 'secondary' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  {player.weapons.secondary.icon}
                  <span className="ml-2 text-sm">{player.weapons.secondary.name}</span>
                </div>
                <span className="text-xs">{player.weapons.secondary.damage} dmg</span>
              </button>
              
              <button
                onClick={() => switchWeapon('melee')}
                className={`flex items-center justify-between px-3 py-2 border rounded ${
                  selectedWeapon === 'melee' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  {player.weapons.melee.icon}
                  <span className="ml-2 text-sm">{player.weapons.melee.name}</span>
                </div>
                <span className="text-xs">{player.weapons.melee.damage} dmg</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom section - logs and info */}
      <div className="mt-4">
        <div className="bg-gray-800 p-3 rounded text-white">
          <div className="mb-2 font-bold border-b border-gray-700 pb-1 flex justify-between">
            <span>Combat Log</span>
            <span className="text-xs text-gray-400">{debugInfo}</span>
          </div>
          <div className="text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Game controls */}
      <div className="mt-4 flex justify-center gap-4">
        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
          <strong>Controls:</strong> WASD to move, 1-2-3 to switch weapons, Space to fire
        </div>
      </div>
    </div>
  );
};

export default CombatInterface;
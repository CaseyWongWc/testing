import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Skull, Heart, Timer, Play, Pause, HelpCircle, Crosshair, Package, Zap, Shield, Swords, Brain } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'portal';
  terrain: 'normal' | 'water' | 'lava' | 'grass';
  isVisible: boolean;
  wasVisible: boolean;
  isWall?: boolean;
  g?: number;
  h?: number;
  f?: number;
  parent?: Cell | null;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  type: 'slime' | 'skeleton' | 'ghost' | 'mage' | 'boss';
  health: number;
  maxHealth: number;
  damage: number;
  moveRange: number;
  attackRange: number;
  turnsToMove: number;
}

interface Item {
  id: number;
  x: number;
  y: number;
  type: 'health' | 'ammo' | 'shield' | 'damage' | 'range';
  value: number;
}

interface Robot {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  damage: number;
  defense: number;
  attackRange: number;
}

interface GameState {
  level: number;
  turn: number;
  kills: number;
  itemsCollected: number;
}

interface CombatLog {
  message: string;
  timestamp: number;
  type: 'attack' | 'damage' | 'heal' | 'item' | 'portal';
}

interface AIState {
  mode: 'explore' | 'combat' | 'heal' | 'portal';
  target?: { x: number; y: number };
  path: Cell[];
  lastDecision: string;
  confidence: number;
}

const ROOM_WIDTH = 15;
const ROOM_HEIGHT = 15;
const VISION_RANGE = 5;

const ENEMY_TYPES = {
  slime: { health: 20, damage: 5, moveRange: 1, attackRange: 1, turnsToMove: 2 },
  skeleton: { health: 30, damage: 8, moveRange: 2, attackRange: 3, turnsToMove: 1 },
  ghost: { health: 25, damage: 6, moveRange: 3, attackRange: 2, turnsToMove: 1 },
  mage: { health: 20, damage: 12, moveRange: 1, attackRange: 4, turnsToMove: 2 },
  boss: { health: 100, damage: 15, moveRange: 2, attackRange: 3, turnsToMove: 1 }
};

const createEmptyRoom = (): Cell[][] => {
  const room: Cell[][] = [];
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      row.push({
        x,
        y,
        type: Math.random() < 0.2 ? 'wall' : 'floor',
        terrain: Math.random() < 0.7 ? 'normal' : 
                Math.random() < 0.5 ? 'water' : 
                Math.random() < 0.5 ? 'lava' : 'grass',
        isVisible: false,
        wasVisible: false
      });
    }
    room.push(row);
  }
  
  // Ensure starting position is clear
  room[1][1].type = 'floor';
  room[1][1].terrain = 'normal';
  
  // Add portal
  const portalX = ROOM_WIDTH - 2;
  const portalY = ROOM_HEIGHT - 2;
  room[portalY][portalX].type = 'portal';
  room[portalY][portalX].terrain = 'normal';
  
  return room;
};

const generateEnemies = (level: number): Enemy[] => {
  const enemies: Enemy[] = [];
  const enemyCount = Math.min(3 + Math.floor(level / 2), 8);
  
  for (let i = 0; i < enemyCount; i++) {
    const types = ['slime', 'skeleton', 'ghost', 'mage'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const baseStats = ENEMY_TYPES[type];
    
    enemies.push({
      id: Date.now() + i,
      x: 2 + Math.floor(Math.random() * (ROOM_WIDTH - 4)),
      y: 2 + Math.floor(Math.random() * (ROOM_HEIGHT - 4)),
      type,
      health: baseStats.health + level * 5,
      maxHealth: baseStats.health + level * 5,
      damage: baseStats.damage + level * 2,
      moveRange: baseStats.moveRange,
      attackRange: baseStats.attackRange,
      turnsToMove: baseStats.turnsToMove
    });
  }
  
  if (level % 5 === 0) {
    enemies.push({
      id: Date.now() + enemyCount,
      x: Math.floor(ROOM_WIDTH / 2),
      y: Math.floor(ROOM_HEIGHT / 2),
      type: 'boss',
      health: ENEMY_TYPES.boss.health + level * 10,
      maxHealth: ENEMY_TYPES.boss.health + level * 10,
      damage: ENEMY_TYPES.boss.damage + level * 3,
      moveRange: ENEMY_TYPES.boss.moveRange,
      attackRange: ENEMY_TYPES.boss.attackRange,
      turnsToMove: ENEMY_TYPES.boss.turnsToMove
    });
  }
  
  return enemies;
};

const generateItems = (): Item[] => {
  const items: Item[] = [];
  const itemCount = 2 + Math.floor(Math.random() * 3);
  
  const types = ['health', 'ammo', 'shield', 'damage', 'range'] as const;
  
  for (let i = 0; i < itemCount; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    items.push({
      id: Date.now() + i,
      x: 2 + Math.floor(Math.random() * (ROOM_WIDTH - 4)),
      y: 2 + Math.floor(Math.random() * (ROOM_HEIGHT - 4)),
      type,
      value: type === 'health' ? 30 : 
             type === 'ammo' ? 15 :
             type === 'shield' ? 5 :
             type === 'damage' ? 5 : 1
    });
  }
  
  return items;
};

const RogueLikeGame: React.FC = () => {
  const [room, setRoom] = useState<Cell[][]>(createEmptyRoom());
  const [robot, setRobot] = useState<Robot>({
    x: 1,
    y: 1,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    damage: 10,
    defense: 5,
    attackRange: 3
  });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    turn: 0,
    kills: 0,
    itemsCollected: 0
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [combatLog, setCombatLog] = useState<CombatLog[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Enemy | null>(null);
  const [aiState, setAIState] = useState<AIState>({
    mode: 'explore',
    path: [],
    lastDecision: 'Initializing...',
    confidence: 1.0
  });
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const addLog = (message: string, type: CombatLog['type']) => {
    setCombatLog(prev => [...prev.slice(-9), { message, timestamp: Date.now(), type }]);
  };

  const updateVisibility = useCallback(() => {
    setRoom(prev => {
      const newRoom = [...prev.map(row => [...row])];
      for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
          const distance = Math.sqrt(Math.pow(x - robot.x, 2) + Math.pow(y - robot.y, 2));
          newRoom[y][x].isVisible = distance <= VISION_RANGE;
          if (newRoom[y][x].isVisible) {
            newRoom[y][x].wasVisible = true;
          }
        }
      }
      return newRoom;
    });
  }, [robot.x, robot.y]);

  const moveRobot = (dx: number, dy: number) => {
    const newX = robot.x + dx;
    const newY = robot.y + dy;
    
    if (newX < 0 || newX >= ROOM_WIDTH || newY < 0 || newY >= ROOM_HEIGHT) return false;
    if (room[newY][newX].type === 'wall') return false;
    
    setRobot(prev => ({ ...prev, x: newX, y: newY }));
    return true;
  };

  const attackEnemy = (enemy: Enemy) => {
    if (robot.ammo <= 0) return false;
    
    const distance = Math.sqrt(Math.pow(enemy.x - robot.x, 2) + Math.pow(enemy.y - robot.y, 2));
    if (distance > robot.attackRange) return false;
    
    setRobot(prev => ({ ...prev, ammo: prev.ammo - 1 }));
    setEnemies(prev => prev.map(e => {
      if (e.id === enemy.id) {
        const newHealth = e.health - robot.damage;
        if (newHealth <= 0) {
          addLog(`Defeated ${e.type}!`, 'attack');
          setGameState(prev => ({ ...prev, kills: prev.kills + 1 }));
          return null as unknown as Enemy;
        }
        addLog(`Hit ${e.type} for ${robot.damage} damage!`, 'attack');
        return { ...e, health: newHealth };
      }
      return e;
    }).filter(Boolean));
    
    return true;
  };

  const collectItem = (item: Item) => {
    if (robot.x === item.x && robot.y === item.y) {
      switch (item.type) {
        case 'health':
          setRobot(prev => ({
            ...prev,
            health: Math.min(prev.maxHealth, prev.health + item.value)
          }));
          addLog(`Collected health +${item.value}`, 'heal');
          break;
        case 'ammo':
          setRobot(prev => ({
            ...prev,
            ammo: Math.min(prev.maxAmmo, prev.ammo + item.value)
          }));
          addLog(`Collected ammo +${item.value}`, 'item');
          break;
        case 'shield':
          setRobot(prev => ({
            ...prev,
            defense: prev.defense + item.value
          }));
          addLog(`Collected shield +${item.value}`, 'item');
          break;
        case 'damage':
          setRobot(prev => ({
            ...prev,
            damage: prev.damage + item.value
          }));
          addLog(`Collected damage +${item.value}`, 'item');
          break;
        case 'range':
          setRobot(prev => ({
            ...prev,
            attackRange: prev.attackRange + item.value
          }));
          addLog(`Collected range +${item.value}`, 'item');
          break;
      }
      setItems(prev => prev.filter(i => i.id !== item.id));
      setGameState(prev => ({ ...prev, itemsCollected: prev.itemsCollected + 1 }));
      return true;
    }
    return false;
  };

  const findPathToTarget = (start: { x: number; y: number }, goal: { x: number; y: number }): Cell[] => {
    const openSet: Cell[] = [];
    const closedSet: Set<string> = new Set();
    
    // Initialize start node
    const startNode = room[start.y][start.x];
    startNode.g = 0;
    startNode.h = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
    startNode.f = startNode.h;
    startNode.parent = null;
    openSet.push(startNode);
  
    while (openSet.length > 0) {
      // Find node with lowest f score
      let current = openSet[0];
      let currentIndex = 0;
      openSet.forEach((node, index) => {
        if (node.f < current.f) {
          current = node;
          currentIndex = index;
        }
      });
  
      // Check if we reached the goal
      if (current.x === goal.x && current.y === goal.y) {
        const path: Cell[] = [];
        let temp = current;
        while (temp.parent) {
          path.unshift(temp);
          temp = temp.parent;
        }
        return path;
      }
  
      // Move current node from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);
  
      // Check all adjacent squares
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dx, dy] of directions) {
        const newX = current.x + dx;
        const newY = current.y + dy;
  
        // Skip if out of bounds
        if (newX < 0 || newX >= ROOM_WIDTH || newY < 0 || newY >= ROOM_HEIGHT) continue;
  
        // Skip if wall or already in closed set
        const neighbor = room[newY][newX];
        if (neighbor.type === 'wall' || closedSet.has(`${newX},${newY}`)) continue;
  
        const tentativeG = current.g + 1;
  
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }
  
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = Math.abs(goal.x - newX) + Math.abs(goal.y - newY);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
  
    return []; // No path found
  };

  const processAI = useCallback(() => {
    if (!isAutoPlaying) return;
  
    // Update AI state based on current situation
    const nearestEnemy = enemies.reduce((nearest, enemy) => {
      const distance = Math.sqrt(Math.pow(enemy.x - robot.x, 2) + Math.pow(enemy.y - robot.y, 2));
      if (!nearest || distance < Math.sqrt(Math.pow(nearest.x - robot.x, 2) + Math.pow(nearest.y - robot.y, 2))) {
        return enemy;
      }
      return nearest;
    }, null as Enemy | null);
  
    const nearestItem = items.reduce((nearest, item) => {
      const distance = Math.sqrt(Math.pow(item.x - robot.x, 2) + Math.pow(item.y - robot.y, 2));
      if (!nearest || distance < Math.sqrt(Math.pow(nearest.x - robot.x, 2) + Math.pow(nearest.y - robot.y, 2))) {
        return item;
      }
      return nearest;
    }, null as Item | null);
  
    // Decision making
    let newMode = aiState.mode;
    let target = undefined;
    let decision = '';
  
    if (robot.health < robot.maxHealth * 0.3) {
      newMode = 'heal';
      const healthItem = items.find(i => i.type === 'health');
      if (healthItem) {
        target = { x: healthItem.x, y: healthItem.y };
        decision = 'Low health, seeking healing item';
      }
    } else if (robot.ammo < 5 && items.some(i => i.type === 'ammo')) {
      newMode = 'explore';
      const ammoItem = items.find(i => i.type === 'ammo');
      if (ammoItem) {
        target = { x: ammoItem.x, y: ammoItem.y };
        decision = 'Low ammo, seeking ammo item';
      }
    } else if (nearestEnemy && robot.ammo > 0) {
      newMode = 'combat';
      target = { x: nearestEnemy.x, y: nearestEnemy.y };
      decision = `Engaging ${nearestEnemy.type}`;
    } else if (nearestItem) {
      newMode = 'explore';
      target = { x: nearestItem.x, y: nearestItem.y };
      decision = `Moving to collect ${nearestItem.type}`;
    } else {
      newMode = 'portal';
      const portalCell = room.flat().find(cell => cell.type === 'portal');
      if (portalCell) {
        target = { x: portalCell.x, y: portalCell.y };
        decision = 'Seeking portal to next level';
      }
    }
  
    setAIState(prev => ({
      ...prev,
      mode: newMode,
      target,
      lastDecision: decision,
      confidence: Math.random() * 0.3 + 0.7
    }));
  
    // Execute action based on state
    if (target) {
      if (newMode === 'combat' && nearestEnemy) {
        const distance = Math.sqrt(Math.pow(nearestEnemy.x - robot.x, 2) + Math.pow(nearestEnemy.y - robot.y, 2));
        if (distance <= robot.attackRange) {
          attackEnemy(nearestEnemy);
        } else {
          // Find path to enemy
          const path = findPathToTarget(robot, target);
          if (path.length > 0) {
            const nextStep = path[0];
            moveRobot(nextStep.x - robot.x, nextStep.y - robot.y);
          }
        }
      } else {
        // Find path to target
        const path = findPathToTarget(robot, target);
        if (path.length > 0) {
          const nextStep = path[0];
          moveRobot(nextStep.x - robot.x, nextStep.y - robot.y);
        }
      }
    }
  
    // Process enemy turns
    setEnemies(prev => prev.map(enemy => {
      if (enemy.turnsToMove > 1) {
        return { ...enemy, turnsToMove: enemy.turnsToMove - 1 };
      }
  
      const distance = Math.sqrt(Math.pow(enemy.x - robot.x, 2) + Math.pow(enemy.y - robot.y, 2));
      if (distance <= enemy.attackRange) {
        const damage = Math.max(0, enemy.damage - robot.defense);
        setRobot(prev => ({
          ...prev,
          health: prev.health - damage
        }));
        addLog(`${enemy.type} hits for ${damage} damage!`, 'damage');
      } else if (distance <= enemy.moveRange) {
        const dx = Math.sign(robot.x - enemy.x);
        const dy = Math.sign(robot.y - enemy.y);
        return {
          ...enemy,
          x: enemy.x + dx,
          y: enemy.y + dy,
          turnsToMove: ENEMY_TYPES[enemy.type].turnsToMove
        };
      }
  
      return { ...enemy, turnsToMove: ENEMY_TYPES[enemy.type].turnsToMove };
    }));
  
    // Check for items
    items.forEach(item => collectItem(item));
  
    // Check for portal
    if (room[robot.y][robot.x].type === 'portal') {
      addLog('Entering portal to next level!', 'portal');
      setGameState(prev => ({ ...prev, level: prev.level + 1 }));
      setRoom(createEmptyRoom());
      setEnemies(generateEnemies(gameState.level + 1));
      setItems(generateItems());
      setRobot(prev => ({ ...prev, x: 1, y: 1 }));
    }
  
    // Update game state
    setGameState(prev => ({ ...prev, turn: prev.turn + 1 }));
  }, [robot, enemies, items, room, aiState, isAutoPlaying, gameState.level]);

  useEffect(() => {
    updateVisibility();
  }, [robot.x, robot.y, updateVisibility]);

  useEffect(() => {
    if (robot.health <= 0) {
      setIsAutoPlaying(false);
      addLog('Game Over!', 'damage');
      return;
    }

    const interval = setInterval(() => {
      if (isAutoPlaying) {
        processAI();
      }
    }, 1000 / moveSpeed);

    return () => clearInterval(interval);
  }, [robot.health, isAutoPlaying, moveSpeed, processAI]);

  useEffect(() => {
    if (enemies.length === 0) {
      setEnemies(generateEnemies(gameState.level));
    }
    if (items.length === 0) {
      setItems(generateItems());
    }
  }, [gameState.level]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoPlaying ? 'Pause' : 'Resume'}
          </button>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={moveSpeed}
              onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{moveSpeed.toFixed(1)}x</span>
          </div>
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-[2fr,1fr] gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-[repeat(15,2rem)] grid-rows-[repeat(15,2rem)] gap-px bg-gray-200">
            {room.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`relative ${
                    cell.isVisible
                      ? 'opacity-100'
                      : cell.wasVisible
                      ? 'opacity-50'
                      : 'opacity-0'
                  } ${
                    cell.type === 'wall'
                      ? 'bg-gray-800'
                      : cell.type === 'portal'
                      ? 'bg-purple-500'
                      : cell.terrain === 'water'
                      ? 'bg-blue-200'
                      : cell.terrain === 'lava'
                      ? 'bg-red-200'
                      : cell.terrain === 'grass'
                      ? 'bg-green-200'
                      : 'bg-white'
                  }`}
                >
                  {robot.x === x && robot.y === y && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                  {enemies.map(enemy => {
                    if (enemy.x === x && enemy.y === y && cell.isVisible) {
                      return (
                        <div
                          key={enemy.id}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {enemy.type === 'slime' ? (
                            <div className="w-6 h-6 rounded-full bg-green-500" />
                          ) : enemy.type === 'skeleton' ? (
                            <Skull className="w-6 h-6 text-gray-700" />
                          ) : enemy.type === 'ghost' ? (
                            <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-400" />
                          ) : enemy.type === 'mage' ? (
                            <Zap className="w-6 h-6 text-purple-500" />
                          ) : (
                            <Swords className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  {items.map(item => {
                    if (item.x === x && item.y === y && cell.isVisible) {
                      return (
                        <div
                          key={item.id}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {item.type === 'health' ? (
                            <Heart className="w-6 h-6 text-red-500" />
                          ) : item.type === 'ammo' ? (
                            <Package className="w-6 h-6 text-yellow-500" />
                          ) : item.type === 'shield' ? (
                            <Shield className="w-6 h-6 text-blue-500" />
                          ) : item.type === 'damage' ? (
                            <Swords className="w-6 h-6 text-orange-500" />
                          ) : (
                            <Crosshair className="w-6 h-6 text-purple-500" />
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Level</span>
                <span>{gameState.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Turn</span>
                <span>{gameState.turn}</span>
              </div>
              <div className="flex justify-between">
                <span>Kills</span>
                <span>{gameState.kills}</span>
              </div>
              <div className="flex justify-between">
                <span>Items</span>
                <span>{gameState.itemsCollected}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Robot</h2>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Health</span>
                  <span>{robot.health}/{robot.maxHealth}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(robot.health / robot.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ammo</span>
                  <span>{robot.ammo}/{robot.maxAmmo}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(robot.ammo / robot.maxAmmo) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span>Damage</span>
                <span>{robot.damage}</span>
              </div>
              <div className="flex justify-between">
                <span>Defense</span>
                <span>{robot.defense}</span>
              </div>
              <div className="flex justify-between">
                <span>Range</span>
                <span>{robot.attackRange}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5" />
              <h2 className="text-lg font-semibold">AI Status</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-medium">{aiState.mode}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confidence</span>
                  <span>{(aiState.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${aiState.confidence * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">{aiState.lastDecision}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Combat Log</h2>
            <div className="space-y-1">
              {combatLog.map((log, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    log.type === 'attack'
                      ? 'text-blue-600'
                      : log.type === 'damage'
                      ? 'text-red-600'
                      : log.type === 'heal'
                      ? 'text-green-600'
                      : log.type === 'portal'
                      ? 'text-purple-600'
                      : 'text-gray-600'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>

          {showLegend && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-2">Legend</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span>Robot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>Slime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-gray-700" />
                  <span>Skeleton</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400" />
                  <span>Ghost</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span>Mage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-500" />
                  <span>Boss</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Health</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-yellow-500" />
                  <span>Ammo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Shield</span>
                </div>
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-orange-500" />
                  <span>Damage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-purple-500" />
                  <span>Range</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RogueLikeGame;
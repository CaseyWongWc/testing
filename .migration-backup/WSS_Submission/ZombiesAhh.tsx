import React, { useState, useEffect, useRef } from 'react';
import { Bot, Skull, Heart, Timer, Play, Pause, HelpCircle, Brain, Shield, Swords } from 'lucide-react';

interface Zombie {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  type: 'normal' | 'fast' | 'tank';
}

interface Robot {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  kills: number;
}

interface GameState {
  wave: number;
  zombiesKilled: number;
  isGameOver: boolean;
}

const GRID_SIZE = 20;
const CELL_SIZE = 30;

const ZombiesAhh: React.FC = () => {
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [robot, setRobot] = useState<Robot>({
    x: Math.floor(GRID_SIZE / 2),
    y: Math.floor(GRID_SIZE / 2),
    health: 100,
    maxHealth: 100,
    damage: 20,
    defense: 5,
    kills: 0
  });
  const [gameState, setGameState] = useState<GameState>({
    wave: 1,
    zombiesKilled: 0,
    isGameOver: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [aiDecision, setAiDecision] = useState('Initializing...');

  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const spawnZombie = (type: 'normal' | 'fast' | 'tank' = 'normal') => {
    // Spawn from edges
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch (side) {
      case 0: // Top
        x = Math.floor(Math.random() * GRID_SIZE);
        y = 0;
        break;
      case 1: // Right
        x = GRID_SIZE - 1;
        y = Math.floor(Math.random() * GRID_SIZE);
        break;
      case 2: // Bottom
        x = Math.floor(Math.random() * GRID_SIZE);
        y = GRID_SIZE - 1;
        break;
      default: // Left
        x = 0;
        y = Math.floor(Math.random() * GRID_SIZE);
    }

    const stats = {
      normal: { health: 50, damage: 10, speed: 1 },
      fast: { health: 30, damage: 5, speed: 2 },
      tank: { health: 100, damage: 15, speed: 0.5 }
    }[type];

    return {
      id: Date.now() + Math.random(),
      x,
      y,
      ...stats,
      maxHealth: stats.health,
      type
    };
  };

  const spawnWave = () => {
    const zombieCount = Math.min(5 + Math.floor(gameState.wave / 2), 15);
    const newZombies: Zombie[] = [];
    
    for (let i = 0; i < zombieCount; i++) {
      const type = Math.random() < 0.7 
        ? 'normal' 
        : Math.random() < 0.5 
          ? 'fast' 
          : 'tank';
      newZombies.push(spawnZombie(type));
    }
    
    setZombies(prev => [...prev, ...newZombies]);
  };

  const moveZombies = () => {
    setZombies(prev => prev.map(zombie => {
      const dx = robot.x - zombie.x;
      const dy = robot.y - zombie.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= 1) {
        // Attack robot
        setRobot(prev => ({
          ...prev,
          health: Math.max(0, prev.health - Math.max(0, zombie.damage - prev.defense))
        }));
        return zombie;
      }

      // Move towards robot
      const moveX = (dx / distance) * zombie.speed;
      const moveY = (dy / distance) * zombie.speed;
      
      return {
        ...zombie,
        x: zombie.x + moveX,
        y: zombie.y + moveY
      };
    }));
  };

  const attackZombies = () => {
    const attackRange = 2;
    let zombiesHit = 0;

    setZombies(prev => prev.map(zombie => {
      const distance = Math.sqrt(
        Math.pow(zombie.x - robot.x, 2) + 
        Math.pow(zombie.y - robot.y, 2)
      );

      if (distance <= attackRange) {
        zombiesHit++;
        const newHealth = zombie.health - robot.damage;
        
        if (newHealth <= 0) {
          setGameState(prev => ({
            ...prev,
            zombiesKilled: prev.zombiesKilled + 1
          }));
          setRobot(prev => ({ ...prev, kills: prev.kills + 1 }));
          return null;
        }
        
        return { ...zombie, health: newHealth };
      }
      
      return zombie;
    }).filter(Boolean) as Zombie[]);

    return zombiesHit;
  };

  const makeAIDecision = () => {
    // Count nearby zombies
    const nearbyZombies = zombies.filter(zombie => 
      Math.sqrt(Math.pow(zombie.x - robot.x, 2) + Math.pow(zombie.y - robot.y, 2)) <= 3
    );

    // Find safest direction
    const directions = [
      { dx: 0, dy: -1, zombies: 0 },
      { dx: 1, dy: 0, zombies: 0 },
      { dx: 0, dy: 1, zombies: 0 },
      { dx: -1, dy: 0, zombies: 0 }
    ];

    directions.forEach(dir => {
      const newX = robot.x + dir.dx;
      const newY = robot.y + dir.dy;
      
      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
        dir.zombies = zombies.filter(zombie =>
          Math.sqrt(Math.pow(zombie.x - newX, 2) + Math.pow(zombie.y - newY, 2)) <= 2
        ).length;
      } else {
        dir.zombies = Infinity;
      }
    });

    // Sort by fewest zombies
    directions.sort((a, b) => a.zombies - b.zombies);

    if (nearbyZombies.length >= 3) {
      // Too many zombies nearby, try to escape
      const safestDir = directions[0];
      if (safestDir.zombies < nearbyZombies.length) {
        setRobot(prev => ({
          ...prev,
          x: Math.max(0, Math.min(GRID_SIZE - 1, prev.x + safestDir.dx)),
          y: Math.max(0, Math.min(GRID_SIZE - 1, prev.y + safestDir.dy))
        }));
        setAiDecision('Retreating from zombie group');
        return;
      }
    }

    // Attack if zombies are in range
    const zombiesHit = attackZombies();
    if (zombiesHit > 0) {
      setAiDecision(`Attacked ${zombiesHit} zombies`);
      return;
    }

    // Move towards nearest zombie if no immediate threats
    if (zombies.length > 0) {
      const nearest = zombies.reduce((nearest, zombie) => {
        const distance = Math.sqrt(
          Math.pow(zombie.x - robot.x, 2) + 
          Math.pow(zombie.y - robot.y, 2)
        );
        return !nearest || distance < nearest.distance 
          ? { zombie, distance }
          : nearest;
      }, null as { zombie: Zombie; distance: number } | null);

      if (nearest) {
        const dx = Math.sign(nearest.zombie.x - robot.x);
        const dy = Math.sign(nearest.zombie.y - robot.y);
        
        setRobot(prev => ({
          ...prev,
          x: Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx)),
          y: Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy))
        }));
        setAiDecision('Moving towards nearest zombie');
      }
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!isPlaying || gameState.isGameOver) return;

      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = 1000 / moveSpeed;

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;
        
        moveZombies();
        makeAIDecision();

        // Spawn new wave if all zombies are dead
        if (zombies.length === 0) {
          setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
          spawnWave();
        }

        // Check game over
        if (robot.health <= 0) {
          setGameState(prev => ({ ...prev, isGameOver: true }));
          setIsPlaying(false);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, moveSpeed, zombies.length, robot.health, gameState.isGameOver]);

  return (
    <div className="flex gap-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div 
          className="grid gap-px bg-gray-100" 
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const zombie = zombies.find(z => Math.floor(z.x) === x && Math.floor(z.y) === y);
            
            return (
              <div 
                key={i} 
                className="bg-white flex items-center justify-center relative"
              >
                {robot.x === x && robot.y === y && (
                  <Bot className="w-6 h-6 text-blue-500" />
                )}
                {zombie && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skull 
                      className={`w-6 h-6 ${
                        zombie.type === 'normal' ? 'text-gray-700' :
                        zombie.type === 'fast' ? 'text-green-500' :
                        'text-red-500'
                      }`} 
                    />
                    <div 
                      className="absolute -top-1 left-0 right-0 h-1 bg-gray-200 rounded-full"
                    >
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(zombie.health / zombie.maxHealth) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => {
              if (!isPlaying && gameState.isGameOver) {
                setGameState({ wave: 1, zombiesKilled: 0, isGameOver: false });
                setRobot({
                  x: Math.floor(GRID_SIZE / 2),
                  y: Math.floor(GRID_SIZE / 2),
                  health: 100,
                  maxHealth: 100,
                  damage: 20,
                  defense: 5,
                  kills: 0
                });
                setZombies([]);
                spawnWave();
              }
              setIsPlaying(!isPlaying);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {gameState.isGameOver ? 'New Game' : isPlaying ? 'Pause' : 'Start'}
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
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Wave</span>
              <span>{gameState.wave}</span>
            </div>
            <div className="flex justify-between">
              <span>Zombies Killed</span>
              <span>{gameState.zombiesKilled}</span>
            </div>
            <div className="flex justify-between">
              <span>Zombies Remaining</span>
              <span>{zombies.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
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
            <div className="flex justify-between">
              <span>Damage</span>
              <span>{robot.damage}</span>
            </div>
            <div className="flex justify-between">
              <span>Defense</span>
              <span>{robot.defense}</span>
            </div>
            <div className="flex justify-between">
              <span>Kills</span>
              <span>{robot.kills}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            <h2 className="text-lg font-semibold">AI Status</h2>
          </div>
          <p className="text-sm text-gray-600">{aiDecision}</p>
        </div>

        {showLegend && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Legend</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <span>Robot</span>
              </div>
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-gray-700" />
                <span>Normal Zombie</span>
              </div>
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-green-500" />
                <span>Fast Zombie</span>
              </div>
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-500" />
                <span>Tank Zombie</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZombiesAhh;
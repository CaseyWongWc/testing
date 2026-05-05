import React, { useState, useEffect } from 'react';
import { Bot, Brain, Sliders, Timer, Skull, Play, Pause } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  weight: number;
  zone: 'inner' | 'middle' | 'outer' | null;
  f?: number;
  g?: number;
  h?: number;
  parent?: Cell | null;
}

interface Student {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  status: string;
}

interface Zombie {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  color: string;
  type: 'normal' | 'dumb';
  lastMove?: { dx: number; dy: number };
}

interface DirectPath {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface Gun {
  damage: number;
  cooldown: number;
  lastFired: number;
}

const DAMAGE_PER_SECOND = 10;
const UPDATE_INTERVAL = 1000; // Base interval of 1 second

const EmptyClassroom: React.FC = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [innerZoneSize, setInnerZoneSize] = useState(4);
  const [middleZoneSize, setMiddleZoneSize] = useState(8);
  const [outerZoneSize, setOuterZoneSize] = useState(4);
  const [timeScale, setTimeScale] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [student, setStudent] = useState<Student>({
    x: Math.floor(30 / 2),
    y: Math.floor(30 / 2),
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    status: 'Observing the classroom...'
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isUpdateIndicatorVisible, setIsUpdateIndicatorVisible] = useState(false);
  const [manualSpawnType, setManualSpawnType] = useState<'normal' | 'dumb'>('normal');
  const [isManualSpawning, setIsManualSpawning] = useState(false);
  const [directPaths, setDirectPaths] = useState<DirectPath[]>([]);
  const [gun, setGun] = useState<Gun>({
    damage: 25,
    cooldown: 500, // 500ms between shots
    lastFired: 0
  });
  const [gridSize, setGridSize] = useState(30);

  useEffect(() => {
    initializeGrid();
  }, [gridSize]);

  const initializeGrid = () => {
    const newGrid: Cell[][] = [];
    for (let y = 0; y < gridSize; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < gridSize; x++) {
        row.push({
          x,
          y,
          isWall: false,
          weight: 1,
          zone: null
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const isLineBlocked = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      if (grid[y][x].isWall) return true;
      if (x === x2 && y === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return false;
  };

  const updateDirectPaths = () => {
    const newPaths: DirectPath[] = [];

    zombies.forEach(zombie => {
      if (!isLineBlocked(student.x, student.y, zombie.x, zombie.y)) {
        newPaths.push({
          x1: student.x,
          y1: student.y,
          x2: zombie.x,
          y2: zombie.y,
          color: zombie.color
        });
      }
    });

    setDirectPaths(newPaths);
  };

  const moveZombies = () => {
    setZombies(prev => prev.map(zombie => {
      if (zombie.type === 'dumb') {
        const directions = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 }
        ];
        
        let possibleMoves = [...directions];
        if (zombie.lastMove) {
          if (Math.random() < 0.5) {
            possibleMoves = [zombie.lastMove];
          }
        }

        possibleMoves = possibleMoves.filter(move => {
          const newX = zombie.x + move.dx;
          const newY = zombie.y + move.dy;
          return (
            newX >= 0 && newX < gridSize &&
            newY >= 0 && newY < gridSize &&
            !grid[newY][newX].isWall
          );
        });

        if (possibleMoves.length > 0) {
          const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          return {
            ...zombie,
            x: zombie.x + move.dx,
            y: zombie.y + move.dy,
            lastMove: move
          };
        }
        return zombie;
      }

      const dx = Math.sign(student.x - zombie.x);
      const dy = Math.sign(student.y - zombie.y);
      
      const newX = zombie.x + dx;
      const newY = zombie.y + dy;
      
      if (
        newX >= 0 && newX < gridSize &&
        newY >= 0 && newY < gridSize &&
        !grid[newY][newX].isWall
      ) {
        return { ...zombie, x: newX, y: newY };
      }
      return zombie;
    }));
  };

  const shoot = () => {
    const now = Date.now();
    if (now - gun.lastFired < gun.cooldown) return;

    let closestZombie: Zombie | null = null;
    let closestDistance = Infinity;

    zombies.forEach(zombie => {
      const distance = Math.sqrt(
        Math.pow(zombie.x - student.x, 2) + 
        Math.pow(zombie.y - student.y, 2)
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestZombie = zombie;
      }
    });

    if (closestZombie) {
      setZombies(prev => prev.map(zombie => {
        if (zombie.id === closestZombie!.id) {
          const newHealth = zombie.health - gun.damage;
          
          if (newHealth <= 0) {
            const side = Math.floor(Math.random() * 4);
            let newX = zombie.x;
            let newY = zombie.y;
            
            switch (side) {
              case 0:
                newX = Math.floor(Math.random() * gridSize);
                newY = 0;
                break;
              case 1:
                newX = gridSize - 1;
                newY = Math.floor(Math.random() * gridSize);
                break;
              case 2:
                newX = Math.floor(Math.random() * gridSize);
                newY = gridSize - 1;
                break;
              case 3:
                newX = 0;
                newY = Math.floor(Math.random() * gridSize);
                break;
            }

            return {
              ...zombie,
              x: newX,
              y: newY,
              health: zombie.maxHealth
            };
          }

          return { ...zombie, health: newHealth };
        }
        return zombie;
      }));

      setGun(prev => ({ ...prev, lastFired: now }));
    }
  };

  const handleGridClick = (x: number, y: number) => {
    if (isManualSpawning) {
      if (!grid[y][x].isWall) {
        const newZombie: Zombie = {
          id: Date.now(),
          x,
          y,
          health: 100,
          maxHealth: 100,
          damage: 10,
          color: manualSpawnType === 'normal' ? 'red' : 'purple',
          type: manualSpawnType
        };
        setZombies(prev => [...prev, newZombie]);
      }
    } else {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[y][x].isWall = !newGrid[y][x].isWall;
        return newGrid;
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setZombies([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let updateInterval: NodeJS.Timeout;
    let blinkTimeout: NodeJS.Timeout;

    const update = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdate) / 1000;
      setLastUpdate(now);

      setIsUpdateIndicatorVisible(true);
      blinkTimeout = setTimeout(() => {
        setIsUpdateIndicatorVisible(false);
      }, 200);

      moveZombies();
      updateDirectPaths();
      shoot();

      setStudent(prev => {
        let newHealth = prev.health;
        zombies.forEach(zombie => {
          const distance = Math.sqrt(
            Math.pow(zombie.x - prev.x, 2) + Math.pow(zombie.y - prev.y, 2)
          );
          if (distance < 2) {
            newHealth -= DAMAGE_PER_SECOND * deltaTime * timeScale;
          }
        });
        return {
          ...prev,
          health: Math.max(0, newHealth)
        };
      });
    };

    if (isRunning) {
      const scaledInterval = UPDATE_INTERVAL / timeScale;
      updateInterval = setInterval(update, scaledInterval);
    }

    return () => {
      clearInterval(updateInterval);
      clearTimeout(blinkTimeout);
    };
  }, [isRunning, timeScale, zombies, lastUpdate]);

  return (
    <div className="flex gap-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={() => setIsManualSpawning(!isManualSpawning)}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              isManualSpawning 
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Skull className="w-4 h-4" />
            {isManualSpawning ? 'Exit Spawn Mode' : 'Spawn Zombies'}
          </button>
          {isManualSpawning && (
            <select
              value={manualSpawnType}
              onChange={(e) => setManualSpawnType(e.target.value as 'normal' | 'dumb')}
              className="px-4 py-2 border rounded"
            >
              <option value="normal">Normal Zombie</option>
              <option value="dumb">Dumb Zombie</option>
            </select>
          )}
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Grid Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="50"
                value={gridSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setStudent(prev => ({
                    ...prev,
                    x: Math.min(prev.x, newSize - 1),
                    y: Math.min(prev.y, newSize - 1)
                  }));
                  setZombies(prev => prev.filter(z => z.x < newSize && z.y < newSize));
                  setGridSize(newSize);
                }}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-8">{gridSize}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div 
            className="grid gap-px bg-gray-100" 
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, 1.5rem)`,
              gridTemplateRows: `repeat(${gridSize}, 1.5rem)`,
              position: 'relative',
              zIndex: 1
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleGridClick(x, y)}
                  className={`
                    flex items-center justify-center relative
                    ${cell.isWall ? 'bg-gray-800' : 'bg-white'}
                    ${cell.zone === 'inner' ? 'bg-opacity-10' : ''}
                    ${cell.zone === 'outer' ? `bg-gray-${cell.weight * 100}` : ''}
                    ${isManualSpawning && !cell.isWall ? 'cursor-pointer hover:bg-gray-50' : ''}
                    transition-colors
                  `}
                >
                  {student.x === x && student.y === y && (
                    <Bot className="w-5 h-5 text-blue-500 relative z-10" />
                  )}
                  {zombies.map(zombie => {
                    if (zombie.x === x && zombie.y === y) {
                      return (
                        <div key={zombie.id} className="relative">
                          <Skull 
                            className={`w-5 h-5 relative z-10 ${
                              zombie.type === 'normal' ? 'text-red-500' : 'text-purple-500'
                            }`}
                          />
                          <div className="absolute -top-1 left-0 right-0 h-1 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all"
                              style={{ width: `${(zombie.health / zombie.maxHealth) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                  {isUpdateIndicatorVisible && (
                    <div className="absolute right-0 top-0 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
            {directPaths.map((path, index) => {
              const startX = path.x1 * 1.5 + 0.75;
              const startY = path.y1 * 1.5 + 0.75;
              const endX = path.x2 * 1.5 + 0.75;
              const endY = path.y2 * 1.5 + 0.75;
              
              const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
              const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
              
              return (
                <div
                  key={index}
                  className={`absolute bg-${path.color}-500`}
                  style={{
                    left: `${startX}rem`,
                    top: `${startY}rem`,
                    width: `${length}rem`,
                    height: '2px',
                    transformOrigin: 'left',
                    transform: `rotate(${angle}deg)`,
                    opacity: 0.75
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Student Status</h2>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Health</span>
                <span>{Math.round(student.health)}/{student.maxHealth}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(student.health / student.maxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Controls</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Time Scale</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-600 text-right">{timeScale.toFixed(1)}x</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyClassroom;
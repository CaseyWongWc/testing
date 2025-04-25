import React, { useState, useCallback } from 'react';

interface Cell {
  x: number;
  y: number;
  terrain: 'plains' | 'mountain' | 'desert' | 'swamp' | 'forest';
  isPath: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface Resource {
  type: 'food' | 'water' | 'gold';
  amount: number;
  repeatable: boolean;
  collected: boolean;
}

interface Player {
  x: number;
  y: number;
  currentStrength: number;
  maxStrength: number;
  currentWater: number;
  maxWater: number;
  currentFood: number;
  maxFood: number;
  gold: number;
}

interface Decision {
  type: string;
  reason: string;
  timestamp: number;
  resourceLevels: {
    strength: number;
    water: number;
    food: number;
  };
}

interface WildernessGameProps {
  width: number;
  height: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const WildernessGame: React.FC<WildernessGameProps> = ({ width, height, difficulty }) => {
  const [map, setMap] = useState<Cell[][]>([]);
  const [resources, setResources] = useState<Map<string, Resource>>(new Map());
  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    currentStrength: 100,
    maxStrength: 100,
    currentWater: 100,
    maxWater: 100,
    currentFood: 100,
    maxFood: 100,
    gold: 0
  });
  const [path, setPath] = useState<Cell[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [currentGoal, setCurrentGoal] = useState<{ x: number; y: number } | null>(null);

  const heuristic = (a: Cell, b: Cell) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  const getValidNeighbors = useCallback((cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        neighbors.push(map[newY][newX]);
      }
    }

    return neighbors;
  }, [map, width, height]);

  const findPathWithCosts = useCallback((targetX: number, targetY: number) => {
    const start = map[player.y][player.x];
    const goal = map[targetY][targetX];
    
    const openSet = new Set<Cell>([start]);
    const closedSet = new Set<Cell>();
    
    start.g = 0;
    start.f = heuristic(start, goal);
    
    while (openSet.size > 0) {
      let current = Array.from(openSet).reduce((a, b) => a.f < b.f ? a : b);
      
      if (current === goal) {
        const path: Cell[] = [];
        while (current) {
          path.unshift(current);
          current = current.parent;
        }
        return { path, cost: goal.g };
      }
      
      openSet.delete(current);
      closedSet.add(current);
      
      for (const neighbor of getValidNeighbors(current)) {
        if (closedSet.has(neighbor)) continue;
        
        const tentativeG = current.g + 1;
        
        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }
        
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.f = neighbor.g + heuristic(neighbor, goal);
      }
    }
    
    return { path: [], cost: Infinity };
  }, [map, player, getValidNeighbors]);

  const findPath = useCallback((targetX: number, targetY: number) => {
    const { path } = findPathWithCosts(targetX, targetY);
    setPath(path);
    setCurrentPathIndex(0);
  }, [findPathWithCosts]);

  const collectResources = useCallback(() => {
    const key = `${player.x},${player.y}`;
    const resource = resources.get(key);
    
    if (resource && !resource.collected) {
      const newResources = new Map(resources);
      const newPlayer = { ...player };
      
      switch (resource.type) {
        case 'food':
          newPlayer.currentFood = Math.min(newPlayer.maxFood, newPlayer.currentFood + resource.amount);
          break;
        case 'water':
          newPlayer.currentWater = Math.min(newPlayer.maxWater, newPlayer.currentWater + resource.amount);
          break;
        case 'gold':
          newPlayer.gold += resource.amount;
          break;
      }

      if (!resource.repeatable) {
        newResources.set(key, { ...resource, collected: true });
      }

      setResources(newResources);
      setPlayer(newPlayer);

      setDecisions(prev => [{
        type: 'collect',
        reason: `Collected ${resource.amount} ${resource.type}`,
        timestamp: Date.now(),
        resourceLevels: {
          strength: newPlayer.currentStrength,
          water: newPlayer.currentWater,
          food: newPlayer.currentFood
        }
      }, ...prev].slice(0, 10));
    }
  }, [player, resources]);

  const generateMap = useCallback(() => {
    const newMap: Cell[][] = [];
    const newResources = new Map<string, Resource>();
    
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        const terrainTypes: Cell['terrain'][] = ['plains', 'mountain', 'desert', 'swamp', 'forest'];
        const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        
        row.push({
          x,
          y,
          terrain,
          isPath: false,
          f: 0,
          g: 0,
          h: 0,
          parent: null
        });
      }
      newMap.push(row);
    }

    const resourceCount = {
      easy: { food: 8, water: 8, gold: 5 },
      medium: { food: 6, water: 6, gold: 4 },
      hard: { food: 4, water: 4, gold: 3 }
    }[difficulty];

    const addResources = (type: 'food' | 'water' | 'gold', count: number) => {
      for (let i = 0; i < count; i++) {
        let x, y;
        do {
          x = Math.floor(Math.random() * width);
          y = Math.floor(Math.random() * height);
        } while (newResources.has(`${x},${y}`) || (x === 0 && y === 0));

        const repeatable = Math.random() < 0.3;
        newResources.set(`${x},${y}`, {
          type,
          amount: Math.floor(Math.random() * 20) + 20,
          repeatable,
          collected: false
        });
      }
    };

    addResources('food', resourceCount.food);
    addResources('water', resourceCount.water);
    addResources('gold', resourceCount.gold);

    setMap(newMap);
    setResources(newResources);
    setPlayer({
      x: 0,
      y: 0,
      currentStrength: 100,
      maxStrength: 100,
      currentWater: 100,
      maxWater: 100,
      currentFood: 100,
      maxFood: 100,
      gold: 0
    });
    setPath([]);
    setCurrentPathIndex(0);
    setGameOver(false);
    setGameWon(false);
    setDecisions([]);
    setCurrentGoal(null);
  }, [width, height, difficulty]);

  // Initialize the game when component mounts
  React.useEffect(() => {
    generateMap();
  }, [generateMap]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-[auto,1fr] gap-8">
        {/* Game board */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid" style={{ 
            gridTemplateColumns: `repeat(${width}, 2.5rem)`,
            gap: '2px' 
          }}>
            {map.map((row, y) => 
              row.map((cell, x) => (
                <div
                  key={`${x},${y}`}
                  className={`
                    h-10 w-10 rounded
                    ${cell.terrain === 'plains' ? 'bg-green-200' :
                      cell.terrain === 'mountain' ? 'bg-gray-400' :
                      cell.terrain === 'desert' ? 'bg-yellow-200' :
                      cell.terrain === 'swamp' ? 'bg-green-700' :
                      'bg-green-800'}
                    ${cell.isPath ? 'ring-2 ring-blue-500' : ''}
                    ${player.x === x && player.y === y ? 'relative' : ''}
                  `}
                >
                  {player.x === x && player.y === y && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full" />
                    </div>
                  )}
                  {resources.get(`${x},${y}`)?.collected === false && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full ${
                        resources.get(`${x},${y}`)?.type === 'food' ? 'bg-green-500' :
                        resources.get(`${x},${y}`)?.type === 'water' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Strength</span>
                  <span>{player.currentStrength}/{player.maxStrength}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(player.currentStrength / player.maxStrength) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Water</span>
                  <span>{player.currentWater}/{player.maxWater}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(player.currentWater / player.maxWater) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Food</span>
                  <span>{player.currentFood}/{player.maxFood}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(player.currentFood / player.maxFood) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span>Gold</span>
                <span>{player.gold}</span>
              </div>
            </div>
          </div>

          {/* Decision log */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Decision Log</h2>
            <div className="space-y-2">
              {decisions.map((decision, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {decision.reason}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game over overlay */}
      {(gameOver || gameWon) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {gameWon ? 'Congratulations!' : 'Game Over'}
            </h2>
            <p className="text-gray-600 mb-6">
              {gameWon 
                ? `You made it to safety with ${player.gold} gold!`
                : 'You did not survive the wilderness.'}
            </p>
            <button
              onClick={generateMap}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WildernessGame;
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Heart, Apple, Coffee, Book, Target, Play, Pause, Timer, FastForward, Eye } from 'lucide-react';

interface Student {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
}

interface Item {
  id: number;
  type: 'food' | 'medkit' | 'goal';
  x: number;
  y: number;
}

const WeightedDecisions: React.FC = () => {
  const [gridSize] = useState({ width: 10, height: 10 });
  const [student, setStudent] = useState<Student>({
    x: 5,
    y: 5,
    health: 80,
    maxHealth: 100,
    hunger: 70,
    maxHunger: 100
  });
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [fogOfWar, setFogOfWar] = useState(true);
  const [visibleCells, setVisibleCells] = useState<boolean[][]>(() =>
    Array(gridSize.height).fill(0).map(() => Array(gridSize.width).fill(!fogOfWar))
  );
  const [path, setPath] = useState<{x: number, y: number}[]>([]);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);

  useEffect(() => {
    updateVisibility();
  }, [student.x, student.y]);

  const updateVisibility = () => {
    const newVisibleCells = Array(gridSize.height).fill(0).map(() => Array(gridSize.width).fill(false));

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = student.x + dx;
        const y = student.y + dy;

        if (x >= 0 && x < gridSize.width && y >= 0 && y < gridSize.height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= 2) {
            newVisibleCells[y][x] = true;
          }
        }
      }
    }

    setVisibleCells(newVisibleCells);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setStudent(prev => {
          let nextStudent = { ...prev, health: Math.max(0, prev.health - 5), hunger: Math.max(0, prev.hunger - 3) };

          // Move along path if available
          if (path.length > 0) {
            const nextPosition = path[0];
            nextStudent = {
              ...nextStudent,
              x: nextPosition.x,
              y: nextPosition.y
            };
            setPath(prev => prev.slice(1));
          }

          // Check for item collection
          items.forEach(item => {
            if (item.x === nextStudent.x && item.y === nextStudent.y) {
              collectItem(item);
            }
          });

          updateVisibility();
          return nextStudent;
        });

        if (Math.random() < 0.2) { // 20% chance to spawn item
          spawnRandomItem();
        }
      }, moveSpeed * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, moveSpeed, path.length]);

  const calculateWeight = (item: Item) => {
    if (!visibleCells[item.y][item.x]) return 0;

    const distance = Math.sqrt(
      Math.pow(item.x - student.x, 2) +
      Math.pow(item.y - student.y, 2)
    );

    const baseWeight = Math.round(70 * (1 - distance / Math.sqrt(200)));

    switch (item.type) {
      case 'food':
        return baseWeight * (1 - student.hunger / student.maxHunger) * 2;
      case 'medkit':
        return baseWeight * (1 - student.health / student.maxHealth) * 2;
      case 'goal':
        return baseWeight * ((student.health / student.maxHealth) + (student.hunger / student.maxHunger)) / 2;
      default:
        return baseWeight;
    }
  };

  const spawnRandomItem = () => {
    const types: ('food' | 'medkit' | 'goal')[] = ['food', 'medkit', 'goal'];

    const newItem: Item = {
      id: Date.now(),
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.floor(Math.random() * gridSize.width),
      y: Math.floor(Math.random() * gridSize.height)
    };

    setItems(prev => [...prev, newItem]);
  };

  const collectItem = (item: Item) => {
    switch (item.type) {
      case 'food':
        setStudent(prev => ({
          ...prev,
          hunger: Math.min(prev.maxHunger, prev.hunger + 30)
        }));
        break;
      case 'medkit':
        setStudent(prev => ({
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + 30)
        }));
        break;
    }
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  useEffect(() => {
    let highestWeight = -1;
    let bestItem: Item | null = null;
    let newPath: {x: number, y: number}[] = [];

    items.forEach(item => {
      const weight = calculateWeight(item);
      if (weight > highestWeight) {
        highestWeight = weight;
        bestItem = item;
      }
    });

    setSelectedItem(bestItem);
    setTargetWeight(bestItem ? Math.round(highestWeight) : null);

    if (bestItem) {
      // Simple path - just direct line
      const dx = bestItem.x - student.x;
      const dy = bestItem.y - student.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      newPath = [];

      for (let i = 0; i <= steps; i++) {
        newPath.push({
          x: student.x + Math.round((dx * i) / steps),
          y: student.y + Math.round((dy * i) / steps)
        });
      }
      setPath(newPath);
    } else {
      setPath([]);
    }

    // Check if we reached an item
    items.forEach(item => {
      if (item.x === student.x && item.y === student.y) {
        collectItem(item);
      }
    });
  }, [student, items, visibleCells]);

  const handleCellClick = (x: number, y: number) => {
    setStudent(prev => ({...prev, x, y}));
    setPath([]); // Clear path when manually moving
    
    // Update visibility for new position
    const newVisibleCells = Array(gridSize.height).fill(0).map(() => Array(gridSize.width).fill(false));
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < gridSize.width && newY >= 0 && newY < gridSize.height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= 2) {
            newVisibleCells[newY][newX] = true;
          }
        }
      }
    }
    setVisibleCells(newVisibleCells);
  };


  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Student Priority Simulator
      </h1>

      <div className="relative">
        <div
          className="grid gap-0.5 bg-gray-200 p-2 rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${gridSize.width}, 1.5rem)`,
            gridTemplateRows: `repeat(${gridSize.height}, 1.5rem)`
          }}
        >
          {Array(gridSize.height).fill(0).map((_, y) =>
            Array(gridSize.width).fill(0).map((_, x) => (
              <div
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                className={`${!fogOfWar || visibleCells[y][x] ? 'bg-white' : 'bg-gray-900'} flex items-center justify-center transition-colors relative cursor-pointer`}
              >
                {path.some(p => p.x === x && p.y === y) && (
                  <div className="absolute inset-0 bg-yellow-200 opacity-30" />
                )}
                {student.x === x && student.y === y && (
                  <Bot className="w-5 h-5 text-blue-500 relative z-10" />
                )}
                {items.map(item => {
                  if (item.x === x && item.y === y) {
                    const Icon = {
                      food: Apple,
                      medkit: Heart,
                      goal: Target
                    }[item.type];

                    const weight = calculateWeight(item);

                    return (
                      <div key={item.id} className="relative">
                        <Icon
                          className={`w-5 h-5 ${
                            selectedItem?.id === item.id
                              ? 'text-green-500'
                              : 'text-gray-500'
                          }`}
                        />
                        {visibleCells[y][x] && weight > 0 && (
                          <div className="absolute -top-3 -right-3 text-xs bg-white px-1 rounded shadow">
                            {Math.round(weight)}
                          </div>
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

      <div className="mt-4 flex gap-4 items-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-4 py-2 ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          } text-white rounded flex items-center gap-2`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Stop' : 'Start'} Simulation
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
          <Timer className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">{moveSpeed.toFixed(1)}s</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={moveSpeed}
            onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
            className="w-24"
          />
          <FastForward className="w-4 h-4 text-gray-600" />
        </div>
        <button
          onClick={() => {
            setFogOfWar(!fogOfWar);
            setVisibleCells(Array(gridSize.height).fill(0).map(() => Array(gridSize.width).fill(!fogOfWar)));
          }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2"
        >
          <Eye className="w-4 h-4 text-gray-600" />
          {fogOfWar ? 'Show All' : 'Enable Fog'}
        </button>
      </div>

      <div className="mt-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Student Status:</h2>
          <div className="space-y-4">
            <div>
              <div className="flex gap-2 items-center mb-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Health: {student.health}/{student.maxHealth}</span>
              </div>
              <div className="w-48 h-4 bg-gray-200 rounded">
                <div
                  className="h-full bg-red-500 rounded transition-all"
                  style={{ width: `${(student.health / student.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex gap-2 items-center mb-1">
                <Apple className="w-4 h-4 text-orange-500" />
                <span>Hunger: {student.hunger}/{student.maxHunger}</span>
              </div>
              <div className="w-48 h-4 bg-gray-200 rounded">
                <div
                  className="h-full bg-orange-500 rounded transition-all"
                  style={{ width: `${(student.hunger / student.maxHunger) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightedDecisions;
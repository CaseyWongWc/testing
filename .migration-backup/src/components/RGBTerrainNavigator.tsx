import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Target, HelpCircle, Play, Pause, Timer, FastForward, ArrowDownToLine, Move, ArrowRight } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  isPath: boolean;
  f: number;
  g_score: number;
  h: number;
  parent: Cell | null;
}

interface RGBTerrainNavigatorProps {
  width: number;
  height: number;
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  colorChange: {
    r: number;
    g: number;
    b: number;
  };
  cost: number;
  timestamp: number;
}

type PathMode = 'shortest' | 'easiest' | 'most-red' | 'most-green' | 'most-blue' | 
                'least-red' | 'least-green' | 'least-blue';

interface ColorMode {
  red: boolean;
  green: boolean;
  blue: boolean;
}

const RGBTerrainNavigator: React.FC<RGBTerrainNavigatorProps> = ({ width: initialWidth, height: initialHeight }) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [colorIntensity, setColorIntensity] = useState(0.5);
  const [colorVariation, setColorVariation] = useState(0.8);
  const [terrain, setTerrain] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: width - 1, y: height - 1 });
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [pathMode, setPathMode] = useState<PathMode>('shortest');
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [pathCost, setPathCost] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [pathStats, setPathStats] = useState<{
    avgRed: number;
    avgGreen: number;
    avgBlue: number;
    totalColorChange: number;
  }>({
    avgRed: 0,
    avgGreen: 0,
    avgBlue: 0,
    totalColorChange: 0
  });
  const [selectedColors, setSelectedColors] = useState<ColorMode>({
    red: false,
    green: false,
    blue: false
  });
  const [continuousPlay, setContinuousPlay] = useState(false);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const calculateCost = useCallback((current: Cell, next: Cell): number => {
    const isDiagonal = Math.abs(next.x - current.x) === 1 && Math.abs(next.y - current.y) === 1;
    const movementCost = isDiagonal ? Math.SQRT2 : 1;

    // Count active color channels
    const activeChannels = [
      selectedColors.red,
      selectedColors.green,
      selectedColors.blue
    ].filter(Boolean).length;

    // If no channels selected, use basic movement cost
    if (activeChannels === 0) {
      return movementCost;
    }

    // Calculate normalized vector components
    const normalizer = 1 / Math.sqrt(activeChannels);
    const colorVector = {
      r: selectedColors.red ? next.r * normalizer : 0,
      g: selectedColors.green ? next.g * normalizer : 0,
      b: selectedColors.blue ? next.b * normalizer : 0
    };

    switch (pathMode) {
      case 'most-red':
      case 'most-green':
      case 'most-blue': {
        // For "most" paths, we want high color values to have low cost
        const colorMagnitude = Math.sqrt(
          colorVector.r * colorVector.r +
          colorVector.g * colorVector.g +
          colorVector.b * colorVector.b
        );
        // Invert and normalize so higher values = lower cost
        return movementCost * (1 - colorMagnitude / Math.sqrt(255));
      }

      case 'least-red':
      case 'least-green':
      case 'least-blue': {
        // For "least" paths, we want high color values to have high cost
        const colorMagnitude = Math.sqrt(
          colorVector.r * colorVector.r +
          colorVector.g * colorVector.g +
          colorVector.b * colorVector.b
        );
        // Normalize so higher values = higher cost
        return movementCost * (colorMagnitude / Math.sqrt(255));
      }

      case 'easiest': {
        // Calculate color change as vector difference
        const currentVector = {
          r: selectedColors.red ? current.r * normalizer : 0,
          g: selectedColors.green ? current.g * normalizer : 0,
          b: selectedColors.blue ? current.b * normalizer : 0
        };

        const colorDiff = Math.sqrt(
          Math.pow((colorVector.r - currentVector.r), 2) +
          Math.pow((colorVector.g - currentVector.g), 2) +
          Math.pow((colorVector.b - currentVector.b), 2)
        );

        return movementCost * (colorDiff / Math.sqrt(255));
      }

      case 'shortest':
      default:
        return movementCost;
    }
  }, [pathMode, selectedColors]);

  const generateTerrain = useCallback(() => {
    const newTerrain: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        const baseColor = Math.random() * 255 * colorIntensity;
        const variation = colorVariation * 255;
        
        row.push({
          x,
          y,
          r: Math.floor(baseColor + (Math.random() - 0.5) * variation),
          g: Math.floor(baseColor + (Math.random() - 0.5) * variation),
          b: Math.floor(baseColor + (Math.random() - 0.5) * variation),
          isPath: false,
          f: 0,
          g_score: 0,
          h: 0,
          parent: null
        });
      }
      newTerrain.push(row);
    }
    
    setTerrain(newTerrain);
    setRobotPos({ x: 0, y: 0 });
    setGoalPos({ x: width - 1, y: height - 1 });
    setPath([]);
    setCurrentPathIndex(0);
    setPathCost(0);
    setIsAnimating(false);
    setContinuousPlay(false);
  }, [width, height, colorIntensity, colorVariation]);

  useEffect(() => {
    generateTerrain();
  }, [width, height]);

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        neighbors.push(terrain[newY][newX]);
      }
    }

    return neighbors;
  };

  const heuristic = (a: Cell, b: Cell) => {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.SQRT2 * Math.min(dx, dy) + Math.abs(dx - dy);
  };

  const findPath = useCallback(() => {
    const startCell = terrain[robotPos.y][robotPos.x];
    const goalCell = terrain[goalPos.y][goalPos.x];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    terrain.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g_score = 0;
      cell.h = 0;
      cell.parent = null;
    }));

    let totalCost = 0;

    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;

      openSet.forEach((cell, index) => {
        if (cell.f < current.f) {
          current = cell;
          currentIndex = index;
        }
      });

      if (current === goalCell) {
        const path: Cell[] = [];
        let temp = current;
        while (temp.parent) {
          path.push(temp);
          temp.isPath = true;
          totalCost += calculateCost(temp.parent, temp);
          temp = temp.parent;
        }
        setPath(path.reverse());
        setPathCost(totalCost);
        setCurrentPathIndex(0);
        return true;
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor)) continue;

        const tentativeG = current.g_score + calculateCost(current, neighbor);

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g_score) {
          continue;
        }

        neighbor.parent = current;
        neighbor.g_score = tentativeG;
        neighbor.h = heuristic(neighbor, goalCell);
        neighbor.f = neighbor.g_score + neighbor.h;
      }
    }

    return false;
  }, [terrain, robotPos, goalPos, calculateCost]);

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    if (e.ctrlKey) {
      if (x === goalPos.x && y === goalPos.y) return;
      setRobotPos({ x, y });
    } else {
      if (x === robotPos.x && y === robotPos.y) return;
      setGoalPos({ x, y });
    }
    
    const newTerrain = [...terrain];
    newTerrain.forEach(row => row.forEach(cell => cell.isPath = false));
    setTerrain(newTerrain);
    findPath();
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!isAnimating && !continuousPlay) return;

      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = moveSpeed * 1000;

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;
        
        if (path.length > 0 && currentPathIndex < path.length) {
          const nextCell = path[currentPathIndex];
          const prevCell = terrain[robotPos.y][robotPos.x];
          
          const colorChange = {
            r: Math.abs(nextCell.r - prevCell.r),
            g: Math.abs(nextCell.g - prevCell.g),
            b: Math.abs(nextCell.b - prevCell.b)
          };

          setMovements(prev => [{
            from: { ...robotPos },
            to: { x: nextCell.x, y: nextCell.y },
            colorChange,
            cost: calculateCost(prevCell, nextCell),
            timestamp: Date.now()
          }, ...prev.slice(0, 9)]);

          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setCurrentPathIndex(prev => prev + 1);
        } else {
          // If we've reached the end of our path but not the goal, or if continuous play is enabled
          if (continuousPlay || (robotPos.x !== goalPos.x || robotPos.y !== goalPos.y)) {
            findPath();
          } else {
            setIsAnimating(false);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating || continuousPlay) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      if (path.length === 0) {
        findPath();
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, continuousPlay, path, currentPathIndex, moveSpeed, robotPos, goalPos, terrain, calculateCost, findPath]);

  useEffect(() => {
    if (path.length > 0) {
      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;
      let totalColorChange = 0;

      path.forEach((cell, index) => {
        totalRed += cell.r;
        totalGreen += cell.g;
        totalBlue += cell.b;

        if (index > 0) {
          const prevCell = path[index - 1];
          totalColorChange += Math.abs(cell.r - prevCell.r) +
                            Math.abs(cell.g - prevCell.g) +
                            Math.abs(cell.b - prevCell.b);
        }
      });

      setPathStats({
        avgRed: totalRed / path.length,
        avgGreen: totalGreen / path.length,
        avgBlue: totalBlue / path.length,
        totalColorChange
      });
    }
  }, [path]);

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Width</span>
              <span className="text-sm text-gray-600">{width}</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Height</span>
              <span className="text-sm text-gray-600">{height}</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Color Variation</span>
              <span className="text-sm text-gray-600">{Math.round(colorVariation * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={colorVariation}
              onChange={(e) => setColorVariation(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Color Intensity</span>
              <span className="text-sm text-gray-600">{Math.round(colorIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={colorIntensity}
              onChange={(e) => setColorIntensity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={generateTerrain}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          Generate New Terrain
        </button>
        
        <div className="flex rounded-lg overflow-hidden bg-white shadow">
          <button
            onClick={() => {
              setPathMode('shortest');
              findPath();
            }}
            className={`px-4 py-2 flex items-center gap-2 transition-colors ${
              pathMode === 'shortest' ? 'bg-gray-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            <Move className="w-4 h-4" />
            Shortest
          </button>
          <button
            onClick={() => {
              setPathMode('most-red');
              findPath();
            }}
            className={`px-4 py-2 transition-colors ${
              pathMode.startsWith('most') ? 'bg-purple-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            Most Color
          </button>
          <button
            onClick={() => {
              setPathMode('least-red');
              findPath();
            }}
            className={`px-4 py-2 transition-colors ${
              pathMode.startsWith('least') ? 'bg-indigo-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            Least Color
          </button>
          <button
            onClick={() => {
              setPathMode('easiest');
              findPath();
            }}
            className={`px-4 py-2 flex items-center gap-2 transition-colors ${
              pathMode === 'easiest' ? 'bg-green-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Smoothest
          </button>
        </div>

        <div className="flex rounded-lg overflow-hidden bg-white shadow">
          <button
            onClick={() => {
              setSelectedColors(prev => ({ ...prev, red: !prev.red }));
              findPath();
            }}
            className={`px-4 py-2 transition-colors ${
              selectedColors.red ? 'bg-red-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            Red Channel
          </button>
          <button
            onClick={() => {
              setSelectedColors(prev => ({ ...prev, green: !prev.green }));
              findPath();
            }}
            className={`px-4 py-2 transition-colors ${
              selectedColors.green ? 'bg-green-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            Green Channel
          </button>
          <button
            onClick={() => {
              setSelectedColors(prev => ({ ...prev, blue: !prev.blue }));
              findPath();
            }}
            className={`px-4 py-2 transition-colors ${
              selectedColors.blue ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'
            }`}
          >
            Blue Channel
          </button>
        </div>

        <button
          onClick={() => {
            if (continuousPlay) {
              setContinuousPlay(false);
              setIsAnimating(false);
            } else {
              setContinuousPlay(true);
            }
          }}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            continuousPlay
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          }`}
        >
          {continuousPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {continuousPlay ? 'Stop' : 'Start'} Continuous Play
        </button>

        {!continuousPlay && (
          <button
            onClick={() => {
              if (path.length === 0) {
                findPath();
              }
              setIsAnimating(!isAnimating);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            disabled={continuousPlay}
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAnimating ? 'Stop' : 'Animate'} Robot
          </button>
        )}

        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg">
          <Timer className="w-4 h-4 text-gray-600" />
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={moveSpeed}
            onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{moveSpeed.toFixed(1)}s</span>
        </div>

        <button
          onClick={() => setShowLegend(!showLegend)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showLegend ? 'Hide' : 'Show'} Legend
        </button>
      </div>

      <div className="flex gap-8">
        <div className="w-64 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Path Statistics
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Average Red</span>
                  <span className="text-sm font-medium">{Math.round(pathStats.avgRed)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500"
                    style={{ width: `${(pathStats.avgRed / 255) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Average Green</span>
                  <span className="text-sm font-medium">{Math.round(pathStats.avgGreen)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: `${(pathStats.avgGreen / 255) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Average Blue</span>
                  <span className="text-sm font-medium">{Math.round(pathStats.avgBlue)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${(pathStats.avgBlue / 255) * 100}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Color Change</span>
                  <span className="text-sm font-medium">{pathStats.totalColorChange}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FastForward className="w-5 h-5 text-purple-500" />
              Recent Moves
            </h3>
            <div className="space-y-2">
              {movements.map((movement, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>({movement.from.x}, {movement.from.y})</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>({movement.to.x}, {movement.to.y})</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>ΔR: {movement.colorChange.r}</span>
                    <span>ΔG: {movement.colorChange.g}</span>
                    <span>ΔB: {movement.colorChange.b}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Cost: {movement.cost.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FastForward className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Path Cost: {pathCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Move className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Mode: {pathMode}</span>
            </div>
          </div>

          {showLegend && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm text-gray-600">Robot (Ctrl+Click to move)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                  <Target className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm text-gray-600">Goal (Click to set)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-200 border border-gray-300 rounded-sm"></div>
                <span className="text-sm text-gray-600">Found Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-6 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-sm"></div>
                <span className="text-sm text-gray-600">RGB Values</span>
              </div>
            </div>
          )}

          <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
            {terrain.map((row, y) => (
              <div key={y} className="flex gap-0.5">
                {row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    onClick={(e) => handleCellClick(x, y, e)}
                    className={`w-8 h-8 flex items-center justify-center transition-all cursor-pointer rounded-sm relative
                      ${cell.isPath ? 'ring-[10px] ring-white-400 ring-opacity-100 shadow-xl transform scale-130 z-10' : ''}`}
                    style={{
                      backgroundColor: `rgb(${cell.r}, ${cell.g}, ${cell.b})`,
                      boxShadow: cell.isPath ? '0 0 20px rgba(250, 204, 21, 0.7), inset 0 0 10px rgba(250, 204, 21, 0.5)' : 'none'
                    }}
                  >
                    {cell.isPath && (
                      <>
                        <div className="absolute inset-0 bg-yellow-400 opacity-25 rounded-sm" />
                        <div className="absolute inset-0 border-2 border-white opacity-30 rounded-sm" />
                      </>
                    )}
                    {robotPos.x === x && robotPos.y === y && (
                      <Bot className="w-6 h-6 text-white drop-shadow-lg z-20 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                    {goalPos.x === x && goalPos.y === y && (
                      <Target className="w-6 h-6 text-white drop-shadow-lg z-20 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RGBTerrainNavigator;
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Target, HelpCircle, Play, Pause, Mountain, ArrowDownToLine, Footprints, Move, Timer, FastForward } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  elevation: number;
  isPath: boolean;
  isVisited: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface TerrainGameProps {
  width: number;
  height: number;
  roughness: number;
}

const TerrainGame: React.FC<TerrainGameProps> = ({ width, height, roughness }) => {
  const [terrain, setTerrain] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: width - 1, y: height - 1 });
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [pathMode, setPathMode] = useState<'shortest' | 'easiest' | 'highest'>('shortest');
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [continuousPlay, setContinuousPlay] = useState(false);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    generateTerrain();
  }, [width, height, roughness]);

  const generateTerrain = () => {
    const newTerrain: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          elevation: 50,
          isPath: false,
          isVisited: false,
          f: 0,
          g: 0,
          h: 0,
          parent: null
        });
      }
      newTerrain.push(row);
    }

    const size = Math.max(width, height);
    const maxSize = Math.pow(2, Math.ceil(Math.log2(size)));
    
    newTerrain[0][0].elevation = Math.random() * 100;
    newTerrain[0][width-1].elevation = Math.random() * 100;
    newTerrain[height-1][0].elevation = Math.random() * 100;
    newTerrain[height-1][width-1].elevation = Math.random() * 100;

    const generateStep = (x: number, y: number, size: number, offset: number) => {
      if (size < 2) return;

      const half = size / 2;
      const scale = roughness * size;

      if (x + half < width && y + half < height) {
        const avg = (
          newTerrain[y][x].elevation +
          newTerrain[y][Math.min(x + size, width - 1)].elevation +
          newTerrain[Math.min(y + size, height - 1)][x].elevation +
          newTerrain[Math.min(y + size, height - 1)][Math.min(x + size, width - 1)].elevation
        ) / 4;
        
        newTerrain[y + half][x + half].elevation = 
          Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * scale));
      }

      const points = [
        [x + half, y],
        [x + size, y + half],
        [x + half, y + size],
        [x, y + half]
      ];

      for (const [px, py] of points) {
        if (px < width && py < height) {
          const values = [];
          if (py - half >= 0) values.push(newTerrain[py - half][px].elevation);
          if (py + half < height) values.push(newTerrain[py + half][px].elevation);
          if (px - half >= 0) values.push(newTerrain[py][px - half].elevation);
          if (px + half < width) values.push(newTerrain[py][px + half].elevation);
          
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          newTerrain[py][px].elevation = 
            Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * scale));
        }
      }

      generateStep(x, y, half, offset / 2);
      generateStep(x + half, y, half, offset / 2);
      generateStep(x, y + half, half, offset / 2);
      generateStep(x + half, y + half, half, offset / 2);
    };

    generateStep(0, 0, maxSize, roughness * 100);

    setTerrain(newTerrain);
    setRobotPos({ x: 0, y: 0 });
    setGoalPos({ x: width - 1, y: height - 1 });
    setPath([]);
    setCurrentPathIndex(0);
    setIsAnimating(false);
    setContinuousPlay(false);
  };

  const findPath = () => {
    const startCell = terrain[robotPos.y][robotPos.x];
    const goalCell = terrain[goalPos.y][goalPos.x];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    terrain.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g = 0;
      cell.h = 0;
      cell.parent = null;
      cell.isPath = false;
    }));

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
          temp = temp.parent;
        }
        setPath(path.reverse());
        setCurrentPathIndex(0);
        return true;
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor)) continue;

        const elevationDiff = Math.abs(neighbor.elevation - current.elevation);
        let cost = 1;

        const isDiagonal = Math.abs(neighbor.x - current.x) === 1 && Math.abs(neighbor.y - current.y) === 1;
        const movementCost = isDiagonal ? Math.SQRT2 : 1;

        switch (pathMode) {
          case 'easiest':
            cost = movementCost + elevationDiff * 2;
            break;
          case 'highest':
            cost = movementCost - (neighbor.elevation / 100);
            break;
          case 'shortest':
          default:
            cost = movementCost;
        }

        const tentativeG = current.g + cost;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, goalCell);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return false;
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
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

  const getElevationColor = (elevation: number) => {
    const value = Math.floor((elevation / 100) * 255);
    return `rgb(${value}, ${value}, ${value})`;
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
  }, [isAnimating, continuousPlay, path, currentPathIndex, moveSpeed, robotPos, goalPos]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        <button
          onClick={generateTerrain}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Generate New Terrain
        </button>
        <div className="flex rounded-lg overflow-hidden">
          <button
            onClick={() => {
              setPathMode('shortest');
              findPath();
            }}
            className={`px-4 py-2 flex items-center gap-2 transition-colors
              ${pathMode === 'shortest' 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <Move className="w-4 h-4" />
            Shortest Path
          </button>
          <button
            onClick={() => {
              setPathMode('easiest');
              findPath();
            }}
            className={`px-4 py-2 flex items-center gap-2 transition-colors
              ${pathMode === 'easiest' 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Easiest Path
          </button>
          <button
            onClick={() => {
              setPathMode('highest');
              findPath();
            }}
            className={`px-4 py-2 flex items-center gap-2 transition-colors
              ${pathMode === 'highest' 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <Mountain className="w-4 h-4" />
            Highest Path
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
          className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
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
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
            disabled={continuousPlay}
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAnimating ? 'Stop' : 'Animate'} Robot
          </button>
        )}
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
          <Timer className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600 w-12">{moveSpeed.toFixed(1)}s</span>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={moveSpeed}
            onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
            className="w-24"
          />
          <FastForward className="w-4 h-4 text-gray-600" />
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <HelpCircle className="w-5 h-5" />
          {showLegend ? 'Hide' : 'Show'} Legend
        </button>
      </div>

      {showLegend && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-24 h-6 bg-gradient-to-r from-black to-white rounded-sm"></div>
            <span className="text-sm text-gray-600">Elevation (Black: Low, White: High)</span>
          </div>
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
            <Move className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">8-Direction Movement</span>
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
                className={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer rounded-sm
                  ${cell.isPath ? 'bg-yellow-200' : ''}`}
                style={{
                  backgroundColor: cell.isPath ? undefined : getElevationColor(cell.elevation)
                }}
              >
                {robotPos.x === x && robotPos.y === y && (
                  <Bot className="w-4 h-4 text-blue-500" />
                )}
                {goalPos.x === x && goalPos.y === y && (
                  <Target className="w-4 h-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerrainGame;
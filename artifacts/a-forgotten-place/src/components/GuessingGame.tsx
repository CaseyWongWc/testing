import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Target, HelpCircle, Eye, Timer, FastForward, MapPin, ArrowRight, Play, Pause } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  elevation: number;
  isPath: boolean;
  isDirectPath: boolean;
  isVisible: boolean;
  isWall: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface GuessingGameProps {
  width: number;
  height: number;
  roughness: number;
  wallDensity?: number;
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'move' | 'guess';
  timestamp: number;
}

const GuessingGame: React.FC<GuessingGameProps> = ({ 
  width = 0, 
  height = 0, 
  roughness,
  wallDensity = 0.2 
}) => {
  const [terrain, setTerrain] = useState<Cell[][]>(() => {
    const validWidth = Math.max(1, Math.floor(width));
    const validHeight = Math.max(1, Math.floor(height));
    
    const grid: Cell[][] = [];
    for (let y = 0; y < validHeight; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < validWidth; x++) {
        row.push({
          x,
          y,
          elevation: 50,
          isPath: false,
          isDirectPath: false,
          isVisible: false,
          isWall: false,
          f: 0,
          g: 0,
          h: 0,
          parent: null
        });
      }
      grid.push(row);
    }
    return grid;
  });
  
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ 
    x: Math.max(0, Math.floor(width/2)), 
    y: Math.max(0, Math.floor(height/2)) 
  });
  const [robotGuessPos, setRobotGuessPos] = useState<{ x: number; y: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [visionRange, setVisionRange] = useState(10);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [autoMove, setAutoMove] = useState(false);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const autoMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (width > 0 && height > 0) {
      generateTerrain();
    }
  }, [width, height, roughness]);

  const updateVisibility = useCallback(() => {
    if (width <= 0 || height <= 0 || !terrain || terrain.length === 0 || !terrain[0]) return;

    const newTerrain = terrain.map(row => 
      row ? row.map(cell => ({
        ...cell,
        isVisible: false
      })) : []
    );

    if (newTerrain.length > 0 && newTerrain[0].length > 0) {
      for (let dy = -visionRange; dy <= visionRange; dy++) {
        for (let dx = -visionRange; dx <= visionRange; dx++) {
          const x = robotPos.x + dx;
          const y = robotPos.y + dy;
          
          if (x >= 0 && x < width && y >= 0 && y < height && newTerrain[y] && newTerrain[y][x]) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= visionRange) {
              newTerrain[y][x].isVisible = true;
            }
          }
        }
      }
    }

    setTerrain(newTerrain);
  }, [robotPos, visionRange, width, height, terrain]);

  useEffect(() => {
    updateVisibility();
  }, [robotPos, updateVisibility]);

  const generateTerrain = (density?: number) => {
    if (width <= 0 || height <= 0) return;

    const validWidth = Math.max(1, Math.floor(width));
    const validHeight = Math.max(1, Math.floor(height));
    
    const newTerrain: Cell[][] = [];
    const actualDensity = density !== undefined ? density : wallDensity;
    
    for (let y = 0; y < validHeight; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < validWidth; x++) {
        row.push({
          x,
          y,
          elevation: 50,
          isPath: false,
          isDirectPath: false,
          isVisible: false,
          isWall: Math.random() < actualDensity * roughness,
          f: 0,
          g: 0,
          h: 0,
          parent: null
        });
      }
      newTerrain.push(row);
    }

    if (newTerrain.length > 0 && newTerrain[0].length > 0) {
      newTerrain[0][0].elevation = Math.random() * 100;
      if (validWidth > 1) {
        newTerrain[0][validWidth-1].elevation = Math.random() * 100;
      }
      if (validHeight > 1) {
        newTerrain[validHeight-1][0].elevation = Math.random() * 100;
        if (validWidth > 1) {
          newTerrain[validHeight-1][validWidth-1].elevation = Math.random() * 100;
        }
      }
    }

    const generateStep = (x: number, y: number, size: number, scale: number) => {
      if (size < 2) return;
      if (x >= validWidth || y >= validHeight) return;

      const half = Math.floor(size / 2);
      const offset = roughness * scale;

      if (x + half < validWidth && y + half < validHeight) {
        const values = [];
        if (newTerrain[y]?.[x]?.elevation !== undefined) values.push(newTerrain[y][x].elevation);
        if (newTerrain[y]?.[x + size]?.elevation !== undefined) values.push(newTerrain[y][x + size].elevation);
        if (newTerrain[y + size]?.[x]?.elevation !== undefined) values.push(newTerrain[y + size][x].elevation);
        if (newTerrain[y + size]?.[x + size]?.elevation !== undefined) values.push(newTerrain[y + size][x + size].elevation);
        
        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          newTerrain[y + half][x + half].elevation = 
            Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * offset));
        }
      }

      const points = [
        [x + half, y],
        [x + size, y + half],
        [x + half, y + size],
        [x, y + half]
      ];

      for (const [px, py] of points) {
        if (px < validWidth && py < validHeight) {
          const values = [];
          if (py - half >= 0 && newTerrain[py - half]?.[px]?.elevation !== undefined) 
            values.push(newTerrain[py - half][px].elevation);
          if (py + half < validHeight && newTerrain[py + half]?.[px]?.elevation !== undefined) 
            values.push(newTerrain[py + half][px].elevation);
          if (px - half >= 0 && newTerrain[py]?.[px - half]?.elevation !== undefined) 
            values.push(newTerrain[py][px - half].elevation);
          if (px + half < validWidth && newTerrain[py]?.[px + half]?.elevation !== undefined) 
            values.push(newTerrain[py][px + half].elevation);
          
          if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            newTerrain[py][px].elevation = 
              Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * offset));
          }
        }
      }

      const newScale = scale * 0.5;
      generateStep(x, y, half, newScale);
      generateStep(x + half, y, half, newScale);
      generateStep(x, y + half, half, newScale);
      generateStep(x + half, y + half, half, newScale);
    };

    const maxSize = Math.pow(2, Math.ceil(Math.log2(Math.max(validWidth, validHeight))));
    generateStep(0, 0, maxSize, 100);

    setTerrain(newTerrain);
    setRobotGuessPos(null);
    setPath([]);
    
    setRobotPos(prev => ({
      x: Math.min(Math.max(0, prev.x), validWidth - 1),
      y: Math.min(Math.max(0, prev.y), validHeight - 1)
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed && !placementMode) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, placementMode]);

  const createDirectPath = (target: { x: number; y: number }) => {
    if (width <= 0 || height <= 0) return;

    const newTerrain = [...terrain];
    terrain.forEach(row => row.forEach(cell => {
      cell.isDirectPath = false;
    }));

    const points: [number, number][] = [];
    let x = robotPos.x;
    let y = robotPos.y;
    const dx = target.x - x;
    const dy = target.y - y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    if (steps > 0) {
      const xInc = dx / steps;
      const yInc = dy / steps;
      
      for (let i = 0; i <= steps; i++) {
        const px = Math.round(x + xInc * i);
        const py = Math.round(y + yInc * i);
        points.push([px, py]);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          newTerrain[py][px].isDirectPath = true;
        }
      }
    }

    setTerrain(newTerrain);
  };

  const findPathToVisionEdge = useCallback((target: { x: number; y: number }) => {
    if (width <= 0 || height <= 0) return;

    const dx = target.x - robotPos.x;
    const dy = target.y - robotPos.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToTarget <= visionRange) {
      setRobotGuessPos({ x: target.x, y: target.y });
      setPath([]);
      return;
    }

    const startCell = terrain[robotPos.y][robotPos.x];
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    terrain.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g = 0;
      cell.h = 0;
      cell.parent = null;
      cell.isPath = false;
    }));

    let pathFound = false;
    let bestCell: Cell | null = null;
    let bestScore = Infinity;

    const directPathCells = terrain.flat().filter(cell => cell.isDirectPath);
    const targetCell = terrain[target.y][target.x];

    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;

      openSet.forEach((cell, index) => {
        if (cell.f < current.f) {
          current = cell;
          currentIndex = index;
        }
      });

      if (current.isDirectPath) {
        const distanceToTarget = Math.abs(current.x - target.x) + Math.abs(current.y - target.y);
        if (distanceToTarget < bestScore) {
          bestScore = distanceToTarget;
          bestCell = current;
        }
      }

      if (!current.isVisible && bestCell) {
        pathFound = true;
        const path: Cell[] = [];
        let temp = bestCell;
        while (temp.parent) {
          path.push(temp);
          temp.isPath = true;
          temp = temp.parent;
        }
        const finalPath = path.reverse();
        setPath(finalPath);
        
        if (finalPath.length > 0) {
          const lastCell = finalPath[finalPath.length - 1];
          setRobotGuessPos({ x: lastCell.x, y: lastCell.y });
        }
        break;
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor) || neighbor.isWall) continue;

        const directPathBonus = neighbor.isDirectPath ? 0.5 : 1;
        const tentativeG = current.g + directPathBonus;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = Math.abs(neighbor.x - target.x) + Math.abs(neighbor.y - target.y);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    if (!pathFound) {
      setPath([]);
      setRobotGuessPos(null);
    }
  }, [terrain, robotPos, visionRange, width, height]);

  const getValidNeighbors = (cell: Cell) => {
    if (width <= 0 || height <= 0) return [];

    const neighbors: Cell[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !terrain[newY][newX].isWall) {
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          if (!terrain[cell.y][newX].isWall && !terrain[newY][cell.x].isWall) {
            neighbors.push(terrain[newY][newX]);
          }
        } else {
          neighbors.push(terrain[newY][newX]);
        }
      }
    }

    return neighbors;
  };

  const findPathToPoint = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (width <= 0 || height <= 0) return [];

    const startCell = terrain[start.y][start.x];
    const endCell = terrain[end.y][end.x];
    
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

      if (current === endCell) {
        const path: Cell[] = [];
        let temp = current;
        while (temp.parent) {
          path.push(temp);
          temp.isPath = true;
          temp = temp.parent;
        }
        return path.reverse();
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor) || neighbor.isWall) continue;

        const tentativeG = current.g + 1;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = Math.abs(neighbor.x - endCell.x) + Math.abs(neighbor.y - endCell.y);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return [];
  };

  useEffect(() => {
    if (!autoMove) {
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }
      return;
    }

    const moveToNextPoint = () => {
      if (!cursorPos) return;

      if (!isAnimating) {
        const pathToPoint = findPathToPoint(robotPos, cursorPos);
        if (pathToPoint.length > 0) {
          setPath(pathToPoint);
          setCurrentPathIndex(0);
          setIsAnimating(true);
        }
      }

      autoMoveTimeoutRef.current = setTimeout(moveToNextPoint, moveSpeed * 1000);
    };

    moveToNextPoint();

    return () => {
      if (autoMoveTimeoutRef.current) {
        clearTimeout(autoMoveTimeoutRef.current);
      }
    };
  }, [autoMove, cursorPos, isAnimating, robotPos, moveSpeed]);

  const handleCellClick = (x: number, y: number) => {
    if (width <= 0 || height <= 0) return;

    if (placementMode) {
      const prevPos = { ...robotPos };
      setRobotPos({ x, y });
      setMovements(prev => [{
        from: prevPos,
        to: { x, y },
        type: 'move',
        timestamp: Date.now()
      }, ...prev.slice(0, 9)]);
      updateVisibility();
      if (cursorPos) {
        createDirectPath(cursorPos);
        findPathToVisionEdge(cursorPos);
      }
    } else if (autoMove) {
      createDirectPath({ x, y });
      findPathToVisionEdge({ x, y });
      if (robotGuessPos) {
        setMovements(prev => [{
          from: robotPos,
          to: robotGuessPos,
          type: 'guess',
          timestamp: Date.now()
        }, ...prev.slice(0, 9)]);
      }
    } else if (!isSpacePressed) {
      createDirectPath({ x, y });
      findPathToVisionEdge({ x, y });
      if (robotGuessPos) {
        setMovements(prev => [{
          from: robotPos,
          to: robotGuessPos,
          type: 'guess',
          timestamp: Date.now()
        }, ...prev.slice(0, 9)]);
      }
    } else {
      setIsAnimating(true);
      const pathToPoint = findPathToPoint(robotPos, { x, y });
      if (pathToPoint.length > 0) {
        setPath(pathToPoint);
        setCurrentPathIndex(0);
      }
    }
  };

  const handleCellHover = (x: number, y: number) => {
    setCursorPos({ x, y });
  };

  const getElevationColor = (elevation: number) => {
    const value = Math.floor((elevation / 100) * 255);
    return `rgb(${value}, ${value}, ${value})`;
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!isAnimating) return;

      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = moveSpeed * 1000;

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;
        
        // Update paths before moving
        if (cursorPos) {
          createDirectPath(cursorPos);
          findPathToVisionEdge(cursorPos);
        }

        if (path.length > 0 && currentPathIndex < path.length) {
          const nextCell = path[currentPathIndex];
          const prevPos = { ...robotPos };
          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setCurrentPathIndex(prev => prev + 1);
          
          setMovements(prev => [{
            from: prevPos,
            to: { x: nextCell.x, y: nextCell.y },
            type: 'move',
            timestamp: Date.now()
          }, ...prev.slice(0, 9)]);

          // Update visibility and paths after moving
          updateVisibility();
        } else {
          setIsAnimating(false);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, path, currentPathIndex, moveSpeed, robotPos, cursorPos]);

  if (width <= 0 || height <= 0) {
    return <div className="text-red-500">Invalid dimensions: Width and height must be greater than 0</div>;
  }

  return (
    <div className="flex gap-8">
      <div className="w-64 bg-white p-4 rounded-lg shadow-md h-fit">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FastForward className="w-5 h-5 text-blue-500" />
          Movement Log
        </h3>
        <div className="space-y-2">
          {movements.map((movement, index) => (
            <div key={index} className="text-sm flex items-center gap-2 text-gray-600">
              <span>({movement.from.x}, {movement.from.y})</span>
              <ArrowRight className="w-4 h-4" />
              <span>({movement.to.x}, {movement.to.y})</span>
              <span className={`text-xs ${movement.type === 'guess' ? 'text-yellow-500' : 'text-blue-500'}`}>
                {movement.type === 'guess' ? 'Guess' : 'Move'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <button
            onClick={() => generateTerrain()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            New Terrain
          </button>
          <button
            onClick={() => setPlacementMode(!placementMode)}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2
              ${placementMode 
                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            disabled={autoMove}
          >
            <MapPin className="w-4 h-4" />
            {placementMode ? 'Exit Place Mode' : 'Place Mode'}
          </button>
          <button
            onClick={() => setAutoMove(!autoMove)}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2
              ${autoMove 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            disabled={placementMode}
          >
            {autoMove ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoMove ? 'Stop Auto-Move' : 'Start Auto-Move'}
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Vision Range:</span>
            <input
              type="range"
              min="5"
              max="15"
              value={visionRange}
              onChange={(e) => {
                setVisionRange(parseInt(e.target.value));
                updateVisibility();
                if (cursorPos) {
                  findPathToVisionEdge(cursorPos);
                }
              }}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{visionRange}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
            <span className="text-sm text-gray-600">Wall Density:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={wallDensity * 100}
              onChange={(e) => {
                const newDensity = parseInt(e.target.value) / 100;
                generateTerrain(newDensity);
              }}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{Math.round(wallDensity * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
            <span className="text-sm text-gray-600">Terrain Intensity:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={roughness * 100}
              onChange={(e) => {
                const newRoughness = parseInt(e.target.value) / 100;
                generateTerrain(wallDensity);
              }}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{Math.round(roughness * 100)}%</span>
          </div>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <p className="text-gray-600">
            {placementMode 
              ? 'Click anywhere to place the robot'
              : autoMove
                ? 'Click anywhere to set the target point - robot will move automatically!'
                : <>Hold <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> and click to move the robot.
                   Release and click to make a guess!</>}
          </p>
        </div>

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-600">Robot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <Target className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="text-sm text-gray-600">Robot Guess</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-gray-600">Cursor Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border border-gray-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Vision Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 border border-gray-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Path to Vision Edge</span>
            
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 border border-gray-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Direct Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-gradient-to-r from-black to-white rounded-sm"></div>
              <span className="text-sm text-gray-600">Elevation (Black: Low, White: High)</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
          <Timer className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Move Speed:</span>
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

        <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
          {terrain.map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onMouseEnter={() => handleCellHover(x, y)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer rounded-sm
                    ${cell.isWall ? 'bg-gray-900' : ''}
                    ${cell.isPath ? 'bg-yellow-200' : ''}
                    ${cell.isDirectPath ? 'bg-green-200' : ''}
                    ${cell.isVisible ? 'ring-2 ring-blue-300' : ''}`}
                  style={{
                    backgroundColor: cell.isPath || cell.isDirectPath || cell.isWall
                      ? undefined 
                      : getElevationColor(cell.elevation)
                  }}
                >
                  {robotPos.x === x && robotPos.y === y && (
                    <Bot className="w-5 h-5 text-blue-500" />
                  )}
                  {robotGuessPos?.x === x && robotGuessPos?.y === y && (
                    <Target className="w-5 h-5 text-yellow-500" />
                  )}
                  {cursorPos?.x === x && cursorPos?.y === y && !cell.isWall && (
                    <MapPin className="w-5 h-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuessingGame;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Target, HelpCircle, Play, Pause, Timer, FastForward, Hammer, ArrowRight, Sparkles } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  isVisited: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  timestamp: number;
}

interface FollowMeGameProps {
  width: number;
  height: number;
  wallDensity: number;
  stopInterval: number;
}

const FollowMeGame: React.FC<FollowMeGameProps> = ({ width, height, wallDensity, stopInterval }) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: width - 1, y: height - 1 });
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [editMode, setEditMode] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [isTargetMoving, setIsTargetMoving] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showTeleport, setShowTeleport] = useState(false);
  const [teleportCount, setTeleportCount] = useState(0);
  const [useChessMovement, setUseChessMovement] = useState(false);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const targetStopTimeRef = useRef<number>(0);
  const currentPathIndexRef = useRef<number>(0);

  useEffect(() => {
    generateMaze();
  }, [width, height, wallDensity]);

  const initializeMaze = () => {
    const newMaze: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          isWall: false,
          isPath: false,
          isVisited: false,
          f: 0,
          g: 0,
          h: 0,
          parent: null
        });
      }
      newMaze.push(row);
    }
    return newMaze;
  };

  const findRandomEmptyCell = (currentMaze: Cell[][], excludePositions: Set<string>) => {
    let x, y;
    do {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
    } while (currentMaze[y][x].isWall || excludePositions.has(`${x},${y}`));
    return { x, y };
  };

  const generateMaze = () => {
    const newMaze = initializeMaze();
    
    // Add random walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < wallDensity) {
          newMaze[y][x].isWall = true;
        }
      }
    }

    // Clear start and target positions
    const usedPositions = new Set<string>();
    
    // Set robot position
    const robotStart = findRandomEmptyCell(newMaze, usedPositions);
    usedPositions.add(`${robotStart.x},${robotStart.y}`);
    newMaze[robotStart.y][robotStart.x].isWall = false;
    
    // Set target position
    const targetStart = findRandomEmptyCell(newMaze, usedPositions);
    newMaze[targetStart.y][targetStart.x].isWall = false;

    setMaze(newMaze);
    setRobotPos(robotStart);
    setTargetPos(targetStart);
    setPath([]);
    setMoveCount(0);
    setIsTargetMoving(true);
    targetStopTimeRef.current = performance.now();
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = useChessMovement 
      ? [[0, 1], [1, 0], [0, -1], [-1, 0]]  // Orthogonal only
      : [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]; // All 8 directions

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !maze[newY][newX].isWall) {
        neighbors.push(maze[newY][newX]);
      }
    }

    return neighbors;
  };

  const heuristic = (a: Cell, b: Cell) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  const findPath = useCallback(() => {
    const startCell = maze[robotPos.y][robotPos.x];
    const goalCell = maze[targetPos.y][targetPos.x];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    // Reset path visualization
    maze.forEach(row => row.forEach(cell => {
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

      if (current.x === goalCell.x && current.y === goalCell.y) {
        const path: Cell[] = [];
        let temp = current;
        while (temp.parent) {
          path.push(maze[temp.y][temp.x]);
          maze[temp.y][temp.x].isPath = true;
          temp = temp.parent;
        }
        setPath(path.reverse());
        return true; // Path found
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor)) continue;

        const tentativeG = current.g + 1;

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

    setPath([]);
    return false; // No path found
  }, [maze, robotPos.x, robotPos.y, targetPos.x, targetPos.y]);

  const moveTarget = useCallback(() => {
    const neighbors = getValidNeighbors(maze[targetPos.y][targetPos.x]);
    if (neighbors.length === 0) return false;

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    setTargetPos({ x: next.x, y: next.y });
    return true;
  }, [maze, targetPos]);

  const teleportBothToNewPositions = useCallback(() => {
    const usedPositions = new Set<string>();
    
    // Find new position for robot
    const newRobotPos = findRandomEmptyCell(maze, usedPositions);
    usedPositions.add(`${newRobotPos.x},${newRobotPos.y}`);
    
    // Find new position for target
    const newTargetPos = findRandomEmptyCell(maze, usedPositions);
    
    setRobotPos(newRobotPos);
    setTargetPos(newTargetPos);
    setShowTeleport(true);
    setTeleportCount(prev => prev + 1);
    
    // Hide teleport effect after animation
    setTimeout(() => setShowTeleport(false), 500);
    
    return true;
  }, [maze]);

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

        // Check if robot caught target while it was stopped
        if (!isTargetMoving && robotPos.x === targetPos.x && robotPos.y === targetPos.y) {
          teleportBothToNewPositions();
          findPath();
          return;
        }

        // Handle target movement and stopping
        if (isTargetMoving) {
          if ((timestamp - targetStopTimeRef.current) >= stopInterval * 1000) {
            setIsTargetMoving(false);
            targetStopTimeRef.current = timestamp;
            
            // Check if path exists to stopped target
            if (!findPath()) {
              // If no path exists, teleport both to new positions
              teleportBothToNewPositions();
              findPath();
            }
          } else {
            moveTarget();
          }
        } else {
          if ((timestamp - targetStopTimeRef.current) >= 2000) {
            setIsTargetMoving(true);
            targetStopTimeRef.current = timestamp;
          }
        }

        // Move robot along path
        if (path.length > 0 && currentPathIndexRef.current < path.length) {
          const nextCell = path[currentPathIndexRef.current];
          const prevPos = { ...robotPos };
          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setMoveCount(prev => prev + 1);
          setMovements(prev => [
            { 
              from: prevPos,
              to: { x: nextCell.x, y: nextCell.y },
              timestamp: Date.now()
            },
            ...prev
          ].slice(0, 10));
          currentPathIndexRef.current++;
        } else {
          findPath();
          currentPathIndexRef.current = 0;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      currentPathIndexRef.current = 0;
      findPath();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, moveSpeed, findPath, robotPos, targetPos, maze, isTargetMoving, stopInterval, teleportBothToNewPositions]);

  const handleCellClick = (x: number, y: number) => {
    if (!editMode) return;

    const newMaze = [...maze];
    newMaze[y][x].isWall = !newMaze[y][x].isWall;
    setMaze(newMaze);

    // If we're placing a wall where the robot or target is, move them
    if (newMaze[y][x].isWall) {
      if (robotPos.x === x && robotPos.y === y) {
        const newPos = findRandomEmptyCell(newMaze, new Set([`${targetPos.x},${targetPos.y}`]));
        setRobotPos(newPos);
      }
      if (targetPos.x === x && targetPos.y === y) {
        const newPos = findRandomEmptyCell(newMaze, new Set([`${robotPos.x},${robotPos.y}`]));
        setTargetPos(newPos);
      }
    }

    findPath();
  };

  return (
    <div className="flex gap-8">
      {/* Movement Log Panel */}
      <div className="w-64 bg-white p-4 rounded-lg shadow-md h-fit">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FastForward className="w-5 h-5 text-blue-500" />
          Movement Log
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm bg-purple-50 p-2 rounded">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-purple-700">Teleports: {teleportCount}</span>
          </div>
          <div className="space-y-2">
            {movements.map((movement, index) => (
              <div key={index} className="text-sm flex items-center gap-2 text-gray-600">
                <span>({movement.from.x}, {movement.from.y})</span>
                <ArrowRight className="w-4 h-4" />
                <span>({movement.to.x}, {movement.to.y})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <button
            onClick={generateMaze}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
          <button
            onClick={() => {
              if (!isAnimating) {
                findPath();
              }
              setIsAnimating(!isAnimating);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAnimating ? 'Stop' : 'Start'} Game
          </button>
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
            onClick={() => setUseChessMovement(!useChessMovement)}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2
              ${useChessMovement 
                ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-4 h-4"
            >
              <path d="M8 16l-6-6 6-6"/>
              <path d="M2 10h20"/>
              <path d="M16 16l6-6-6-6"/>
            </svg>
            {useChessMovement ? 'Chess Movement On' : 'Chess Movement Off'}
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2
              ${editMode 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Hammer className="w-4 h-4" />
            {editMode ? 'Exit Edit Mode' : 'Edit Walls'}
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <FastForward className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Moves: {moveCount}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <Target className={`w-5 h-5 ${isTargetMoving ? 'text-red-500' : 'text-green-500'}`} />
            <span className="font-medium">Target: {isTargetMoving ? 'Moving' : 'Stopped'}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`w-5 h-5 ${useChessMovement ? 'text-indigo-500' : 'text-gray-400'}`}
            >
              <path d="M8 16l-6-6 6-6"/>
              <path d="M2 10h20"/>
              <path d="M16 16l6-6-6-6"/>
            </svg>
            <span className="font-medium">Movement: {useChessMovement ? 'Chess' : 'Free'}</span>
          </div>
        </div>

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded-sm"></div>
              <span className="text-sm text-gray-600">Wall {editMode && '(Click to toggle)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-600">Robot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <Target className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-gray-600">Moving Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 border border-gray-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Path</span>
            </div>
          </div>
        )}

        <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
          {maze.map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm
                    ${cell.isWall ? 'bg-gray-900' : 'bg-white'}
                    ${cell.isPath ? 'bg-yellow-200' : ''}
                    ${showTeleport && ((x === robotPos.x && y === robotPos.y) || (x === targetPos.x && y === targetPos.y)) 
                      ? 'animate-pulse bg-purple-200' : ''}
                    ${editMode && !cell.isWall ? 'hover:bg-gray-100 cursor-pointer' : ''}
                    ${editMode && cell.isWall ? 'hover:bg-gray-800 cursor-pointer' : ''}
                  `}
                >
                  {robotPos.x === x && robotPos.y === y && (
                    <Bot className={`w-5 h-5 text-blue-500 ${showTeleport ? 'animate-spin' : ''}`} />
                  )}
                  {targetPos.x === x && targetPos.y === y && (
                    <Target className={`w-5 h-5 ${isTargetMoving ? 'text-red-500' : 'text-green-500'} 
                      ${showTeleport ? 'animate-spin' : ''}`} 
                    />
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

export default FollowMeGame;
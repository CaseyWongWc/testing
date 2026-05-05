import React, { useState, useEffect, useRef } from 'react';
import { Bot, Target, HelpCircle, Play, Pause, Timer, FastForward, Eye } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  isVisible: boolean;
  wasVisible: boolean;
  isVisited: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface DarkGameProps {
  width: number;
  height: number;
  wallDensity: number;
  visionRange: number;
}

const DarkGame: React.FC<DarkGameProps> = ({ width, height, wallDensity, visionRange }) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: width - 1, y: height - 1 });
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [moveCount, setMoveCount] = useState(0);
  const [backtrackCount, setBacktrackCount] = useState(0);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

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
          isWall: true,
          isPath: false,
          isVisible: false,
          wasVisible: false,
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

  const carvePassages = (maze: Cell[][], startX: number, startY: number) => {
    const stack: [number, number][] = [[startX, startY]];
    maze[startY][startX].isWall = false;

    while (stack.length > 0) {
      const [currentX, currentY] = stack[stack.length - 1];
      const directions = [
        [0, -1], // North
        [1, 0],  // East
        [0, 1],  // South
        [-1, 0]  // West
      ].sort(() => Math.random() - 0.5);

      let foundNext = false;

      for (const [dx, dy] of directions) {
        const newX = currentX + (dx * 2);
        const newY = currentY + (dy * 2);

        if (newX >= 0 && newX < width && newY >= 0 && newY < height && maze[newY][newX].isWall) {
          // Carve through walls
          maze[currentY + dy][currentX + dx].isWall = false;
          maze[newY][newX].isWall = false;
          
          stack.push([newX, newY]);
          foundNext = true;
          break;
        }
      }

      if (!foundNext) {
        stack.pop();
      }
    }
  };

  const generateMaze = () => {
    const newMaze = initializeMaze();
    
    // Generate base maze using recursive backtracking
    carvePassages(newMaze, 0, 0);

    // Add some random walls based on density
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!newMaze[y][x].isWall && Math.random() < wallDensity && 
            !(x === 0 && y === 0) && !(x === width-1 && y === height-1)) {
          newMaze[y][x].isWall = true;
        }
      }
    }

    // Ensure path exists
    makePathPossible(newMaze);
    
    // Clear start and end positions
    newMaze[0][0].isWall = false;
    newMaze[height-1][width-1].isWall = false;
    
    setMaze(newMaze);
    setRobotPos({ x: 0, y: 0 });
    setGoalPos({ x: width - 1, y: height - 1 });
    setPath([]);
    setCurrentPathIndex(0);
    setIsAnimating(false);
    setMoveCount(0);
    setBacktrackCount(0);
    
    // Update initial visibility
    updateVisibility(newMaze, { x: 0, y: 0 });
  };

  const makePathPossible = (maze: Cell[][]) => {
    const visited: boolean[][] = Array(height).fill(false).map(() => Array(width).fill(false));
    const queue: [number, number][] = [[0, 0]];
    visited[0][0] = true;

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;

      if (x === width - 1 && y === height - 1) {
        return true;
      }

      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;

        if (newX >= 0 && newX < width && newY >= 0 && newY < height &&
            !visited[newY][newX] && !maze[newY][newX].isWall) {
          visited[newY][newX] = true;
          queue.push([newX, newY]);
        }
      }
    }

    // If no path exists, clear a path
    let x = 0, y = 0;
    while (x < width - 1 || y < height - 1) {
      maze[y][x].isWall = false;
      if (x < width - 1) x++;
      else if (y < height - 1) y++;
    }
    maze[height-1][width-1].isWall = false;
  };

  const updateVisibility = (currentMaze: Cell[][], pos: { x: number, y: number }) => {
    // Reset visibility but keep wasVisible state
    const newMaze = currentMaze.map(row => 
      row.map(cell => ({
        ...cell,
        isVisible: false
      }))
    );

    // Update visibility in range
    for (let dy = -visionRange; dy <= visionRange; dy++) {
      for (let dx = -visionRange; dx <= visionRange; dx++) {
        const x = pos.x + dx;
        const y = pos.y + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= visionRange) {
            newMaze[y][x].isVisible = true;
            newMaze[y][x].wasVisible = true;
          }
        }
      }
    }

    return newMaze;
  };

  const findPath = () => {
    const startCell = maze[robotPos.y][robotPos.x];
    const goalCell = maze[goalPos.y][goalPos.x];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
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
        if (closedSet.includes(neighbor) || 
            (neighbor.wasVisible && neighbor.isWall)) continue;

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

    return false;
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        neighbors.push(maze[newY][newX]);
      }
    }

    return neighbors;
  };

  const heuristic = (a: Cell, b: Cell) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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
        
        if (path.length > 0 && currentPathIndex < path.length) {
          const nextCell = path[currentPathIndex];
          
          // Update robot position
          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setCurrentPathIndex(prev => prev + 1);
          setMoveCount(prev => prev + 1);
          
          // Update visibility
          const newMaze = updateVisibility(maze, { x: nextCell.x, y: nextCell.y });
          setMaze(newMaze);

          // If we discover a wall in our path, recalculate
          if (newMaze[nextCell.y][nextCell.x].isWall) {
            setPath([]);
            setCurrentPathIndex(0);
            setBacktrackCount(prev => prev + 1);
            findPath();
          }
        } else {
          // If we've reached the end of our path but not the goal, recalculate
          if (robotPos.x !== goalPos.x || robotPos.y !== goalPos.y) {
            findPath();
          } else {
            setIsAnimating(false);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      findPath();
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, path, currentPathIndex, maze, moveSpeed]);

  return (
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
          {isAnimating ? 'Stop' : 'Start'} Robot
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
          <Eye className="w-5 h-5 text-purple-500" />
          <span className="font-medium">Vision Range: {visionRange}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
          <FastForward className="w-5 h-5 rotate-180 text-red-500" />
          <span className="font-medium">Backtracks: {backtrackCount}</span>
        </div>
      </div>

      {showLegend && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-sm"></div>
            <span className="text-sm text-gray-600">Wall</span>
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
            <span className="text-sm text-gray-600">Goal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 border border-gray-300 rounded-sm"></div>
            <span className="text-sm text-gray-600">Visible Area</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 border border-gray-300 rounded-sm"></div>
            <span className="text-sm text-gray-600">Explored Area</span>
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
                className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm
                  ${cell.isVisible ? 'bg-blue-100' : cell.wasVisible ? 'bg-gray-100' : 'bg-gray-800'}
                  ${cell.isWall && (cell.isVisible || cell.wasVisible) ? 'bg-gray-900' : ''}
                  ${cell.isPath && cell.isVisible ? 'bg-yellow-200' : ''}
                `}
              >
                {robotPos.x === x && robotPos.y === y && (
                  <Bot className="w-5 h-5 text-blue-500" />
                )}
                {goalPos.x === x && goalPos.y === y && (
                  <Target className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DarkGame;
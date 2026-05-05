import React, { useState, useEffect, useRef } from 'react';
import { Bot, Target, HelpCircle, Play, Pause, Timer, FastForward } from 'lucide-react';

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

interface MazeGameProps {
  width: number;
  height: number;
  wallDensity: number;
}

type MazeAlgorithm = 'recursive-backtracking' | 'prims' | 'recursive-division';

const MazeGame: React.FC<MazeGameProps> = ({ width, height, wallDensity }) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [goalPos, setGoalPos] = useState<{ x: number; y: number }>({ x: width - 1, y: height - 1 });
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [algorithm, setAlgorithm] = useState<MazeAlgorithm>('recursive-backtracking');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    generateMaze();
  }, [width, height, wallDensity, algorithm]);

  const initializeMaze = (allWalls: boolean = true) => {
    const newMaze: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          isWall: allWalls,
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

  const generateMaze = () => {
    let newMaze: Cell[][];
    
    switch (algorithm) {
      case 'prims':
        newMaze = generatePrimsMaze();
        break;
      case 'recursive-division':
        newMaze = generateRecursiveDivisionMaze();
        break;
      case 'recursive-backtracking':
      default:
        newMaze = generateRecursiveBacktrackingMaze();
    }

    // Add random walls based on density
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
    
    setMaze(newMaze);
    setRobotPos({ x: 0, y: 0 });
    setGoalPos({ x: width - 1, y: height - 1 });
    setPath([]);
    setCurrentPathIndex(0);
    setIsAnimating(false);
  };

  const generateRecursiveBacktrackingMaze = () => {
    const newMaze = initializeMaze(true);
    const stack: Cell[] = [];
    const start = newMaze[0][0];
    start.isWall = false;
    start.isVisited = true;
    stack.push(start);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = getUnvisitedNeighbors(current, newMaze, 2);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        next.isVisited = true;
        next.isWall = false;

        const dx = next.x - current.x;
        const dy = next.y - current.y;
        newMaze[current.y + dy/2][current.x + dx/2].isWall = false;

        stack.push(next);
      }
    }

    return newMaze;
  };

  const generatePrimsMaze = () => {
    const newMaze = initializeMaze(true);
    const walls: Cell[] = [];
    
    // Start with the top-left cell
    newMaze[0][0].isWall = false;
    
    // Add walls around the starting cell
    if (width > 2) walls.push(newMaze[0][2]);
    if (height > 2) walls.push(newMaze[2][0]);

    while (walls.length > 0) {
      const randomIndex = Math.floor(Math.random() * walls.length);
      const wall = walls[randomIndex];
      walls.splice(randomIndex, 1);

      const neighbors = getUnvisitedNeighbors(wall, newMaze, 2);
      if (neighbors.length > 0) {
        const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        wall.isWall = false;
        neighbor.isWall = false;

        // Connect the cells
        const dx = neighbor.x - wall.x;
        const dy = neighbor.y - wall.y;
        newMaze[wall.y + dy/2][wall.x + dx/2].isWall = false;

        // Add new walls
        for (const dir of [[0, 2], [2, 0], [0, -2], [-2, 0]]) {
          const newX = neighbor.x + dir[0];
          const newY = neighbor.y + dir[1];
          if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
            const newWall = newMaze[newY][newX];
            if (newWall.isWall && !walls.includes(newWall)) {
              walls.push(newWall);
            }
          }
        }
      }
    }

    return newMaze;
  };

  const generateRecursiveDivisionMaze = () => {
    const newMaze = initializeMaze(false);
    
    // Add outer walls
    for (let x = 0; x < width; x++) {
      newMaze[0][x].isWall = true;
      newMaze[height - 1][x].isWall = true;
    }
    for (let y = 0; y < height; y++) {
      newMaze[y][0].isWall = true;
      newMaze[y][width - 1].isWall = true;
    }

    // Clear start and end
    newMaze[0][0].isWall = false;
    newMaze[height - 1][width - 1].isWall = false;

    const divide = (x: number, y: number, w: number, h: number) => {
      if (w < 3 || h < 3) return;

      // Decide where to divide
      let divideHorizontally = h > w;
      
      // Calculate division coordinates
      let wallX = x + (divideHorizontally ? 0 : Math.floor(Math.random() * (w - 2)));
      let wallY = y + (divideHorizontally ? Math.floor(Math.random() * (h - 2)) : 0);
      
      // Calculate passage coordinate
      let passageX = wallX + (divideHorizontally ? Math.floor(Math.random() * w) : 0);
      let passageY = wallY + (divideHorizontally ? 0 : Math.floor(Math.random() * h));

      // Build walls
      for (let i = 0; i < (divideHorizontally ? w : h); i++) {
        const cx = wallX + (divideHorizontally ? i : 0);
        const cy = wallY + (divideHorizontally ? 0 : i);
        if (cx !== passageX || cy !== passageY) {
          newMaze[cy][cx].isWall = true;
        }
      }

      // Recursively divide sub-chambers
      if (divideHorizontally) {
        divide(x, y, w, wallY - y + 1);
        divide(x, wallY + 1, w, h - (wallY - y + 1));
      } else {
        divide(x, y, wallX - x + 1, h);
        divide(wallX + 1, y, w - (wallX - x + 1), h);
      }
    };

    divide(1, 1, width - 2, height - 2);
    return newMaze;
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
      if (x < width - 1) {
        x++;
        maze[y][x].isWall = false;
      }
      if (y < height - 1) {
        y++;
        maze[y][x].isWall = false;
      }
    }
  };

  const getUnvisitedNeighbors = (cell: Cell, maze: Cell[][], step: number = 1) => {
    const neighbors: Cell[] = [];
    const directions = [
      { x: 0, y: -step },  // Up
      { x: step, y: 0 },   // Right
      { x: 0, y: step },   // Down
      { x: -step, y: 0 }   // Left
    ];

    for (const dir of directions) {
      const newX = cell.x + dir.x;
      const newY = cell.y + dir.y;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !maze[newY][newX].isVisited) {
        neighbors.push(maze[newY][newX]);
      }
    }

    return neighbors;
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
        return;
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
        neighbor.h = heuristic(neighbor, goalCell);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

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

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    if (maze[y][x].isWall) return;
    
    if (e.ctrlKey) {
      if (x === goalPos.x && y === goalPos.y) return;
      setRobotPos({ x, y });
    } else {
      if (x === robotPos.x && y === robotPos.y) return;
      setGoalPos({ x, y });
    }
    
    const newMaze = [...maze];
    newMaze.forEach(row => row.forEach(cell => cell.isPath = false));
    setMaze(newMaze);
    findPath();
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!isAnimating) return;

      // Calculate delta time since last frame
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Accumulate time until we reach our target frame time
      accumulatedTimeRef.current += deltaTime;
      const frameTime = moveSpeed * 1000; // Convert seconds to milliseconds

      // Only update if enough time has passed
      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;
        
        if (path.length > 0 && currentPathIndex < path.length) {
          const nextCell = path[currentPathIndex];
          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setCurrentPathIndex(prev => prev + 1);
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
  }, [isAnimating, currentPathIndex, path, moveSpeed]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 mb-4 flex-wrap justify-center">
        <div className="flex rounded-lg overflow-hidden">
          <button
            onClick={() => {
              setAlgorithm('recursive-backtracking');
              generateMaze();
            }}
            className={`px-4 py-2 transition-colors
              ${algorithm === 'recursive-backtracking'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Recursive Backtracking
          </button>
          <button
            onClick={() => {
              setAlgorithm('prims');
              generateMaze();
            }}
            className={`px-4 py-2 transition-colors
              ${algorithm === 'prims'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Prim's Algorithm
          </button>
          <button
            onClick={() => {
              setAlgorithm('recursive-division');
              generateMaze();
            }}
            className={`px-4 py-2 transition-colors
              ${algorithm === 'recursive-division'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Recursive Division
          </button>
        </div>
        <button
          onClick={generateMaze}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Generate New Maze
        </button>
        <button
          onClick={() => {
            if (path.length === 0) {
              findPath();
            }
            setIsAnimating(!isAnimating);
          }}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isAnimating ? 'Stop' : 'Animate'} Robot
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
        </div>
      )}

      <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
        {maze.map((row, y) => (
          <div key={y} className="flex gap-0.5">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                onClick={(e) => !cell.isWall && handleCellClick(x, y, e)}
                className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer rounded-sm
                  ${cell.isWall 
                    ? 'bg-gray-900' 
                    : 'bg-white hover:bg-blue-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#f0f0f0_2px,#f0f0f0_4px)]'}
                  ${cell.isPath ? 'bg-yellow-200 !bg-none' : ''}
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

export default MazeGame;
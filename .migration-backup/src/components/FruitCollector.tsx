import React, { useState, useEffect, useCallback } from 'react';
import { Bot, HelpCircle, Play, Pause, Cherry, Timer, FastForward } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  hasFruit: boolean;
  isVisited: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface FruitCollectorProps {
  width: number;
  height: number;
  wallDensity: number;
  fruitCount: number;
}

const FruitCollector: React.FC<FruitCollectorProps> = ({ width, height, wallDensity, fruitCount }) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [path, setPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [remainingFruits, setRemainingFruits] = useState<{ x: number, y: number }[]>([]);
  const [moveSpeed, setMoveSpeed] = useState(0.5); // Default to 0.5 seconds
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    generateMaze();
  }, [width, height, wallDensity, fruitCount]);

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
          hasFruit: false,
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
    const newMaze = initializeMaze();
    
    // Add random walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < wallDensity && !(x === 0 && y === 0)) {
          newMaze[y][x].isWall = true;
        }
      }
    }

    // Place fruits
    const fruits: { x: number, y: number }[] = [];
    while (fruits.length < fruitCount) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      if (!newMaze[y][x].isWall && !(x === 0 && y === 0) && !fruits.some(f => f.x === x && f.y === y)) {
        fruits.push({ x, y });
        newMaze[y][x].hasFruit = true;
      }
    }

    setMaze(newMaze);
    setRobotPos({ x: 0, y: 0 });
    setRemainingFruits(fruits);
    setPath([]);
    setCurrentPathIndex(0);
    setIsAnimating(false);
    setScore(0);
    setMoves(0);
  };

  const findPathToNearestFruit = useCallback(() => {
    if (remainingFruits.length === 0) return;

    const startCell = maze[robotPos.y][robotPos.x];
    let shortestPath: Cell[] = [];
    let nearestFruit = remainingFruits[0];
    let shortestDistance = Infinity;

    // Find the nearest fruit
    for (const fruit of remainingFruits) {
      const path = findPath(startCell, maze[fruit.y][fruit.x]);
      if (path && path.length < shortestDistance) {
        shortestDistance = path.length;
        shortestPath = path;
        nearestFruit = fruit;
      }
    }

    if (shortestPath.length > 0) {
      setPath(shortestPath);
      setCurrentPathIndex(0);
    }
  }, [maze, robotPos, remainingFruits]);

  const findPath = (start: Cell, goal: Cell) => {
    const openSet: Cell[] = [start];
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

      if (current === goal) {
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
        neighbor.h = heuristic(neighbor, goal);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return null;
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

  useEffect(() => {
    let animationFrame: number;
    let timeoutId: NodeJS.Timeout;
    
    const animate = () => {
      if (isAnimating && path.length > 0 && currentPathIndex < path.length) {
        const nextCell = path[currentPathIndex];
        setRobotPos({ x: nextCell.x, y: nextCell.y });
        setMoves(prev => prev + 1);
        
        if (nextCell.hasFruit) {
          setScore(prev => prev + 100);
          const newMaze = [...maze];
          newMaze[nextCell.y][nextCell.x].hasFruit = false;
          setMaze(newMaze);
          setRemainingFruits(prev => prev.filter(f => !(f.x === nextCell.x && f.y === nextCell.y)));
        }

        setCurrentPathIndex(prev => prev + 1);
        
        timeoutId = setTimeout(() => {
          animationFrame = requestAnimationFrame(animate);
        }, moveSpeed * 1000); // Convert seconds to milliseconds
      } else {
        setIsAnimating(false);
        if (remainingFruits.length > 0) {
          findPathToNearestFruit();
        }
      }
    };

    if (isAnimating) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAnimating, currentPathIndex, path, maze, moveSpeed, remainingFruits, findPathToNearestFruit]);

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
            if (remainingFruits.length > 0) {
              findPathToNearestFruit();
              setIsAnimating(!isAnimating);
            }
          }}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
          disabled={remainingFruits.length === 0}
        >
          {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isAnimating ? 'Stop' : 'Start'} Robot
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
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
          <Cherry className="w-5 h-5 text-red-500" />
          <span className="font-medium">Score: {score}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
          <FastForward className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Moves: {moves}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
          <Cherry className="w-5 h-5 text-purple-500" />
          <span className="font-medium">Fruits Left: {remainingFruits.length}</span>
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
              <Cherry className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-gray-600">Fruit</span>
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
                  ${cell.isWall 
                    ? 'bg-gray-900' 
                    : 'bg-white'}
                  ${cell.isPath ? 'bg-yellow-200' : ''}
                `}
              >
                {robotPos.x === x && robotPos.y === y && (
                  <Bot className="w-5 h-5 text-blue-500" />
                )}
                {cell.hasFruit && (
                  <Cherry className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FruitCollector;
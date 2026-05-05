import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, FastForward, Eye } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface Student {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  targetX: number | null;
  targetY: number | null;
  currentPathIndex: number;
}

const Pathfinder: React.FC = () => {
  const [gridSize] = useState({ width: 10, height: 10 });
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [student, setStudent] = useState<Student>({
    x: 5,
    y: 5,
    health: 80,
    maxHealth: 100,
    hunger: 70,
    maxHunger: 100,
    targetX: null,
    targetY: null,
    currentPathIndex: 0
  });
  // We'll track walls in the grid state instead
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [showAllPaths, setShowAllPaths] = useState(false);

  // Initialize grid
  useEffect(() => {
    initializeGrid();
  }, []);

  // Movement and path following logic
  useEffect(() => {
    if (!isPlaying || currentPath.length === 0 || student.currentPathIndex >= currentPath.length) {
      return;
    }

    const moveInterval = setInterval(() => {
      setStudent(prev => {
        if (prev.currentPathIndex >= currentPath.length) {
          clearInterval(moveInterval);
          return prev;
        }

        const nextPosition = currentPath[prev.currentPathIndex];
        
        // Update health and hunger based on movement
        const newHealth = Math.max(0, prev.health - 1);
        const newHunger = Math.max(0, prev.hunger - 2);
        
        return {
          ...prev,
          x: nextPosition.x,
          y: nextPosition.y,
          health: newHealth,
          hunger: newHunger,
          currentPathIndex: prev.currentPathIndex + 1
        };
      });
    }, 1000 / moveSpeed);

    return () => clearInterval(moveInterval);
  }, [isPlaying, currentPath, moveSpeed]);

  const initializeGrid = () => {
    // Create base grid
    const newGrid: Cell[][] = Array(gridSize.height)
      .fill(null)
      .map((_, y) =>
        Array(gridSize.width)
          .fill(null)
          .map((_, x) => ({
            x,
            y,
            isWall: false,
            isPath: false,
            f: 0,
            g: 0,
            h: 0,
            parent: null
          }))
      );

    // Add some walls in a cross pattern
    // Create a simple cross pattern
    for (let i = 0; i < gridSize.width; i++) {
      if (i === 3 || i === 4 || i === 5 || i === 6) continue; // Leave opening in the middle
      if (newGrid[4] && newGrid[4][i]) newGrid[4][i].isWall = true;
      if (newGrid[5] && newGrid[5][i]) newGrid[5][i].isWall = true;
    }
    
    for (let i = 0; i < gridSize.height; i++) {
      if (i === 3 || i === 4 || i === 5 || i === 6) continue; // Leave opening in the middle
      if (newGrid[i] && newGrid[i][4]) newGrid[i][4].isWall = true;
      if (newGrid[i] && newGrid[i][5]) newGrid[i][5].isWall = true;
    }
    
    // Apply wall updates to grid
    setGrid(newGrid);
  };

  // A* pathfinding algorithm
  const findPath = useCallback((startX: number, startY: number, targetX: number, targetY: number) => {
    if (!grid.length) return [];
    
    // Clone the grid to avoid modifying the original
    const pathGrid: Cell[][] = grid.map(row => 
      row.map(cell => ({...cell, f: 0, g: 0, h: 0, parent: null, isPath: false}))
    );
    
    const start = pathGrid[startY][startX];
    const end = pathGrid[targetY][targetX];
    
    // Don't try to path to a wall
    if (end.isWall) return [];
    
    const openSet: Cell[] = [start];
    const closedSet: Cell[] = [];
    
    while (openSet.length > 0) {
      // Find the node with the lowest f value
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      
      const current = openSet[lowestIndex];
      
      // Found the path to the end
      if (current.x === end.x && current.y === end.y) {
        let temp = current;
        const path: {x: number, y: number}[] = [];
        
        while (temp.parent) {
          path.push({x: temp.x, y: temp.y});
          temp = temp.parent;
        }
        
        return path.reverse();
      }
      
      // Move current from open to closed set
      openSet.splice(lowestIndex, 1);
      closedSet.push(current);
      
      // Check all neighboring cells
      const neighbors = getNeighbors(current, pathGrid);
      
      for (const neighbor of neighbors) {
        // Skip if already evaluated or is a wall
        if (closedSet.some(c => c.x === neighbor.x && c.y === neighbor.y) || neighbor.isWall) {
          continue;
        }
        
        const tentativeG = current.g + 1;
        const inOpenSet = openSet.some(c => c.x === neighbor.x && c.y === neighbor.y);
        
        if (!inOpenSet || tentativeG < neighbor.g) {
          neighbor.parent = current;
          neighbor.g = tentativeG;
          neighbor.h = heuristic(neighbor, end);
          neighbor.f = neighbor.g + neighbor.h;
          
          if (!inOpenSet) {
            openSet.push(neighbor);
          }
        }
      }
    }
    
    // No path found
    return [];
  }, [grid]);

  // Get valid neighboring cells
  const getNeighbors = (cell: Cell, grid: Cell[][]) => {
    const neighbors: Cell[] = [];
    const {x, y} = cell;
    
    // Cardinal directions only (no diagonals)
    const dirs = [
      {dx: 1, dy: 0},
      {dx: -1, dy: 0},
      {dx: 0, dy: 1},
      {dx: 0, dy: -1}
    ];
    
    for (const dir of dirs) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      
      // Check bounds
      if (newX >= 0 && newX < gridSize.width && newY >= 0 && newY < gridSize.height) {
        neighbors.push(grid[newY][newX]);
      }
    }
    
    return neighbors;
  };

  // Manhattan distance heuristic
  const heuristic = (a: Cell, b: Cell) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  // Handle grid cell click - set target location and calculate path
  const handleCellClick = (x: number, y: number) => {
    if (grid[y][x].isWall) return;
    
    const path = findPath(student.x, student.y, x, y);
    
    setCurrentPath(path);
    setStudent(prev => ({
      ...prev,
      targetX: x,
      targetY: y,
      currentPathIndex: 0
    }));
  };

  // Start/pause simulation
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Reset simulation
  const resetSimulation = () => {
    setIsPlaying(false);
    setStudent({
      x: 5,
      y: 5,
      health: 80,
      maxHealth: 100,
      hunger: 70,
      maxHunger: 100,
      targetX: null,
      targetY: null,
      currentPathIndex: 0
    });
    setCurrentPath([]);
    initializeGrid();
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-bold mb-4">Student Priority Simulator</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-10 gap-0.5">
          {grid.map((row, y) => 
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                  cell.isWall ? 'bg-gray-800' : 
                  (student.x === x && student.y === y) ? 'bg-blue-500' : 
                  (showAllPaths && currentPath.some(p => p.x === x && p.y === y)) ? 'bg-green-200' : 
                  'bg-white hover:bg-blue-100'
                }`}
                onClick={() => handleCellClick(x, y)}
              >
                {student.x === x && student.y === y && (
                  <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12.5C13.1046 12.5 14 11.6046 14 10.5C14 9.39543 13.1046 8.5 12 8.5C10.8954 8.5 10 9.39543 10 10.5C10 11.6046 10.8954 12.5 12 12.5Z" fill="white"/>
                      <path d="M12 21C13.1046 21 14 20.1046 14 19C14 17.8954 13.1046 17 12 17C10.8954 17 10 17.8954 10 19C10 20.1046 10.8954 21 12 21Z" fill="white"/>
                      <path d="M12 4C13.1046 4 14 3.10457 14 2C14 0.89543 13.1046 0 12 0C10.8954 0 10 0.89543 10 2C10 3.10457 10.8954 4 12 4Z" fill="white"/>
                      <path d="M19 13C20.1046 13 21 12.1046 21 11C21 9.89543 20.1046 9 19 9C17.8954 9 17 9.89543 17 11C17 12.1046 17.8954 13 19 13Z" fill="white"/>
                      <path d="M5 13C6.10457 13 7 12.1046 7 11C7 9.89543 6.10457 9 5 9C3.89543 9 3 9.89543 3 11C3 12.1046 3.89543 13 5 13Z" fill="white"/>
                    </svg>
                  </div>
                )}
                {student.targetX === x && student.targetY === y && !cell.isWall && !(student.x === x && student.y === y) && (
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex gap-2 mb-4">
        <button 
          onClick={togglePlay}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {isPlaying ? <RotateCcw size={16} /> : <Play size={16} />} {isPlaying ? 'Stop Simulation' : 'Start Simulation'}
        </button>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-600">Speed:</span>
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1" 
            value={moveSpeed}
            onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
            className="w-32"
          />
          <FastForward size={16} className="text-gray-600" />
        </div>
        
        <button 
          onClick={() => setShowAllPaths(!showAllPaths)}
          className={`flex items-center gap-1 px-4 py-2 ${
            showAllPaths ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700'
          } rounded hover:bg-gray-300 transition`}
        >
          <Eye size={16} /> Show All
        </button>

        <button 
          onClick={resetSimulation}
          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition ml-2"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>
      
      <div className="mt-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Student Status:</h2>
          <div className="space-y-4">
            <div>
              <div className="flex gap-2 items-center mb-1">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
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
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.05 9.79L10 7.5v9l3.05-2.29L16 12l-2.95-2.21zm0 0L10 7.5v9l3.05-2.29L16 12l-2.95-2.21z" />
                </svg>
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

export default Pathfinder;
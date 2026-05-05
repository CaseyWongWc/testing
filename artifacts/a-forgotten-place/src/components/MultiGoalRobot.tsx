import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Target, HelpCircle, Play, Pause, Mountain, ArrowDownToLine, Timer, FastForward, ArrowRight, Move } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  isVisited: boolean;
  elevation: number;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
}

interface Goal {
  x: number;
  y: number;
  collected: boolean;
  pathCost: number;
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  goalIndex: number;
  pathCost: number;
  timestamp: number;
}

interface MultiGoalRobotProps {
  width: number;
  height: number;
  wallDensity: number;
  roughness: number;
  terrainIntensity: number;
  goalCount: number;
}

const MultiGoalRobot: React.FC<MultiGoalRobotProps> = ({ 
  width, 
  height, 
  wallDensity, 
  roughness,
  terrainIntensity,
  goalCount 
}) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentPath, setCurrentPath] = useState<Cell[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState<number>(-1);
  const [pathfindingMode, setPathfindingMode] = useState<'nearest' | 'easiest'>('nearest');
  const [movementMode, setMovementMode] = useState<'orthogonal' | 'free'>('orthogonal');
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    generateMaze();
  }, [width, height, wallDensity, roughness, terrainIntensity, goalCount]);

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
          elevation: 50,
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

  const generateTerrain = (maze: Cell[][]) => {
    maze[0][0].elevation = Math.random() * 100;
    maze[0][width-1].elevation = Math.random() * 100;
    maze[height-1][0].elevation = Math.random() * 100;
    maze[height-1][width-1].elevation = Math.random() * 100;

    const generateStep = (x: number, y: number, size: number, scale: number) => {
      if (size < 2) return;

      const half = Math.floor(size / 2);
      const offset = roughness * scale * terrainIntensity;

      if (x + half < width && y + half < height) {
        const avg = (
          maze[y][x].elevation +
          maze[y][Math.min(x + size, width - 1)].elevation +
          maze[Math.min(y + size, height - 1)][x].elevation +
          maze[Math.min(y + size, height - 1)][Math.min(x + size, width - 1)].elevation
        ) / 4;
        
        maze[y + half][x + half].elevation = 
          Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * offset));
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
          if (py - half >= 0) values.push(maze[py - half][px].elevation);
          if (py + half < height) values.push(maze[py + half][px].elevation);
          if (px - half >= 0) values.push(maze[py][px - half].elevation);
          if (px + half < width) values.push(maze[py][px + half].elevation);
          
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          maze[py][px].elevation = 
            Math.max(0, Math.min(100, avg + (Math.random() * 2 - 1) * offset));
        }
      }

      const newScale = scale * 0.5;
      generateStep(x, y, half, newScale);
      generateStep(x + half, y, half, newScale);
      generateStep(x, y + half, half, newScale);
      generateStep(x + half, y + half, half, newScale);
    };

    const maxSize = Math.pow(2, Math.ceil(Math.log2(Math.max(width, height))));
    generateStep(0, 0, maxSize, 100);

    return maze;
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
    let newMaze = initializeMaze();
    
    newMaze = generateTerrain(newMaze);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < wallDensity) {
          newMaze[y][x].isWall = true;
        }
      }
    }

    const usedPositions = new Set<string>();
    
    const robotStart = findRandomEmptyCell(newMaze, usedPositions);
    usedPositions.add(`${robotStart.x},${robotStart.y}`);
    newMaze[robotStart.y][robotStart.x].isWall = false;
    
    const newGoals: Goal[] = [];
    for (let i = 0; i < goalCount; i++) {
      const goalPos = findRandomEmptyCell(newMaze, usedPositions);
      usedPositions.add(`${goalPos.x},${goalPos.y}`);
      newMaze[goalPos.y][goalPos.x].isWall = false;
      newGoals.push({
        x: goalPos.x,
        y: goalPos.y,
        collected: false,
        pathCost: 0
      });
    }

    setMaze(newMaze);
    setRobotPos(robotStart);
    setGoals(newGoals);
    setCurrentPath([]);
    setCurrentPathIndex(0);
    setMovements([]);
    setCurrentGoalIndex(-1);
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = movementMode === 'orthogonal' 
      ? [[-1, 0], [1, 0], [0, -1], [0, 1]]  // Orthogonal movement
      : [  // Free movement (including diagonals)
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],          [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !maze[newY][newX].isWall) {
        // For diagonal movement, check if both adjacent cells are not walls
        if (movementMode === 'free' && Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          if (!maze[cell.y][newX].isWall && !maze[newY][cell.x].isWall) {
            neighbors.push(maze[newY][newX]);
          }
        } else {
          neighbors.push(maze[newY][newX]);
        }
      }
    }

    return neighbors;
  };

  const heuristic = (a: Cell, b: Cell) => {
    return movementMode === 'orthogonal'
      ? Math.abs(a.x - b.x) + Math.abs(a.y - b.y)  // Manhattan distance for orthogonal
      : Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));  // Chebyshev distance for free movement
  };

  const findPath = useCallback((start: { x: number, y: number }, goal: { x: number, y: number }) => {
    const startCell = maze[start.y][start.x];
    const goalCell = maze[goal.y][goal.x];
    
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
        let pathCost = 0;
        while (temp.parent) {
          path.push(temp);
          temp.isPath = true;
          pathCost += pathfindingMode === 'easiest' ? temp.elevation / 10 : 1;
          temp = temp.parent;
        }
        return { path: path.reverse(), cost: pathCost };
      }

      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      const neighbors = getValidNeighbors(current);

      for (const neighbor of neighbors) {
        if (closedSet.includes(neighbor)) continue;

        const movementCost = pathfindingMode === 'easiest' 
          ? neighbor.elevation / 10 
          : 1;
        
        const tentativeG = current.g + movementCost;

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

    return { path: [], cost: Infinity };
  }, [maze, pathfindingMode, movementMode]);

  const findNextGoal = useCallback(() => {
    const uncollectedGoals = goals.filter(g => !g.collected);
    if (uncollectedGoals.length === 0) return -1;

    let bestGoalIndex = -1;
    let bestMetric = Infinity;

    uncollectedGoals.forEach(goal => {
      const { path, cost } = findPath(robotPos, goal);
      const index = goals.findIndex(g => g.x === goal.x && g.y === goal.y);
      
      const metric = pathfindingMode === 'easiest' ? cost : path.length;
      
      if (metric < bestMetric) {
        bestMetric = metric;
        bestGoalIndex = index;
      }
    });

    return bestGoalIndex;
  }, [goals, robotPos, findPath, pathfindingMode]);

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

        if (currentPath.length === 0 || currentPathIndex >= currentPath.length) {
          const nextGoalIndex = findNextGoal();
          
          if (nextGoalIndex === -1) {
            setIsAnimating(false);
            return;
          }

          const nextGoal = goals[nextGoalIndex];
          const { path, cost } = findPath(robotPos, nextGoal);
          
          if (path.length > 0) {
            setCurrentPath(path);
            setCurrentPathIndex(0);
            setCurrentGoalIndex(nextGoalIndex);
            
            const updatedGoals = [...goals];
            updatedGoals[nextGoalIndex].pathCost = cost;
            setGoals(updatedGoals);
          }
        }

        if (currentPath.length > 0 && currentPathIndex < currentPath.length) {
          const nextCell = currentPath[currentPathIndex];
          const prevPos = { ...robotPos };
          
          setRobotPos({ x: nextCell.x, y: nextCell.y });
          setCurrentPathIndex(prev => prev + 1);

          if (currentGoalIndex !== -1 && 
              nextCell.x === goals[currentGoalIndex].x && 
              nextCell.y === goals[currentGoalIndex].y) {
            const updatedGoals = [...goals];
            updatedGoals[currentGoalIndex].collected = true;
            setGoals(updatedGoals);
          }

          setMovements(prev => [{
            from: prevPos,
            to: { x: nextCell.x, y: nextCell.y },
            goalIndex: currentGoalIndex,
            pathCost: nextCell.elevation / 10,
            timestamp: Date.now()
          }, ...prev.slice(0, 9)]);
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
  }, [isAnimating, currentPath, currentPathIndex, robotPos, goals, moveSpeed, findPath, findNextGoal, currentGoalIndex]);

  return (
    <div className="flex gap-8">
      <div className="w-64 bg-white p-4 rounded-lg shadow-md h-fit">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Goals Status
        </h3>
        <div className="space-y-4">
          {goals.map((goal, index) => (
            <div 
              key={index}
              className={`p-2 rounded ${goal.collected ? 'bg-green-50' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 text-sm">
                <Target className={`w-4 h-4 ${goal.collected ? 'text-green-500' : 'text-gray-500'}`} />
                <span className={goal.collected ? 'text-green-700' : 'text-gray-700'}>
                  Goal {index + 1}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Position: ({goal.x}, {goal.y})
                {goal.pathCost > 0 && (
                  <div>Path Cost: {goal.pathCost.toFixed(1)}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-4 flex items-center gap-2">
          <FastForward className="w-5 h-5 text-purple-500" />
          Recent Moves
        </h3>
        <div className="space-y-2">
          {movements.map((movement, index) => (
            <div key={index} className="text-sm flex items-center gap-2 text-gray-600">
              <span>({movement.from.x}, {movement.from.y})</span>
              <ArrowRight className="w-4 h-4" />
              <span>({movement.to.x}, {movement.to.y})</span>
              <span className="text-xs text-gray-400">
                Cost: {movement.pathCost.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <button
            onClick={generateMaze}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setPathfindingMode('nearest')}
              className={`px-4 py-2 transition-colors flex items-center gap-2
                ${pathfindingMode === 'nearest'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Target className="w-4 h-4" />
              Nearest First
            </button>
            <button
              onClick={() => setPathfindingMode('easiest')}
              className={`px-4 py-2 transition-colors flex items-center gap-2
                ${pathfindingMode === 'easiest'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              Easiest First
            </button>
          </div>
          <button
            onClick={() => setMovementMode(mode => mode === 'orthogonal' ? 'free' : 'orthogonal')}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2
              ${movementMode === 'free'
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Move className="w-4 h-4" />
            {movementMode === 'free' ? 'Free Movement' : 'Orthogonal Movement'}
          </button>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
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
                <Target className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-sm text-gray-600">Collected Goal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                <Target className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-600">Uncollected Goal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 border border-gray-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Current Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 bg-gradient-to-r from-white to-gray-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Elevation (Light to Dark)</span>
            </div>
            <div className="flex items-center gap-2">
              <Move className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">
                Movement: {movementMode === 'free' ? '8-Direction' : '4-Direction'}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
          {maze.map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((cell, x) => {
                const goal = goals.find(g => g.x === x && g.y === y);
                return (
                  <div
                    key={`${x},${y}`}
                    className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm
                      ${cell.isWall ? 'bg-gray-900' : ''}
                      ${!cell.isWall ? `bg-gray-${Math.floor(cell.elevation / 10) * 100}` : ''}
                      ${cell.isPath ? 'bg-yellow-200' : ''}
                    `}
                    style={{
                      backgroundColor: cell.isWall 
                        ? undefined 
                        : cell.isPath 
                          ? undefined 
                          : `rgb(${255 - cell.elevation * terrainIntensity}, ${255 - cell.elevation * terrainIntensity}, ${255 - cell.elevation * terrainIntensity})`
                    }}
                  >
                    {robotPos.x === x && robotPos.y === y && (
                      <Bot className="w-5 h-5 text-blue-500" />
                    )}
                    {goal && (
                      <Target className={`w-5 h-5 ${goal.collected ? 'text-green-500' : 'text-gray-500'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiGoalRobot;
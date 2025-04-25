import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, HelpCircle, Play, Pause, Timer, FastForward, Hammer, ArrowRight, Sparkles } from 'lucide-react';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null;
  robotPaths: { robotId: number; color: string }[];
}

interface Robot {
  id: number;
  x: number;
  y: number;
  isIt: boolean;
  path: Cell[];
  pathIndex: number;
  color: string;
  lastTagTime: number;
  status: string;
}

interface Movement {
  robotId: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'move' | 'tag';
  timestamp: number;
}

interface TagGameProps {
  width: number;
  height: number;
  wallDensity: number;
  robotCount: number;
}

const TagGame: React.FC<TagGameProps> = ({ width, height, wallDensity, robotCount }) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [editMode, setEditMode] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lastTagLocation, setLastTagLocation] = useState<{ x: number, y: number } | null>(null);
  const [continuousPlay, setContinuousPlay] = useState(false);
  const [teleportCount, setTeleportCount] = useState(0);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const colors = ['blue', 'red', 'green', 'purple', 'orange'];
  const TAG_COOLDOWN = 2000;

  useEffect(() => {
    generateMaze();
  }, [width, height, wallDensity, robotCount]);

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
          f: 0,
          g: 0,
          h: 0,
          parent: null,
          robotPaths: []
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
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < wallDensity) {
          newMaze[y][x].isWall = true;
        }
      }
    }

    const newRobots: Robot[] = [];
    const usedPositions = new Set<string>();

    for (let i = 0; i < robotCount; i++) {
      const pos = findRandomEmptyCell(newMaze, usedPositions);
      usedPositions.add(`${pos.x},${pos.y}`);
      
      newRobots.push({
        id: i,
        x: pos.x,
        y: pos.y,
        isIt: i === 0,
        path: [],
        pathIndex: 0,
        color: colors[i],
        lastTagTime: 0,
        status: 'Active'
      });
    }

    setMaze(newMaze);
    setRobots(newRobots);
    setMovements([]);
    setLastTagLocation(null);
    setTeleportCount(0);
    setIsAnimating(false);
    setContinuousPlay(false);
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

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

  const findPath = useCallback((start: { x: number; y: number }, goal: { x: number; y: number }) => {
    const startCell = maze[start.y][start.x];
    const goalCell = maze[goal.y][goal.x];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    maze.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g = 0;
      cell.h = 0;
      cell.parent = null;
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
          temp = temp.parent;
        }
        return path.reverse();
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

    return [];
  }, [maze, width, height]);

  const updatePaths = useCallback(() => {
    const newMaze = [...maze];
    const newRobots = [...robots];

    // Clear all existing paths
    newMaze.forEach(row => row.forEach(cell => {
      cell.robotPaths = [];
    }));

    // Find path for "it" robot first
    const itRobot = newRobots.find(r => r.isIt);
    if (!itRobot) return;

    const nonItRobots = newRobots.filter(r => !r.isIt);
    if (nonItRobots.length === 0) return;

    // Find closest target for "it" robot
    let closestTarget = nonItRobots[0];
    let shortestDistance = Infinity;
    let shortestPath: Cell[] = [];

    for (const target of nonItRobots) {
      const path = findPath(
        { x: itRobot.x, y: itRobot.y },
        { x: target.x, y: target.y }
      );
      
      if (path.length > 0 && path.length < shortestDistance) {
        shortestDistance = path.length;
        shortestPath = path;
        closestTarget = target;
      }
    }

    if (shortestPath.length > 0) {
      itRobot.path = shortestPath;
      itRobot.pathIndex = 0;
      itRobot.status = `Chasing ${closestTarget.color} robot`;

      // Mark path on maze
      shortestPath.forEach(cell => {
        newMaze[cell.y][cell.x].robotPaths.push({
          robotId: itRobot.id,
          color: itRobot.color
        });
      });
    }

    // Calculate escape paths for other robots
    nonItRobots.forEach(robot => {
      // Find furthest point from "it" robot
      let bestDistance = -1;
      let bestPath: Cell[] = [];

      // Try multiple random points to find a good escape route
      for (let i = 0; i < 10; i++) {
        const targetPos = findRandomEmptyCell(maze, new Set());
        const distanceToIt = Math.abs(targetPos.x - itRobot.x) + Math.abs(targetPos.y - itRobot.y);
        
        if (distanceToIt > bestDistance) {
          const path = findPath(
            { x: robot.x, y: robot.y },
            targetPos
          );
          
          if (path.length > 0) {
            bestDistance = distanceToIt;
            bestPath = path;
          }
        }
      }

      if (bestPath.length > 0) {
        robot.path = bestPath;
        robot.pathIndex = 0;
        robot.status = 'Escaping';

        // Mark path on maze
        bestPath.forEach(cell => {
          newMaze[cell.y][cell.x].robotPaths.push({
            robotId: robot.id,
            color: robot.color
          });
        });
      }
    });

    setMaze(newMaze);
    setRobots(newRobots);
  }, [robots, maze, findPath]);

  const handleCellClick = (x: number, y: number) => {
    if (!editMode) return;

    const newMaze = [...maze];
    newMaze[y][x].isWall = !newMaze[y][x].isWall;
    setMaze(newMaze);

    const robotOnCell = robots.find(r => r.x === x && r.y === y);
    if (robotOnCell) {
      const usedPositions = new Set(robots.map(r => `${r.x},${r.y}`));
      const newPos = findRandomEmptyCell(newMaze, usedPositions);
      const newRobots = robots.map(r => 
        r.id === robotOnCell.id 
          ? { ...r, x: newPos.x, y: newPos.y }
          : r
      );
      setRobots(newRobots);
    }

    updatePaths();
  };

  useEffect(() => {
    let animationFrameId: number;
    const UNIVERSAL_CLOCK = 1000; // 1 second base clock
    
    const animate = (timestamp: number) => {
      if (!isAnimating && !continuousPlay) return;

      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = UNIVERSAL_CLOCK * moveSpeed;

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;

        const newRobots = [...robots];
        let tagHappened = false;
        let anyRobotMoved = false;

        // Move all robots simultaneously
        newRobots.forEach(robot => {
          if (robot.path.length > robot.pathIndex) {
            const nextCell = robot.path[robot.pathIndex];
            const prevPos = { x: robot.x, y: robot.y };
            
            robot.x = nextCell.x;
            robot.y = nextCell.y;
            robot.pathIndex++;
            anyRobotMoved = true;

            setMovements(prev => [{
              robotId: robot.id,
              from: prevPos,
              to: { x: nextCell.x, y: nextCell.y },
              type: 'move',
              timestamp: Date.now()
            }, ...prev.slice(0, 9)]);
          }
        });

        // Check for tags after all robots have moved
        const it = newRobots.find(r => r.isIt)!;
        const now = Date.now();
        
        if (now - it.lastTagTime >= TAG_COOLDOWN) {
          newRobots.forEach(robot => {
            if (!robot.isIt && Math.abs(robot.x - it.x) <= 1 && Math.abs(robot.y - it.y) <= 1) {
              setLastTagLocation({ x: robot.x, y: robot.y });
              robot.isIt = true;
              it.isIt = false;
              robot.lastTagTime = now;
              tagHappened = true;
            }
          });
        }

        setRobots(newRobots);

        // Update paths if needed
        if (tagHappened || !anyRobotMoved) {
          updatePaths();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating || continuousPlay) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      updatePaths(); // Initial path calculation
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, continuousPlay, robots, maze, moveSpeed, updatePaths]);

  return (
    <div className="flex gap-8">
      <div className="w-64 space-y-4">
        {robots.map(robot => (
          <div 
            key={robot.id}
            className={`bg-white p-4 rounded-lg shadow-md ${
              robot.isIt ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Bot className={`w-5 h-5 text-${robot.color}-500`} />
              <span className="font-medium">
                Robot {robot.id + 1} {robot.isIt ? "(IT)" : ""}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Position: ({robot.x}, {robot.y})
            </div>
            <div className="text-sm text-gray-600">
              Status: {robot.status}
            </div>
          </div>
        ))}

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FastForward className="w-5 h-5 text-blue-500" />
            Movement Log
          </h3>
          <div className="space-y-2">
            {movements.map((movement, index) => {
              const robot = robots.find(r => r.id === movement.robotId);
              return (
                <div key={index} className="text-sm flex items-center gap-2 text-gray-600">
                  <Bot className={`w-4 h-4 text-${robot?.color}-500`} />
                  {movement.type === 'tag' ? (
                    <span className="text-red-500 font-medium">Tagged!</span>
                  ) : (
                    <>
                      <span>({movement.from.x}, {movement.from.y})</span>
                      <ArrowRight className="w-4 h-4" />
                      <span>({movement.to.x}, {movement.to.y})</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
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
              onClick={() => setIsAnimating(!isAnimating)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
              disabled={continuousPlay}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isAnimating ? 'Stop' : 'Start'} Single Round
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

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded-sm"></div>
              <span className="text-sm text-gray-600">Wall {editMode && '(Click to toggle)'}</span>
            </div>
            {robots.map((robot, index) => (
              <div key={robot.id} className="flex items-center gap-2">
                <div className={`w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center`}>
                  <Bot className={`w-4 h-4 text-${robot.color}-500`} />
                </div>
                <span className="text-sm text-gray-600">
                  Robot {index + 1} {robot.isIt ? "(IT)" : ""}
                </span>
              </div>
            ))}
            {lastTagLocation && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border border-red-300 rounded-sm flex items-center justify-center">
                  <span className="text-red-500 text-xs">TAG!</span>
                </div>
                <span className="text-sm text-gray-600">Recent Tag</span>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
          {maze.map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((cell, x) => {
                const robot = robots.find(r => r.x === x && r.y === y);
                const robotPath = cell.robotPaths[0];
                const isTagLocation = lastTagLocation?.x === x && lastTagLocation?.y === y;
                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm
                      ${cell.isWall ? 'bg-gray-900' : 'bg-white'}
                      ${robotPath ? `bg-${robotPath.color}-100` : ''}
                      ${isTagLocation ? 'bg-red-100' : ''}
                      ${editMode && !cell.isWall ? 'hover:bg-gray-100 cursor-pointer' : ''}
                      ${editMode && cell.isWall ? 'hover:bg-gray-800 cursor-pointer' : ''}
                    `}
                  >
                    {robot && (
                      <Bot 
                        className={`w-5 h-5 text-${robot.color}-500 ${
                          robot.isIt ? 'animate-pulse' : ''
                        }`}
                      />
                    )}
                    {isTagLocation && !robot && (
                      <span className="text-red-500 text-xs font-bold">TAG!</span>
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

export default TagGame;
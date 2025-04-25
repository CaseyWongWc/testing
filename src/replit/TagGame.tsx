import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, HelpCircle, FastForward, Hammer, ArrowRight } from 'lucide-react';

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
  movements: Movement[]; // Each robot has its own movement history
}

interface Movement {
  robotId: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'move' | 'tag';
  timestamp: number;
}

interface TagGameProps {
  width?: number;
  height?: number;
  wallDensity?: number;
  robotCount?: number;
}

const TagGame: React.FC<TagGameProps> = ({ 
  width = 20, 
  height = 15, 
  wallDensity = 0.3, 
  robotCount = 4 
}) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [editMode, setEditMode] = useState(false);
  const [lastTagLocation, setLastTagLocation] = useState<{ x: number, y: number } | null>(null);
  const [continuousPlay, setContinuousPlay] = useState(false);
  const [expandedRobot, setExpandedRobot] = useState<number | null>(null);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const colors = ['blue', 'red', 'green', 'purple', 'orange'];
  const TAG_COOLDOWN = 2000;
  const UNIVERSAL_CLOCK = 1000;
  const MAX_MOVEMENTS = 10; // Maximum number of movements to store per robot

  // Define helper functions
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
        color: colors[i % colors.length],
        lastTagTime: 0,
        status: 'Active',
        movements: [] // Initialize with empty movements array
      });
    }

    setMaze(newMaze);
    setRobots(newRobots);
    setLastTagLocation(null);
    setIsAnimating(false);
    setContinuousPlay(false);
    setExpandedRobot(null);
  };
  
  // Initialize game on mount only
  useEffect(() => {
    generateMaze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    
    // Reset cell values for pathfinding
    maze.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g = 0;
      cell.h = 0;
      cell.parent = null;
    }));

    while (openSet.length > 0) {
      // Find the node with the lowest f score
      let current = openSet[0];
      let currentIndex = 0;

      openSet.forEach((cell, index) => {
        if (cell.f < current.f) {
          current = cell;
          currentIndex = index;
        }
      });

      // If we reached the goal, reconstruct and return the path
      if (current === goalCell) {
        const path: Cell[] = [];
        let temp = current;
        while (temp.parent) {
          path.push(temp);
          temp = temp.parent;
        }
        return path.reverse();
      }

      // Move current from openSet to closedSet
      openSet.splice(currentIndex, 1);
      closedSet.push(current);

      // Check all neighbors
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

  // Update paths for all robots
  const updatePaths = useCallback(() => {
    const newMaze = [...maze];
    const newRobots = [...robots];

    // Clear all existing paths from maze
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

    // Calculate escape paths for other robots independently
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

        // Mark path on maze with distinct color for each robot
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

  // Update paths when animation starts
  useEffect(() => {
    if (isAnimating || continuousPlay) {
      updatePaths();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, continuousPlay]);
  
  // Animation loop
  useEffect(() => {
    if (!isAnimating && !continuousPlay) return;
    
    let animationFrameId: number;
    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      
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

            // Add movement to this robot's movement history
            const movement: Movement = {
              robotId: robot.id,
              from: prevPos,
              to: { x: nextCell.x, y: nextCell.y },
              type: 'move',
              timestamp: Date.now()
            };
            
            // Update this robot's movement history
            robot.movements = [movement, ...robot.movements.slice(0, MAX_MOVEMENTS - 1)];
          }
        });

        // Check for tags after all robots have moved
        const it = newRobots.find(r => r.isIt);
        if (it) {
          const now = Date.now();
          
          if (now - it.lastTagTime >= TAG_COOLDOWN) {
            newRobots.forEach(robot => {
              if (!robot.isIt && Math.abs(robot.x - it.x) <= 1 && Math.abs(robot.y - it.y) <= 1) {
                setLastTagLocation({ x: robot.x, y: robot.y });
                robot.isIt = true;
                it.isIt = false;
                robot.lastTagTime = now;
                tagHappened = true;

                // Add tag event to both robots' movement history
                const tagMovement: Movement = {
                  robotId: robot.id,
                  from: { x: robot.x, y: robot.y },
                  to: { x: robot.x, y: robot.y },
                  type: 'tag',
                  timestamp: now
                };
                
                robot.movements = [tagMovement, ...robot.movements.slice(0, MAX_MOVEMENTS - 1)];
                
                // Also log the tag in the previous "it" robot's history
                const taggedMovement: Movement = {
                  robotId: it.id,
                  from: { x: it.x, y: it.y },
                  to: { x: it.x, y: it.y },
                  type: 'tag',
                  timestamp: now
                };
                
                it.movements = [taggedMovement, ...it.movements.slice(0, MAX_MOVEMENTS - 1)];
              }
            });
          }
        }

        // Update robots in one batch
        setRobots(newRobots);

        // Update paths after each cycle
        // This ensures all robots have fresh paths for next round
        if (tagHappened || !anyRobotMoved) {
          // Using setTimeout to avoid immediate state updates which can cause infinite loops
          setTimeout(() => {
            updatePaths();
          }, 0);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    lastFrameTimeRef.current = 0;
    accumulatedTimeRef.current = 0;
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, continuousPlay, robots, maze, moveSpeed, updatePaths]);

  // Toggle expanded robot view for movement logs
  const toggleExpandRobot = (robotId: number) => {
    if (expandedRobot === robotId) {
      setExpandedRobot(null);
    } else {
      setExpandedRobot(robotId);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 space-y-4">
        {robots.map(robot => (
          <div 
            key={robot.id}
            className={`bg-white p-4 rounded-lg shadow-md ${
              robot.isIt ? 'border-2 border-red-500' : ''
            }`}
          >
            <div 
              className="flex items-center gap-2 mb-2 cursor-pointer"
              onClick={() => toggleExpandRobot(robot.id)}
            >
              <Bot className={`w-5 h-5 text-${robot.color}-500`} />
              <span className="font-medium">
                Robot {robot.id + 1} {robot.isIt ? "(IT)" : ""}
              </span>
              {expandedRobot === robot.id ? 
                <span className="ml-auto text-xs text-gray-400">▲</span> :
                <span className="ml-auto text-xs text-gray-400">▼</span>
              }
            </div>
            <div className="text-sm">
              Position: ({robot.x}, {robot.y})
            </div>
            <div className="text-sm">
              Status: {robot.status}
            </div>
            
            {expandedRobot === robot.id && (
              <div className="mt-3 border-t pt-2">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FastForward className="w-4 h-4 text-blue-500" />
                  Movement Log
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto pl-1">
                  {robot.movements.length > 0 ? (
                    robot.movements.map((movement, index) => (
                      <div key={index} className="text-xs flex items-center gap-1 text-gray-600">
                        {movement.type === 'tag' ? (
                          <span className="text-red-500 font-medium">Tagged!</span>
                        ) : (
                          <>
                            <span>({movement.from.x}, {movement.from.y})</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>({movement.to.x}, {movement.to.y})</span>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No movements yet</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
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
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {continuousPlay ? 
              <><span className="mr-1">Stop</span> Continuous Play</> : 
              <><span className="mr-1">Start</span> Continuous Play</>
            }
          </button>
          
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-gray-600">{moveSpeed.toFixed(1)}s</span>
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.1"
              value={moveSpeed}
              onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
            <button className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded">
              <FastForward className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center gap-2"
          >
            <Hammer className="w-4 h-4" />
            Edit Walls
          </button>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-2xl">
          <div className="grid grid-cols-1">
            <div 
              className="grid" 
              style={{
                gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
                gap: '2px'
              }}
            >
              {maze.map(row => row.map(cell => {
                const robot = robots.find(r => r.x === cell.x && r.y === cell.y);
                const isTagLocation = lastTagLocation && 
                  lastTagLocation.x === cell.x && 
                  lastTagLocation.y === cell.y;
                
                // Determine cell display based on type
                let cellClass;
                
                if (cell.isWall) {
                  // Wall cells are dark
                  cellClass = 'bg-gray-800';
                } else if (cell.robotPaths.length > 0) {
                  // Path cells are colored based on which robot's path it is
                  const pathRobot = cell.robotPaths[0];
                  cellClass = `bg-${pathRobot.color}-100`;
                } else {
                  // Empty cells are white
                  cellClass = 'bg-white';
                }
                
                // Tag location cells have pink background
                if (isTagLocation && !robot) {
                  cellClass = 'bg-red-100';
                }
                
                return (
                  <div
                    key={`${cell.x},${cell.y}`}
                    className={`aspect-square flex items-center justify-center relative ${cellClass} ${
                      editMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''
                    }`}
                    onClick={() => handleCellClick(cell.x, cell.y)}
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
              }))}
            </div>
          </div>
        </div>

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Legend
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-800 rounded"></div>
                <span>Wall</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <span>"It" Robot</span>
              </div>
              
              {colors.slice(0, robotCount).map((color) => (
                <div key={color} className="flex items-center gap-2">
                  <div className={`w-6 h-6 bg-${color}-100 rounded`}></div>
                  <span>{color.charAt(0).toUpperCase() + color.slice(1)} Path</span>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-red-500 text-xs font-bold">TAG!</span>
                </div>
                <span>Tag Location</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagGame;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, HelpCircle, Play, Pause, Timer, FastForward, ArrowRight, Database, User } from 'lucide-react';

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

interface Robot {
  id: number;
  name: string;
  x: number;
  y: number;
  color: string;
  path: Cell[];
  pathIndex: number;
  targetRobotId: number | null;
  containers: {
    bucket_A: number;
    bucket_B: number;
    bucket_C: number;
  };
  foundRobots: Set<number>;
  inactiveTurns: number;
  isIdle: boolean;
  status: string;
}

interface Movement {
  robotId: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  foundRobot?: number;
  timestamp: number;
}

interface WhatsYourNameGameProps {
  width: number;
  height: number;
  wallDensity: number;
  robotCount: number;
}

const ROBOT_COLORS = ['blue', 'red', 'green', 'purple', 'orange'];
const ROBOT_NAMES = [
  'Alice', 'Bob', 'Charlie', 'David', 'Emma',
  'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
  'Kelly', 'Liam', 'Mia', 'Noah', 'Olivia'
];

const WhatsYourNameGame: React.FC<WhatsYourNameGameProps> = ({ width, height, wallDensity, robotCount }) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(0.5);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null);
  const [interactions, setInteractions] = useState<string[]>([]);
  const [teleportCount, setTeleportCount] = useState(0);
  const [continuousPlay, setContinuousPlay] = useState(false);
  
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
          isWall: false,
          isPath: false,
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

  const teleportRobotsToNewPositions = () => {
    const newRobots = [...robots];
    const usedPositions = new Set<string>();
    
    const oldPositions = robots.map(r => ({ id: r.id, x: r.x, y: r.y }));
    
    newRobots.forEach(robot => {
      const newPos = findRandomEmptyCell(maze, usedPositions);
      usedPositions.add(`${newPos.x},${newPos.y}`);
      
      robot.x = newPos.x;
      robot.y = newPos.y;
      robot.path = [];
      robot.pathIndex = 0;
      robot.targetRobotId = null;
      robot.inactiveTurns = 0;
    });

    oldPositions.forEach(oldPos => {
      const robot = newRobots.find(r => r.id === oldPos.id);
      if (robot) {
        setMovements(prev => [{
          robotId: robot.id,
          from: { x: oldPos.x, y: oldPos.y },
          to: { x: robot.x, y: robot.y },
          timestamp: Date.now()
        }, ...prev.slice(0, 9)]);
      }
    });

    setRobots(newRobots);
    setTeleportCount(prev => prev + 1);
    setInteractions(prev => [
      'All robots have been teleported to new positions!',
      ...prev
    ]);
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
    const usedNames = new Set<string>();

    for (let i = 0; i < robotCount; i++) {
      const pos = findRandomEmptyCell(newMaze, usedPositions);
      usedPositions.add(`${pos.x},${pos.y}`);
      
      let robotName;
      do {
        robotName = ROBOT_NAMES[Math.floor(Math.random() * ROBOT_NAMES.length)];
      } while (usedNames.has(robotName));
      usedNames.add(robotName);
      
      newRobots.push({
        id: i,
        name: robotName,
        x: pos.x,
        y: pos.y,
        color: ROBOT_COLORS[i],
        path: [],
        pathIndex: 0,
        targetRobotId: null,
        containers: {
          bucket_A: Math.floor(Math.random() * 11),
          bucket_B: Math.floor(Math.random() * 11),
          bucket_C: Math.floor(Math.random() * 11)
        },
        foundRobots: new Set(),
        inactiveTurns: 0,
        isIdle: false,
        status: 'Searching for robots...'
      });
    }

    setMaze(newMaze);
    setRobots(newRobots);
    setMovements([]);
    setInteractions([]);
    setSelectedRobotId(null);
    setTeleportCount(0);
  };

  const getValidNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;

      if (newX >= 0 && newX < width && newY >= 0 && newY < height && !maze[newY][newX].isWall) {
        neighbors.push(maze[newY][newX]);
      }
    }

    return neighbors;
  };

  const findPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const startCell = maze[start.y][start.x];
    const endCell = maze[end.y][end.x];
    
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

      if (current === endCell) {
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
        neighbor.h = Math.abs(neighbor.x - endCell.x) + Math.abs(neighbor.y - endCell.y);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return [];
  };

  const findNearestUnknownRobot = (robot: Robot) => {
    let nearestRobot: Robot | null = null;
    let shortestPath: Cell[] = [];
    let shortestDistance = Infinity;

    robots.forEach(otherRobot => {
      if (otherRobot.id !== robot.id && !robot.foundRobots.has(otherRobot.id)) {
        const path = findPath(
          { x: robot.x, y: robot.y },
          { x: otherRobot.x, y: otherRobot.y }
        );
        
        if (path.length > 0 && path.length < shortestDistance) {
          shortestDistance = path.length;
          shortestPath = path;
          nearestRobot = otherRobot;
        }
      }
    });

    return { nearestRobot, path: shortestPath };
  };

  const findRobotWithHighestBucket = (bucketType: 'bucket_A' | 'bucket_B' | 'bucket_C', robot: Robot) => {
    let targetRobot: Robot | null = null;
    let highestValue = -1;
    let path: Cell[] = [];

    robots.forEach(otherRobot => {
      if (otherRobot.id !== robot.id && otherRobot.containers[bucketType] > highestValue) {
        const newPath = findPath(
          { x: robot.x, y: robot.y },
          { x: otherRobot.x, y: otherRobot.y }
        );
        
        if (newPath.length > 0) {
          highestValue = otherRobot.containers[bucketType];
          targetRobot = otherRobot;
          path = newPath;
        }
      }
    });

    return { targetRobot, path };
  };

  const checkForRobotMeeting = (robot: Robot) => {
    const newFoundRobots = new Set(robot.foundRobots);
    let foundNewRobot = false;

    robots.forEach(otherRobot => {
      if (otherRobot.id !== robot.id && 
          Math.abs(robot.x - otherRobot.x) <= 1 && 
          Math.abs(robot.y - otherRobot.y) <= 1 &&
          !robot.foundRobots.has(otherRobot.id)) {
        newFoundRobots.add(otherRobot.id);
        foundNewRobot = true;
        
        setInteractions(prev => [
          `${robot.name} met ${otherRobot.name}!`,
          `${otherRobot.name}'s buckets: A=${otherRobot.containers.bucket_A}, B=${otherRobot.containers.bucket_B}, C=${otherRobot.containers.bucket_C}`,
          ...prev
        ]);
      }
    });

    if (foundNewRobot) {
      setRobots(prev => prev.map(r => 
        r.id === robot.id 
          ? { ...r, foundRobots: newFoundRobots }
          : r
      ));
    }

    return foundNewRobot;
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

        const newRobots = [...robots];
        let anyRobotMoved = false;
        let allRobotsInactive = true;

        newRobots.forEach(robot => {
          if (robot.isIdle) {
            robot.status = 'Idle';
            return;
          }

          if (robot.path.length > robot.pathIndex) {
            const nextCell = robot.path[robot.pathIndex];
            const prevPos = { x: robot.x, y: robot.y };
            
            robot.x = nextCell.x;
            robot.y = nextCell.y;
            robot.pathIndex++;
            anyRobotMoved = true;
            allRobotsInactive = false;
            robot.inactiveTurns = 0;

            setMovements(prev => [{
              robotId: robot.id,
              from: prevPos,
              to: { x: nextCell.x, y: nextCell.y },
              timestamp: Date.now()
            }, ...prev.slice(0, 9)]);

            const foundNewRobot = checkForRobotMeeting(robot);
            if (foundNewRobot) {
              robot.path = [];
              robot.pathIndex = 0;
              robot.targetRobotId = null;
              robot.status = 'Found a robot!';
            }
          } else if (!robot.targetRobotId) {
            const { nearestRobot, path } = findNearestUnknownRobot(robot);
            if (nearestRobot) {
              robot.path = path;
              robot.pathIndex = 0;
              robot.targetRobotId = nearestRobot.id;
              robot.status = `Looking for ${nearestRobot.name}...`;
              allRobotsInactive = false;
              robot.inactiveTurns = 0;
            } else {
              robot.inactiveTurns++;
              robot.status = 'No more robots to find';
            }
          }
        });

        if (allRobotsInactive) {
          const allInactiveLongEnough = newRobots.every(r => r.inactiveTurns >= 5);
          if (allInactiveLongEnough) {
            teleportRobotsToNewPositions();
            newRobots.forEach(robot => {
              robot.status = 'Searching for robots...';
            });
          }
        }

        if (!anyRobotMoved && !allRobotsInactive && !continuousPlay) {
          setIsAnimating(false);
        }

        setRobots(newRobots);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating || continuousPlay) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, continuousPlay, robots, moveSpeed]);

  return (
    <div className="flex gap-8">
      <div className="space-y-4">
        {robots.map(robot => (
          <div 
            key={robot.id}
            className={`bg-white p-4 rounded-lg shadow-md w-64 ${
              selectedRobotId === robot.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedRobotId(robot.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Bot className={`w-5 h-5 text-${robot.color}-500`} />
              <h3 className="font-semibold">{`Robot ${robot.id + 1}`}</h3>
            </div>

            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>My name is: {robot.name}</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Position:</span>
                <span>({robot.x}, {robot.y})</span>
              </div>
              <div className="flex justify-between">
                <span>Bucket A:</span>
                <span>{robot.containers.bucket_A}</span>
              </div>
              <div className="flex justify-between">
                <span>Bucket B:</span>
                <span>{robot.containers.bucket_B}</span>
              </div>
              <div className="flex justify-between">
                <span>Bucket C:</span>
                <span>{robot.containers.bucket_C}</span>
              </div>
              <div>
                <div className="mb-1">Found Robots:</div>
                <div className="pl-2 text-gray-600">
                  {Array.from(robot.foundRobots).map(id => {
                    const foundRobot = robots.find(r => r.id === id);
                    return foundRobot ? (
                      <div key={id} className="flex items-center gap-1">
                        <Bot className={`w-3 h-3 text-${foundRobot.color}-500`} />
                        <span>{foundRobot.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mt-2">
              Status: {robot.status}
            </div>

            {selectedRobotId === robot.id && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    setRobots(prev => prev.map(r =>
                      r.id === robot.id
                        ? { ...r, isIdle: !r.isIdle, status: !r.isIdle ? 'Idle' : 'Searching for robots...' }
                        : r
                    ));
                  }}
                  className={`w-full px-3 py-2 rounded transition-colors ${
                    robot.isIdle
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {robot.isIdle ? 'Resume Activity' : 'Set to Idle'}
                </button>

                <select 
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const targetName = e.target.value;
                    if (targetName) {
                      const targetRobot = robots.find(r => r.name === targetName);
                      if (targetRobot) {
                        const path = findPath(
                          { x: robot.x, y: robot.y },
                          { x: targetRobot.x, y: targetRobot.y }
                        );
                        setRobots(prev => prev.map(r => 
                          r.id === robot.id 
                            ? { ...r, path, pathIndex: 0, targetRobotId: targetRobot.id }
                            : r
                        ));
                        setInteractions(prev => [
                          `${robot.name} is looking for ${targetRobot.name}...`,
                          ...prev
                        ]);
                      }
                    }
                  }}
                >
                  <option value="">Find robot by name...</option>
                  {robots
                    .filter(r => r.id !== robot.id)
                    .map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))
                  }
                </select>

                <select 
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const bucketType = e.target.value as 'bucket_A' | 'bucket_B' | 'bucket_C';
                    if (bucketType) {
                      const { targetRobot, path } = findRobotWithHighestBucket(bucketType, robot);
                      if (targetRobot) {
                        setRobots(prev => prev.map(r => 
                          r.id === robot.id 
                            ? { ...r, path, pathIndex: 0, targetRobotId: targetRobot.id }
                            : r
                        ));
                        setInteractions(prev => [
                          `${robot.name} is searching for highest ${bucketType}...`,
                          ...prev
                        ]);
                      }
                    }
                  }}
                >
                  <option value="">Find highest bucket...</option>
                  <option value="bucket_A">Bucket A</option>
                  <option value="bucket_B">Bucket B</option>
                  <option value="bucket_C">Bucket C</option>
                </select>
              </div>
            )}
          </div>
        ))}

        <div className="bg-white p-4 rounded-lg shadow-md w-64">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Interaction Log
          </h3>
          <div className="space-y-2 text-sm">
            {interactions.map((interaction, index) => (
              <div key={index} className="text-gray-600">{interaction}</div>
            ))}
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
            onClick={() => setShowLegend(!showLegend)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
            <FastForward className="w-5 h-5 text-purple-500" />
            <span className="font-medium">Teleports: {teleportCount}</span>
          </div>
        </div>

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
            {robots.map(robot => (
              <div key={robot.id} className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-300 rounded-sm flex items-center justify-center">
                  <Bot className={`w-4 h-4 text-${robot.color}-500`} />
                </div>
                <span className="text-sm text-gray-600">{robot.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded-sm"></div>
              <span className="text-sm text-gray-600">Wall</span>
            </div>
          </div>
        )}

        <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
          {maze.map((row, y) => (
            <div key={y} className="flex gap-0.5">
              {row.map((cell, x) => {
                const robot = robots.find(r => r.x === x && r.y === y);
                const robotWithPath = robots.find(r => 
                  r.path.some(p => p.x === x && p.y === y)
                );
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`w-8 h-8 flex items-center justify-center transition-colors rounded-sm
                      ${cell.isWall ? 'bg-gray-900' : 'bg-white'}
                      ${robotWithPath ? `bg-${robotWithPath.color}-100` : ''}
                    `}
                  >
                    {robot && (
                      <Bot 
                        className={`w-5 h-5 text-${robot.color}-500 ${
                          selectedRobotId === robot.id ? 'animate-bounce' : ''
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="w-64 bg-white p-4 rounded-lg shadow-md h-fit">
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
                <span>({movement.from.x}, {movement.from.y})</span>
                <ArrowRight className="w-4 h-4" />
                <span>({movement.to.x}, {movement.to.y})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WhatsYourNameGame;
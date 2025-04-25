import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Target, Settings, Star, Circle } from 'lucide-react';

// Types
interface Goal {
  id: number;
  x: number;
  y: number;
  value: number;
  color: string;
  createdAt: number;
  spawnerIndex: number;
}

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath?: boolean;
  f?: number;
  g?: number;
  h?: number;
  parent?: Cell | null;
}

interface Robot {
  x: number;
  y: number;
  targetGoal: Goal | null;
  path: Cell[];
  pathIndex: number;
  score: number;
  status: string;
  collected: number;
}

interface SpawnerConfig {
  name: string;
  x: number;
  y: number;
  color: string;
  maxCapacity: number;
  spawnInterval: number; // in seconds
  active: boolean;
  spawnCount: number;
  lastSpawnTime: number;
  goalValue: number;
}

interface SpawnerProps {
  width: number;
  height: number;
  wallDensity: number;
}

export const Spawner: React.FC<SpawnerProps> = ({ width, height, wallDensity }) => {
  // State
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [spawners, setSpawners] = useState<SpawnerConfig[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedSpawner, setSelectedSpawner] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Animation refs
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Add a log message
  const addLog = useCallback((message: string) => {
    setLogMessages(prev => {
      const newLogs = [...prev, message];
      // Keep only the last 10 messages
      if (newLogs.length > 10) {
        return newLogs.slice(newLogs.length - 10);
      }
      return newLogs;
    });
  }, []);

  // Generate the grid
  useEffect(() => {
    const newGrid: Cell[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        // Create walls at the edges
        const isEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        const isWall = isEdge || (Math.random() < wallDensity);
        
        row.push({
          x,
          y,
          isWall,
          isPath: false,
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    
    // Create initial spawners
    const initialSpawners: SpawnerConfig[] = [
      {
        name: "Red Spawner",
        x: 3,
        y: 3,
        color: "#ff5555",
        maxCapacity: 5,
        spawnInterval: 3,
        active: false,
        spawnCount: 0,
        lastSpawnTime: 0,
        goalValue: 10
      },
      {
        name: "Blue Spawner",
        x: width - 4,
        y: height - 4,
        color: "#5555ff",
        maxCapacity: 3,
        spawnInterval: 7,
        active: false,
        spawnCount: 0,
        lastSpawnTime: 0,
        goalValue: 20
      }
    ];
    
    // Make sure spawners aren't on walls
    initialSpawners.forEach((spawner, index) => {
      let { x, y } = spawner;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts && (x === 0 || y === 0 || x === width - 1 || y === height - 1 || Math.random() < wallDensity)) {
        x = Math.floor(Math.random() * (width - 4)) + 2;
        y = Math.floor(Math.random() * (height - 4)) + 2;
        attempts++;
      }
      
      initialSpawners[index] = {
        ...spawner,
        x,
        y
      };
    });
    
    setSpawners(initialSpawners);
    
    // Place the robot in the center
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // Make sure the center position isn't a wall
    let robotX = centerX;
    let robotY = centerY;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    // Try to find a non-wall position for the robot
    while (attempts < maxAttempts) {
      if (!newGrid[robotY][robotX].isWall) {
        break;
      }
      
      robotX = Math.floor(Math.random() * (width - 4)) + 2;
      robotY = Math.floor(Math.random() * (height - 4)) + 2;
      attempts++;
    }
    
    if (attempts < maxAttempts) {
      setRobot({
        x: robotX,
        y: robotY,
        targetGoal: null,
        path: [],
        pathIndex: 0,
        score: 0,
        collected: 0,
        status: 'Idle'
      });
    } else {
      // Just force a position if we can't find one
      newGrid[centerY][centerX].isWall = false;
      setGrid(newGrid);
      
      setRobot({
        x: centerX,
        y: centerY,
        targetGoal: null,
        path: [],
        pathIndex: 0,
        score: 0,
        collected: 0,
        status: 'Idle'
      });
    }
    
  }, [width, height, wallDensity]);

  // A* pathfinding
  const findPath = useCallback((startX: number, startY: number, endX: number, endY: number): Cell[] => {
    if (!grid.length) return [];
    
    // Create a copy of the grid for pathfinding
    const gridCopy: Cell[][] = grid.map(row => 
      row.map(cell => ({ ...cell, f: 0, g: 0, h: 0, parent: null, isPath: false }))
    );
    
    const startCell = gridCopy[startY][startX];
    const endCell = gridCopy[endY][endX];
    
    const openSet: Cell[] = [startCell];
    const closedSet: Cell[] = [];
    
    // A* algorithm
    while (openSet.length > 0) {
      // Find cell with lowest f score
      let currentIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f! < openSet[currentIndex].f!) {
          currentIndex = i;
        }
      }
      
      const current = openSet[currentIndex];
      
      // If we reached the goal
      if (current.x === endX && current.y === endY) {
        const path: Cell[] = [];
        let temp = current;
        
        // Construct path by following parents
        while (temp.parent) {
          path.push(temp);
          temp = temp.parent;
        }
        
        return path.reverse();
      }
      
      // Move current from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.push(current);
      
      // Check neighbors (4 directions only)
      const neighbors = [
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }  // left
      ];
      
      for (const { dx, dy } of neighbors) {
        const newX = current.x + dx;
        const newY = current.y + dy;
        
        // Check if valid position
        if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
          continue;
        }
        
        const neighbor = gridCopy[newY][newX];
        
        // Skip if wall or already in closed set
        if (neighbor.isWall || closedSet.some(c => c.x === neighbor.x && c.y === neighbor.y)) {
          continue;
        }
        
        // Calculate g score
        const gScore = current.g! + 1;
        const inOpenSet = openSet.some(c => c.x === neighbor.x && c.y === neighbor.y);
        
        if (!inOpenSet || gScore < neighbor.g!) {
          // Update scores and parent
          neighbor.g = gScore;
          neighbor.h = Math.abs(endX - newX) + Math.abs(endY - newY);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          neighbor.isPath = true;
          
          if (!inOpenSet) {
            openSet.push(neighbor);
          }
        }
      }
    }
    
    // No path found
    return [];
  }, [grid, width, height]);

  // Spawn a goal from a spawner
  const spawnGoal = useCallback((spawnerIndex: number) => {
    const spawner = spawners[spawnerIndex];
    if (!spawner || !spawner.active) return;
    
    // Check if spawner reached capacity
    const spawnerGoals = goals.filter(g => g.spawnerIndex === spawnerIndex);
    if (spawnerGoals.length >= spawner.maxCapacity) return;
    
    // Find valid position near spawner
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }  // left
    ];
    
    // Shuffle directions
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    
    let spawnX = -1;
    let spawnY = -1;
    
    // Try each direction
    for (const { dx, dy } of directions) {
      const newX = spawner.x + dx;
      const newY = spawner.y + dy;
      
      if (
        newX >= 0 && newX < width && 
        newY >= 0 && newY < height && 
        !grid[newY][newX].isWall && 
        !goals.some(g => g.x === newX && g.y === newY) &&
        !(robot && robot.x === newX && robot.y === newY)
      ) {
        spawnX = newX;
        spawnY = newY;
        break;
      }
    }
    
    // No valid position found
    if (spawnX === -1 || spawnY === -1) return;
    
    // Create new goal
    const newGoal: Goal = {
      id: Date.now(),
      x: spawnX,
      y: spawnY,
      value: spawner.goalValue,
      color: spawner.color,
      createdAt: Date.now(),
      spawnerIndex
    };
    
    // Update spawner
    setSpawners(prev => prev.map((s, i) => 
      i === spawnerIndex 
        ? { 
            ...s, 
            lastSpawnTime: Date.now(),
            spawnCount: s.spawnCount + 1
          } 
        : s
    ));
    
    // Add goal
    setGoals(prev => [...prev, newGoal]);
    
    addLog(`Spawned goal from ${spawner.name} at (${spawnX}, ${spawnY})`);
  }, [spawners, goals, robot, grid, width, height, addLog]);

  // Find nearest goal for robot
  const findNearestGoal = useCallback(() => {
    if (!robot || goals.length === 0) return null;
    
    let nearestGoal = null;
    let shortestPath: Cell[] = [];
    
    for (const goal of goals) {
      const path = findPath(robot.x, robot.y, goal.x, goal.y);
      
      if (path.length > 0 && (shortestPath.length === 0 || path.length < shortestPath.length)) {
        nearestGoal = goal;
        shortestPath = path;
      }
    }
    
    if (nearestGoal) {
      return {
        goal: nearestGoal,
        path: shortestPath
      };
    }
    
    return null;
  }, [robot, goals, findPath]);

  // Update game state
  const updateGame = useCallback((timestamp: number) => {
    if (!running) return;
    
    // Limit update rate
    if (timestamp - lastUpdateTimeRef.current < 100) {
      animationRef.current = requestAnimationFrame(updateGame);
      return;
    }
    
    const deltaTime = (timestamp - lastUpdateTimeRef.current) / 1000; // in seconds
    lastUpdateTimeRef.current = timestamp;
    
    // Update spawners
    setSpawners(prev => prev.map((spawner, index) => {
      if (!spawner.active) return spawner;
      
      const timeSinceLastSpawn = (Date.now() - spawner.lastSpawnTime) / 1000;
      
      if (timeSinceLastSpawn >= spawner.spawnInterval) {
        // Try to spawn a goal
        spawnGoal(index);
      }
      
      return spawner;
    }));
    
    // Update robot
    setRobot(prev => {
      if (!prev) return prev;
      
      const newRobot = { ...prev };
      
      // If robot at target goal, collect it
      if (newRobot.targetGoal && newRobot.x === newRobot.targetGoal.x && newRobot.y === newRobot.targetGoal.y) {
        // Collect goal
        newRobot.score += newRobot.targetGoal.value;
        newRobot.collected += 1;
        newRobot.status = `Collected goal (${newRobot.targetGoal.value} points)`;
        
        // Remove goal
        setGoals(goals => goals.filter(g => g.id !== newRobot.targetGoal!.id));
        
        // Reset path and target
        newRobot.targetGoal = null;
        newRobot.path = [];
        newRobot.pathIndex = 0;
        
        addLog(`Robot collected goal, score: ${newRobot.score}`);
      }
      
      // If robot has no target or finished path, find a new one
      if (!newRobot.targetGoal || newRobot.pathIndex >= newRobot.path.length) {
        const nearest = findNearestGoal();
        
        if (nearest) {
          newRobot.targetGoal = nearest.goal;
          newRobot.path = nearest.path;
          newRobot.pathIndex = 0;
          newRobot.status = `Moving to goal from ${spawners[nearest.goal.spawnerIndex].name}`;
        } else {
          newRobot.status = 'Searching for goals';
        }
      }
      
      // Move robot along path
      if (newRobot.path.length > 0 && newRobot.pathIndex < newRobot.path.length) {
        const nextCell = newRobot.path[newRobot.pathIndex];
        newRobot.x = nextCell.x;
        newRobot.y = nextCell.y;
        newRobot.pathIndex++;
      }
      
      return newRobot;
    });
    
    animationRef.current = requestAnimationFrame(updateGame);
  }, [running, spawnGoal, findNearestGoal, spawners, addLog]);

  // Start/stop animation
  useEffect(() => {
    if (running) {
      lastUpdateTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(updateGame);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running, updateGame]);

  // Toggle spawner active state
  const toggleSpawnerActive = (index: number) => {
    setSpawners(prev => prev.map((s, i) => 
      i === index ? { ...s, active: !s.active } : s
    ));
  };

  // Update spawner config
  const updateSpawnerConfig = (index: number, key: keyof SpawnerConfig, value: any) => {
    setSpawners(prev => prev.map((s, i) => 
      i === index ? { ...s, [key]: value } : s
    ));
  };

  // Reset simulation
  const resetSimulation = () => {
    setRunning(false);
    
    // Reset spawners
    setSpawners(prev => prev.map(s => ({
      ...s,
      active: false,
      spawnCount: 0,
      lastSpawnTime: 0
    })));
    
    // Clear goals
    setGoals([]);
    
    // Reset robot
    if (robot) {
      setRobot({
        ...robot,
        targetGoal: null,
        path: [],
        pathIndex: 0,
        score: 0,
        collected: 0,
        status: 'Idle'
      });
    }
    
    // Clear logs
    setLogMessages([]);
    addLog('Simulation reset');
  };

  // Render a cell
  const renderCell = (x: number, y: number) => {
    const cell = grid[y] && grid[y][x];
    if (!cell) return null;
    
    // Check what this cell contains
    const isRobot = robot && robot.x === x && robot.y === y;
    const goal = goals.find(g => g.x === x && g.y === y);
    const spawnerIndex = spawners.findIndex(s => s.x === x && s.y === y);
    const isSpawner = spawnerIndex !== -1;
    const isSelectedSpawner = selectedSpawner === spawnerIndex;
    const isPath = robot && robot.path.some(p => p.x === x && p.y === y);
    
    // Determine cell style
    let cellClasses = "w-6 h-6 flex items-center justify-center border border-gray-200";
    let cellStyle: React.CSSProperties = {};
    let content = null;
    
    if (cell.isWall) {
      cellClasses += " bg-gray-800";
    } else if (isRobot) {
      cellClasses += " bg-green-600 text-white";
      content = <Robot size={14} />;
    } else if (goal) {
      cellClasses += " text-white";
      cellStyle.backgroundColor = goal.color;
      content = <Target size={14} />;
    } else if (isSelectedSpawner) {
      cellClasses += " bg-purple-600 text-white";
      content = <Star size={14} />;
    } else if (isSpawner) {
      cellClasses += " text-white";
      cellStyle.backgroundColor = spawners[spawnerIndex].color;
      content = <Circle size={14} />;
    } else if (isPath) {
      cellClasses += " bg-green-100";
    }
    
    return (
      <div 
        className={cellClasses}
        style={cellStyle}
        onClick={() => {
          if (isSpawner) {
            setSelectedSpawner(spawnerIndex);
          }
        }}
      >
        {content}
      </div>
    );
  };

  const Robot = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="9" cy="10" r="1.5" fill="white" />
      <circle cx="15" cy="10" r="1.5" fill="white" />
      <path d="M9 16C10.5 17.5 13.5 17.5 15 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        {/* Grid and Controls */}
        <div className="flex-1">
          {/* Grid */}
          <div className="border border-gray-300 rounded bg-gray-50 p-2">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(1.5rem,1fr))] gap-0">
              {grid.map((row, y) => (
                <React.Fragment key={y}>
                  {row.map((_, x) => (
                    <div key={`${x}-${y}`}>
                      {renderCell(x, y)}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setRunning(!running)}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Start'}
            </button>
            
            <button
              onClick={resetSimulation}
              className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                debugMode 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Settings size={16} />
              {debugMode ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
          
          {/* Stats */}
          {robot && (
            <div className="mt-4 bg-white p-3 rounded shadow-sm">
              <h3 className="font-semibold mb-2">Robot Stats</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 text-sm">Score:</span>
                  <span className="font-bold ml-2">{robot.score}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 text-sm">Goals Collected:</span>
                  <span className="font-bold ml-2">{robot.collected}</span>
                </div>
              </div>
              <div className="mt-2 bg-gray-50 p-2 rounded">
                <span className="text-gray-600 text-sm">Status:</span>
                <span className="ml-2">{robot.status}</span>
              </div>
            </div>
          )}
          
          {/* Debug Logs */}
          {debugMode && (
            <div className="mt-4 p-3 bg-gray-100 rounded h-32 overflow-y-auto font-mono text-xs">
              {logMessages.map((msg, i) => (
                <div key={i} className="mb-1">
                  {msg}
                </div>
              ))}
              {logMessages.length === 0 && (
                <div className="text-gray-500">No activity logs yet.</div>
              )}
            </div>
          )}
        </div>
        
        {/* Spawner Configuration Panel */}
        <div className="w-full md:w-72 bg-white p-4 rounded border border-gray-200 shadow-sm">
          <h3 className="font-bold mb-3">Spawner Configuration</h3>
          
          {/* Spawners List */}
          <div className="flex gap-2 mb-4">
            {spawners.map((spawner, i) => (
              <button
                key={i}
                onClick={() => setSelectedSpawner(i)}
                className={`px-3 py-1 rounded text-white text-sm flex-1 ${
                  selectedSpawner === i ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{ backgroundColor: spawner.color }}
              >
                {spawner.name}
              </button>
            ))}
          </div>
          
          {/* Selected Spawner Config */}
          {selectedSpawner !== null && spawners[selectedSpawner] && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {spawners[selectedSpawner].name}
                </span>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={spawners[selectedSpawner].active}
                    onChange={() => toggleSpawnerActive(selectedSpawner)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-2 text-sm font-medium text-gray-700">
                    {spawners[selectedSpawner].active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Capacity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={spawners[selectedSpawner].maxCapacity}
                    onChange={(e) => updateSpawnerConfig(selectedSpawner, 'maxCapacity', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm w-6 text-center">
                    {spawners[selectedSpawner].maxCapacity}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spawn Interval (sec)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={spawners[selectedSpawner].spawnInterval}
                    onChange={(e) => updateSpawnerConfig(selectedSpawner, 'spawnInterval', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm w-6 text-center">
                    {spawners[selectedSpawner].spawnInterval}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Value
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={spawners[selectedSpawner].goalValue}
                    onChange={(e) => updateSpawnerConfig(selectedSpawner, 'goalValue', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm w-6 text-center">
                    {spawners[selectedSpawner].goalValue}
                  </span>
                </div>
              </div>
              
              {debugMode && (
                <div className="p-3 bg-gray-100 rounded text-xs">
                  <div>Position: ({spawners[selectedSpawner].x}, {spawners[selectedSpawner].y})</div>
                  <div>Goals Spawned: {spawners[selectedSpawner].spawnCount}</div>
                  <div>Current Goals: {goals.filter(g => g.spawnerIndex === selectedSpawner).length}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-white rounded shadow-sm">
        <h3 className="font-bold mb-2">Legend</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-800 mr-2"></div>
            <span className="text-sm">Wall</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 mr-2"></div>
            <span className="text-sm">Robot</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 flex items-center justify-center bg-purple-600">
              <Star size={10} color="white" />
            </div>
            <span className="text-sm">Spawner</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 flex items-center justify-center" style={{ backgroundColor: "#ff5555" }}>
              <Target size={10} color="white" />
            </div>
            <span className="text-sm">Goal</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 mr-2"></div>
            <span className="text-sm">Path</span>
          </div>
        </div>
      </div>
    </div>
  );
};
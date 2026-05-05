import React, { useState, useEffect, useCallback } from 'react';
import ArrowIcon from '../components/ArrowIcon';

// Types for our ecosystem
interface Robot {
  id: number;
  x: number;
  y: number;
  type: 'pathfinder' | 'collector' | 'defender' | 'explorer';
  color: string;
  health: number;
  energy: number;
  goal?: { x: number; y: number };
  path: Array<{ x: number; y: number }>;
  inventory: Record<string, number>;
  status: string;
  lastDecision: string;
}

interface Resource {
  id: number;
  x: number;
  y: number;
  type: 'food' | 'water' | 'material' | 'energy';
  amount: number;
  color: string;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'hazard' | 'water';
}

interface Cell {
  x: number;
  y: number;
  type: 'grass' | 'sand' | 'water' | 'forest' | 'mountain';
  elevation: number;
  danger: number;
  resources: string[];
}

// Decision-making utility for robots
const makeDecision = (robot: Robot, grid: Cell[][], resources: Resource[], _robots: Robot[]) => {
  // Using _robots naming convention to indicate an unused parameter
  const decisions = {
    pathfinder: 'Looking for optimal paths through complex terrain',
    collector: 'Gathering resources for the community',
    defender: 'Protecting the ecosystem from threats',
    explorer: 'Discovering new areas and resources'
  };
  
  // Simple pathfinding logic
  if (!robot.goal || (robot.goal.x === robot.x && robot.goal.y === robot.y)) {
    // Set new goal when reaching current one or none exists
    const nearestResource = findNearestResource(robot, resources);
    if (nearestResource) {
      return {
        ...robot,
        goal: { x: nearestResource.x, y: nearestResource.y },
        lastDecision: `Heading toward ${nearestResource.type} resource at (${nearestResource.x}, ${nearestResource.y})`
      };
    } else {
      // Random exploration when no resources found
      const randomX = Math.floor(Math.random() * grid[0].length);
      const randomY = Math.floor(Math.random() * grid.length);
      return {
        ...robot,
        goal: { x: randomX, y: randomY },
        lastDecision: `Exploring randomly to position (${randomX}, ${randomY})`
      };
    }
  }
  
  // Move toward goal
  if (robot.goal) {
    const dx = Math.sign(robot.goal.x - robot.x);
    const dy = Math.sign(robot.goal.y - robot.y);
    return {
      ...robot,
      x: robot.x + dx,
      y: robot.y + dy, 
      energy: robot.energy - 1,
      lastDecision: decisions[robot.type] || 'Moving toward goal'
    };
  }
  
  return robot;
};

// Find the nearest resource to a robot
const findNearestResource = (robot: Robot, resources: Resource[]) => {
  if (resources.length === 0) return null;
  
  let nearestResource = resources[0];
  let minDistance = Math.sqrt(
    Math.pow(resources[0].x - robot.x, 2) + 
    Math.pow(resources[0].y - robot.y, 2)
  );
  
  resources.forEach(resource => {
    const distance = Math.sqrt(
      Math.pow(resource.x - robot.x, 2) + 
      Math.pow(resource.y - robot.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestResource = resource;
    }
  });
  
  return nearestResource;
};

// Generate the initial grid
const generateGrid = (width: number, height: number): Cell[][] => {
  const types: Array<'grass' | 'sand' | 'water' | 'forest' | 'mountain'> = [
    'grass', 'sand', 'water', 'forest', 'mountain'
  ];
  
  const grid: Cell[][] = [];
  
  // Generate perlin-like noise (simplified)
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      const noiseValue = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
      const typeIndex = Math.floor(noiseValue * types.length);
      
      row.push({
        x,
        y,
        type: types[typeIndex],
        elevation: Math.floor(noiseValue * 10),
        danger: Math.random() * 0.3,
        resources: []
      });
    }
    grid.push(row);
  }
  
  return grid;
};

// Component definition
const RobotEcosystem: React.FC = () => {
  const gridWidth = 20;
  const gridHeight = 15;
  const cellSize = 30;
  
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000); // ms between updates
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [turnsElapsed, setTurnsElapsed] = useState<number>(0);
  const [message, setMessage] = useState<string>("Welcome to Robot Ecosystem");
  
  // Get color for a terrain type
  const getTerrainColor = (type: string): string => {
    const colors: Record<string, string> = {
      grass: '#8FBC8F',
      sand: '#F5DEB3',
      water: '#ADD8E6',
      forest: '#228B22',
      mountain: '#A9A9A9'
    };
    return colors[type] || '#FFFFFF';
  };
  
  // Initialize simulation
  useEffect(() => {
    // Generate the grid
    const newGrid = generateGrid(gridWidth, gridHeight);
    setGrid(newGrid);
    
    // Create robots
    const robotTypes: Array<'pathfinder' | 'collector' | 'defender' | 'explorer'> = [
      'pathfinder', 'collector', 'defender', 'explorer'
    ];
    
    const robotColors: Record<string, string> = {
      pathfinder: '#4169E1', // Royal Blue
      collector: '#32CD32', // Lime Green
      defender: '#DC143C',  // Crimson
      explorer: '#FF8C00'   // Dark Orange
    };
    
    const newRobots = Array.from({ length: 5 }, (_, i) => {
      const type = robotTypes[i % robotTypes.length];
      return {
        id: i,
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
        type,
        color: robotColors[type],
        health: 100,
        energy: 100,
        path: [],
        inventory: { food: 0, water: 0, material: 0, energy: 0 },
        status: 'idle',
        lastDecision: 'Waiting for commands'
      };
    });
    
    setRobots(newRobots);
    
    // Create resources
    const resourceTypes: Array<'food' | 'water' | 'material' | 'energy'> = [
      'food', 'water', 'material', 'energy'
    ];
    
    const resourceColors: Record<string, string> = {
      food: '#7CFC00',    // Lawn Green
      water: '#1E90FF',   // Dodger Blue
      material: '#CD853F',// Peru
      energy: '#FFD700'   // Gold
    };
    
    const newResources = Array.from({ length: 15 }, (_, i) => {
      const type = resourceTypes[i % resourceTypes.length];
      return {
        id: i,
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
        type,
        amount: Math.floor(Math.random() * 50) + 10,
        color: resourceColors[type]
      };
    });
    
    setResources(newResources);
    
    // Create obstacles
    const obstacleTypes: Array<'wall' | 'hazard' | 'water'> = [
      'wall', 'hazard', 'water'
    ];
    
    const newObstacles = Array.from({ length: 5 }, (_, i) => {
      return {
        id: i,
        x: Math.floor(Math.random() * (gridWidth - 3)),
        y: Math.floor(Math.random() * (gridHeight - 3)),
        width: Math.floor(Math.random() * 3) + 1,
        height: Math.floor(Math.random() * 3) + 1,
        type: obstacleTypes[i % obstacleTypes.length]
      };
    });
    
    setObstacles(newObstacles);
    
  }, []);
  
  // Update simulation logic
  const updateSimulation = useCallback(() => {
    if (!isRunning || robots.length === 0) return;
    
    // Update each robot
    const updatedRobots = robots.map(robot => {
      // Skip robots with no energy
      if (robot.energy <= 0) {
        return { ...robot, status: 'exhausted', lastDecision: 'Out of energy' };
      }
      
      // Make a decision for this robot
      return makeDecision(robot, grid, resources, robots);
    });
    
    setRobots(updatedRobots);
    setTurnsElapsed(prev => prev + 1);
    
    // Check for resource collection
    const collectibleResources: Record<number, number> = {}; // resourceId -> robotId
    
    updatedRobots.forEach(robot => {
      resources.forEach(resource => {
        if (robot.x === resource.x && robot.y === resource.y) {
          collectibleResources[resource.id] = robot.id;
        }
      });
    });
    
    // Process resource collection
    if (Object.keys(collectibleResources).length > 0) {
      const updatedResources = [...resources];
      const robotsWithUpdates = [...updatedRobots];
      
      Object.entries(collectibleResources).forEach(([resourceId, robotId]) => {
        const resourceIndex = updatedResources.findIndex(r => r.id === parseInt(resourceId));
        const robotIndex = robotsWithUpdates.findIndex(r => r.id === robotId);
        
        if (resourceIndex !== -1 && robotIndex !== -1) {
          const resource = updatedResources[resourceIndex];
          
          // Update robot inventory
          const updatedRobot = { 
            ...robotsWithUpdates[robotIndex],
            inventory: {
              ...robotsWithUpdates[robotIndex].inventory,
              [resource.type]: (robotsWithUpdates[robotIndex].inventory[resource.type] || 0) + 10
            },
            energy: Math.min(robotsWithUpdates[robotIndex].energy + 20, 100),
            lastDecision: `Collected ${resource.type} resource`
          };
          
          robotsWithUpdates[robotIndex] = updatedRobot;
          
          // Remove or reduce resource
          if (resource.amount <= 10) {
            updatedResources.splice(resourceIndex, 1);
          } else {
            updatedResources[resourceIndex] = {
              ...resource,
              amount: resource.amount - 10
            };
          }
          
          setMessage(`Robot ${robotId} (${updatedRobot.type}) collected ${resource.type} resource`);
        }
      });
      
      setResources(updatedResources);
      setRobots(robotsWithUpdates);
    }
    
  }, [robots, grid, isRunning, resources]);
  
  // Set up the simulation interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning) {
      intervalId = setInterval(updateSimulation, simulationSpeed);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, simulationSpeed, updateSimulation]);
  
  // Handle robot selection
  const handleRobotClick = (robot: Robot) => {
    setSelectedRobot(robot);
  };
  
  // Toggle simulation
  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    setIsRunning(false);
    setTurnsElapsed(0);
    
    // Re-initialize all entities
    const newGrid = generateGrid(gridWidth, gridHeight);
    setGrid(newGrid);
    
    // Reset robots to starting positions with full energy
    setRobots(prev => prev.map(robot => ({
      ...robot,
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight),
      health: 100,
      energy: 100,
      goal: undefined,
      status: 'idle',
      lastDecision: 'Simulation reset'
    })));
    
    // Regenerate resources
    const resourceTypes: Array<'food' | 'water' | 'material' | 'energy'> = [
      'food', 'water', 'material', 'energy'
    ];
    
    const resourceColors: Record<string, string> = {
      food: '#7CFC00',
      water: '#1E90FF',
      material: '#CD853F',
      energy: '#FFD700'
    };
    
    const newResources = Array.from({ length: 15 }, (_, i) => {
      const type = resourceTypes[i % resourceTypes.length];
      return {
        id: i,
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
        type,
        amount: Math.floor(Math.random() * 50) + 10,
        color: resourceColors[type]
      };
    });
    
    setResources(newResources);
    setMessage("Simulation reset");
  };
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-blue-700 mb-2 flex items-center">
          Robot Ecosystem <ArrowIcon size={20} color="#4299e1" className="ml-2" />
        </h2>
        <p className="text-gray-600 mb-4">
          A simulation of different robots interacting in a shared environment.
          Each robot type has different behaviors and goals.
        </p>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={toggleSimulation}
            className={`px-4 py-2 rounded-md ${
              isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            {isRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>
          
          <button
            onClick={resetSimulation}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Reset Simulation
          </button>
          
          <div className="flex items-center">
            <label htmlFor="speed" className="mr-2 text-sm">Speed:</label>
            <select
              id="speed"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={2000}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={500}>Fast</option>
              <option value={200}>Very Fast</option>
            </select>
          </div>
        </div>
        
        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            Turn: {turnsElapsed} | {message}
          </p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="relative">
          <div 
            className="grid border border-gray-300 rounded-md bg-gray-50"
            style={{
              gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`
            }}
          >
            {/* Render grid cells */}
            {grid.length > 0 && grid.flat().map((cell) => (
              <div 
                key={`${cell.x}-${cell.y}`} 
                className="border border-gray-200"
                style={{ 
                  backgroundColor: getTerrainColor(cell.type),
                  width: `${cellSize}px`, 
                  height: `${cellSize}px`
                }}
              />
            ))}
            
            {/* Render obstacles */}
            {obstacles.map((obstacle) => (
              <div
                key={`obstacle-${obstacle.id}`}
                className="absolute border border-gray-700"
                style={{
                  left: obstacle.x * cellSize,
                  top: obstacle.y * cellSize,
                  width: obstacle.width * cellSize,
                  height: obstacle.height * cellSize,
                  backgroundColor: obstacle.type === 'wall' ? '#8B4513' :
                                  obstacle.type === 'hazard' ? '#FF4500' : '#87CEEB',
                  opacity: 0.7,
                  zIndex: 10
                }}
              />
            ))}
            
            {/* Render resources */}
            {resources.map((resource) => (
              <div
                key={`resource-${resource.id}`}
                className="absolute rounded-full flex items-center justify-center font-bold text-xs"
                style={{
                  left: resource.x * cellSize,
                  top: resource.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: resource.color,
                  zIndex: 20
                }}
              >
                {resource.amount}
              </div>
            ))}
            
            {/* Render robots */}
            {robots.map((robot) => (
              <div
                key={`robot-${robot.id}`}
                className="absolute rounded-full flex items-center justify-center cursor-pointer border-2 transition-all"
                style={{
                  left: robot.x * cellSize,
                  top: robot.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: robot.color,
                  borderColor: selectedRobot?.id === robot.id ? 'white' : 'transparent',
                  zIndex: 30,
                  transform: selectedRobot?.id === robot.id ? 'scale(1.1)' : 'scale(1)'
                }}
                onClick={() => handleRobotClick(robot)}
              >
                {robot.id}
              </div>
            ))}
            
            {/* Render robot goals */}
            {robots.map((robot) => 
              robot.goal && (
                <div
                  key={`goal-${robot.id}`}
                  className="absolute rounded-full border-2 border-dashed opacity-50"
                  style={{
                    left: robot.goal.x * cellSize,
                    top: robot.goal.y * cellSize,
                    width: cellSize,
                    height: cellSize,
                    borderColor: robot.color,
                    zIndex: 15
                  }}
                />
              )
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-white p-4 rounded-md border border-gray-200">
          {selectedRobot ? (
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ color: selectedRobot.color }}>
                Robot {selectedRobot.id}: {selectedRobot.type.charAt(0).toUpperCase() + selectedRobot.type.slice(1)}
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-mono">({selectedRobot.x}, {selectedRobot.y})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>{selectedRobot.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Health</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${selectedRobot.health}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Energy</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-400 h-2.5 rounded-full" 
                      style={{ width: `${selectedRobot.energy}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Inventory</p>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {Object.entries(selectedRobot.inventory).map(([resource, amount]) => (
                    <div key={resource} className="bg-gray-100 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">{resource}</p>
                      <p className="font-bold">{amount}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Decision</p>
                <p className="italic text-gray-600 text-sm p-2 bg-gray-50 rounded">
                  "{selectedRobot.lastDecision}"
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Select a robot to view details</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="p-3 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
            <p className="font-semibold">Pathfinder</p>
          </div>
          <p className="text-xs text-gray-600 mt-1">Finds optimal routes through terrain</p>
        </div>
        
        <div className="p-3 bg-green-50 rounded-md">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-600 mr-2"></div>
            <p className="font-semibold">Collector</p>
          </div>
          <p className="text-xs text-gray-600 mt-1">Efficiently gathers resources</p>
        </div>
        
        <div className="p-3 bg-red-50 rounded-md">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-600 mr-2"></div>
            <p className="font-semibold">Defender</p>
          </div>
          <p className="text-xs text-gray-600 mt-1">Protects others from threats</p>
        </div>
        
        <div className="p-3 bg-yellow-50 rounded-md">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-600 mr-2"></div>
            <p className="font-semibold">Explorer</p>
          </div>
          <p className="text-xs text-gray-600 mt-1">Discovers new areas and resources</p>
        </div>
      </div>
    </div>
  );
};

export default RobotEcosystem;
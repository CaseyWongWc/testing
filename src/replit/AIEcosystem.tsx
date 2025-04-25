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
  // Using _agents naming convention to indicate an unused parameter
  const decisions = {
    pathfinder: 'Looking for optimal paths through complex terrain',
    collector: 'Gathering resources for the community',
    defender: 'Protecting the ecosystem from threats',
    explorer: 'Discovering new areas and resources'
  };
  
  // Simple pathfinding logic
  if (!agent.goal || (agent.goal.x === agent.x && agent.goal.y === agent.y)) {
    // Set new goal when reaching current one or none exists
    const nearestResource = findNearestResource(agent, resources);
    if (nearestResource) {
      return {
        ...agent,
        goal: { x: nearestResource.x, y: nearestResource.y },
        lastDecision: `Heading toward ${nearestResource.type} resource at (${nearestResource.x}, ${nearestResource.y})`
      };
    } else {
      // Random exploration when no resources found
      const randomX = Math.floor(Math.random() * grid[0].length);
      const randomY = Math.floor(Math.random() * grid.length);
      return {
        ...agent,
        goal: { x: randomX, y: randomY },
        lastDecision: `Exploring randomly to position (${randomX}, ${randomY})`
      };
    }
  }
  
  // Move toward goal
  if (agent.goal) {
    const dx = Math.sign(agent.goal.x - agent.x);
    const dy = Math.sign(agent.goal.y - agent.y);
    return {
      ...agent,
      x: agent.x + dx,
      y: agent.y + dy, 
      energy: agent.energy - 1,
      lastDecision: decisions[agent.type] || 'Moving toward goal'
    };
  }
  
  return agent;
};

// Find the nearest resource to an agent
const findNearestResource = (agent: Agent, resources: Resource[]) => {
  if (resources.length === 0) return null;
  
  let nearestResource = resources[0];
  let minDistance = Math.sqrt(
    Math.pow(resources[0].x - agent.x, 2) + 
    Math.pow(resources[0].y - agent.y, 2)
  );
  
  resources.forEach(resource => {
    const distance = Math.sqrt(
      Math.pow(resource.x - agent.x, 2) + 
      Math.pow(resource.y - agent.y, 2)
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000); // ms between updates
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [turnsElapsed, setTurnsElapsed] = useState<number>(0);
  const [message, setMessage] = useState<string>("Welcome to AI Ecosystem");
  
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
    
    // Create agents
    const agentTypes: Array<'pathfinder' | 'collector' | 'defender' | 'explorer'> = [
      'pathfinder', 'collector', 'defender', 'explorer'
    ];
    
    const agentColors: Record<string, string> = {
      pathfinder: '#4169E1', // Royal Blue
      collector: '#32CD32', // Lime Green
      defender: '#DC143C',  // Crimson
      explorer: '#FF8C00'   // Dark Orange
    };
    
    const newAgents = Array.from({ length: 5 }, (_, i) => {
      const type = agentTypes[i % agentTypes.length];
      return {
        id: i,
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
        type,
        color: agentColors[type],
        health: 100,
        energy: 100,
        path: [],
        inventory: { food: 0, water: 0, material: 0, energy: 0 },
        status: 'idle',
        lastDecision: 'Waiting for commands'
      };
    });
    
    setAgents(newAgents);
    
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
    if (!isRunning || agents.length === 0) return;
    
    // Update each agent
    const updatedAgents = agents.map(agent => {
      // Skip agents with no energy
      if (agent.energy <= 0) {
        return { ...agent, status: 'exhausted', lastDecision: 'Out of energy' };
      }
      
      // Make a decision for this agent
      return makeDecision(agent, grid, resources, agents);
    });
    
    setAgents(updatedAgents);
    setTurnsElapsed(prev => prev + 1);
    
    // Check for resource collection
    const collectibleResources: Record<number, number> = {}; // resourceId -> agentId
    
    updatedAgents.forEach(agent => {
      resources.forEach(resource => {
        if (agent.x === resource.x && agent.y === resource.y) {
          collectibleResources[resource.id] = agent.id;
        }
      });
    });
    
    // Process resource collection
    if (Object.keys(collectibleResources).length > 0) {
      const updatedResources = [...resources];
      const agentsWithUpdates = [...updatedAgents];
      
      Object.entries(collectibleResources).forEach(([resourceId, agentId]) => {
        const resourceIndex = updatedResources.findIndex(r => r.id === parseInt(resourceId));
        const agentIndex = agentsWithUpdates.findIndex(a => a.id === agentId);
        
        if (resourceIndex !== -1 && agentIndex !== -1) {
          const resource = updatedResources[resourceIndex];
          
          // Update agent inventory
          const updatedAgent = { 
            ...agentsWithUpdates[agentIndex],
            inventory: {
              ...agentsWithUpdates[agentIndex].inventory,
              [resource.type]: (agentsWithUpdates[agentIndex].inventory[resource.type] || 0) + 10
            },
            energy: Math.min(agentsWithUpdates[agentIndex].energy + 20, 100),
            lastDecision: `Collected ${resource.type} resource`
          };
          
          agentsWithUpdates[agentIndex] = updatedAgent;
          
          // Remove or reduce resource
          if (resource.amount <= 10) {
            updatedResources.splice(resourceIndex, 1);
          } else {
            updatedResources[resourceIndex] = {
              ...resource,
              amount: resource.amount - 10
            };
          }
          
          setMessage(`Agent ${agentId} (${updatedAgent.type}) collected ${resource.type} resource`);
        }
      });
      
      setResources(updatedResources);
      setAgents(agentsWithUpdates);
    }
    
  }, [agents, grid, isRunning, resources]);
  
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
  
  // Handle agent selection
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
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
    
    // Reset agents to starting positions with full energy
    setAgents(prev => prev.map(agent => ({
      ...agent,
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
          AI Ecosystem <ArrowIcon size={20} color="#4299e1" className="ml-2" />
        </h2>
        <p className="text-gray-600 mb-4">
          A simulation of different AI agents interacting in a shared environment.
          Each agent type has different behaviors and goals.
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
            
            {/* Render agents */}
            {agents.map((agent) => (
              <div
                key={`agent-${agent.id}`}
                className="absolute rounded-full flex items-center justify-center cursor-pointer border-2 transition-all"
                style={{
                  left: agent.x * cellSize,
                  top: agent.y * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: agent.color,
                  borderColor: selectedAgent?.id === agent.id ? 'white' : 'transparent',
                  zIndex: 30,
                  transform: selectedAgent?.id === agent.id ? 'scale(1.1)' : 'scale(1)'
                }}
                onClick={() => handleAgentClick(agent)}
              >
                {agent.id}
              </div>
            ))}
            
            {/* Render agent goals */}
            {agents.map((agent) => 
              agent.goal && (
                <div
                  key={`goal-${agent.id}`}
                  className="absolute rounded-full border-2 border-dashed opacity-50"
                  style={{
                    left: agent.goal.x * cellSize,
                    top: agent.goal.y * cellSize,
                    width: cellSize,
                    height: cellSize,
                    borderColor: agent.color,
                    zIndex: 15
                  }}
                />
              )
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-white p-4 rounded-md border border-gray-200">
          {selectedAgent ? (
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ color: selectedAgent.color }}>
                Agent {selectedAgent.id}: {selectedAgent.type.charAt(0).toUpperCase() + selectedAgent.type.slice(1)}
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-mono">({selectedAgent.x}, {selectedAgent.y})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>{selectedAgent.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Health</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${selectedAgent.health}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Energy</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-400 h-2.5 rounded-full" 
                      style={{ width: `${selectedAgent.energy}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Inventory</p>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {Object.entries(selectedAgent.inventory).map(([resource, amount]) => (
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
                  "{selectedAgent.lastDecision}"
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Select an agent to view details</p>
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

export default AIEcosystem;
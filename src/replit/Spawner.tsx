import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Play, Pause, RotateCcw } from 'lucide-react';

// Types for the different entities
interface Entity {
  id: number;
  x: number;
  y: number;
  type: EntityType;
  color: string;
  speed: number;
  direction?: { dx: number; dy: number };
  health?: number;
  maxHealth?: number;
  strength?: number;
  properties: { [key: string]: string | number | boolean };
  status?: string;
  lifespan?: number;
  createdAt: number;
}

type EntityType = 'item' | 'creature' | 'npc' | 'obstacle';

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  entities: Entity[];
  f?: number;
  g?: number;
  h?: number;
  parent?: Cell | null;
}

interface SpawnerConfig {
  maxCapacity: number;
  spawnFrequency: number; // in seconds
  entityType: EntityType;
  direction: 'up' | 'down' | 'left' | 'right' | 'random';
  randomOrientation: boolean;
  templates: {
    item: { [key: string]: any }[];
    creature: { [key: string]: any }[];
    npc: { [key: string]: any }[];
    obstacle: { [key: string]: any }[];
  };
}

interface SpawnerState {
  active: boolean;
  entities: Entity[];
  spawnCount: number;
  lastSpawnTime: number;
}

interface SpawnerProps {
  width: number;
  height: number;
  wallDensity: number;
}

export const Spawner: React.FC<SpawnerProps> = ({ width, height, wallDensity }) => {
  // Grid state
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [spawners, setSpawners] = useState<{ position: { x: number, y: number }, config: SpawnerConfig, state: SpawnerState }[]>([]);
  const [selectedSpawner, setSelectedSpawner] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [entityCount, setEntityCount] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // Templates for different entity types
  const entityTemplates = {
    item: [
      {
        name: 'Health Potion',
        color: '#ff5555',
        properties: { 
          strengthValue: 0, 
          goldValue: 5, 
          foodValue: 0, 
          waterValue: 0,
          healing: 20
        },
        speed: 0
      },
      {
        name: 'Gold Coin',
        color: '#ffdd44',
        properties: { 
          strengthValue: 0, 
          goldValue: 10, 
          foodValue: 0, 
          waterValue: 0
        },
        speed: 0
      },
      {
        name: 'Magic Orb',
        color: '#aa44ff',
        properties: { 
          strengthValue: 5, 
          goldValue: 8, 
          foodValue: 0, 
          waterValue: 0,
          mana: 15
        },
        speed: 0
      },
      {
        name: 'Food Ration',
        color: '#44bb33',
        properties: { 
          strengthValue: 2, 
          goldValue: 3, 
          foodValue: 10, 
          waterValue: 0
        },
        speed: 0
      },
      {
        name: 'Water Flask',
        color: '#33aaff',
        properties: { 
          strengthValue: 0, 
          goldValue: 2, 
          foodValue: 0, 
          waterValue: 10
        },
        speed: 0
      }
    ],
    creature: [
      {
        name: 'Slime',
        color: '#22cc88',
        properties: { 
          health: 20,
          maxHealth: 20,
          damage: 5,
          aggressive: false,
          dropRate: 0.5
        },
        speed: 0.7
      },
      {
        name: 'Wolf',
        color: '#888888',
        properties: { 
          health: 30,
          maxHealth: 30,
          damage: 8,
          aggressive: true,
          dropRate: 0.6
        },
        speed: 1.2
      },
      {
        name: 'Ghost',
        color: '#ccccff',
        properties: { 
          health: 15,
          maxHealth: 15,
          damage: 10,
          aggressive: true,
          phasing: true,
          dropRate: 0.7
        },
        speed: 0.9
      }
    ],
    npc: [
      {
        name: 'Villager',
        color: '#e0c080',
        properties: { 
          health: 50,
          maxHealth: 50,
          friendly: true,
          dialogue: 'Hello traveler!',
          quest: false
        },
        speed: 0.5
      },
      {
        name: 'Merchant',
        color: '#c08060',
        properties: { 
          health: 60,
          maxHealth: 60,
          friendly: true,
          dialogue: 'Care to trade?',
          quest: false,
          inventory: 'Large'
        },
        speed: 0.4
      },
      {
        name: 'Guard',
        color: '#6080e0',
        properties: { 
          health: 80,
          maxHealth: 80,
          friendly: true,
          dialogue: 'Stay out of trouble!',
          quest: false,
          weapon: 'Sword'
        },
        speed: 0.7
      }
    ],
    obstacle: [
      {
        name: 'Barrel',
        color: '#a06040',
        properties: { 
          destructible: true,
          health: 15,
          containsLoot: true
        },
        speed: 0
      },
      {
        name: 'Crate',
        color: '#c08040',
        properties: { 
          destructible: true,
          health: 20,
          containsLoot: true
        },
        speed: 0
      },
      {
        name: 'Boulder',
        color: '#808080',
        properties: { 
          destructible: false,
          moveable: false
        },
        speed: 0
      }
    ]
  };

  // Direction icons
  const directionIcons = {
    up: <ArrowUp size={16} />,
    down: <ArrowDown size={16} />,
    left: <ArrowLeft size={16} />,
    right: <ArrowRight size={16} />,
    random: 'R',
  };

  // Initialize grid
  useEffect(() => {
    // Generate grid with walls
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
          entities: [],
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);

    // Initialize some default spawners
    const defaultSpawners = [
      {
        position: { x: 5, y: 5 },
        config: {
          maxCapacity: 10,
          spawnFrequency: 3,
          entityType: 'item' as EntityType,
          direction: 'random' as 'up' | 'down' | 'left' | 'right' | 'random',
          randomOrientation: true,
          templates: entityTemplates
        },
        state: {
          active: false,
          entities: [],
          spawnCount: 0,
          lastSpawnTime: 0
        }
      },
      {
        position: { x: width - 6, y: 5 },
        config: {
          maxCapacity: 5,
          spawnFrequency: 5,
          entityType: 'creature' as EntityType,
          direction: 'down' as 'up' | 'down' | 'left' | 'right' | 'random',
          randomOrientation: false,
          templates: entityTemplates
        },
        state: {
          active: false,
          entities: [],
          spawnCount: 0,
          lastSpawnTime: 0
        }
      },
      {
        position: { x: 5, y: height - 6 },
        config: {
          maxCapacity: 3,
          spawnFrequency: 7,
          entityType: 'npc' as EntityType,
          direction: 'right' as 'up' | 'down' | 'left' | 'right' | 'random',
          randomOrientation: false,
          templates: entityTemplates
        },
        state: {
          active: false,
          entities: [],
          spawnCount: 0,
          lastSpawnTime: 0
        }
      }
    ];

    // Adjust spawner positions to ensure they're not on walls
    defaultSpawners.forEach(spawner => {
      let { x, y } = spawner.position;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts && (x === 0 || y === 0 || x === width - 1 || y === height - 1 || Math.random() < wallDensity)) {
        x = Math.floor(Math.random() * (width - 2)) + 1;
        y = Math.floor(Math.random() * (height - 2)) + 1;
        attempts++;
      }
      
      spawner.position = { x, y };
    });

    setSpawners(defaultSpawners);
    setSelectedSpawner(0);

  }, [width, height, wallDensity]);

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

  // Spawn entity logic
  const spawnEntity = useCallback((spawnerIndex: number) => {
    const spawner = spawners[spawnerIndex];
    if (!spawner) return null;
    
    // Check if the spawner has reached its capacity
    if (spawner.state.entities.length >= spawner.config.maxCapacity) {
      return null;
    }

    // Get entity template based on type
    const templates = spawner.config.templates[spawner.config.entityType];
    if (!templates || templates.length === 0) return null;
    
    const templateIndex = Math.floor(Math.random() * templates.length);
    const template = templates[templateIndex];
    
    // Calculate spawn position based on direction
    let spawnX = spawner.position.x;
    let spawnY = spawner.position.y;
    let directionVector = { dx: 0, dy: 0 };
    
    switch (spawner.config.direction) {
      case 'up':
        spawnY -= 1;
        directionVector = { dx: 0, dy: -1 };
        break;
      case 'down':
        spawnY += 1;
        directionVector = { dx: 0, dy: 1 };
        break;
      case 'left':
        spawnX -= 1;
        directionVector = { dx: -1, dy: 0 };
        break;
      case 'right':
        spawnX += 1;
        directionVector = { dx: 1, dy: 0 };
        break;
      case 'random':
        const directions = [
          { dx: 0, dy: -1 }, // up
          { dx: 0, dy: 1 },  // down
          { dx: -1, dy: 0 }, // left
          { dx: 1, dy: 0 }   // right
        ];
        const randomDir = Math.floor(Math.random() * directions.length);
        directionVector = directions[randomDir];
        spawnX += directionVector.dx;
        spawnY += directionVector.dy;
        break;
    }
    
    // Validate spawn position
    if (spawnX < 0 || spawnX >= width || spawnY < 0 || spawnY >= height) {
      return null;
    }
    
    // Check if the spawn position is a wall
    if (grid[spawnY][spawnX].isWall) {
      return null;
    }
    
    // Create the entity
    const entity: Entity = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      x: spawnX,
      y: spawnY,
      type: spawner.config.entityType,
      color: template.color,
      speed: template.speed,
      direction: spawner.config.randomOrientation 
        ? { 
            dx: Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0,
            dy: Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) : 0
          }
        : directionVector,
      properties: { ...template.properties },
      createdAt: Date.now(),
      status: 'spawned'
    };
    
    if (spawner.config.entityType === 'creature' || spawner.config.entityType === 'npc') {
      entity.health = template.properties.health;
      entity.maxHealth = template.properties.maxHealth;
      entity.strength = template.properties.damage || 0;
    }
    
    // For non-stationary entities, add a lifespan
    if (entity.speed > 0) {
      entity.lifespan = Math.floor(30000 + Math.random() * 30000); // 30-60 seconds
    }

    addLog(`Spawned ${spawner.config.entityType}: ${template.name} at (${spawnX}, ${spawnY})`);
    
    return entity;
  }, [grid, spawners, width, height, addLog]);

  // Update game state
  const updateGame = useCallback((timestamp: number) => {
    if (!running) return;
    
    // Update only every 50ms
    if (timestamp - lastUpdateTimeRef.current < 50) {
      animationRef.current = requestAnimationFrame(updateGame);
      return;
    }
    
    const deltaTime = (timestamp - lastUpdateTimeRef.current) / 1000; // Convert to seconds
    lastUpdateTimeRef.current = timestamp;
    
    setSpawners(prevSpawners => {
      const updatedSpawners = [...prevSpawners];
      let updatedGrid = [...grid];
      let totalEntities = 0;
      
      // Process each spawner
      updatedSpawners.forEach((spawner, index) => {
        // Skip inactive spawners
        if (!spawner.state.active) return;
        
        // Check if it's time to spawn a new entity
        const currentTime = Date.now();
        const timeSinceLastSpawn = (currentTime - spawner.state.lastSpawnTime) / 1000;
        
        if (timeSinceLastSpawn >= spawner.config.spawnFrequency && 
            spawner.state.entities.length < spawner.config.maxCapacity) {
          const newEntity = spawnEntity(index);
          
          if (newEntity) {
            // Add entity to grid
            updatedGrid[newEntity.y][newEntity.x].entities.push(newEntity);
            
            // Update spawner state
            const updatedState = {
              ...spawner.state,
              entities: [...spawner.state.entities, newEntity],
              spawnCount: spawner.state.spawnCount + 1,
              lastSpawnTime: currentTime
            };
            
            updatedSpawners[index] = {
              ...spawner,
              state: updatedState
            };
          }
        }
        
        // Update entities for this spawner
        const updatedEntities = spawner.state.entities.map(entity => {
          // Skip if entity is stationary
          if (entity.speed === 0) return entity;
          
          // Update entity position based on direction and speed
          let newX = entity.x;
          let newY = entity.y;
          
          if (entity.direction) {
            newX += entity.direction.dx * entity.speed * deltaTime;
            newY += entity.direction.dy * entity.speed * deltaTime;
            
            // Round to nearest grid position
            newX = Math.round(newX);
            newY = Math.round(newY);
            
            // Check bounds and walls
            if (newX >= 0 && newX < width && newY >= 0 && newY < height && 
                !updatedGrid[newY][newX].isWall) {
              // Remove from current position
              updatedGrid[entity.y][entity.x].entities = updatedGrid[entity.y][entity.x].entities
                .filter(e => e.id !== entity.id);
              
              // Add to new position
              updatedGrid[newY][newX].entities.push({
                ...entity,
                x: newX,
                y: newY
              });
              
              return {
                ...entity,
                x: newX,
                y: newY
              };
            } else {
              // Hit a wall, change direction
              return {
                ...entity,
                direction: {
                  dx: Math.random() < 0.5 ? -entity.direction.dx : entity.direction.dx * -1,
                  dy: Math.random() < 0.5 ? -entity.direction.dy : entity.direction.dy * -1
                }
              };
            }
          }
          
          return entity;
        }).filter(entity => {
          // Check for expired entities
          if (entity.lifespan && Date.now() - entity.createdAt > entity.lifespan) {
            // Remove from grid
            updatedGrid[entity.y][entity.x].entities = updatedGrid[entity.y][entity.x].entities
              .filter(e => e.id !== entity.id);
            
            // Log entity expiry
            addLog(`${entity.type} expired at (${entity.x}, ${entity.y})`);
            
            return false;
          }
          return true;
        });
        
        // Update spawner with filtered entities
        updatedSpawners[index] = {
          ...spawner,
          state: {
            ...spawner.state,
            entities: updatedEntities
          }
        };
        
        totalEntities += updatedEntities.length;
      });
      
      // Update entity count
      setEntityCount(totalEntities);
      
      // Update the grid
      setGrid(updatedGrid);
      
      return updatedSpawners;
    });
    
    animationRef.current = requestAnimationFrame(updateGame);
  }, [running, grid, spawnEntity, width, height, addLog]);

  // Start/stop the simulation
  useEffect(() => {
    if (running) {
      lastUpdateTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(updateGame);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running, updateGame]);

  // Toggle spawner active state
  const toggleSpawnerActive = (index: number) => {
    setSpawners(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        state: {
          ...updated[index].state,
          active: !updated[index].state.active
        }
      };
      return updated;
    });
  };

  // Update spawner config
  const updateSpawnerConfig = (index: number, key: keyof SpawnerConfig, value: any) => {
    setSpawners(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        config: {
          ...updated[index].config,
          [key]: value
        }
      };
      return updated;
    });
  };

  // Render a cell
  const renderCell = (cell: Cell) => {
    const { x, y, isWall, entities } = cell;
    
    // Check if this cell contains a spawner
    const spawnerIndex = spawners.findIndex(s => s.position.x === x && s.position.y === y);
    const isSpawner = spawnerIndex !== -1;
    const isSelectedSpawner = isSpawner && spawnerIndex === selectedSpawner;
    
    // Cell styling
    let cellClassName = "w-5 h-5 border border-gray-200 flex items-center justify-center";
    if (isWall) {
      cellClassName += " bg-gray-800";
    } else if (isSelectedSpawner) {
      cellClassName += " bg-purple-500 text-white";
    } else if (isSpawner) {
      cellClassName += " bg-purple-300";
    } else if (entities.length > 0) {
      // Display the top entity
      const topEntity = entities[entities.length - 1];
      return (
        <div
          className={`${cellClassName} relative`}
          style={{ backgroundColor: topEntity.color }}
          title={`${topEntity.type} - ${topEntity.properties.name || 'Entity'}`}
        >
          {topEntity.type === 'creature' && <div className="text-xs">C</div>}
          {topEntity.type === 'npc' && <div className="text-xs">N</div>}
          {topEntity.type === 'item' && <div className="text-xs">I</div>}
          {entities.length > 1 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {entities.length}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div
        key={`${x}-${y}`}
        className={cellClassName}
        onClick={() => {
          if (isSpawner) {
            setSelectedSpawner(spawnerIndex);
          }
        }}
      >
        {isSpawner && (
          <div className="text-sm">
            {directionIcons[spawners[spawnerIndex].config.direction]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(1.25rem,1fr))] gap-0 border border-gray-300 p-1 bg-gray-50">
            {grid.map((row, y) => (
              <React.Fragment key={y}>
                {row.map((cell, x) => (
                  <div key={`${x}-${y}`}>
                    {renderCell(cell)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setRunning(!running)}
              className={`px-4 py-2 rounded flex items-center gap-1 ${
                running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Start'}
            </button>
            
            <button
              onClick={() => {
                setRunning(false);
                
                // Reset all spawners
                setSpawners(prev => prev.map(spawner => ({
                  ...spawner,
                  state: {
                    active: false,
                    entities: [],
                    spawnCount: 0,
                    lastSpawnTime: 0
                  }
                })));
                
                // Reset grid - clear all entities
                setGrid(prev => prev.map(row => 
                  row.map(cell => ({
                    ...cell,
                    entities: []
                  }))
                ));
                
                setEntityCount(0);
                setLogMessages([]);
                addLog("Simulation reset");
              }}
              className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`px-4 py-2 rounded transition-colors ${
                showDebug 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Entity Count: {entityCount}</h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(entityTemplates).map(type => (
                <div key={type} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </div>
              ))}
            </div>
            
            {/* Log Output */}
            {showDebug && (
              <div className="mt-4 p-2 bg-gray-100 rounded h-32 overflow-y-auto font-mono text-xs">
                {logMessages.map((msg, i) => (
                  <div key={i} className="mb-1">
                    {msg}
                  </div>
                ))}
                {logMessages.length === 0 && (
                  <div className="text-gray-500">No activity logs yet</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Spawner Configuration Panel */}
        <div className="w-72 bg-gray-50 p-4 rounded border border-gray-200">
          <h3 className="font-bold mb-3">Spawner Configuration</h3>
          
          {selectedSpawner !== null && spawners[selectedSpawner] && (
            <>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Spawner #{selectedSpawner + 1}</span>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={spawners[selectedSpawner].state.active}
                      onChange={() => toggleSpawnerActive(selectedSpawner)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-2 text-sm font-medium text-gray-700">
                      {spawners[selectedSpawner].state.active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={spawners[selectedSpawner].config.entityType}
                      onChange={(e) => updateSpawnerConfig(selectedSpawner, 'entityType', e.target.value as EntityType)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="item">Items</option>
                      <option value="creature">Creatures</option>
                      <option value="npc">NPCs</option>
                      <option value="obstacle">Obstacles</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Capacity
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={spawners[selectedSpawner].config.maxCapacity}
                        onChange={(e) => updateSpawnerConfig(selectedSpawner, 'maxCapacity', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm w-8 text-center">
                        {spawners[selectedSpawner].config.maxCapacity}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spawn Frequency (sec)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={spawners[selectedSpawner].config.spawnFrequency}
                        onChange={(e) => updateSpawnerConfig(selectedSpawner, 'spawnFrequency', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm w-8 text-center">
                        {spawners[selectedSpawner].config.spawnFrequency}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Direction
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(Object.keys(directionIcons) as Array<keyof typeof directionIcons>).map(dir => (
                        <button
                          key={dir}
                          onClick={() => updateSpawnerConfig(selectedSpawner, 'direction', dir)}
                          className={`p-2 flex items-center justify-center border ${
                            spawners[selectedSpawner].config.direction === dir
                              ? 'bg-blue-500 text-white border-blue-600'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {typeof directionIcons[dir] === 'string' 
                            ? directionIcons[dir] 
                            : directionIcons[dir]}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="randomOrientation"
                      checked={spawners[selectedSpawner].config.randomOrientation}
                      onChange={(e) => updateSpawnerConfig(selectedSpawner, 'randomOrientation', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="randomOrientation" className="text-sm text-gray-700">
                      Random Orientation
                    </label>
                  </div>
                  
                  {showDebug && (
                    <div className="p-2 bg-gray-100 rounded mt-2">
                      <p className="text-xs mb-1">Entities Spawned: {spawners[selectedSpawner].state.spawnCount}</p>
                      <p className="text-xs mb-1">Current Entities: {spawners[selectedSpawner].state.entities.length}</p>
                      <p className="text-xs">Position: ({spawners[selectedSpawner].position.x}, {spawners[selectedSpawner].position.y})</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-2 p-4 bg-gray-50 rounded">
        <h2 className="font-bold text-lg mb-2">Legend</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-800 mr-2"></div>
            <span className="text-sm">Wall</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 mr-2"></div>
            <span className="text-sm">Spawner</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2"></div>
            <span className="text-sm">Item</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 mr-2"></div>
            <span className="text-sm">Creature</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 mr-2"></div>
            <span className="text-sm">NPC</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-600 mr-2"></div>
            <span className="text-sm">Obstacle</span>
          </div>
        </div>
      </div>
    </div>
  );
};
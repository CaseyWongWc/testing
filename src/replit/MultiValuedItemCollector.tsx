import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Item {
  id: string;
  type: string;
  name: string;
  description: string;
  x: number;
  y: number;
  collected: boolean;
  strengthValue: number;
  goldValue: number;
  foodValue: number;
  waterValue: number;
  color: string;
  weight?: number; // Current calculated weight/importance of this item
}

interface Robot {
  x: number;
  y: number;
  path: Cell[];
  pathIndex: number;
  inventory: {
    items: Item[];
    strengthTotal: number;
    goldTotal: number;
    foodTotal: number;
    waterTotal: number;
  };
  thresholds: {
    strength: number;
    gold: number;
    food: number;
    water: number;
  };
  status: string;
  activeValueType: 'strength' | 'gold' | 'food' | 'water' | 'balanced';
  history: string[];
}

interface Cell {
  x: number;
  y: number;
  isWall: boolean;
  isPath: boolean;
  f: number;
  g: number;
  h: number;
  parent: Cell | null | undefined;
}

interface DirectPath {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  weight: number;
}

interface MultiValuedItemCollectorProps {
  width?: number;
  height?: number;
  wallDensity?: number;
  itemCount?: number;
}

// Item type definitions with their color coding
const ITEM_TYPES = [
  { type: 'strength', name: 'Strength Potion', color: 'bg-red-500' },
  { type: 'gold', name: 'Gold Coin', color: 'bg-yellow-500' },
  { type: 'food', name: 'Food Ration', color: 'bg-green-500' },
  { type: 'water', name: 'Water Flask', color: 'bg-blue-500' },
  { type: 'balanced', name: 'Balanced Resource', color: 'bg-purple-500' }
];

// Value descriptions for item types
const VALUE_DESCRIPTIONS = {
  strength: {
    positive: [
      "Enhances carrying capacity",
      "Boosts structural integrity",
      "Reinforces mechanical systems"
    ],
    negative: [
      "Causes structural strain",
      "Damages load-bearing components",
      "Weakens mechanical joints"
    ]
  },
  gold: {
    positive: [
      "Valuable trading resource",
      "Currency for upgrades",
      "High market value"
    ],
    negative: [
      "Counterfeit material",
      "Debt token",
      "Trade penalty"
    ]
  },
  food: {
    positive: [
      "Energy-rich fuel source",
      "Sustains core functions",
      "Optimizes energy usage"
    ],
    negative: [
      "Contaminated energy source",
      "System-incompatible material",
      "Energy drain substance"
    ]
  },
  water: {
    positive: [
      "Cooling system replenishment",
      "Hydraulic system fluid",
      "Circuit cleansing solution"
    ],
    negative: [
      "Corrosive liquid",
      "System-contaminating fluid",
      "Circuit-shorting substance"
    ]
  }
};

export const MultiValuedItemCollector: React.FC<MultiValuedItemCollectorProps> = ({
  width = 25,
  height = 20,
  wallDensity = 0.2,
  itemCount = 20
}) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [directPaths, setDirectPaths] = useState<DirectPath[]>([]);
  const robotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  // Initialize the maze
  useEffect(() => {
    initializeMaze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, wallDensity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (robotIntervalRef.current) {
        clearInterval(robotIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Update direct paths visualizing the connections to nearby items
  const updateDirectPaths = useCallback(() => {
    if (!robot) return;
    
    const newPaths: DirectPath[] = [];
    const visibleItems = items.filter(item => !item.collected);
    
    // Only show paths to the 5 closest items for performance and readability
    const itemsWithDistances = visibleItems.map(item => {
      const distance = Math.abs(robot.x - item.x) + Math.abs(robot.y - item.y);
      // Calculate item value for the current robot state
      const value = calculateItemValue(item, robot);
      return { item, distance, value };
    });
    
    // Sort by distance and take top 5
    const closestItems = itemsWithDistances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    // Create paths
    for (const { item, value } of closestItems) {
      // Only connect if not blocked by walls using line of sight check
      if (!isLineBlocked(robot.x, robot.y, item.x, item.y)) {
        // Extract item type color from bg-color-500 format
        const colorMatch = item.color.match(/bg-(\w+)-\d+/);
        const color = colorMatch ? colorMatch[1] : 'gray';
        
        // Create the path
        newPaths.push({
          x1: robot.x,
          y1: robot.y,
          x2: item.x,
          y2: item.y,
          color: color,
          weight: value
        });
      }
    }
    
    setDirectPaths(newPaths);
  }, [robot, items]);
  
  // Check if a direct line is blocked by walls (for line-of-sight checking)
  const isLineBlocked = (x1: number, y1: number, x2: number, y2: number): boolean => {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      // If we're at a wall, the line is blocked
      if (maze[y]?.[x]?.isWall) return true;
      
      // If we've reached the destination, the line is not blocked
      if (x === x2 && y === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return false;
  };

  const initializeMaze = () => {
    // Create an empty maze
    const newMaze: Cell[][] = [];
    
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({
          x,
          y,
          isWall: Math.random() < wallDensity && 
                 !(x === 1 && y === 1) && // Keep robot position clear
                 !(x === 0 && y === 0) && // For aesthetics
                 !(x === width - 1 && y === height - 1), // For aesthetics
          isPath: false,
          f: 0,
          g: 0,
          h: 0,
          parent: null
        });
      }
      newMaze.push(row);
    }
    
    setMaze(newMaze);
    
    // Initialize robot
    const newRobot: Robot = {
      x: 1,
      y: 1,
      path: [],
      pathIndex: 0,
      inventory: {
        items: [],
        strengthTotal: 0,
        goldTotal: 0,
        foodTotal: 0,
        waterTotal: 0
      },
      thresholds: {
        strength: 10,
        gold: 15,
        food: 20,
        water: 18
      },
      status: "Initializing...",
      activeValueType: 'balanced',
      history: ["Robot activated and ready to collect items."]
    };
    
    setRobot(newRobot);
    
    // Generate items
    const usedPositions = new Set<string>();
    usedPositions.add(`${newRobot.x},${newRobot.y}`); // Robot position

    const newItems: Item[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const item = generateItem(i, newMaze, usedPositions);
      newItems.push(item);
      usedPositions.add(`${item.x},${item.y}`);
    }
    
    setItems(newItems);
  };

  const generateItem = (id: number, maze: Cell[][], usedPositions: Set<string>): Item => {
    // Find an empty position for the item
    let x, y;
    do {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
    } while (maze[y][x].isWall || usedPositions.has(`${x},${y}`));

    // Determine the primary type of the item
    const typeIndex = Math.floor(Math.random() * ITEM_TYPES.length);
    const itemType = ITEM_TYPES[typeIndex];
    
    // Assign values - can be positive or negative
    let strengthValue = 0, goldValue = 0, foodValue = 0, waterValue = 0;
    
    // For balanced items, give moderate values to all attributes
    if (itemType.type === 'balanced') {
      strengthValue = Math.floor(Math.random() * 6) - 1; // -1 to 4
      goldValue = Math.floor(Math.random() * 6) - 1;
      foodValue = Math.floor(Math.random() * 6) - 1;
      waterValue = Math.floor(Math.random() * 6) - 1;
    } else {
      // For specialized items, give higher value to main attribute, possible negatives to others
      switch (itemType.type) {
        case 'strength':
          strengthValue = Math.floor(Math.random() * 10) + 1; // 1 to 10
          goldValue = Math.floor(Math.random() * 7) - 3; // -3 to 3
          foodValue = Math.floor(Math.random() * 7) - 3;
          waterValue = Math.floor(Math.random() * 7) - 3;
          break;
        case 'gold':
          strengthValue = Math.floor(Math.random() * 7) - 3;
          goldValue = Math.floor(Math.random() * 10) + 1;
          foodValue = Math.floor(Math.random() * 7) - 3;
          waterValue = Math.floor(Math.random() * 7) - 3;
          break;
        case 'food':
          strengthValue = Math.floor(Math.random() * 7) - 3;
          goldValue = Math.floor(Math.random() * 7) - 3;
          foodValue = Math.floor(Math.random() * 10) + 1;
          waterValue = Math.floor(Math.random() * 7) - 3;
          break;
        case 'water':
          strengthValue = Math.floor(Math.random() * 7) - 3;
          goldValue = Math.floor(Math.random() * 7) - 3;
          foodValue = Math.floor(Math.random() * 7) - 3;
          waterValue = Math.floor(Math.random() * 10) + 1;
          break;
      }
    }

    // Generate description based on values
    let description = "";
    if (strengthValue !== 0) {
      const descArray = strengthValue > 0 ? VALUE_DESCRIPTIONS.strength.positive : VALUE_DESCRIPTIONS.strength.negative;
      description += descArray[Math.floor(Math.random() * descArray.length)] + ". ";
    }
    if (goldValue !== 0) {
      const descArray = goldValue > 0 ? VALUE_DESCRIPTIONS.gold.positive : VALUE_DESCRIPTIONS.gold.negative;
      description += descArray[Math.floor(Math.random() * descArray.length)] + ". ";
    }
    if (foodValue !== 0) {
      const descArray = foodValue > 0 ? VALUE_DESCRIPTIONS.food.positive : VALUE_DESCRIPTIONS.food.negative;
      description += descArray[Math.floor(Math.random() * descArray.length)] + ". ";
    }
    if (waterValue !== 0) {
      const descArray = waterValue > 0 ? VALUE_DESCRIPTIONS.water.positive : VALUE_DESCRIPTIONS.water.negative;
      description += descArray[Math.floor(Math.random() * descArray.length)] + ". ";
    }

    return {
      id: `item-${id}`,
      type: itemType.type,
      name: itemType.name,
      description,
      x,
      y,
      collected: false,
      strengthValue,
      goldValue,
      foodValue,
      waterValue,
      color: itemType.color
    };
  };

  const findPath = useCallback((start: Cell, goal: Cell): Cell[] => {
    // A* pathfinding algorithm
    const openSet: Cell[] = [];
    const closedSet: Set<string> = new Set();
    
    // Reset the maze path visualization
    const newMaze = maze.map(row => 
      row.map(cell => ({ ...cell, isPath: false, f: 0, g: 0, h: 0, parent: null }))
    );
    
    // Add start node to open set
    const startNode = newMaze[start.y][start.x];
    startNode.g = 0;
    startNode.h = heuristic(startNode, goal);
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // Find node with lowest f value
      let lowestIndex = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      
      const current = openSet[lowestIndex];
      
      // If we've reached the goal
      if (current.x === goal.x && current.y === goal.y) {
        const path: Cell[] = [];
        let temp: Cell | null = current;
        while (temp) {
          path.push(temp);
          temp = temp.parent;
        }
        
        // Mark path cells for visualization
        const pathCells = new Set<string>();
        for (const cell of path) {
          pathCells.add(`${cell.x},${cell.y}`);
        }
        
        const finalMaze = newMaze.map(row => 
          row.map(cell => ({
            ...cell,
            isPath: pathCells.has(`${cell.x},${cell.y}`)
          }))
        );
        
        setMaze(finalMaze);
        return path.reverse();
      }
      
      // Remove current from open set and add to closed set
      openSet.splice(lowestIndex, 1);
      closedSet.add(`${current.x},${current.y}`);
      
      // Check all neighbors
      const neighbors = getValidNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborNode = newMaze[neighbor.y][neighbor.x];
        
        // Skip if in closed set
        if (closedSet.has(`${neighborNode.x},${neighborNode.y}`)) continue;
        
        // Calculate tentative g score
        const tentativeG = current.g + 1;
        
        // Check if we need to update this neighbor
        const inOpenSet = openSet.some(n => n.x === neighborNode.x && n.y === neighborNode.y);
        if (!inOpenSet || tentativeG < neighborNode.g) {
          neighborNode.parent = current;
          neighborNode.g = tentativeG;
          neighborNode.h = heuristic(neighborNode, goal);
          neighborNode.f = neighborNode.g + neighborNode.h;
          
          if (!inOpenSet) {
            openSet.push(neighborNode);
          }
        }
      }
    }
    
    // If no path is found, return empty path
    return [];
  }, [maze]);

  const getValidNeighbors = (cell: Cell): Cell[] => {
    const neighbors: Cell[] = [];
    const { x, y } = cell;
    
    // Check 8 directions
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: -1 }, // Up-Right
      { dx: 1, dy: 0 },  // Right
      { dx: 1, dy: 1 },  // Down-Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 1 }, // Down-Left
      { dx: -1, dy: 0 }, // Left
      { dx: -1, dy: -1 } // Up-Left
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      // Check bounds
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        // Check if not a wall
        if (!maze[ny][nx].isWall) {
          neighbors.push(maze[ny][nx]);
        }
      }
    }
    
    return neighbors;
  };

  const heuristic = (a: Cell, b: Cell): number => {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };

  const calculateItemValue = (item: Item, robot: Robot): number => {
    // Determine which resource the robot needs most based on thresholds
    const strengthNeed = robot.thresholds.strength - robot.inventory.strengthTotal;
    const goldNeed = robot.thresholds.gold - robot.inventory.goldTotal;
    const foodNeed = robot.thresholds.food - robot.inventory.foodTotal;
    const waterNeed = robot.thresholds.water - robot.inventory.waterTotal;
    
    // Calculate value based on needs and item values
    let value = 0;
    
    if (strengthNeed > 0) {
      value += (item.strengthValue * (strengthNeed / robot.thresholds.strength) * 2);
    } else if (item.strengthValue < 0) {
      // Negative values are worse if we already have enough
      value += item.strengthValue;
    } else {
      value += item.strengthValue * 0.5; // Still valuable but less so
    }
    
    if (goldNeed > 0) {
      value += (item.goldValue * (goldNeed / robot.thresholds.gold) * 2);
    } else if (item.goldValue < 0) {
      value += item.goldValue;
    } else {
      value += item.goldValue * 0.5;
    }
    
    if (foodNeed > 0) {
      value += (item.foodValue * (foodNeed / robot.thresholds.food) * 2);
    } else if (item.foodValue < 0) {
      value += item.foodValue;
    } else {
      value += item.foodValue * 0.5;
    }
    
    if (waterNeed > 0) {
      value += (item.waterValue * (waterNeed / robot.thresholds.water) * 2);
    } else if (item.waterValue < 0) {
      value += item.waterValue;
    } else {
      value += item.waterValue * 0.5;
    }
    
    // Distance penalty (items farther away are less valuable)
    const distance = Math.abs(robot.x - item.x) + Math.abs(robot.y - item.y);
    value = value / (1 + distance * 0.1);
    
    return value;
  };

  const findBestItem = (robot: Robot, items: Item[]): Item | null => {
    if (!robot) return null;
    
    // Filter uncollected items
    const uncollectedItems = items.filter(item => !item.collected);
    if (uncollectedItems.length === 0) return null;
    
    // Update robot's value priority
    const valueType = updateRobotValuePriority(robot);
    setRobot(prev => prev ? { ...prev, activeValueType: valueType } : null);
    
    // Calculate value for each item
    let bestItem = null;
    let bestValue = -Infinity;
    
    for (const item of uncollectedItems) {
      const value = calculateItemValue(item, robot);
      
      if (value > bestValue) {
        bestValue = value;
        bestItem = item;
      }
    }
    
    return bestItem;
  };

  const updateRobotValuePriority = (robot: Robot): 'strength' | 'gold' | 'food' | 'water' | 'balanced' => {
    const { strengthTotal, goldTotal, foodTotal, waterTotal } = robot.inventory;
    const { strength, gold, food, water } = robot.thresholds;
    
    // Calculate percentage of threshold for each resource
    const strengthPct = strengthTotal / strength;
    const goldPct = goldTotal / gold;
    const foodPct = foodTotal / food;
    const waterPct = waterTotal / water;
    
    // Find the resource with lowest percentage (highest need)
    const resources = [
      { type: 'strength', pct: strengthPct },
      { type: 'gold', pct: goldPct },
      { type: 'food', pct: foodPct },
      { type: 'water', pct: waterPct }
    ];
    
    resources.sort((a, b) => a.pct - b.pct);
    
    // If all resources are above threshold, stay balanced
    if (resources[0].pct >= 1) {
      return 'balanced';
    }
    
    // Otherwise prioritize the most needed resource
    return resources[0].type as 'strength' | 'gold' | 'food' | 'water';
  };

  const startRobotLogic = () => {
    if (isRunning || !robot || animationFrameRef.current) return;
    
    setIsRunning(true);
    setRobot(prev => prev ? { 
      ...prev, 
      status: "Analyzing environment...",
      history: [...prev.history, "Started item collection process."]
    } : null);
    
    // Reset animation timing references
    lastFrameTimeRef.current = null;
    accumulatedTimeRef.current = 0;
    
    // Start animation loop using requestAnimationFrame for smoother movement
    const animate = (timestamp: number) => {
      if (!isRunning || !robot) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      // Initialize lastFrameTime on first frame
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      // Accumulate time until we reach our movement interval
      accumulatedTimeRef.current += deltaTime;
      const moveInterval = 600; // time between moves in ms
      
      if (accumulatedTimeRef.current >= moveInterval) {
        accumulatedTimeRef.current = 0;
        moveRobot();
        
        // Update direct paths visualization after each move
        updateDirectPaths();
      }
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Initial path visualization
    updateDirectPaths();
  };

  const stopRobotLogic = () => {
    setIsRunning(false);
    if (robotIntervalRef.current) {
      clearInterval(robotIntervalRef.current);
      robotIntervalRef.current = null;
    }
    
    setRobot(prev => prev ? {
      ...prev,
      status: "Paused",
      history: [...prev.history, "Collection process paused."]
    } : null);
  };

  const moveRobot = () => {
    if (!robot) return;

    // If robot has a path and is following it
    if (robot.path.length > 0 && robot.pathIndex < robot.path.length) {
      const nextCell = robot.path[robot.pathIndex];
      
      // Move robot to next cell in path
      setRobot(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          x: nextCell.x,
          y: nextCell.y,
          pathIndex: prev.pathIndex + 1,
          status: `Moving to (${nextCell.x}, ${nextCell.y})...`
        };
      });

      // Check if robot reached an item
      const itemAtPosition = items.find(
        item => !item.collected && item.x === nextCell.x && item.y === nextCell.y
      );

      if (itemAtPosition) {
        collectItem(itemAtPosition);
      }

      // If robot reached the end of its path
      if (robot.pathIndex + 1 >= robot.path.length) {
        findNextTarget();
      }
    } else {
      findNextTarget();
    }
  };

  const findNextTarget = () => {
    setIsThinking(true);
    
    setTimeout(() => {
      if (!robot) {
        setIsThinking(false);
        return;
      }
      
      const bestItem = findBestItem(robot, items);
      
      if (bestItem) {
        const robotCell = maze[robot.y][robot.x];
        const goalCell = maze[bestItem.y][bestItem.x];
        
        const path = findPath(robotCell, goalCell);
        
        if (path.length > 0) {
          setRobot(prev => {
            if (!prev) return null;
            
            // Create a description of why this item was chosen
            let rationaleText = "";
            
            if (prev.activeValueType === 'strength') {
              rationaleText = `Prioritizing strength (${prev.inventory.strengthTotal}/${prev.thresholds.strength})`;
            } else if (prev.activeValueType === 'gold') {
              rationaleText = `Prioritizing gold (${prev.inventory.goldTotal}/${prev.thresholds.gold})`;
            } else if (prev.activeValueType === 'food') {
              rationaleText = `Prioritizing food (${prev.inventory.foodTotal}/${prev.thresholds.food})`;
            } else if (prev.activeValueType === 'water') {
              rationaleText = `Prioritizing water (${prev.inventory.waterTotal}/${prev.thresholds.water})`;
            } else {
              rationaleText = "Maintaining balanced resource collection";
            }
            
            // Add item value details
            rationaleText += `. Selected ${bestItem.name} with values (S:${bestItem.strengthValue} G:${bestItem.goldValue} F:${bestItem.foodValue} W:${bestItem.waterValue}).`;
            
            return {
              ...prev,
              path,
              pathIndex: 0,
              status: `Heading to ${bestItem.name} at (${bestItem.x}, ${bestItem.y})`,
              history: [...prev.history, rationaleText]
            };
          });
        } else {
          setRobot(prev => prev ? {
            ...prev,
            path: [],
            status: "No path found to target item.",
            history: [...prev.history, "Unable to find path to target item."]
          } : null);
        }
      } else {
        // All items collected
        setRobot(prev => prev ? {
          ...prev,
          path: [],
          status: "All items collected!",
          history: [...prev.history, "Collection complete. All items gathered."]
        } : null);
        
        stopRobotLogic();
      }
      
      setIsThinking(false);
    }, 300);
  };

  const collectItem = (item: Item) => {
    // Update item to collected
    setItems(prevItems => 
      prevItems.map(i => 
        i.id === item.id ? { ...i, collected: true } : i
      )
    );
    
    // Update robot inventory
    setRobot(prev => {
      if (!prev) return null;
      
      const newStrengthTotal = prev.inventory.strengthTotal + item.strengthValue;
      const newGoldTotal = prev.inventory.goldTotal + item.goldValue;
      const newFoodTotal = prev.inventory.foodTotal + item.foodValue;
      const newWaterTotal = prev.inventory.waterTotal + item.waterValue;

      // Create collection message with appropriate messages for positive/negative values
      let collectionMessage = `Collected ${item.name}. `;
      
      if (item.strengthValue !== 0) {
        collectionMessage += `Strength ${item.strengthValue > 0 ? "+" : ""}${item.strengthValue}. `;
      }
      if (item.goldValue !== 0) {
        collectionMessage += `Gold ${item.goldValue > 0 ? "+" : ""}${item.goldValue}. `;
      }
      if (item.foodValue !== 0) {
        collectionMessage += `Food ${item.foodValue > 0 ? "+" : ""}${item.foodValue}. `;
      }
      if (item.waterValue !== 0) {
        collectionMessage += `Water ${item.waterValue > 0 ? "+" : ""}${item.waterValue}. `;
      }
      
      return {
        ...prev,
        inventory: {
          items: [...prev.inventory.items, item],
          strengthTotal: newStrengthTotal,
          goldTotal: newGoldTotal,
          foodTotal: newFoodTotal,
          waterTotal: newWaterTotal
        },
        status: `Collected ${item.name}`,
        history: [...prev.history, collectionMessage]
      };
    });
  };

  const resetSimulation = () => {
    stopRobotLogic();
    initializeMaze();
  };

  // Render the item at the given coordinates
  const renderItem = (item: Item) => {
    if (item.collected) return null;
    
    return (
      <div 
        key={item.id}
        className={`absolute rounded-full ${item.color} border-2 border-white w-5 h-5 flex items-center justify-center text-xs text-white font-bold`}
        style={{ 
          left: `${item.x * 20 + 10}px`, 
          top: `${item.y * 20 + 10}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: 20
        }}
        title={`${item.name}: S:${item.strengthValue} G:${item.goldValue} F:${item.foodValue} W:${item.waterValue}\n${item.description}`}
      >
        {item.type.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Background shade for a cell based on its position in the robot's path
  const getCellPathStyle = (x: number, y: number) => {
    if (!robot || robot.path.length === 0) return {};
    
    const cellInPath = robot.path.findIndex(cell => cell.x === x && cell.y === y);
    
    if (cellInPath !== -1) {
      const opacity = 0.2 + (0.8 * (1 - cellInPath / robot.path.length));
      
      // Use color based on robot's active value type
      let bgColor;
      switch (robot.activeValueType) {
        case 'strength': 
          bgColor = `rgba(239, 68, 68, ${opacity})`; // Red
          break;
        case 'gold': 
          bgColor = `rgba(234, 179, 8, ${opacity})`; // Yellow
          break;
        case 'food': 
          bgColor = `rgba(34, 197, 94, ${opacity})`; // Green
          break;
        case 'water': 
          bgColor = `rgba(59, 130, 246, ${opacity})`; // Blue
          break;
        default: 
          bgColor = `rgba(168, 85, 247, ${opacity})`; // Purple (balanced)
      }
      
      return { backgroundColor: bgColor };
    }
    
    return {};
  };

  // Get status bar color based on resource percentage
  const getStatusBarColor = (current: number, threshold: number) => {
    const percentage = current / threshold;
    
    if (percentage >= 1) return 'bg-green-500';
    if (percentage >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Maze and visualization area */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="relative bg-gray-100 border border-gray-300"
          style={{ width: `${width * 20}px`, height: `${height * 20}px` }}
        >
          {/* Render maze cells */}
          {maze.map((row, y) => 
            row.map((cell, x) => (
              <div
                key={`cell-${x}-${y}`}
                className={`absolute ${cell.isWall ? 'bg-gray-800' : 'bg-gray-100'}`}
                style={{ 
                  left: `${x * 20}px`, 
                  top: `${y * 20}px`, 
                  width: '20px', 
                  height: '20px',
                  ...getCellPathStyle(x, y)
                }}
              />
            ))
          )}
          
          {/* Render items */}
          {items.map(item => renderItem(item))}
          
          {/* Render robot */}
          {robot && (
            <div 
              className={`absolute bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white z-30 transition-all duration-300 shadow-lg
                ${isThinking ? 'animate-pulse' : ''}`}
              style={{ 
                left: `${robot.x * 20 + 10}px`, 
                top: `${robot.y * 20 + 10}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              R
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Legend</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-800 mr-1"></div>
              <span className="text-sm">Wall</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 mr-1"></div>
              <span className="text-sm">Path</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-600 mr-1"></div>
              <span className="text-sm">Robot</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-1"></div>
              <span className="text-sm">Strength Item</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-sm">Gold Item</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-1"></div>
              <span className="text-sm">Food Item</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-sm">Water Item</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-500 mr-1"></div>
              <span className="text-sm">Balanced Item</span>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex gap-2">
          <button 
            onClick={startRobotLogic}
            disabled={isRunning}
            className={`px-4 py-2 rounded ${isRunning ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            Start
          </button>
          <button 
            onClick={stopRobotLogic}
            disabled={!isRunning}
            className={`px-4 py-2 rounded ${!isRunning ? 'bg-gray-300 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
          >
            Pause
          </button>
          <button 
            onClick={resetSimulation}
            className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Reset
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 ml-auto"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      </div>
      
      {/* Robot Status & Item Log Panel */}
      <div className="w-full lg:w-80 flex flex-col">
        {/* Robot Status */}
        {robot && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="font-bold mb-3 text-blue-600">Robot Status</h3>
            <p className="mb-2"><span className="font-semibold">Status:</span> {robot.status}</p>
            <p className="mb-2"><span className="font-semibold">Position:</span> ({robot.x}, {robot.y})</p>
            <p className="mb-2"><span className="font-semibold">Collection Priority:</span> 
              <span className={`ml-1 ${
                robot.activeValueType === 'strength' ? 'text-red-500' :
                robot.activeValueType === 'gold' ? 'text-yellow-500' :
                robot.activeValueType === 'food' ? 'text-green-500' :
                robot.activeValueType === 'water' ? 'text-blue-500' :
                'text-purple-500'
              }`}>
                {robot.activeValueType.charAt(0).toUpperCase() + robot.activeValueType.slice(1)}
              </span>
            </p>
            
            <h4 className="font-semibold mt-4 mb-2">Resources</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-500 font-medium">Strength</span>
                  <span>{robot.inventory.strengthTotal}/{robot.thresholds.strength}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatusBarColor(robot.inventory.strengthTotal, robot.thresholds.strength)}`}
                    style={{ width: `${Math.min(100, (robot.inventory.strengthTotal / robot.thresholds.strength) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-500 font-medium">Gold</span>
                  <span>{robot.inventory.goldTotal}/{robot.thresholds.gold}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatusBarColor(robot.inventory.goldTotal, robot.thresholds.gold)}`}
                    style={{ width: `${Math.min(100, (robot.inventory.goldTotal / robot.thresholds.gold) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-500 font-medium">Food</span>
                  <span>{robot.inventory.foodTotal}/{robot.thresholds.food}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatusBarColor(robot.inventory.foodTotal, robot.thresholds.food)}`}
                    style={{ width: `${Math.min(100, (robot.inventory.foodTotal / robot.thresholds.food) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-500 font-medium">Water</span>
                  <span>{robot.inventory.waterTotal}/{robot.thresholds.water}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatusBarColor(robot.inventory.waterTotal, robot.thresholds.water)}`}
                    style={{ width: `${Math.min(100, (robot.inventory.waterTotal / robot.thresholds.water) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity Log */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex-1 overflow-hidden">
          <h3 className="font-bold mb-3 text-blue-600">Activity Log</h3>
          <div className="max-h-96 overflow-y-auto">
            {robot?.history.map((entry, index) => (
              <div key={`log-${index}`} className="py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm text-gray-700">{entry}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(Date.now() - (robot.history.length - 1 - index) * 1000).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Debug panel */}
        {showDebug && (
          <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-sm overflow-y-auto max-h-96">
            <h3 className="font-semibold mb-2">Debug Information</h3>
            
            <div className="mt-2">
              <h4 className="font-medium text-sm">Uncollected Items</h4>
              <div className="space-y-1 mt-1">
                {items.filter(i => !i.collected).map(item => (
                  <div key={item.id} className="text-xs bg-white p-1 rounded">
                    {item.name} ({item.x}, {item.y}) - S:{item.strengthValue} G:{item.goldValue} F:{item.foodValue} W:{item.waterValue}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-3">
              <h4 className="font-medium text-sm">Current Path</h4>
              {robot?.path.length ? (
                <div className="text-xs mt-1">
                  {robot.path.map((cell, i) => 
                    <span key={i} className="bg-white p-1 rounded m-1 inline-block">
                      ({cell.x}, {cell.y})
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs mt-1">No active path</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
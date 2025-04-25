import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  parent: Cell | null;
}

interface MultiValuedItemCollectorProps {
  width?: number;
  height?: number;
  wallDensity?: number;
  itemCount?: number;
}

const MAX_HISTORY = 10;
const COLORS = ['blue', 'green', 'orange', 'purple', 'yellow', 'cyan', 'magenta', 'lime'];

const MultiValuedItemCollector: React.FC<MultiValuedItemCollectorProps> = ({
  width = 25,
  height = 20,
  wallDensity = 0.3,
  itemCount = 15,
}) => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [robot, setRobot] = useState<Robot | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isRobotThinking, setIsRobotThinking] = useState(false);
  const [displayLogs, setDisplayLogs] = useState(false);
  
  // Form inputs for settings
  const [widthInput, setWidthInput] = useState(width.toString());
  const [heightInput, setHeightInput] = useState(height.toString());
  const [wallDensityInput, setWallDensityInput] = useState(wallDensity.toString());
  const [itemCountInput, setItemCountInput] = useState(itemCount.toString());
  const [strengthThresholdInput, setStrengthThresholdInput] = useState('10');
  const [goldThresholdInput, setGoldThresholdInput] = useState('10');
  const [foodThresholdInput, setFoodThresholdInput] = useState('10');
  const [waterThresholdInput, setWaterThresholdInput] = useState('10');
  
  // Animation refs
  const lastFrameTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const frameIntervalRef = useRef<number>(100); // ms per frame

  // Initialize maze with walls
  const initializeMaze = () => {
    const currentWidth = parseInt(widthInput) || width;
    const currentHeight = parseInt(heightInput) || height;
    const currentWallDensity = parseFloat(wallDensityInput) || wallDensity;
    
    const newMaze: Cell[][] = [];
    for (let y = 0; y < currentHeight; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < currentWidth; x++) {
        row.push({
          x,
          y,
          isWall: Math.random() < currentWallDensity,
          isPath: false,
          f: 0,
          g: 0,
          h: 0,
          parent: null,
        });
      }
      newMaze.push(row);
    }
    
    // Ensure start position is not a wall
    newMaze[0][0].isWall = false;
    
    return newMaze;
  };

  // Find random empty cell
  const findRandomEmptyCell = (maze: Cell[][], excludePositions: Set<string>) => {
    const currentWidth = parseInt(widthInput) || width;
    const currentHeight = parseInt(heightInput) || height;
    
    const availableCells: {x: number, y: number}[] = [];
    
    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        if (!maze[y][x].isWall && !excludePositions.has(`${x},${y}`)) {
          availableCells.push({x, y});
        }
      }
    }
    
    if (availableCells.length === 0) {
      // If no empty cells, clear a cell
      const x = Math.floor(Math.random() * currentWidth);
      const y = Math.floor(Math.random() * currentHeight);
      maze[y][x].isWall = false;
      return {x, y};
    }
    
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[randomIndex];
  };

  // Generate a random item
  const generateItem = (id: number, maze: Cell[][], usedPositions: Set<string>): Item => {
    const pos = findRandomEmptyCell(maze, usedPositions);
    usedPositions.add(`${pos.x},${pos.y}`);
    
    // Generate random values for each attribute
    const strengthValue = Math.floor(Math.random() * 20);
    const goldValue = Math.floor(Math.random() * 20);
    const foodValue = Math.floor(Math.random() * 20);
    const waterValue = Math.floor(Math.random() * 20);
    
    // Determine the item type based on its highest value
    let type = 'balanced';
    let color = 'gray';
    
    const max = Math.max(strengthValue, goldValue, foodValue, waterValue);
    
    if (max === strengthValue) {
      type = 'strength';
      color = 'red';
    } else if (max === goldValue) {
      type = 'gold';
      color = 'yellow';
    } else if (max === foodValue) {
      type = 'food';
      color = 'green';
    } else if (max === waterValue) {
      type = 'water';
      color = 'blue';
    }
    
    return {
      id: `item_${id}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Item`,
      description: `An item with various values (S:${strengthValue}, G:${goldValue}, F:${foodValue}, W:${waterValue})`,
      x: pos.x,
      y: pos.y,
      collected: false,
      strengthValue,
      goldValue,
      foodValue,
      waterValue,
      color
    };
  };

  // Initialize the game
  const initializeGame = () => {
    const newMaze = initializeMaze();
    
    // Create items
    const currentItemCount = parseInt(itemCountInput) || itemCount;
    const usedPositions = new Set<string>();
    const newItems: Item[] = [];
    
    for (let i = 0; i < currentItemCount; i++) {
      const item = generateItem(i, newMaze, usedPositions);
      newItems.push(item);
    }
    
    // Create robot at (0,0)
    const robotPos = findRandomEmptyCell(newMaze, usedPositions);
    usedPositions.add(`${robotPos.x},${robotPos.y}`);
    
    const newRobot: Robot = {
      x: robotPos.x,
      y: robotPos.y,
      path: [],
      pathIndex: 0,
      inventory: {
        items: [],
        strengthTotal: 0,
        goldTotal: 0,
        foodTotal: 0,
        waterTotal: 0,
      },
      thresholds: {
        strength: parseInt(strengthThresholdInput) || 10,
        gold: parseInt(goldThresholdInput) || 10,
        food: parseInt(foodThresholdInput) || 10,
        water: parseInt(waterThresholdInput) || 10,
      },
      status: 'Idle',
      activeValueType: 'balanced',
      history: ['Robot initialized and ready to collect items']
    };
    
    setMaze(newMaze);
    setItems(newItems);
    setRobot(newRobot);
    setIsAnimating(false);
  };

  // A* pathfinding algorithm
  const findPath = useCallback((start: Cell, goal: Cell): Cell[] => {
    const openSet: Cell[] = [start];
    const closedSet: Cell[] = [];
    
    // Reset path values
    maze.forEach(row => row.forEach(cell => {
      cell.f = 0;
      cell.g = 0;
      cell.h = 0;
      cell.parent = null;
      cell.isPath = false;
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
      
      // If we reached the goal, construct the path
      if (current.x === goal.x && current.y === goal.y) {
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
        neighbor.h = heuristic(neighbor, goal);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
    
    return []; // No path found
  }, [maze]);

  // Get valid neighboring cells (non-wall cells)
  const getValidNeighbors = (cell: Cell): Cell[] => {
    const neighbors: Cell[] = [];
    const directions = [
      [0, -1], [1, 0], [0, 1], [-1, 0], // Cardinal directions
      [-1, -1], [1, -1], [1, 1], [-1, 1] // Diagonal directions
    ];
    
    for (const [dx, dy] of directions) {
      const newX = cell.x + dx;
      const newY = cell.y + dy;
      
      if (
        newX >= 0 && newX < maze[0].length &&
        newY >= 0 && newY < maze.length &&
        !maze[newY][newX].isWall
      ) {
        neighbors.push(maze[newY][newX]);
      }
    }
    
    return neighbors;
  };

  // Heuristic function for A*
  const heuristic = (a: Cell, b: Cell): number => {
    // Manhattan distance plus diagonal shortcut
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy) + 0.5 * Math.min(dx, dy);
  };

  // Calculate value of item based on robot's current priority
  const calculateItemValue = (item: Item, robot: Robot): number => {
    switch (robot.activeValueType) {
      case 'strength':
        return item.strengthValue * 3 + item.goldValue + item.foodValue + item.waterValue;
      case 'gold':
        return item.strengthValue + item.goldValue * 3 + item.foodValue + item.waterValue;
      case 'food':
        return item.strengthValue + item.goldValue + item.foodValue * 3 + item.waterValue;
      case 'water':
        return item.strengthValue + item.goldValue + item.foodValue + item.waterValue * 3;
      case 'balanced':
      default:
        return item.strengthValue + item.goldValue + item.foodValue + item.waterValue;
    }
  };
  
  // Find the most valuable item for the robot
  const findBestItem = (robot: Robot, items: Item[]): Item | null => {
    if (!items.length) return null;
    
    const availableItems = items.filter(item => !item.collected);
    if (!availableItems.length) return null;
    
    let bestItem = availableItems[0];
    let bestValue = -1;
    let bestDistance = Infinity;
    
    for (const item of availableItems) {
      const value = calculateItemValue(item, robot);
      const distance = Math.sqrt(
        Math.pow(robot.x - item.x, 2) + Math.pow(robot.y - item.y, 2)
      );
      
      // Value per distance calculation - prioritize high value, low distance
      const valuePerDistance = value / (distance + 1);
      
      if (valuePerDistance > bestValue) {
        bestValue = valuePerDistance;
        bestItem = item;
        bestDistance = distance;
      }
    }
    
    return bestItem;
  };

  // Update robot's active value type based on current inventory and thresholds
  const updateRobotValuePriority = (robot: Robot): 'strength' | 'gold' | 'food' | 'water' | 'balanced' => {
    // Check which values are below threshold
    const belowThreshold = [];
    
    if (robot.inventory.strengthTotal < robot.thresholds.strength) {
      belowThreshold.push({type: 'strength', deficit: robot.thresholds.strength - robot.inventory.strengthTotal});
    }
    
    if (robot.inventory.goldTotal < robot.thresholds.gold) {
      belowThreshold.push({type: 'gold', deficit: robot.thresholds.gold - robot.inventory.goldTotal});
    }
    
    if (robot.inventory.foodTotal < robot.thresholds.food) {
      belowThreshold.push({type: 'food', deficit: robot.thresholds.food - robot.inventory.foodTotal});
    }
    
    if (robot.inventory.waterTotal < robot.thresholds.water) {
      belowThreshold.push({type: 'water', deficit: robot.thresholds.water - robot.inventory.waterTotal});
    }
    
    // If nothing is below threshold, stay balanced
    if (belowThreshold.length === 0) {
      return 'balanced';
    }
    
    // Sort by largest deficit and prioritize that value
    belowThreshold.sort((a, b) => b.deficit - a.deficit);
    return belowThreshold[0].type as 'strength' | 'gold' | 'food' | 'water';
  };

  // Analyze and make decision for the robot
  const robotThink = useCallback(() => {
    if (!robot) return;
    
    setIsRobotThinking(true);
    
    // Create copies for modification
    const newRobot = { ...robot };
    const newMaze = [...maze];
    const newItems = [...items];
    
    // Update robot's priority based on current inventory and thresholds
    const newPriority = updateRobotValuePriority(newRobot);
    
    if (newPriority !== newRobot.activeValueType) {
      newRobot.activeValueType = newPriority;
      newRobot.history = [
        `Changed priority to: ${newPriority}`,
        ...newRobot.history.slice(0, MAX_HISTORY - 1)
      ];
    }
    
    // Find the best item to collect
    const targetItem = findBestItem(newRobot, newItems);
    
    if (!targetItem) {
      newRobot.status = 'All items collected';
      newRobot.history = [
        'All items collected, mission complete!',
        ...newRobot.history.slice(0, MAX_HISTORY - 1)
      ];
      setRobot(newRobot);
      setIsRobotThinking(false);
      return;
    }
    
    // Find a path to the target item
    const startCell = newMaze[newRobot.y][newRobot.x];
    const goalCell = newMaze[targetItem.y][targetItem.x];
    
    const path = findPath(startCell, goalCell);
    
    if (path.length > 0) {
      // Update path visualization
      newMaze.forEach(row => row.forEach(cell => { cell.isPath = false; }));
      path.forEach(cell => { newMaze[cell.y][cell.x].isPath = true; });
      
      newRobot.path = path;
      newRobot.pathIndex = 0;
      
      newRobot.status = `Moving to collect ${targetItem.name}`;
      newRobot.history = [
        `Targeted ${targetItem.name} at (${targetItem.x}, ${targetItem.y}) - Values: S:${targetItem.strengthValue}, G:${targetItem.goldValue}, F:${targetItem.foodValue}, W:${targetItem.waterValue}`,
        ...newRobot.history.slice(0, MAX_HISTORY - 1)
      ];
    } else {
      newRobot.status = 'No path to target item';
      newRobot.history = [
        `Cannot find path to ${targetItem.name} at (${targetItem.x}, ${targetItem.y})`,
        ...newRobot.history.slice(0, MAX_HISTORY - 1)
      ];
    }
    
    setMaze(newMaze);
    setRobot(newRobot);
    setItems(newItems);
    setIsRobotThinking(false);
  }, [robot, maze, items, findPath]);

  // Move the robot along its path
  const moveRobot = useCallback(() => {
    if (!robot || robot.pathIndex >= robot.path.length) return false;
    
    const newRobot = { ...robot };
    const nextCell = robot.path[robot.pathIndex];
    
    // Update robot position
    newRobot.x = nextCell.x;
    newRobot.y = nextCell.y;
    newRobot.pathIndex++;
    
    // Check if robot reached an item
    const itemAtPosition = items.find(
      item => item.x === newRobot.x && item.y === newRobot.y && !item.collected
    );
    
    if (itemAtPosition) {
      const newItems = items.map(item => 
        item.id === itemAtPosition.id 
          ? { ...item, collected: true } 
          : item
      );
      
      // Update robot's inventory
      newRobot.inventory.items.push({...itemAtPosition, collected: true});
      newRobot.inventory.strengthTotal += itemAtPosition.strengthValue;
      newRobot.inventory.goldTotal += itemAtPosition.goldValue;
      newRobot.inventory.foodTotal += itemAtPosition.foodValue;
      newRobot.inventory.waterTotal += itemAtPosition.waterValue;
      
      newRobot.history = [
        `Collected ${itemAtPosition.name} - Values: S:${itemAtPosition.strengthValue}, G:${itemAtPosition.goldValue}, F:${itemAtPosition.foodValue}, W:${itemAtPosition.waterValue}`,
        ...newRobot.history.slice(0, MAX_HISTORY - 1)
      ];
      
      setItems(newItems);
    }
    
    setRobot(newRobot);
    
    // Return true if we reached the end of the path
    return newRobot.pathIndex >= newRobot.path.length;
  }, [robot, items]);

  // Handle cell click (toggle wall)
  const handleCellClick = (x: number, y: number) => {
    if (!editMode) return;
    
    const newMaze = [...maze];
    newMaze[y][x].isWall = !newMaze[y][x].isWall;
    
    // If cell contains robot or item, clear the wall
    if (robot && robot.x === x && robot.y === y) {
      newMaze[y][x].isWall = false;
    }
    
    const itemAtPosition = items.find(item => item.x === x && item.y === y);
    if (itemAtPosition) {
      newMaze[y][x].isWall = false;
    }
    
    setMaze(newMaze);
  };

  // Apply settings and initialize the game
  const applySettings = () => {
    initializeGame();
  };

  // Start/stop animation
  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      if (robot && items.some(item => !item.collected)) {
        robotThink();
        setIsAnimating(true);
      }
    }
  };

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;
    
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      accumulatedTimeRef.current += deltaTime;
      
      if (accumulatedTimeRef.current >= frameIntervalRef.current) {
        accumulatedTimeRef.current = 0;
        
        // Move the robot
        const pathCompleted = moveRobot();
        
        // If path completed, find a new target
        if (pathCompleted) {
          robotThink();
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAnimating, moveRobot, robotThink]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Settings panel */}
      <div className="w-full md:w-1/4 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Multi-Valued Item Collector</h2>
        
        <div className="space-y-4">
          {/* Maze dimensions */}
          <div>
            <label className="block text-sm font-medium">Width</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Height</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Wall Density ({Math.round(parseFloat(wallDensityInput) * 100)}%)
            </label>
            <input
              type="range"
              className="w-full"
              min="0"
              max="1"
              step="0.05"
              value={wallDensityInput}
              onChange={(e) => setWallDensityInput(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Item Count</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={itemCountInput}
              onChange={(e) => setItemCountInput(e.target.value)}
            />
          </div>
          
          {/* Robot thresholds */}
          <div className="border-t pt-2">
            <h3 className="text-lg font-semibold">Robot Thresholds</h3>
            <p className="text-xs text-gray-500 mb-2">
              The robot will prioritize resources below these thresholds
            </p>
            
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Strength Threshold</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={strengthThresholdInput}
                  onChange={(e) => setStrengthThresholdInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Gold Threshold</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={goldThresholdInput}
                  onChange={(e) => setGoldThresholdInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Food Threshold</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={foodThresholdInput}
                  onChange={(e) => setFoodThresholdInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Water Threshold</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={waterThresholdInput}
                  onChange={(e) => setWaterThresholdInput(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex space-x-2">
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              onClick={applySettings}
            >
              Generate New Maze
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`flex-1 ${isAnimating ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white py-2 px-4 rounded`}
              onClick={toggleAnimation}
            >
              {isAnimating ? 'Stop' : 'Start'} Simulation
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`flex-1 ${editMode ? 'bg-orange-500' : 'bg-gray-200'} py-2 px-4 rounded`}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Exit Edit Mode' : 'Edit Maze'}
            </button>
            
            <button
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
              onClick={() => setDisplayLogs(!displayLogs)}
            >
              {displayLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>
        </div>
        
        {/* Robot status */}
        {robot && (
          <div className="mt-4 border-t pt-2">
            <h3 className="text-lg font-semibold">Robot Status</h3>
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <p><strong>Position:</strong> ({robot.x}, {robot.y})</p>
              <p><strong>Status:</strong> {robot.status}</p>
              <p><strong>Priority:</strong> {robot.activeValueType}</p>
              <div className="mt-2">
                <h4 className="font-medium">Inventory:</h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>Strength: {robot.inventory.strengthTotal}</div>
                  <div>Gold: {robot.inventory.goldTotal}</div>
                  <div>Food: {robot.inventory.foodTotal}</div>
                  <div>Water: {robot.inventory.waterTotal}</div>
                </div>
                <p className="mt-1"><strong>Items:</strong> {robot.inventory.items.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Main display area */}
      <div className="w-full md:w-3/4">
        <div className="bg-white rounded-lg shadow p-4">
          {/* Maze grid */}
          <div 
            className="grid gap-0 border border-gray-300 mb-4"
            style={{ 
              gridTemplateColumns: `repeat(${parseInt(widthInput) || width}, minmax(0, 1fr))`,
              width: 'fit-content' 
            }}
          >
            {maze.map((row, y) => 
              row.map((cell, x) => {
                // Determine cell content
                const isRobot = robot && robot.x === x && robot.y === y;
                const item = items.find(item => item.x === x && item.y === y && !item.collected);
                
                // Determine cell background color
                let bgColor = cell.isWall ? 'bg-gray-800' : 'bg-white';
                if (cell.isPath) bgColor = 'bg-blue-100';
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`${bgColor} border border-gray-200 w-6 h-6 flex items-center justify-center cursor-pointer`}
                    onClick={() => handleCellClick(x, y)}
                  >
                    {isRobot && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        R
                      </div>
                    )}
                    {item && (
                      <div 
                        className={`w-4 h-4 rounded-full bg-${item.color}-500`}
                        title={`${item.name} - S:${item.strengthValue}, G:${item.goldValue}, F:${item.foodValue}, W:${item.waterValue}`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Legend */}
          <div className="mb-4">
            <h3 className="font-semibold">Legend</h3>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-800 mr-2"></div>
                <span>Wall</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 mr-2"></div>
                <span>Path</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex items-center justify-center text-white text-xs font-bold">R</div>
                <span>Robot</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>Strength Item</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>Gold Item</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span>Food Item</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span>Water Item</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-500 mr-2"></div>
                <span>Balanced Item</span>
              </div>
            </div>
          </div>
          
          {/* Activity Log */}
          {displayLogs && robot && (
            <div>
              <h3 className="font-semibold">Robot Activity Log</h3>
              <div className="mt-2 p-2 bg-gray-100 rounded h-40 overflow-y-auto">
                {robot.history.map((entry, index) => (
                  <div key={index} className="mb-1 text-sm border-b pb-1">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiValuedItemCollector;
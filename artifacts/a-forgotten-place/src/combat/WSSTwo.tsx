import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Skull,
  Droplet,
  Apple,
  Coins,
  Mountain,
  Trees,
  Waves,
  MapPin,
  UserPlus,
  ShoppingBag,
  Shield,
  Eye,
  Brain,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Compass
} from "lucide-react";

// Terrain Types
type TerrainType = "plains" | "mountain" | "desert" | "swamp" | "forest";

// Direction for movement
type Direction = "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest" | "stay";

// Item Types
type ItemType = "food" | "water" | "gold" | "trader";

// Terrain costs and characteristics
interface TerrainCosts {
  type: TerrainType;
  movementCost: number;
  waterCost: number;
  foodCost: number;
  color: string;
  description: string;
}

// Map Cell
interface Cell {
  x: number;
  y: number;
  terrain: TerrainType;
  items: Item[];
  isVisible: boolean;
  wasVisible: boolean;
}

// Item in the map
interface Item {
  id: number;
  type: ItemType;
  amount: number;
  repeating: boolean;
  lastCollected: number | null; // Turn when last collected, null if never collected
}

// Trader for trading resources
interface Trader {
  id: number;
  type: "generous" | "fair" | "greedy" | "impatient";
  maxOffers: number; // How many counter-offers before getting annoyed
  offersCount: number; // Current number of offers in this interaction
  valueRatio: { // How the trader values different resources (higher = values more)
    food: number;
    water: number;
    gold: number;
  };
}

// Trade offer structure
interface TradeOffer {
  offered: {
    food: number;
    water: number;
    gold: number;
  };
  requested: {
    food: number;
    water: number;
    gold: number;
  };
}

// Player attributes
interface Player {
  x: number;
  y: number;
  currentStrength: number;
  maxStrength: number;
  currentWater: number;
  maxWater: number;
  currentFood: number;
  maxFood: number;
  gold: number;
  vision: VisionType;
  brain: BrainType;
  turn: number;
}

// Types of vision
type VisionType = "cautious" | "eagle" | "strategic";

// Types of brain (decision-making)
type BrainType = "balanced" | "explorer" | "collector" | "trader" | "adaptive" | "strategic";

// Path returned by vision
interface Path {
  moves: Direction[];
  totalMovementCost: number;
  totalWaterCost: number;
  totalFoodCost: number;
  destination: {
    x: number;
    y: number;
  };
}

// Game state
interface GameState {
  mapWidth: number;
  mapHeight: number;
  difficulty: "easy" | "medium" | "hard";
  day: number;
  gameOver: boolean;
  gameWon: boolean;
  message: string;
  trading: boolean;
  currentTrader: Trader | null;
  currentOffer: TradeOffer | null;
}

// Log message
interface LogMessage {
  text: string;
  turn: number;
  type: "move" | "item" | "trade" | "status";
}

// Constants for terrain costs
const TERRAIN_COSTS: Record<TerrainType, TerrainCosts> = {
  plains: {
    type: "plains",
    movementCost: 1,
    waterCost: 1,
    foodCost: 1,
    color: "#a3be8c",
    description: "Open grasslands, easy to traverse"
  },
  mountain: {
    type: "mountain",
    movementCost: 3,
    waterCost: 2,
    foodCost: 2,
    color: "#b48ead",
    description: "Rugged terrain, difficult to climb"
  },
  desert: {
    type: "desert",
    movementCost: 2,
    waterCost: 3,
    foodCost: 2,
    color: "#ebcb8b",
    description: "Hot, dry land with scarce resources"
  },
  swamp: {
    type: "swamp",
    movementCost: 3,
    waterCost: 1,
    foodCost: 2,
    color: "#5e81ac",
    description: "Wet, muddy terrain that slows movement"
  },
  forest: {
    type: "forest",
    movementCost: 2,
    waterCost: 1,
    foodCost: 1,
    color: "#a3be8c",
    description: "Dense woodland with ample food and water"
  }
};

// Vision ranges for different vision types
const VISION_RANGES: Record<VisionType, number> = {
  cautious: 1, // Can see 1 square in each direction
  eagle: 3,    // Can see 3 squares in each direction
  strategic: 2  // Can see 2 squares in each direction
};

// Component for the Wilderness Survival System
const WSSTwo: React.FC = () => {
  // State for the map
  const [map, setMap] = useState<Cell[][]>([]);
  
  // State for the player
  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    currentStrength: 20,
    maxStrength: 20,
    currentWater: 15,
    maxWater: 15,
    currentFood: 15,
    maxFood: 15,
    gold: 0,
    vision: "cautious",
    brain: "balanced",
    turn: 0
  });
  
  // State for the game
  const [gameState, setGameState] = useState<GameState>({
    mapWidth: 10,
    mapHeight: 10,
    difficulty: "easy",
    day: 1,
    gameOver: false,
    gameWon: false,
    message: "Welcome to the Wilderness Survival System!",
    trading: false,
    currentTrader: null,
    currentOffer: null
  });
  
  // State for logs
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "Welcome to the Wilderness Survival System!", turn: 0, type: "status" }
  ]);
  
  // Reference for the logs div to auto-scroll
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // State for configuration options
  const [configWidth, setConfigWidth] = useState<number>(10);
  const [configHeight, setConfigHeight] = useState<number>(10);
  const [configDifficulty, setConfigDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [configVision, setConfigVision] = useState<VisionType>("cautious");
  const [configBrain, setConfigBrain] = useState<BrainType>("balanced");
  const [showConfig, setShowConfig] = useState<boolean>(true);
  
  // State for the brain's current suggested move
  const [suggestedMove, setSuggestedMove] = useState<Direction | null>(null);
  
  // State for the brain's current reasoning
  const [brainReasoning, setBrainReasoning] = useState<string>("");
  
  // State for auto-play
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number>(1000); // ms between moves
  const autoPlayRef = useRef<number | null>(null);
  
  // Helper to add a log message
  const addLog = (text: string, type: LogMessage["type"] = "status") => {
    setLogs(prev => [...prev, { text, turn: player.turn, type }]);
  };
  
  // Effect to scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);
  
  // Effect to handle auto-play
  useEffect(() => {
    if (autoPlay && !gameState.gameOver && !gameState.trading) {
      autoPlayRef.current = window.setTimeout(() => {
        if (suggestedMove) {
          handleMove(suggestedMove);
        } else {
          // If no suggested move, calculate one
          const newSuggestedMove = calculateBrainMove();
          if (newSuggestedMove) {
            handleMove(newSuggestedMove);
          }
        }
      }, autoPlaySpeed);
    }
    
    return () => {
      if (autoPlayRef.current !== null) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [autoPlay, gameState.gameOver, gameState.trading, suggestedMove, player.turn]);
  
  // Initialize the game
  const initializeGame = () => {
    // Update game state with config values
    setGameState(prev => ({
      ...prev,
      mapWidth: configWidth,
      mapHeight: configHeight,
      difficulty: configDifficulty,
      day: 1,
      gameOver: false,
      gameWon: false,
      message: "Game started!",
      trading: false,
      currentTrader: null,
      currentOffer: null
    }));
    
    // Create the map based on config
    createMap(configWidth, configHeight, configDifficulty);
    
    // Set player at western edge
    const startY = Math.floor(configHeight / 2);
    setPlayer({
      x: 0,
      y: startY,
      currentStrength: 20,
      maxStrength: 20,
      currentWater: 15,
      maxWater: 15,
      currentFood: 15,
      maxFood: 15,
      gold: 0,
      vision: configVision,
      brain: configBrain,
      turn: 0
    });
    
    // Reset logs
    setLogs([{ text: "Game started! Travel east to win.", turn: 0, type: "status" }]);
    
    // Hide config screen
    setShowConfig(false);
    
    // Reset suggested move
    setSuggestedMove(null);
    setBrainReasoning("");
  };
  
  // Create the map with terrain and items
  const createMap = (width: number, height: number, difficulty: "easy" | "medium" | "hard") => {
    const newMap: Cell[][] = [];
    
    // Create empty cells with default values
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        // Start with plains terrain
        row.push({
          x,
          y,
          terrain: "plains",
          items: [],
          isVisible: false,
          wasVisible: false
        });
      }
      newMap.push(row);
    }
    
    // Apply terrain generation based on difficulty
    generateTerrain(newMap, difficulty);
    
    // Add items to the map
    generateItems(newMap, difficulty);
    
    // Set the map
    setMap(newMap);
  };
  
  // Generate terrain patterns based on difficulty
  const generateTerrain = (mapData: Cell[][], difficulty: "easy" | "medium" | "hard") => {
    const width = mapData[0].length;
    const height = mapData.length;
    
    // Different strategies based on difficulty
    if (difficulty === "easy") {
      // Mostly plains with some forests and mountains
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rand = Math.random();
          
          // Leave the western edge mostly plains for easy start
          if (x < 2) {
            mapData[y][x].terrain = "plains";
          } 
          // Eastern edge is plains for easy finish
          else if (x >= width - 2) {
            mapData[y][x].terrain = "plains";
          }
          // Middle area has more varied terrain
          else {
            if (rand < 0.6) {
              mapData[y][x].terrain = "plains";
            } else if (rand < 0.8) {
              mapData[y][x].terrain = "forest";
            } else if (rand < 0.9) {
              mapData[y][x].terrain = "mountain";
            } else {
              mapData[y][x].terrain = "swamp";
            }
          }
        }
      }
    } else if (difficulty === "medium") {
      // More varied terrain with some deserts
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rand = Math.random();
          
          // Leave the western edge somewhat easy
          if (x < 2) {
            if (rand < 0.7) {
              mapData[y][x].terrain = "plains";
            } else {
              mapData[y][x].terrain = "forest";
            }
          } 
          // Eastern edge has some challenges
          else if (x >= width - 2) {
            if (rand < 0.5) {
              mapData[y][x].terrain = "plains";
            } else if (rand < 0.8) {
              mapData[y][x].terrain = "forest";
            } else {
              mapData[y][x].terrain = "mountain";
            }
          }
          // Middle area has more difficult terrain
          else {
            if (rand < 0.3) {
              mapData[y][x].terrain = "plains";
            } else if (rand < 0.5) {
              mapData[y][x].terrain = "forest";
            } else if (rand < 0.7) {
              mapData[y][x].terrain = "mountain";
            } else if (rand < 0.85) {
              mapData[y][x].terrain = "swamp";
            } else {
              mapData[y][x].terrain = "desert";
            }
          }
        }
      }
      
      // Add some terrain patterns - a mountain range
      const mountainRangeY = Math.floor(height / 2);
      const mountainRangeStartX = Math.floor(width / 3);
      const mountainRangeEndX = Math.floor(2 * width / 3);
      
      for (let x = mountainRangeStartX; x <= mountainRangeEndX; x++) {
        // Place mountains in middle and adjacent squares
        mapData[mountainRangeY][x].terrain = "mountain";
        if (mountainRangeY > 0) {
          mapData[mountainRangeY - 1][x].terrain = Math.random() < 0.7 ? "mountain" : "forest";
        }
        if (mountainRangeY < height - 1) {
          mapData[mountainRangeY + 1][x].terrain = Math.random() < 0.7 ? "mountain" : "forest";
        }
      }
      
    } else { // Hard difficulty
      // Very challenging terrain with lots of deserts and mountains
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rand = Math.random();
          
          // Even the western edge has some challenges
          if (x < 2) {
            if (rand < 0.5) {
              mapData[y][x].terrain = "plains";
            } else if (rand < 0.8) {
              mapData[y][x].terrain = "forest";
            } else {
              mapData[y][x].terrain = "swamp";
            }
          } 
          // Eastern edge is very difficult
          else if (x >= width - 2) {
            if (rand < 0.3) {
              mapData[y][x].terrain = "plains";
            } else if (rand < 0.5) {
              mapData[y][x].terrain = "forest";
            } else if (rand < 0.7) {
              mapData[y][x].terrain = "mountain";
            } else {
              mapData[y][x].terrain = "desert";
            }
          }
          // Middle area is extremely challenging
          else {
            if (rand < 0.2) {
              mapData[y][x].terrain = "plains";
            } else if (rand < 0.35) {
              mapData[y][x].terrain = "forest";
            } else if (rand < 0.6) {
              mapData[y][x].terrain = "mountain";
            } else if (rand < 0.8) {
              mapData[y][x].terrain = "desert";
            } else {
              mapData[y][x].terrain = "swamp";
            }
          }
        }
      }
      
      // Add a desert region
      const desertStartY = Math.floor(height / 4);
      const desertEndY = Math.floor(3 * height / 4);
      const desertStartX = Math.floor(width / 4);
      const desertEndX = Math.floor(width / 2);
      
      for (let y = desertStartY; y <= desertEndY; y++) {
        for (let x = desertStartX; x <= desertEndX; x++) {
          mapData[y][x].terrain = "desert";
        }
      }
      
      // Add a swamp region
      const swampStartY = Math.floor(height / 3);
      const swampEndY = Math.floor(2 * height / 3);
      const swampStartX = Math.floor(2 * width / 3);
      const swampEndX = Math.floor(5 * width / 6);
      
      for (let y = swampStartY; y <= swampEndY; y++) {
        for (let x = swampStartX; x <= swampEndX; x++) {
          mapData[y][x].terrain = "swamp";
        }
      }
    }
    
    // Always ensure at least one path to the eastern edge
    ensurePath(mapData);
  };
  
  // Ensure there's at least one viable path from west to east
  const ensurePath = (mapData: Cell[][]) => {
    const width = mapData[0].length;
    const height = mapData.length;
    
    // Create a simple path from west to east
    const pathY = Math.floor(height / 2);
    
    // Make the path alternate between plains and forest for a bit of challenge
    for (let x = 0; x < width; x++) {
      if (x % 2 === 0) {
        mapData[pathY][x].terrain = "plains";
      } else {
        mapData[pathY][x].terrain = "forest";
      }
    }
  };
  
  // Generate items on the map
  const generateItems = (mapData: Cell[][], difficulty: "easy" | "medium" | "hard") => {
    const width = mapData[0].length;
    const height = mapData.length;
    
    // Calculate number of items based on difficulty and map size
    let foodCount, waterCount, goldCount, traderCount;
    
    if (difficulty === "easy") {
      foodCount = Math.floor(width * height * 0.08);
      waterCount = Math.floor(width * height * 0.08);
      goldCount = Math.floor(width * height * 0.05);
      traderCount = Math.floor(width * height * 0.03);
    } else if (difficulty === "medium") {
      foodCount = Math.floor(width * height * 0.06);
      waterCount = Math.floor(width * height * 0.06);
      goldCount = Math.floor(width * height * 0.04);
      traderCount = Math.floor(width * height * 0.02);
    } else { // Hard
      foodCount = Math.floor(width * height * 0.04);
      waterCount = Math.floor(width * height * 0.04);
      goldCount = Math.floor(width * height * 0.03);
      traderCount = Math.floor(width * height * 0.015);
    }
    
    // Place food items
    placeItems(mapData, "food", foodCount);
    
    // Place water items
    placeItems(mapData, "water", waterCount);
    
    // Place gold items
    placeItems(mapData, "gold", goldCount);
    
    // Place traders
    placeItems(mapData, "trader", traderCount);
  };
  
  // Place specific type of items on the map
  const placeItems = (mapData: Cell[][], itemType: ItemType, count: number) => {
    const width = mapData[0].length;
    const height = mapData.length;
    let itemsPlaced = 0;
    let itemId = 1;
    
    while (itemsPlaced < count) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      // Skip cells near the western edge (starting area)
      if (x < 2) continue;
      
      // Determine if this item should be repeating
      let repeating = false;
      if (itemType === "food" && mapData[y][x].terrain === "forest") {
        repeating = Math.random() < 0.3; // 30% chance for repeating food in forests
      } else if (itemType === "water" && 
                (mapData[y][x].terrain === "swamp" || mapData[y][x].terrain === "forest")) {
        repeating = Math.random() < 0.4; // 40% chance for repeating water in swamps and forests
      } else if (itemType === "trader") {
        repeating = true; // Traders are always repeating
      }
      
      // Determine amount based on item type and terrain
      let amount = 1;
      if (itemType === "food") {
        if (mapData[y][x].terrain === "forest") {
          amount = 3 + Math.floor(Math.random() * 3); // 3-5 food in forests
        } else if (mapData[y][x].terrain === "plains") {
          amount = 2 + Math.floor(Math.random() * 2); // 2-3 food in plains
        } else {
          amount = 1 + Math.floor(Math.random() * 2); // 1-2 food elsewhere
        }
      } else if (itemType === "water") {
        if (mapData[y][x].terrain === "swamp") {
          amount = 3 + Math.floor(Math.random() * 3); // 3-5 water in swamps
        } else if (mapData[y][x].terrain === "forest") {
          amount = 2 + Math.floor(Math.random() * 2); // 2-3 water in forests
        } else {
          amount = 1 + Math.floor(Math.random() * 2); // 1-2 water elsewhere
        }
      } else if (itemType === "gold") {
        if (mapData[y][x].terrain === "mountain") {
          amount = 2 + Math.floor(Math.random() * 3); // 2-4 gold in mountains
        } else {
          amount = 1 + Math.floor(Math.random() * 2); // 1-2 gold elsewhere
        }
      } else if (itemType === "trader") {
        // Traders don't have amounts, just placeholder
        amount = 1;
      }
      
      // Add the item to the cell
      mapData[y][x].items.push({
        id: itemId++,
        type: itemType,
        amount,
        repeating,
        lastCollected: null
      });
      
      itemsPlaced++;
    }
  };
  
  // Update visibility based on player position and vision
  const updateVisibility = () => {
    const { x, y, vision } = player;
    const visionRange = VISION_RANGES[vision];
    
    setMap(prevMap => {
      const newMap = [...prevMap];
      
      // Mark all previously visible cells as wasVisible
      for (let my = 0; my < newMap.length; my++) {
        for (let mx = 0; mx < newMap[0].length; mx++) {
          if (newMap[my][mx].isVisible) {
            newMap[my][mx] = {
              ...newMap[my][mx],
              isVisible: false,
              wasVisible: true
            };
          }
        }
      }
      
      // Calculate new visibility
      for (let dy = -visionRange; dy <= visionRange; dy++) {
        for (let dx = -visionRange; dx <= visionRange; dx++) {
          const newX = x + dx;
          const newY = y + dy;
          
          // Check if cell is in bounds
          if (
            newX >= 0 && 
            newX < newMap[0].length && 
            newY >= 0 && 
            newY < newMap.length
          ) {
            // Check if cell is within vision range (using Manhattan distance for simplicity)
            const distance = Math.abs(dx) + Math.abs(dy);
            if (distance <= visionRange) {
              newMap[newY][newX] = {
                ...newMap[newY][newX],
                isVisible: true
              };
            }
          }
        }
      }
      
      return newMap;
    });
  };
  
  // Handle player movement
  const handleMove = (direction: Direction) => {
    if (gameState.gameOver || gameState.trading) return;
    
    // Calculate new position
    let newX = player.x;
    let newY = player.y;
    
    switch (direction) {
      case "north":
        newY -= 1;
        break;
      case "south":
        newY += 1;
        break;
      case "east":
        newX += 1;
        break;
      case "west":
        newX -= 1;
        break;
      case "northeast":
        newX += 1;
        newY -= 1;
        break;
      case "northwest":
        newX -= 1;
        newY -= 1;
        break;
      case "southeast":
        newX += 1;
        newY += 1;
        break;
      case "southwest":
        newX -= 1;
        newY += 1;
        break;
      case "stay":
        // Stay in place - just process turn
        processTurn(newX, newY, direction);
        return;
    }
    
    // Check if new position is out of bounds
    if (newX < 0 || newX >= gameState.mapWidth || newY < 0 || newY >= gameState.mapHeight) {
      // Check if player reached eastern edge
      if (newX >= gameState.mapWidth) {
        // Player has won!
        setGameState(prev => ({
          ...prev,
          gameOver: true,
          gameWon: true,
          message: "Congratulations! You've reached the eastern edge and won the game!"
        }));
        addLog("You've reached the eastern edge and won the game!", "status");
        return;
      }
      
      addLog(`You can't move ${direction}, it's out of bounds.`, "move");
      return;
    }
    
    // Check if player has enough resources to enter the new cell
    const terrain = map[newY][newX].terrain;
    const terrainData = TERRAIN_COSTS[terrain];
    
    // If staying in place, strength is regained and other costs are halved
    const movementCost = direction === "stay" 
      ? -2 // Regain 2 strength when staying
      : terrainData.movementCost;
    
    const waterCost = direction === "stay" 
      ? Math.ceil(terrainData.waterCost / 2) 
      : terrainData.waterCost;
    
    const foodCost = direction === "stay" 
      ? Math.ceil(terrainData.foodCost / 2) 
      : terrainData.foodCost;
    
    // Check if player has enough resources
    if (player.currentStrength < movementCost) {
      addLog(`You don't have enough strength to move to ${terrain}.`, "move");
      return;
    }
    
    if (player.currentWater < waterCost) {
      addLog(`You don't have enough water to move to ${terrain}.`, "move");
      return;
    }
    
    if (player.currentFood < foodCost) {
      addLog(`You don't have enough food to move to ${terrain}.`, "move");
      return;
    }
    
    // Process the turn with the valid move
    processTurn(newX, newY, direction);
  };
  
  // Process a turn with a valid move
  const processTurn = (newX: number, newY: number, direction: Direction) => {
    // Get terrain data for the destination cell
    const isStaying = direction === "stay";
    const terrain = isStaying 
      ? map[player.y][player.x].terrain 
      : map[newY][newX].terrain;
    const terrainData = TERRAIN_COSTS[terrain];
    
    // Calculate costs
    const movementCost = isStaying 
      ? -2 // Regain 2 strength when staying
      : terrainData.movementCost;
    
    const waterCost = isStaying 
      ? Math.ceil(terrainData.waterCost / 2) 
      : terrainData.waterCost;
    
    const foodCost = isStaying 
      ? Math.ceil(terrainData.foodCost / 2) 
      : terrainData.foodCost;
    
    // Update player position and resources
    setPlayer(prev => {
      const newPlayer = {
        ...prev,
        x: newX,
        y: newY,
        currentStrength: Math.min(prev.maxStrength, prev.currentStrength - movementCost),
        currentWater: Math.max(0, prev.currentWater - waterCost),
        currentFood: Math.max(0, prev.currentFood - foodCost),
        turn: prev.turn + 1
      };
      
      return newPlayer;
    });
    
    // Add log message
    if (isStaying) {
      addLog(`You stayed in place and regained some strength.`, "move");
    } else {
      addLog(`You moved ${direction} to ${terrain}.`, "move");
    }
    
    // Check for items in the cell
    checkCellItems(newX, newY);
    
    // Update visibility based on new position
    updateVisibility();
    
    // Check win/loss conditions
    checkGameConditions();
    
    // Calculate brain's next suggested move after player moved
    setTimeout(() => {
      const nextMove = calculateBrainMove();
      setSuggestedMove(nextMove);
    }, 100);
  };
  
  // Check for items in the current cell
  const checkCellItems = (x: number, y: number) => {
    const cell = map[y][x];
    
    // If no items, return
    if (cell.items.length === 0) return;
    
    // For each item, offer to collect
    cell.items.forEach(item => {
      // Check if it's a repeating item that was collected this turn
      if (item.repeating && item.lastCollected === player.turn) {
        return; // Skip this item as it was already collected this turn
      }
      
      if (item.type === "trader") {
        // For traders, offer to trade
        addLog(`There's a trader here. You can trade with them.`, "item");
      } else {
        // For collectible items, automatically collect them
        collectItem(item, x, y);
      }
    });
  };
  
  // Collect an item
  const collectItem = (item: Item, x: number, y: number) => {
    if (item.type === "trader") {
      // Start trading
      startTrading(x, y);
      return;
    }
    
    // Update player resources
    setPlayer(prev => {
      const newPlayer = { ...prev };
      
      if (item.type === "food") {
        newPlayer.currentFood = Math.min(prev.currentFood + item.amount, prev.maxFood);
        addLog(`You collected ${item.amount} food.`, "item");
      } else if (item.type === "water") {
        newPlayer.currentWater = Math.min(prev.currentWater + item.amount, prev.maxWater);
        addLog(`You collected ${item.amount} water.`, "item");
      } else if (item.type === "gold") {
        newPlayer.gold = prev.gold + item.amount;
        addLog(`You collected ${item.amount} gold.`, "item");
      }
      
      return newPlayer;
    });
    
    // Update the map to mark item as collected
    setMap(prev => {
      const newMap = [...prev];
      const cell = { ...newMap[y][x] };
      
      // If not repeating, remove the item
      if (!item.repeating) {
        cell.items = cell.items.filter(i => i.id !== item.id);
      } else {
        // If repeating, mark it as collected this turn
        cell.items = cell.items.map(i => 
          i.id === item.id ? { ...i, lastCollected: player.turn } : i
        );
      }
      
      newMap[y][x] = cell;
      return newMap;
    });
  };
  
  // Start trading with a trader
  const startTrading = (x: number, y: number) => {
    // Find a trader in this cell
    const traders = map[y][x].items.filter(item => item.type === "trader");
    if (traders.length === 0) return;
    
    // Create a trader object (internal representation)
    const traderTypes: Trader["type"][] = ["generous", "fair", "greedy", "impatient"];
    const traderType = traderTypes[Math.floor(Math.random() * traderTypes.length)];
    
    const trader: Trader = {
      id: traders[0].id,
      type: traderType,
      maxOffers: traderType === "impatient" ? 3 : 6,
      offersCount: 0,
      valueRatio: {
        food: 1.0,
        water: 1.0,
        gold: 1.0
      }
    };
    
    // Adjust value ratios based on trader type
    if (traderType === "generous") {
      trader.valueRatio.food = 0.8;
      trader.valueRatio.water = 0.8;
      trader.valueRatio.gold = 1.2;
    } else if (traderType === "greedy") {
      trader.valueRatio.food = 1.2;
      trader.valueRatio.water = 1.2;
      trader.valueRatio.gold = 0.8;
    }
    
    // Set initial trader offer
    const initialOffer: TradeOffer = {
      offered: {
        food: 0,
        water: 0,
        gold: 0
      },
      requested: {
        food: 0,
        water: 0,
        gold: 0
      }
    };
    
    // Set up trading UI
    setGameState(prev => ({
      ...prev,
      trading: true,
      currentTrader: trader,
      currentOffer: initialOffer
    }));
    
    addLog(`You started trading with a trader.`, "trade");
  };
  
  // Update the current trade offer
  const updateTradeOffer = (
    resource: keyof TradeOffer["offered"], 
    amount: number, 
    isOffered: boolean
  ) => {
    if (!gameState.currentOffer) return;
    
    setGameState(prev => {
      if (!prev.currentOffer) return prev;
      
      const newOffer = { ...prev.currentOffer };
      
      if (isOffered) {
        // Update offered resources (limited by what player has)
        const maxAmount = resource === "food" 
          ? player.currentFood 
          : resource === "water" 
            ? player.currentWater 
            : player.gold;
        
        newOffer.offered[resource] = Math.max(0, Math.min(maxAmount, amount));
      } else {
        // Update requested resources
        newOffer.requested[resource] = Math.max(0, amount);
      }
      
      return {
        ...prev,
        currentOffer: newOffer
      };
    });
  };
  
  // Propose the current offer to the trader
  const proposeOffer = () => {
    if (!gameState.currentTrader || !gameState.currentOffer) return;
    
    const trader = gameState.currentTrader;
    const offer = gameState.currentOffer;
    
    // Increment offers count
    const newTrader = {
      ...trader,
      offersCount: trader.offersCount + 1
    };
    
    // Check if trader will accept the offer
    const playerValue = calculateOfferValue(offer.offered);
    const traderValue = calculateOfferValue(offer.requested, trader.valueRatio);
    
    // Trader will accept if they're getting a good deal
    const willAccept = trader.type === "generous" 
      ? playerValue >= traderValue * 0.8 // Generous trader accepts 80% value
      : trader.type === "fair"
        ? playerValue >= traderValue * 0.9 // Fair trader accepts 90% value
        : playerValue >= traderValue * 1.1; // Greedy trader wants 110% value
    
    // Check if trader is fed up with too many offers
    const isFedUp = newTrader.offersCount >= newTrader.maxOffers;
    
    if (isFedUp) {
      // Trader ends trading
      addLog(`The trader is fed up with your offers and ends the trading.`, "trade");
      setGameState(prev => ({
        ...prev,
        trading: false,
        currentTrader: null,
        currentOffer: null
      }));
      return;
    }
    
    if (willAccept) {
      // Trader accepts the offer
      addLog(`The trader accepts your offer!`, "trade");
      executeTradeOffer(offer);
    } else {
      // Trader makes a counter offer
      const counterOffer = generateCounterOffer(offer, newTrader);
      addLog(`The trader rejects your offer and makes a counter offer.`, "trade");
      
      setGameState(prev => ({
        ...prev,
        currentTrader: newTrader,
        currentOffer: counterOffer
      }));
    }
  };
  
  // Calculate the value of resources
  const calculateOfferValue = (
    resources: TradeOffer["offered"], 
    valueRatio?: Trader["valueRatio"]
  ) => {
    const baseValue = (
      resources.food * 2 + // Food is worth 2 per unit
      resources.water * 2 + // Water is worth 2 per unit
      resources.gold * 3 // Gold is worth 3 per unit
    );
    
    if (!valueRatio) return baseValue;
    
    return (
      resources.food * 2 * valueRatio.food +
      resources.water * 2 * valueRatio.water +
      resources.gold * 3 * valueRatio.gold
    );
  };
  
  // Generate a counter offer from the trader
  const generateCounterOffer = (offer: TradeOffer, trader: Trader): TradeOffer => {
    // Start with the player's offer
    const counterOffer: TradeOffer = {
      offered: { ...offer.requested }, // Trader's offer is what player requested
      requested: { ...offer.offered }  // Trader's request is what player offered
    };
    
    // Adjust based on trader type
    if (trader.type === "generous") {
      // Generous trader might reduce what they're asking for
      counterOffer.requested.food = Math.floor(counterOffer.requested.food * 0.8);
      counterOffer.requested.water = Math.floor(counterOffer.requested.water * 0.8);
      counterOffer.requested.gold = Math.floor(counterOffer.requested.gold * 0.9);
    } else if (trader.type === "greedy") {
      // Greedy trader might increase what they're asking for
      counterOffer.requested.food = Math.ceil(counterOffer.requested.food * 1.2);
      counterOffer.requested.water = Math.ceil(counterOffer.requested.water * 1.2);
      counterOffer.requested.gold = Math.ceil(counterOffer.requested.gold * 1.1);
    }
    
    // Make sure counter offer is reasonable
    const playerValue = calculateOfferValue(counterOffer.requested);
    const traderValue = calculateOfferValue(counterOffer.offered, trader.valueRatio);
    
    // If the value is too imbalanced, adjust it
    if (playerValue > traderValue * 1.3) {
      // Trader needs to offer more
      const adjustFactor = (playerValue / (traderValue * 1.2));
      counterOffer.offered.food = Math.ceil(counterOffer.offered.food * adjustFactor);
      counterOffer.offered.water = Math.ceil(counterOffer.offered.water * adjustFactor);
      counterOffer.offered.gold = Math.ceil(counterOffer.offered.gold * adjustFactor);
    }
    
    return counterOffer;
  };
  
  // Execute a trade offer
  const executeTradeOffer = (offer: TradeOffer) => {
    // Update player resources
    setPlayer(prev => ({
      ...prev,
      currentFood: Math.min(
        prev.maxFood, 
        prev.currentFood - offer.offered.food + offer.requested.food
      ),
      currentWater: Math.min(
        prev.maxWater, 
        prev.currentWater - offer.offered.water + offer.requested.water
      ),
      gold: prev.gold - offer.offered.gold + offer.requested.gold
    }));
    
    // End trading
    setGameState(prev => ({
      ...prev,
      trading: false,
      currentTrader: null,
      currentOffer: null
    }));
    
    // Log the trade results
    const tradeLog = `Trade completed! You gave ${offer.offered.food} food, ${offer.offered.water} water, ${offer.offered.gold} gold and received ${offer.requested.food} food, ${offer.requested.water} water, ${offer.requested.gold} gold.`;
    addLog(tradeLog, "trade");
  };
  
  // Check game win/loss conditions
  const checkGameConditions = () => {
    // Check if player has reached the eastern edge
    if (player.x >= gameState.mapWidth - 1) {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        gameWon: true,
        message: "Congratulations! You've reached the eastern edge and won the game!"
      }));
      addLog("You've reached the eastern edge and won the game!", "status");
      return;
    }
    
    // Check if player has run out of water or food
    if (player.currentWater <= 0 || player.currentFood <= 0) {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        gameWon: false,
        message: player.currentWater <= 0 
          ? "Game over! You've run out of water and perished in the wilderness."
          : "Game over! You've run out of food and perished in the wilderness."
      }));
      
      addLog(player.currentWater <= 0 
        ? "You've run out of water and perished in the wilderness."
        : "You've run out of food and perished in the wilderness.", 
        "status"
      );
    }
  };
  
  // A* pathfinding function to find optimal path
  const findPathAStar = (startX: number, startY: number, goalX: number, goalY: number): Direction | null => {
    // If already at goal, return null
    if (startX === goalX && startY === goalY) return null;
    
    // Initialize openSet, closedSet, and cameFrom
    const openSet: { x: number; y: number; f: number; g: number; h: number }[] = [];
    const closedSet: Set<string> = new Set();
    const cameFrom: Map<string, { x: number; y: number }> = new Map();
    
    // Add start position to openSet
    openSet.push({
      x: startX,
      y: startY,
      g: 0,
      h: Math.abs(goalX - startX) + Math.abs(goalY - startY),
      f: Math.abs(goalX - startX) + Math.abs(goalY - startY)
    });
    
    while (openSet.length > 0) {
      // Find node with lowest f score
      let lowestIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      
      const current = openSet[lowestIndex];
      
      // If we've reached the goal, reconstruct and return first step
      if (current.x === goalX && current.y === goalY) {
        // Reconstruct path
        let currentPos = { x: current.x, y: current.y };
        const path: { x: number; y: number }[] = [currentPos];
        
        while (cameFrom.has(`${currentPos.x},${currentPos.y}`)) {
          currentPos = cameFrom.get(`${currentPos.x},${currentPos.y}`)!;
          path.unshift(currentPos);
        }
        
        // If path has at least 2 points, return direction to the first step
        if (path.length >= 2) {
          const firstStep = path[1];
          return getDirectionToCell(startX, startY, firstStep.x, firstStep.y);
        }
        
        return null;
      }
      
      // Remove current from openSet and add to closedSet
      openSet.splice(lowestIndex, 1);
      closedSet.add(`${current.x},${current.y}`);
      
      // Check all neighbor directions
      const directions: Direction[] = [
        "north", "south", "east", "west", 
        "northeast", "northwest", "southeast", "southwest"
      ];
      
      for (const direction of directions) {
        let neighborX = current.x;
        let neighborY = current.y;
        
        // Calculate new position based on direction
        switch (direction) {
          case "north": neighborY--; break;
          case "south": neighborY++; break;
          case "east": neighborX++; break;
          case "west": neighborX--; break;
          case "northeast": neighborX++; neighborY--; break;
          case "northwest": neighborX--; neighborY--; break;
          case "southeast": neighborX++; neighborY++; break;
          case "southwest": neighborX--; neighborY++; break;
        }
        
        // Skip if out of bounds
        if (
          neighborX < 0 || 
          neighborX >= gameState.mapWidth || 
          neighborY < 0 || 
          neighborY >= gameState.mapHeight
        ) {
          continue;
        }
        
        // Skip if in closedSet
        if (closedSet.has(`${neighborX},${neighborY}`)) {
          continue;
        }
        
        // Skip if not visible (can't pathfind through fog of war)
        if (!map[neighborY][neighborX].isVisible && !map[neighborY][neighborX].wasVisible) {
          continue;
        }
        
        // Calculate movement cost to this neighbor
        const terrainData = TERRAIN_COSTS[map[neighborY][neighborX].terrain];
        const moveCost = terrainData.movementCost;
        
        // Skip if player doesn't have enough resources to enter this cell
        if (
          player.currentStrength < moveCost ||
          player.currentWater < terrainData.waterCost ||
          player.currentFood < terrainData.foodCost
        ) {
          continue;
        }
        
        // Calculate tentative g score
        const tentativeG = current.g + moveCost;
        
        // Check if this neighbor is in openSet
        const existingNodeIndex = openSet.findIndex(
          node => node.x === neighborX && node.y === neighborY
        );
        
        if (existingNodeIndex === -1) {
          // Not in openSet, add it
          const h = Math.abs(goalX - neighborX) + Math.abs(goalY - neighborY);
          openSet.push({
            x: neighborX,
            y: neighborY,
            g: tentativeG,
            h,
            f: tentativeG + h
          });
          cameFrom.set(`${neighborX},${neighborY}`, { x: current.x, y: current.y });
        } else if (tentativeG < openSet[existingNodeIndex].g) {
          // Already in openSet but this path is better
          openSet[existingNodeIndex].g = tentativeG;
          openSet[existingNodeIndex].f = tentativeG + openSet[existingNodeIndex].h;
          cameFrom.set(`${neighborX},${neighborY}`, { x: current.x, y: current.y });
        }
      }
    }
    
    // No path found
    return null;
  };
  
  // Calculate brain's suggested move
  const calculateBrainMove = (): Direction => {
    const { brain, x, y, currentFood, maxFood, currentWater, maxWater, currentStrength, maxStrength } = player;
    
    let reasoning = "";
    let move: Direction = "stay";
    
    // Get visible surrounding cells
    const visibleCells = map.flat().filter(cell => cell.isVisible);
    
    // Calculate which resources are most needed
    const foodNeed = 1 - (currentFood / maxFood);
    const waterNeed = 1 - (currentWater / maxWater);
    const strengthNeed = 1 - (currentStrength / maxStrength);
    
    // Check if we're close to east edge
    const isCloseToEast = x >= gameState.mapWidth - 5;
    
    // Find cells with items
    const cellsWithFood = visibleCells.filter(cell => 
      cell.items.some(item => item.type === "food")
    );
    
    const cellsWithWater = visibleCells.filter(cell => 
      cell.items.some(item => item.type === "water")
    );
    
    const cellsWithTraders = visibleCells.filter(cell => 
      cell.items.some(item => item.type === "trader")
    );
    
    // Calculate all possible move directions and their costs
    const possibleMoves: { direction: Direction; terrainCost: number }[] = [];
    const directions: Direction[] = [
      "north", "south", "east", "west", 
      "northeast", "northwest", "southeast", "southwest", "stay"
    ];
    
    for (const direction of directions) {
      if (direction === "stay") {
        possibleMoves.push({ direction: "stay", terrainCost: -2 }); // Resting recovers strength
        continue;
      }
      
      let moveX = x;
      let moveY = y;
      
      switch (direction) {
        case "north": moveY--; break;
        case "south": moveY++; break;
        case "east": moveX++; break;
        case "west": moveX--; break;
        case "northeast": moveX++; moveY--; break;
        case "northwest": moveX--; moveY--; break;
        case "southeast": moveX++; moveY++; break;
        case "southwest": moveX--; moveY++; break;
      }
      
      // Skip if out of bounds
      if (moveX < 0 || moveX >= gameState.mapWidth || moveY < 0 || moveY >= gameState.mapHeight) {
        continue;
      }
      
      // Get terrain cost
      const terrain = map[moveY][moveX].terrain;
      const terrainCost = TERRAIN_COSTS[terrain].movementCost;
      
      possibleMoves.push({ direction, terrainCost });
    }
    
    // Different brain types have different strategies
    if (brain === "balanced") {
      reasoning = "Using balanced brain strategy:\n";
      
      // If close to eastern edge, prioritize reaching it
      if (isCloseToEast) {
        reasoning += "- Close to eastern edge, prioritizing eastward movement\n";
        move = "east";
      }
      // If very low on food or water, prioritize finding those
      else if (foodNeed > 0.8 && cellsWithFood.length > 0) {
        reasoning += "- Very low on food, seeking food sources\n";
        const closestFood = cellsWithFood.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestFood.x, closestFood.y);
      }
      else if (waterNeed > 0.8 && cellsWithWater.length > 0) {
        reasoning += "- Very low on water, seeking water sources\n";
        const closestWater = cellsWithWater.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestWater.x, closestWater.y);
      }
      // Otherwise balance eastward progress with resource gathering
      else {
        // If fairly low on either resource, seek it out
        if (foodNeed > 0.5 && cellsWithFood.length > 0) {
          reasoning += "- Low on food, seeking food sources\n";
          const closestFood = cellsWithFood.sort((a, b) => 
            Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
          )[0];
          move = getDirectionToCell(x, y, closestFood.x, closestFood.y);
        }
        else if (waterNeed > 0.5 && cellsWithWater.length > 0) {
          reasoning += "- Low on water, seeking water sources\n";
          const closestWater = cellsWithWater.sort((a, b) => 
            Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
          )[0];
          move = getDirectionToCell(x, y, closestWater.x, closestWater.y);
        }
        // If low on strength, rest
        else if (strengthNeed > 0.7) {
          reasoning += "- Low on strength, staying to rest\n";
          move = "stay";
        }
        // Otherwise continue east
        else {
          reasoning += "- Resources are sufficient, moving eastward\n";
          move = "east";
        }
      }
    }
    else if (brain === "explorer") {
      reasoning = "Using explorer brain strategy:\n";
      
      // Explorer prioritizes moving east whenever possible
      if (foodNeed < 0.7 && waterNeed < 0.7) {
        reasoning += "- Resources are sufficient, prioritizing eastward exploration\n";
        move = "east";
      }
      // If low on resources, look for them
      else if (foodNeed > waterNeed && cellsWithFood.length > 0) {
        reasoning += "- Low on food, seeking food sources\n";
        const closestFood = cellsWithFood.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestFood.x, closestFood.y);
      }
      else if (waterNeed >= foodNeed && cellsWithWater.length > 0) {
        reasoning += "- Low on water, seeking water sources\n";
        const closestWater = cellsWithWater.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestWater.x, closestWater.y);
      }
      // If resources are critically low, rest to conserve
      else if (foodNeed > 0.9 || waterNeed > 0.9) {
        reasoning += "- Critical resource shortage, staying to conserve\n";
        move = "stay";
      }
      // If no resources found but needed, just try going east anyway
      else {
        reasoning += "- No resources spotted but continuing eastward\n";
        move = "east";
      }
    }
    else if (brain === "collector") {
      reasoning = "Using collector brain strategy:\n";
      
      // Collector prioritizes grabbing items and maintaining high resources
      let targetFound = false;
      
      // If there's a trader, go to it
      if (cellsWithTraders.length > 0 && player.gold > 0) {
        reasoning += "- Found a trader, moving to trade\n";
        const closestTrader = cellsWithTraders.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestTrader.x, closestTrader.y);
        targetFound = true;
      }
      
      // If food is not full and there's food, go get it
      if (!targetFound && foodNeed > 0.2 && cellsWithFood.length > 0) {
        reasoning += "- Food not at optimal levels, collecting more\n";
        const closestFood = cellsWithFood.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestFood.x, closestFood.y);
        targetFound = true;
      }
      
      // If water is not full and there's water, go get it
      if (!targetFound && waterNeed > 0.2 && cellsWithWater.length > 0) {
        reasoning += "- Water not at optimal levels, collecting more\n";
        const closestWater = cellsWithWater.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestWater.x, closestWater.y);
        targetFound = true;
      }
      
      // If resources are very low, rest
      if (!targetFound && (foodNeed > 0.8 || waterNeed > 0.8)) {
        reasoning += "- Resources low with no sources in sight, conserving\n";
        move = "stay";
        targetFound = true;
      }
      
      // Otherwise move east
      if (!targetFound) {
        reasoning += "- Resources at good levels, moving east\n";
        move = "east";
      }
    }
    else if (brain === "trader") {
      reasoning = "Using trader brain strategy:\n";
      
      // Trader prioritizes finding traders and maintaining a good gold reserve
      
      // If there's a trader, go to it
      if (cellsWithTraders.length > 0) {
        reasoning += "- Found a trader, moving to trade\n";
        const closestTrader = cellsWithTraders.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestTrader.x, closestTrader.y);
      }
      // If critically low on resources, seek them out
      else if (foodNeed > 0.8 && cellsWithFood.length > 0) {
        reasoning += "- Critically low on food, seeking food\n";
        const closestFood = cellsWithFood.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestFood.x, closestFood.y);
      }
      else if (waterNeed > 0.8 && cellsWithWater.length > 0) {
        reasoning += "- Critically low on water, seeking water\n";
        const closestWater = cellsWithWater.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        move = getDirectionToCell(x, y, closestWater.x, closestWater.y);
      }
      // If close to east, prioritize winning
      else if (isCloseToEast) {
        reasoning += "- Close to eastern edge, prioritizing victory\n";
        move = "east";
      }
      // Otherwise continue east looking for traders
      else {
        reasoning += "- Moving east to find more traders\n";
        move = "east";
      }
    }
    // New brain type: Strategic - uses A* pathfinding
    else if (brain === "strategic") {
      reasoning = "Using strategic brain strategy with A* pathfinding:\n";
      
      // Determine target based on priorities
      let targetX = -1;
      let targetY = -1;
      
      // If critically low on resources, find the closest source
      if (foodNeed > 0.8 && cellsWithFood.length > 0) {
        reasoning += "- Critically low on food, calculating optimal path to food\n";
        const closestFood = cellsWithFood.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        targetX = closestFood.x;
        targetY = closestFood.y;
      }
      else if (waterNeed > 0.8 && cellsWithWater.length > 0) {
        reasoning += "- Critically low on water, calculating optimal path to water\n";
        const closestWater = cellsWithWater.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        targetX = closestWater.x;
        targetY = closestWater.y;
      }
      // If there's a trader and we have gold, go to it
      else if (cellsWithTraders.length > 0 && player.gold > 0) {
        reasoning += "- Found a trader, calculating optimal path\n";
        const closestTrader = cellsWithTraders.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        targetX = closestTrader.x;
        targetY = closestTrader.y;
      }
      // If resources are below 50%, find the closest source
      else if (foodNeed > 0.5 && cellsWithFood.length > 0) {
        reasoning += "- Food below 50%, calculating optimal path to food\n";
        const closestFood = cellsWithFood.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        targetX = closestFood.x;
        targetY = closestFood.y;
      }
      else if (waterNeed > 0.5 && cellsWithWater.length > 0) {
        reasoning += "- Water below 50%, calculating optimal path to water\n";
        const closestWater = cellsWithWater.sort((a, b) => 
          Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
        )[0];
        targetX = closestWater.x;
        targetY = closestWater.y;
      }
      // If strength is low, rest
      else if (strengthNeed > 0.7) {
        reasoning += "- Low on strength, staying to rest\n";
        move = "stay";
      }
      // Otherwise, head east
      else {
        reasoning += "- Calculating optimal path eastward\n";
        
        // Find the most efficient path eastward
        // Look for the eastmost visible cell with lowest movement cost
        const eastCells = visibleCells.filter(cell => cell.x > x);
        if (eastCells.length > 0) {
          // Sort by x (prioritize furthest east), then by terrain cost (lowest first)
          eastCells.sort((a, b) => {
            if (b.x !== a.x) return b.x - a.x;
            return TERRAIN_COSTS[a.terrain].movementCost - TERRAIN_COSTS[b.terrain].movementCost;
          });
          
          targetX = eastCells[0].x;
          targetY = eastCells[0].y;
        } else {
          // If no visible cells to the east, just try to go east
          move = "east";
        }
      }
      
      // Use A* pathfinding to find the best path to the target
      if (targetX !== -1 && targetY !== -1) {
        const pathDirection = findPathAStar(x, y, targetX, targetY);
        if (pathDirection) {
          reasoning += `- A* pathfinding suggests moving ${pathDirection}\n`;
          move = pathDirection;
        } else {
          reasoning += "- No valid path found, defaulting to move east\n";
          move = "east";
        }
      }
    }
    // New brain type: Adaptive - changes strategy based on conditions
    else if (brain === "adaptive") {
      reasoning = "Using adaptive brain strategy:\n";
      
      // Calculate current condition scores to determine what strategy to use
      const resourceScore = Math.min(currentFood / maxFood, currentWater / maxWater) * 100;
      const progressScore = (x / gameState.mapWidth) * 100;
      const explorationScore = map.flat().filter(cell => cell.wasVisible).length / 
                              (gameState.mapWidth * gameState.mapHeight) * 100;
      
      reasoning += `- Current conditions: Resource level ${resourceScore.toFixed(0)}%, ` +
                  `Progress ${progressScore.toFixed(0)}%, ` +
                  `Exploration ${explorationScore.toFixed(0)}%\n`;
      
      // Pick a strategy based on the current conditions
      if (resourceScore < 20) {
        // Critical resource shortage - act like collector but more desperate
        reasoning += "- CRITICAL: Resources dangerously low, prioritizing survival\n";
        
        // If very low on food or water, find the closest source
        if (foodNeed > waterNeed && cellsWithFood.length > 0) {
          reasoning += "- Seeking food as top priority\n";
          const closestFood = cellsWithFood.sort((a, b) => 
            Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
          )[0];
          move = getDirectionToCell(x, y, closestFood.x, closestFood.y);
        }
        else if (cellsWithWater.length > 0) {
          reasoning += "- Seeking water as top priority\n";
          const closestWater = cellsWithWater.sort((a, b) => 
            Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
          )[0];
          move = getDirectionToCell(x, y, closestWater.x, closestWater.y);
        }
        // If no resources in sight and critically low, stay to conserve
        else if (resourceScore < 10) {
          reasoning += "- No resources in sight and critically low, conserving energy\n";
          move = "stay";
        }
        // Otherwise try to find an unexplored area that might have resources
        else {
          reasoning += "- Exploring for resources in unexplored areas\n";
          
          // Find unexplored directions
          const unexploredDirs = possibleMoves.filter(m => {
            if (m.direction === "stay") return false;
            
            let nx = x, ny = y;
            switch (m.direction) {
              case "north": ny--; break;
              case "south": ny++; break;
              case "east": nx++; break;
              case "west": nx--; break;
              case "northeast": nx++; ny--; break;
              case "northwest": nx--; ny--; break;
              case "southeast": nx++; ny++; break;
              case "southwest": nx--; ny++; break;
            }
            
            // Check if out of bounds
            if (nx < 0 || nx >= gameState.mapWidth || ny < 0 || ny >= gameState.mapHeight) {
              return false;
            }
            
            return !map[ny][nx].isVisible && !map[ny][nx].wasVisible;
          });
          
          if (unexploredDirs.length > 0) {
            // Sort by lowest terrain cost
            unexploredDirs.sort((a, b) => a.terrainCost - b.terrainCost);
            move = unexploredDirs[0].direction;
          } else {
            // If no unexplored directions, try east
            move = "east";
          }
        }
      }
      else if (progressScore > 80) {
        // Near the goal - act like explorer
        reasoning += "- Near eastern edge, prioritizing completing the journey\n";
        
        // Only divert from going east if resources are critical
        if (resourceScore < 30 && (cellsWithFood.length > 0 || cellsWithWater.length > 0)) {
          reasoning += "- Resources getting low, need a quick resupply before continuing\n";
          // Find closest resource
          const targets = [...cellsWithFood, ...cellsWithWater].sort((a, b) => 
            Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
          );
          
          if (targets.length > 0) {
            move = getDirectionToCell(x, y, targets[0].x, targets[0].y);
          } else {
            move = "east";
          }
        } else {
          move = "east";
        }
      }
      else if (explorationScore < 30) {
        // Early game, not much explored - balance exploration with resource gathering
        reasoning += "- Early exploration phase, balancing discovery with survival\n";
        
        // If resources are good, explore more aggressive directions
        if (resourceScore > 70) {
          reasoning += "- Resources plentiful, exploring aggressively\n";
          
          // Prefer eastward exploration
          const explorationDirs: Direction[] = ["east", "northeast", "southeast", "north", "south"];
          
          for (const dir of explorationDirs) {
            const isValid = validateMove(dir);
            if (isValid.valid) {
              move = dir;
              break;
            }
          }
        } 
        // If resources are okay, explore but be cautious
        else if (resourceScore > 40) {
          reasoning += "- Resources adequate, exploring with some caution\n";
          
          // Collect resources if convenient
          if (cellsWithFood.length > 0 || cellsWithWater.length > 0) {
            const targets = [...cellsWithFood, ...cellsWithWater].sort((a, b) => 
              Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
            );
            
            // Only divert to resources if they're close (1-2 steps away)
            if (targets.length > 0 && Math.abs(targets[0].x - x) + Math.abs(targets[0].y - y) <= 2) {
              reasoning += "- Found nearby resources, collecting before continuing\n";
              move = getDirectionToCell(x, y, targets[0].x, targets[0].y);
            } else {
              // Otherwise keep moving east but through low-cost terrain
              const eastOptions = possibleMoves.filter(m => 
                m.direction === "east" || m.direction === "northeast" || m.direction === "southeast"
              );
              
              if (eastOptions.length > 0) {
                // Choose the lowest cost option
                eastOptions.sort((a, b) => a.terrainCost - b.terrainCost);
                move = eastOptions[0].direction;
              } else {
                move = "east";
              }
            }
          } else {
            // No resources in sight, move east through lowest cost terrain
            const eastOptions = possibleMoves.filter(m => 
              m.direction === "east" || m.direction === "northeast" || m.direction === "southeast"
            );
            
            if (eastOptions.length > 0) {
              // Choose the lowest cost option
              eastOptions.sort((a, b) => a.terrainCost - b.terrainCost);
              move = eastOptions[0].direction;
            } else {
              move = "east";
            }
          }
        }
        // If resources are low, prioritize finding more
        else {
          reasoning += "- Resources running low, need to find supplies\n";
          
          if (cellsWithFood.length > 0 || cellsWithWater.length > 0) {
            const targets = [...cellsWithFood, ...cellsWithWater].sort((a, b) => 
              Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
            );
            
            if (targets.length > 0) {
              move = getDirectionToCell(x, y, targets[0].x, targets[0].y);
            } else {
              // If no resources visible, explore in the general eastward direction
              const dirs: Direction[] = ["east", "northeast", "southeast"];
              for (const dir of dirs) {
                const isValid = validateMove(dir);
                if (isValid.valid) {
                  move = dir;
                  break;
                }
              }
            }
          }
        }
      }
      // Mid-game balanced strategy
      else {
        reasoning += "- Mid-journey phase, optimizing for long-term survival\n";
        
        // If trader is visible, consider trading
        if (cellsWithTraders.length > 0 && player.gold > 0) {
          // Only divert to trader if we need resources
          if (resourceScore < 60) {
            reasoning += "- Found trader and resources below 60%, worth a detour\n";
            const closestTrader = cellsWithTraders.sort((a, b) => 
              Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
            )[0];
            move = getDirectionToCell(x, y, closestTrader.x, closestTrader.y);
          } else {
            reasoning += "- Found trader but resources adequate, continuing eastward\n";
            move = "east";
          }
        }
        // If resources are getting low, restock
        else if (resourceScore < 50) {
          reasoning += "- Resources below 50%, need to restock\n";
          
          if (cellsWithFood.length > 0 || cellsWithWater.length > 0) {
            const targets = [...cellsWithFood, ...cellsWithWater].sort((a, b) => 
              Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
            );
            
            if (targets.length > 0) {
              move = getDirectionToCell(x, y, targets[0].x, targets[0].y);
            } else {
              move = "east";
            }
          } else {
            move = "east";
          }
        }
        // Otherwise continue east but prefer paths with resources
        else {
          reasoning += "- Resources adequate, prioritizing eastward progress\n";
          
          // Check if any eastern cells have resources
          const eastCellsWithItems = visibleCells.filter(cell => 
            cell.x > x && cell.items.length > 0
          );
          
          if (eastCellsWithItems.length > 0) {
            reasoning += "- Found resources in eastern direction, optimal path\n";
            // Pick the closest one
            const target = eastCellsWithItems.sort((a, b) => 
              Math.abs(a.x - x) + Math.abs(a.y - y) - (Math.abs(b.x - x) + Math.abs(b.y - y))
            )[0];
            move = getDirectionToCell(x, y, target.x, target.y);
          } else {
            // No resources to the east, just go east through lowest cost terrain
            const eastOptions = possibleMoves.filter(m => 
              m.direction === "east" || m.direction === "northeast" || m.direction === "southeast"
            );
            
            if (eastOptions.length > 0) {
              // Choose the lowest cost option
              eastOptions.sort((a, b) => a.terrainCost - b.terrainCost);
              move = eastOptions[0].direction;
            } else {
              move = "east";
            }
          }
        }
      }
    }
    
    // Check if the move is valid (not out of bounds or into inaccessible terrain)
    const isValidMove = validateMove(move);
    if (!isValidMove.valid) {
      reasoning += `- ${move.toUpperCase()} move invalid: ${isValidMove.reason}\n`;
      
      // Try alternative directions, prioritizing eastward movement
      const alternatives: Direction[] = ["east", "northeast", "southeast", "north", "south", "stay"];
      
      for (const alt of alternatives) {
        const altValidation = validateMove(alt);
        if (altValidation.valid) {
          reasoning += `- Choosing alternative direction: ${alt.toUpperCase()}\n`;
          move = alt;
          break;
        }
      }
    }
    
    // Set the reasoning for UI display
    setBrainReasoning(reasoning);
    
    return move;
  };
  
  // Validate if a move is possible
  const validateMove = (direction: Direction): { valid: boolean; reason?: string } => {
    const { x, y, currentStrength, currentWater, currentFood } = player;
    
    // Calculate new position
    let newX = x;
    let newY = y;
    
    switch (direction) {
      case "north":
        newY -= 1;
        break;
      case "south":
        newY += 1;
        break;
      case "east":
        newX += 1;
        break;
      case "west":
        newX -= 1;
        break;
      case "northeast":
        newX += 1;
        newY -= 1;
        break;
      case "northwest":
        newX -= 1;
        newY -= 1;
        break;
      case "southeast":
        newX += 1;
        newY += 1;
        break;
      case "southwest":
        newX -= 1;
        newY += 1;
        break;
      case "stay":
        // Staying is always valid
        return { valid: true };
    }
    
    // Check if out of bounds
    if (newX < 0 || newX >= gameState.mapWidth || newY < 0 || newY >= gameState.mapHeight) {
      return { valid: false, reason: "Out of bounds" };
    }
    
    // Check if we have required resources for the terrain
    const terrain = map[newY][newX].terrain;
    const terrainData = TERRAIN_COSTS[terrain];
    
    if (currentStrength < terrainData.movementCost) {
      return { valid: false, reason: "Not enough strength" };
    }
    
    if (currentWater < terrainData.waterCost) {
      return { valid: false, reason: "Not enough water" };
    }
    
    if (currentFood < terrainData.foodCost) {
      return { valid: false, reason: "Not enough food" };
    }
    
    return { valid: true };
  };
  
  // Get direction to move from current position to target cell
  const getDirectionToCell = (fromX: number, fromY: number, toX: number, toY: number): Direction => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    // Check if already at the cell
    if (dx === 0 && dy === 0) return "stay";
    
    // Determine direction based on dx and dy
    if (dx > 0 && dy === 0) return "east";
    if (dx < 0 && dy === 0) return "west";
    if (dx === 0 && dy > 0) return "south";
    if (dx === 0 && dy < 0) return "north";
    if (dx > 0 && dy < 0) return "northeast";
    if (dx < 0 && dy < 0) return "northwest";
    if (dx > 0 && dy > 0) return "southeast";
    if (dx < 0 && dy > 0) return "southwest";
    
    // Default to east if something went wrong
    return "east";
  };
  
  // Get color for a cell based on terrain and visibility
  const getCellColor = (cell: Cell) => {
    if (!cell.isVisible && !cell.wasVisible) {
      return "#333333"; // Unexplored
    }
    
    if (!cell.isVisible && cell.wasVisible) {
      // Darken the terrain color for previously seen cells
      const color = TERRAIN_COSTS[cell.terrain].color;
      return adjustColorBrightness(color, -40);
    }
    
    return TERRAIN_COSTS[cell.terrain].color;
  };
  
  // Adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Get icon for a terrain type
  const getTerrainIcon = (terrain: TerrainType) => {
    switch (terrain) {
      case "plains":
        return "🌿";
      case "mountain":
        return "⛰️";
      case "desert":
        return "🏜️";
      case "swamp":
        return "🌱";
      case "forest":
        return "🌳";
    }
  };
  
  // Render the component
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      {/* Game Configuration Screen */}
      {showConfig && (
        <div className="bg-white rounded-lg p-6 shadow-md mb-4">
          <h2 className="text-xl font-bold mb-4">Wilderness Survival System Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Map Width</label>
              <input
                type="number"
                min="5"
                max="30"
                value={configWidth}
                onChange={(e) => setConfigWidth(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))}
                className="block w-full rounded border border-gray-300 shadow-sm p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Map Height</label>
              <input
                type="number"
                min="5"
                max="20"
                value={configHeight}
                onChange={(e) => setConfigHeight(Math.max(5, Math.min(20, parseInt(e.target.value) || 10)))}
                className="block w-full rounded border border-gray-300 shadow-sm p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={configDifficulty}
                onChange={(e) => setConfigDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="block w-full rounded border border-gray-300 shadow-sm p-2"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vision Type</label>
              <select
                value={configVision}
                onChange={(e) => setConfigVision(e.target.value as VisionType)}
                className="block w-full rounded border border-gray-300 shadow-sm p-2"
              >
                <option value="cautious">Cautious (1 square range)</option>
                <option value="strategic">Strategic (2 square range)</option>
                <option value="eagle">Eagle (3 square range)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brain Type</label>
              <select
                value={configBrain}
                onChange={(e) => setConfigBrain(e.target.value as BrainType)}
                className="block w-full rounded border border-gray-300 shadow-sm p-2"
              >
                <option value="balanced">Balanced (All-around strategy)</option>
                <option value="explorer">Explorer (Prioritizes eastward movement)</option>
                <option value="collector">Collector (Prioritizes gathering resources)</option>
                <option value="trader">Trader (Prioritizes trading)</option>
                <option value="adaptive">Adaptive (Changes strategy based on conditions)</option>
                <option value="strategic">Strategic (Uses A* pathfinding for optimal routes)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={initializeGame}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Game
          </button>
        </div>
      )}
      
      {/* Game Interface */}
      {!showConfig && (
        <div>
          {/* Game Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Wilderness Survival System</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfig(true)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={gameState.trading}
              >
                New Game
              </button>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  disabled={gameState.gameOver || gameState.trading}
                />
                <span>Auto Play</span>
              </label>
              {autoPlay && (
                <select
                  value={autoPlaySpeed}
                  onChange={(e) => setAutoPlaySpeed(parseInt(e.target.value))}
                  className="text-sm rounded border border-gray-300"
                >
                  <option value="500">Fast</option>
                  <option value="1000">Medium</option>
                  <option value="2000">Slow</option>
                </select>
              )}
            </div>
          </div>
          
          {/* Game Status */}
          <div className="bg-white rounded-lg p-4 shadow-md mb-4">
            <div className="font-medium mb-2">{gameState.message}</div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Day</div>
                <div className="text-lg">{gameState.day}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Location</div>
                <div className="text-lg">{player.x}, {player.y}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Vision</div>
                <div className="text-lg">{player.vision}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Brain</div>
                <div className="text-lg">{player.brain}</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Side - Map and Controls */}
            <div className="flex-1">
              {/* Player Resources */}
              <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Shield className="w-4 h-4" /> Strength
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(player.currentStrength / player.maxStrength) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-right mt-1">
                      {player.currentStrength}/{player.maxStrength}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Droplet className="w-4 h-4 text-blue-500" /> Water
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(player.currentWater / player.maxWater) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-right mt-1">
                      {player.currentWater}/{player.maxWater}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Apple className="w-4 h-4 text-green-500" /> Food
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(player.currentFood / player.maxFood) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-right mt-1">
                      {player.currentFood}/{player.maxFood}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      <Coins className="w-4 h-4 text-yellow-500" /> Gold
                    </div>
                    <div className="text-lg">{player.gold}</div>
                  </div>
                </div>
              </div>
              
              {/* Map Display */}
              <div className="bg-white rounded-lg p-4 shadow-md mb-4 overflow-auto">
                <div className="grid grid-flow-row gap-0 border border-gray-300">
                  {map.map((row, y) => (
                    <div key={y} className="flex">
                      {row.map((cell, x) => (
                        <div
                          key={`${x}-${y}`}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors border border-gray-300 relative
                            ${player.x === x && player.y === y ? 'ring-2 ring-blue-500' : ''}
                            ${!cell.isVisible && !cell.wasVisible ? 'bg-gray-800' : ''}
                          `}
                          style={{ 
                            backgroundColor: getCellColor(cell),
                            color: '#fff',
                            textShadow: '1px 1px 0 #000',
                          }}
                        >
                          {cell.isVisible || cell.wasVisible ? (
                            <>
                              {/* Terrain icon */}
                              {getTerrainIcon(cell.terrain)}
                              
                              {/* Player position */}
                              {player.x === x && player.y === y && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  <Bot className="w-6 h-6 text-blue-500 drop-shadow-md" />
                                </div>
                              )}
                              
                              {/* Item indicators */}
                              {cell.isVisible && cell.items.length > 0 && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-xs w-3 h-3 rounded-full flex items-center justify-center">
                                  {cell.items.length}
                                </div>
                              )}
                            </>
                          ) : (
                            // Fog of war
                            '?'
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Movement Controls */}
              {!gameState.gameOver && !gameState.trading && (
                <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                  <div className="flex flex-col items-center">
                    <div className="grid grid-cols-3 gap-2 mb-4 w-40">
                      <button
                        onClick={() => handleMove("northwest")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ↖️
                      </button>
                      <button
                        onClick={() => handleMove("north")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => handleMove("northeast")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ↗️
                      </button>
                      <button
                        onClick={() => handleMove("west")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ⬅️
                      </button>
                      <button
                        onClick={() => handleMove("stay")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ⚪
                      </button>
                      <button
                        onClick={() => handleMove("east")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded font-bold"
                      >
                        ➡️
                      </button>
                      <button
                        onClick={() => handleMove("southwest")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ↙️
                      </button>
                      <button
                        onClick={() => handleMove("south")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => handleMove("southeast")}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        ↘️
                      </button>
                    </div>
                    
                    {suggestedMove && (
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium">Brain suggests: {suggestedMove.toUpperCase()}</div>
                        <button
                          onClick={() => handleMove(suggestedMove)}
                          className="mt-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Accept Suggestion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Trading UI */}
              {gameState.trading && gameState.currentOffer && (
                <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                  <h3 className="text-lg font-medium mb-3">Trading</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border rounded p-3 bg-gray-50">
                      <h4 className="font-medium mb-2">You Offer</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Apple className="w-4 h-4 text-green-500 mr-1" /> Food
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={player.currentFood}
                            value={gameState.currentOffer.offered.food}
                            onChange={(e) => updateTradeOffer("food", parseInt(e.target.value) || 0, true)}
                            className="w-16 border rounded p-1 text-right"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Droplet className="w-4 h-4 text-blue-500 mr-1" /> Water
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={player.currentWater}
                            value={gameState.currentOffer.offered.water}
                            onChange={(e) => updateTradeOffer("water", parseInt(e.target.value) || 0, true)}
                            className="w-16 border rounded p-1 text-right"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Coins className="w-4 h-4 text-yellow-500 mr-1" /> Gold
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={player.gold}
                            value={gameState.currentOffer.offered.gold}
                            onChange={(e) => updateTradeOffer("gold", parseInt(e.target.value) || 0, true)}
                            className="w-16 border rounded p-1 text-right"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded p-3 bg-gray-50">
                      <h4 className="font-medium mb-2">Trader Offers</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Apple className="w-4 h-4 text-green-500 mr-1" /> Food
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={gameState.currentOffer.requested.food}
                            onChange={(e) => updateTradeOffer("food", parseInt(e.target.value) || 0, false)}
                            className="w-16 border rounded p-1 text-right"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Droplet className="w-4 h-4 text-blue-500 mr-1" /> Water
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={gameState.currentOffer.requested.water}
                            onChange={(e) => updateTradeOffer("water", parseInt(e.target.value) || 0, false)}
                            className="w-16 border rounded p-1 text-right"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            <Coins className="w-4 h-4 text-yellow-500 mr-1" /> Gold
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={gameState.currentOffer.requested.gold}
                            onChange={(e) => updateTradeOffer("gold", parseInt(e.target.value) || 0, false)}
                            className="w-16 border rounded p-1 text-right"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setGameState(prev => ({ ...prev, trading: false, currentTrader: null, currentOffer: null }))}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel Trade
                    </button>
                    
                    <button
                      onClick={proposeOffer}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={
                        // Disable if offering nothing or requesting nothing
                        (gameState.currentOffer.offered.food === 0 && 
                         gameState.currentOffer.offered.water === 0 && 
                         gameState.currentOffer.offered.gold === 0) ||
                        (gameState.currentOffer.requested.food === 0 && 
                         gameState.currentOffer.requested.water === 0 && 
                         gameState.currentOffer.requested.gold === 0)
                      }
                    >
                      Propose Trade
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Side - Info and Logs */}
            <div className="lg:w-96">
              {/* Terrain Legend */}
              <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                <h3 className="font-medium mb-2">Terrain Legend</h3>
                <div className="space-y-2">
                  {Object.entries(TERRAIN_COSTS).map(([type, data]) => (
                    <div key={type} className="flex items-center">
                      <div 
                        className="w-5 h-5 rounded mr-2"
                        style={{ backgroundColor: data.color }}
                      />
                      <div className="flex-grow">
                        <div className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                        <div className="text-xs text-gray-500">
                          Move: {data.movementCost}, Water: {data.waterCost}, Food: {data.foodCost}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Player Stats */}
              <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                <h3 className="font-medium mb-2">Player Stats</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" /> Vision Range
                    </span>
                    <span>{VISION_RANGES[player.vision]} squares</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Brain className="w-4 h-4 mr-1" /> Brain Type
                    </span>
                    <span>{player.brain}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> Distance to East
                    </span>
                    <span>{gameState.mapWidth - player.x - 1} squares</span>
                  </div>
                </div>
              </div>
              
              {/* Brain Reasoning */}
              {brainReasoning && (
                <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-1" /> Brain Reasoning
                  </h3>
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded border">{brainReasoning}</pre>
                </div>
              )}
              
              {/* Game Logs */}
              <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                <h3 className="font-medium mb-2">Game Log</h3>
                <div className="h-60 overflow-y-auto bg-gray-50 p-2 rounded border">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`text-sm mb-1 ${
                        log.type === "move" 
                          ? "text-blue-600" 
                          : log.type === "item" 
                            ? "text-green-600" 
                            : log.type === "trade" 
                              ? "text-purple-600" 
                              : "text-gray-700"
                      }`}
                    >
                      <span className="text-xs text-gray-500">Day {log.turn + 1}: </span>
                      {log.text}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
              
              {/* Game Over UI */}
              {gameState.gameOver && (
                <div className={`rounded-lg p-4 shadow-md mb-4 ${gameState.gameWon ? "bg-green-100" : "bg-red-100"}`}>
                  <h3 className="font-bold text-lg mb-2">
                    {gameState.gameWon ? "Victory!" : "Game Over"}
                  </h3>
                  <p className="mb-4">{gameState.message}</p>
                  <button
                    onClick={() => setShowConfig(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WSSTwo;
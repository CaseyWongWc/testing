import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Skull,
  Heart,
  Crosshair,
  Package,
  Shield,
  Swords,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

// Types for game entities
interface Cell {
  x: number;
  y: number;
  type: "floor" | "wall" | "portal";
  terrain: "normal" | "water" | "lava" | "grass";
  isVisible: boolean;
  wasVisible: boolean;
  isWall?: boolean;
  g?: number;
  h?: number;
  f?: number;
  parent?: Cell | null;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  type: "slime" | "skeleton" | "ghost" | "mage" | "boss";
  health: number;
  maxHealth: number;
  damage: number;
  moveRange: number;
  attackRange: number;
  turnsToMove: number;
  controlledBy?: string; // clientId of the player controlling this enemy
}

interface Item {
  id: number;
  x: number;
  y: number;
  type: "health" | "ammo" | "shield" | "damage" | "range";
  value: number;
}

interface Robot {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  damage: number;
  defense: number;
  attackRange: number;
  clientId?: string; // The client who controls this robot
  color?: string; // Visual identifier for the robot
  name?: string; // Player name
}

interface GameState {
  level: number;
  turn: number;
  kills: number;
  itemsCollected: number;
  status: "waiting" | "playing" | "victory" | "defeat";
}

interface CombatLog {
  message: string;
  timestamp: number;
  type: "attack" | "damage" | "heal" | "item" | "portal" | "join" | "leave";
  clientId?: string;
}

interface AIState {
  mode: "explore" | "combat" | "heal" | "portal";
  target?: { x: number; y: number };
  path: Cell[];
  lastDecision: string;
  confidence: number;
}

// WebSocket message types
interface WebSocketMessage {
  type: string;
  clientId: string;
  data?: any;
  timestamp: string;
}

interface PlayerAction {
  type: "move" | "attack" | "use_item" | "chat";
  clientId: string;
  x?: number;
  y?: number;
  targetId?: number;
  itemId?: number;
  message?: string;
}

const WSSRogueHDraft: React.FC = () => {
  // Room state
  const [room, setRoom] = useState<Cell[][]>([]);
  
  // Player state
  const [robot, setRobot] = useState<Robot>({
    x: 1,
    y: 1,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    damage: 10,
    defense: 5,
    attackRange: 3,
  });
  
  // Other players (as robots)
  const [otherPlayers, setOtherPlayers] = useState<Robot[]>([]);
  
  // Game entities
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    turn: 0,
    kills: 0,
    itemsCollected: 0,
    status: "waiting",
  });
  
  // Animation and UI states
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [combatLog, setCombatLog] = useState<CombatLog[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<Enemy | null>(null);
  const [aiState, setAIState] = useState<AIState>({
    mode: "explore",
    path: [],
    lastDecision: "Initializing...",
    confidence: 1.0,
  });
  
  // WebSocket related states
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([]);
  
  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastActionRef = useRef<number>(0);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      if (connectionAttempts >= 3) {
        console.log('Switching to demo mode after multiple failed connection attempts');
        setDemoMode(true);
        setConnected(true);
        
        // Create a demo client ID
        const demoClientId = "demo-" + Math.random().toString(36).substring(2, 6);
        setClientId(demoClientId);
        
        // Update the robot with client info
        setRobot(prev => ({
          ...prev,
          clientId: demoClientId,
          color: getRandomColor(),
          name: "Player (You)"
        }));
        
        // Add a mock opponent in demo mode
        setOtherPlayers([{
          x: 5,
          y: 5,
          health: 100,
          maxHealth: 100,
          ammo: 30,
          maxAmmo: 30,
          damage: 15,
          defense: 8,
          attackRange: 4,
          clientId: "demo-opponent",
          color: getRandomColor(),
          name: "AI Opponent"
        }]);
        
        // Create a new room
        initializeRoom();
        return;
      }

      // Get the protocol (wss for https, ws for http)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Use the same host
      const host = window.location.host;
      
      // Create WebSocket URL with the ws path
      const wsUrl = `${protocol}//${host}/ws`;
      console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
      
      try {
        // Create new WebSocket connection
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Handle connection open
        socket.onopen = () => {
          console.log('WebSocket connection established');
          setConnected(true);
          setConnectionAttempts(0); // Reset connection attempts
          
          // Add a system message
          addLog('Connected to the game server', 'join');
        };
        
        // Handle incoming messages
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            console.log('Received message:', message);
            
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };
        
        // Handle connection close
        socket.onclose = () => {
          console.log('WebSocket connection closed');
          setConnected(false);
          
          // Add a system message
          addLog('Disconnected from the game server', 'leave');
          
          // Increment connection attempts
          setConnectionAttempts(prev => prev + 1);
          
          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };
        
        // Handle connection errors
        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionAttempts(prev => prev + 1);
        
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      }
    };
    
    // Initialize connection
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Clear any running game loop
      if (gameLoopRef.current !== null) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [connectionAttempts]);

  // Handler for WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connect':
        // This is our client ID from the server
        setClientId(message.clientId);
        
        // Update the robot with client info
        setRobot(prev => ({
          ...prev,
          clientId: message.clientId,
          color: getRandomColor(),
          name: "Player (You)"
        }));
        
        // If we're the first player, initialize the room
        if (!message.data?.roomExists) {
          initializeRoom();
        }
        break;
        
      case 'game_state':
        // Receive full game state from server
        if (message.data) {
          if (message.data.room) setRoom(message.data.room);
          if (message.data.enemies) setEnemies(message.data.enemies);
          if (message.data.items) setItems(message.data.items);
          if (message.data.gameState) setGameState(message.data.gameState);
        }
        break;
        
      case 'player_list':
        // Update online players list
        if (message.data?.players) {
          setOnlinePlayers(message.data.players);
          
          // Update other players' robots
          if (message.data.robots) {
            setOtherPlayers(message.data.robots.filter(
              (r: Robot) => r.clientId !== clientId
            ));
          }
        }
        break;
        
      case 'player_join':
        // Another player joined
        if (message.clientId !== clientId) {
          addLog(`Player ${message.clientId} joined the game`, 'join', message.clientId);
          setOnlinePlayers(prev => [...prev, message.clientId]);
          
          // Add their robot if provided
          if (message.data?.robot) {
            setOtherPlayers(prev => [...prev, message.data.robot]);
          }
        }
        break;
        
      case 'player_leave':
        // A player left
        if (message.clientId !== clientId) {
          addLog(`Player ${message.clientId} left the game`, 'leave', message.clientId);
          setOnlinePlayers(prev => prev.filter(id => id !== message.clientId));
          setOtherPlayers(prev => prev.filter(p => p.clientId !== message.clientId));
        }
        break;
        
      case 'player_action':
        // Process player action
        if (message.clientId !== clientId && message.data) {
          handlePlayerAction(message.data as PlayerAction);
        }
        break;
        
      case 'chat':
        // Receive chat message
        if (message.data?.message) {
          const playerName = message.clientId === clientId ? 
            "You" : `Player ${message.clientId.substring(0, 6)}`;
          addLog(`${playerName}: ${message.data.message}`, 'item', message.clientId);
        }
        break;
    }
  };

  // Process actions from other players
  const handlePlayerAction = (action: PlayerAction) => {
    switch (action.type) {
      case 'move':
        // Update other player position
        if (action.x !== undefined && action.y !== undefined) {
          setOtherPlayers(prev => 
            prev.map(p => 
              p.clientId === action.clientId 
                ? { ...p, x: action.x!, y: action.y! } 
                : p
            )
          );
        }
        break;
        
      case 'attack':
        // Handle attack from other player
        if (action.targetId !== undefined) {
          const target = enemies.find(e => e.id === action.targetId);
          if (target) {
            const attacker = otherPlayers.find(p => p.clientId === action.clientId);
            if (attacker) {
              addLog(`${attacker.name || "Player"} attacks ${target.type}!`, 'attack', action.clientId);
            }
          }
        }
        break;
        
      case 'use_item':
        // Handle item use from other player
        if (action.itemId !== undefined) {
          const item = items.find(i => i.id === action.itemId);
          if (item) {
            const player = otherPlayers.find(p => p.clientId === action.clientId);
            if (player) {
              addLog(`${player.name || "Player"} picked up ${item.type}`, 'item', action.clientId);
              
              // Remove the item from the game
              setItems(prev => prev.filter(i => i.id !== action.itemId));
            }
          }
        }
        break;
    }
  };

  // Send actions to other players
  const sendPlayerAction = (action: PlayerAction) => {
    if (!connected || !socketRef.current) {
      if (demoMode) {
        // In demo mode, simulate responses locally
        setTimeout(() => {
          handleDemoResponse(action);
        }, 500);
      }
      return;
    }
    
    socketRef.current.send(JSON.stringify({
      type: 'player_action',
      clientId: clientId,
      data: action,
      timestamp: new Date().toISOString()
    }));
  };

  // Handle demo mode responses
  const handleDemoResponse = (action: PlayerAction) => {
    // Simulate AI response in demo mode
    if (action.type === 'attack' && action.targetId !== undefined) {
      const target = enemies.find(e => e.id === action.targetId);
      if (target) {
        // Simulate damage to enemy
        setEnemies(prev => 
          prev.map(e => 
            e.id === action.targetId 
              ? { ...e, health: Math.max(0, e.health - Math.floor(robot.damage * (Math.random() * 0.5 + 0.75))) } 
              : e
          )
        );
        
        // If enemy health is now 0, remove it
        setTimeout(() => {
          setEnemies(prev => prev.filter(e => e.id !== action.targetId || e.health > 0));
          setGameState(prev => ({ ...prev, kills: prev.kills + 1 }));
          addLog(`You defeated ${target.type}!`, 'attack');
        }, 500);
      }
    }
    
    // Simulate AI opponent movement
    if (otherPlayers.length > 0 && Math.random() > 0.7) {
      const opponent = otherPlayers[0];
      const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      
      // Check if the new position is valid (not a wall)
      const newX = Math.max(0, Math.min(room[0]?.length - 1 || 0, opponent.x + dx));
      const newY = Math.max(0, Math.min(room.length - 1 || 0, opponent.y + dy));
      
      if (room[newY]?.[newX]?.type !== 'wall') {
        setOtherPlayers(prev => 
          prev.map(p => 
            p.clientId === opponent.clientId 
              ? { ...p, x: newX, y: newY } 
              : p
          )
        );
      }
    }
  };

  // Send chat message
  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    
    if (connected && socketRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        clientId: clientId,
        data: {
          message: chatMessage
        },
        timestamp: new Date().toISOString()
      }));
    } else if (demoMode) {
      // In demo mode, just add to local log
      addLog(`You: ${chatMessage}`, 'item');
      
      // Simulate response
      setTimeout(() => {
        const responses = [
          "I'm trying to find a good strategy here.",
          "Watch out for that skeleton!",
          "Let's try to reach the portal together.",
          "I found some loot over here!",
          "Need healing? I found a health item earlier."
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        addLog(`AI Opponent: ${response}`, 'item', 'demo-opponent');
      }, 1000);
    }
    
    // Clear chat input
    setChatMessage('');
  };

  // Generate a random color for player identification
  const getRandomColor = () => {
    const colors = [
      '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', 
      '#ffff00', '#ff8000', '#8000ff', '#0080ff', '#ff0080'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Add a message to the combat log
  const addLog = (message: string, type: CombatLog["type"], clientId?: string) => {
    setCombatLog((prev) => [
      ...prev.slice(-9),
      { message, timestamp: Date.now(), type, clientId },
    ]);
  };

  // Create a new room
  const initializeRoom = () => {
    // Create a simple room for the demo
    const newRoom: Cell[][] = [];
    const width = 20;
    const height = 15;
    
    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        // Create walls around the edges
        const isWall = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        
        // Add some random walls
        const randomWall = Math.random() < 0.1 && x > 2 && y > 2;
        
        row.push({
          x,
          y,
          type: isWall || randomWall ? "wall" : "floor",
          terrain: "normal",
          isVisible: true,
          wasVisible: false,
          isWall: isWall || randomWall
        });
      }
      newRoom.push(row);
    }
    
    // Add a portal
    const portalX = Math.floor(width * 0.8);
    const portalY = Math.floor(height * 0.8);
    newRoom[portalY][portalX].type = "portal";
    
    // Set the room
    setRoom(newRoom);
    
    // Generate some enemies
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < 5; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (width - 4)) + 2;
        y = Math.floor(Math.random() * (height - 4)) + 2;
      } while (newRoom[y][x].type !== "floor" || 
               (Math.abs(x - 1) < 3 && Math.abs(y - 1) < 3)); // Keep away from starting position
      
      const enemyTypes: Enemy["type"][] = ["slime", "skeleton", "ghost", "mage"];
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      
      newEnemies.push({
        id: i + 1,
        x,
        y,
        type,
        health: type === "mage" ? 40 : type === "ghost" ? 30 : type === "skeleton" ? 25 : 15,
        maxHealth: type === "mage" ? 40 : type === "ghost" ? 30 : type === "skeleton" ? 25 : 15,
        damage: type === "mage" ? 15 : type === "ghost" ? 10 : type === "skeleton" ? 8 : 5,
        moveRange: type === "ghost" ? 3 : 1,
        attackRange: type === "mage" ? 4 : type === "ghost" ? 2 : 1,
        turnsToMove: 2
      });
    }
    
    setEnemies(newEnemies);
    
    // Generate some items
    const newItems: Item[] = [];
    for (let i = 0; i < 6; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * (width - 4)) + 2;
        y = Math.floor(Math.random() * (height - 4)) + 2;
      } while (
        newRoom[y][x].type !== "floor" || 
        newEnemies.some(e => e.x === x && e.y === y) ||
        (Math.abs(x - 1) < 2 && Math.abs(y - 1) < 2)
      );
      
      const itemTypes: Item["type"][] = ["health", "ammo", "shield", "damage", "range"];
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      
      newItems.push({
        id: i + 1,
        x,
        y,
        type,
        value: type === "health" ? 20 : type === "ammo" ? 10 : 5
      });
    }
    
    setItems(newItems);
    
    // Set game state to playing
    setGameState(prev => ({ ...prev, status: "playing" }));
    
    // Broadcast the new game state if we're connected
    if (connected && socketRef.current && clientId) {
      socketRef.current.send(JSON.stringify({
        type: 'game_state',
        clientId: clientId,
        data: {
          room: newRoom,
          enemies: newEnemies,
          items: newItems,
          gameState: { ...gameState, status: "playing" }
        },
        timestamp: new Date().toISOString()
      }));
    }
    
    // Add a log message
    addLog("New game level generated!", "portal");
  };

  // Handle player movement
  const movePlayer = (dx: number, dy: number) => {
    // Prevent movement if we're in combat or game is not playing
    if (isAnimating || gameState.status !== "playing") return;
    
    // Calculate new position
    const newX = robot.x + dx;
    const newY = robot.y + dy;
    
    // Check if the new position is valid
    if (newX < 0 || newY < 0 || newX >= room[0]?.length || newY >= room.length) return;
    if (room[newY][newX].type === "wall") return;
    
    // Check if the new position has an enemy
    const enemyAtPosition = enemies.find(e => e.x === newX && e.y === newY);
    if (enemyAtPosition) {
      // Attack the enemy
      attackEnemy(enemyAtPosition);
      return;
    }
    
    // Check if the new position has another player
    const playerAtPosition = otherPlayers.find(p => p.x === newX && p.y === newY);
    if (playerAtPosition) {
      // Cannot move to another player's position
      return;
    }
    
    // Check if the new position has an item
    const itemAtPosition = items.find(i => i.x === newX && i.y === newY);
    if (itemAtPosition) {
      // Collect the item
      collectItem(itemAtPosition);
    }
    
    // Check if the new position is a portal
    if (room[newY][newX].type === "portal") {
      // Go to next level
      addLog("You found the portal to the next level!", "portal");
      setGameState(prev => ({ 
        ...prev, 
        level: prev.level + 1,
        turn: 0
      }));
      
      // Generate a new room
      initializeRoom();
      return;
    }
    
    // Update player position
    setRobot(prev => ({ ...prev, x: newX, y: newY }));
    
    // Send movement to other players
    sendPlayerAction({
      type: "move",
      clientId: clientId || "",
      x: newX,
      y: newY
    });
    
    // Increment turn counter
    setGameState(prev => ({ ...prev, turn: prev.turn + 1 }));
    
    // Process enemy turns
    processEnemyTurns();
  };

  // Process enemy turns
  const processEnemyTurns = () => {
    setEnemies(prev => 
      prev.map(enemy => {
        // Only move enemies that aren't controlled by other players
        if (enemy.controlledBy) return enemy;
        
        // Only move on certain turns
        if (gameState.turn % enemy.turnsToMove !== 0) return enemy;
        
        // Calculate distance to player
        const dist = Math.sqrt(
          Math.pow(enemy.x - robot.x, 2) + Math.pow(enemy.y - robot.y, 2)
        );
        
        // If in attack range, attack
        if (dist <= enemy.attackRange) {
          // Attack player
          const damage = Math.max(1, enemy.damage - robot.defense / 2);
          setRobot(prev => ({ 
            ...prev, 
            health: Math.max(0, prev.health - damage) 
          }));
          
          addLog(
            `${enemy.type} attacks you for ${damage} damage!`, 
            "damage"
          );
          
          // Check if player is defeated
          if (robot.health - damage <= 0) {
            setGameState(prev => ({ ...prev, status: "defeat" }));
            addLog("You have been defeated!", "damage");
          }
          
          return enemy;
        }
        
        // If player is within move range, move toward player
        if (dist <= enemy.moveRange * 5) {
          // Simple movement AI - move toward player
          const dx = Math.sign(robot.x - enemy.x);
          const dy = Math.sign(robot.y - enemy.y);
          
          // Choose horizontal or vertical movement randomly
          const moveHorizontal = Math.random() > 0.5;
          
          let newX = enemy.x;
          let newY = enemy.y;
          
          if (moveHorizontal && dx !== 0) {
            newX = enemy.x + dx;
          } else if (dy !== 0) {
            newY = enemy.y + dy;
          }
          
          // Check if the new position is valid
          if (
            newX >= 0 && newY >= 0 && 
            newX < room[0]?.length && newY < room.length &&
            room[newY][newX].type !== "wall" &&
            !enemies.some(e => e.id !== enemy.id && e.x === newX && e.y === newY) &&
            !(robot.x === newX && robot.y === newY) &&
            !otherPlayers.some(p => p.x === newX && p.y === newY)
          ) {
            return { ...enemy, x: newX, y: newY };
          }
        }
        
        return enemy;
      })
    );
  };

  // Attack an enemy
  const attackEnemy = (enemy: Enemy) => {
    if (isAnimating || gameState.status !== "playing") return;
    
    // Calculate distance to enemy
    const dist = Math.sqrt(
      Math.pow(enemy.x - robot.x, 2) + Math.pow(enemy.y - robot.y, 2)
    );
    
    // Check if enemy is in range
    if (dist > robot.attackRange) {
      addLog(`${enemy.type} is out of range!`, "attack");
      return;
    }
    
    // Check if we have ammo
    if (robot.ammo <= 0) {
      addLog("You're out of ammo!", "attack");
      return;
    }
    
    // Set the selected target
    setSelectedTarget(enemy);
    
    // Start animation
    setIsAnimating(true);
    
    // Calculate damage
    const damage = Math.floor(robot.damage * (Math.random() * 0.5 + 0.75));
    
    // Update enemy health
    setEnemies(prev => 
      prev.map(e => 
        e.id === enemy.id 
          ? { ...e, health: Math.max(0, e.health - damage) } 
          : e
      )
    );
    
    // Reduce ammo
    setRobot(prev => ({ ...prev, ammo: prev.ammo - 1 }));
    
    // Add log message
    addLog(`You attack ${enemy.type} for ${damage} damage!`, "attack");
    
    // Send attack to other players
    sendPlayerAction({
      type: "attack",
      clientId: clientId || "",
      targetId: enemy.id
    });
    
    // Check if enemy is defeated
    if (enemy.health - damage <= 0) {
      setTimeout(() => {
        setEnemies(prev => prev.filter(e => e.id !== enemy.id));
        setGameState(prev => ({ ...prev, kills: prev.kills + 1 }));
        addLog(`You defeated ${enemy.type}!`, "attack");
        
        // Check if all enemies are defeated
        if (enemies.length <= 1) {
          addLog("You've defeated all enemies! Find the portal to continue.", "portal");
        }
        
        setIsAnimating(false);
      }, 500);
    } else {
      setTimeout(() => {
        setIsAnimating(false);
        setSelectedTarget(null);
      }, 500);
    }
  };

  // Collect an item
  const collectItem = (item: Item) => {
    // Update player stats based on item type
    switch (item.type) {
      case "health":
        setRobot(prev => ({ 
          ...prev, 
          health: Math.min(prev.maxHealth, prev.health + item.value) 
        }));
        addLog(`You found a health pack! +${item.value} HP`, "heal");
        break;
        
      case "ammo":
        setRobot(prev => ({ 
          ...prev, 
          ammo: Math.min(prev.maxAmmo, prev.ammo + item.value) 
        }));
        addLog(`You found ammo! +${item.value} ammo`, "item");
        break;
        
      case "shield":
        setRobot(prev => ({ ...prev, defense: prev.defense + item.value }));
        addLog(`You found a shield upgrade! +${item.value} defense`, "item");
        break;
        
      case "damage":
        setRobot(prev => ({ ...prev, damage: prev.damage + item.value }));
        addLog(`You found a damage upgrade! +${item.value} damage`, "item");
        break;
        
      case "range":
        setRobot(prev => ({ ...prev, attackRange: prev.attackRange + 1 }));
        addLog("You found a range extender! +1 attack range", "item");
        break;
    }
    
    // Remove the item from the game
    setItems(prev => prev.filter(i => i.id !== item.id));
    
    // Update game state
    setGameState(prev => ({ ...prev, itemsCollected: prev.itemsCollected + 1 }));
    
    // Send item collection to other players
    sendPlayerAction({
      type: "use_item",
      clientId: clientId || "",
      itemId: item.id
    });
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process key events if the game is active and not in a chat input
      if (document.activeElement?.tagName === "INPUT") return;
      
      switch (e.key) {
        case "ArrowUp":
        case "w":
          movePlayer(0, -1);
          break;
        case "ArrowDown":
        case "s":
          movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
          movePlayer(-1, 0);
          break;
        case "ArrowRight":
        case "d":
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [room, robot, enemies, items, gameState, isAnimating]);

  // Render the game cell
  const renderCell = (cell: Cell, x: number, y: number) => {
    // Determine cell appearance based on type and terrain
    let bgColor = "bg-gray-200";
    let content = null;
    
    if (cell.type === "wall") {
      bgColor = "bg-gray-800";
    } else if (cell.type === "portal") {
      bgColor = "bg-purple-500";
      content = "⊛";
    } else {
      // Floor cells with different terrain types
      switch (cell.terrain) {
        case "water":
          bgColor = "bg-blue-200";
          break;
        case "lava":
          bgColor = "bg-red-200";
          break;
        case "grass":
          bgColor = "bg-green-200";
          break;
        default:
          bgColor = "bg-gray-200";
      }
    }
    
    // Check for entities on this cell
    const itemAtCell = items.find(item => item.x === x && item.y === y);
    const enemyAtCell = enemies.find(enemy => enemy.x === x && enemy.y === y);
    const playerAtCell = otherPlayers.find(player => player.x === x && player.y === y);
    const isPlayer = robot.x === x && robot.y === y;
    
    // Player takes precedence over other entities
    if (isPlayer) {
      content = (
        <div className="flex items-center justify-center w-full h-full">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
      );
    } else if (playerAtCell) {
      // Other player
      content = (
        <div 
          className="flex items-center justify-center w-full h-full"
          style={{ color: playerAtCell.color || "#888888" }}
        >
          <Bot className="w-5 h-5" />
        </div>
      );
    } else if (enemyAtCell) {
      // Enemy with health indicator
      content = (
        <div className="flex flex-col items-center justify-center w-full h-full">
          {getEnemyIcon(enemyAtCell.type)}
          <div className="w-full h-1 bg-gray-300 mt-1">
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${(enemyAtCell.health / enemyAtCell.maxHealth) * 100}%` }}
            />
          </div>
        </div>
      );
    } else if (itemAtCell) {
      // Item
      content = getItemIcon(itemAtCell.type);
    }
    
    // Selected target highlight
    const isSelected = selectedTarget?.x === x && selectedTarget?.y === y;
    
    return (
      <div
        key={`${x}-${y}`}
        className={`border border-gray-300 ${bgColor} ${
          isSelected ? "ring-2 ring-yellow-400" : ""
        } flex items-center justify-center w-6 h-6 text-xs`}
      >
        {content}
      </div>
    );
  };

  // Get icon for enemy type
  const getEnemyIcon = (type: Enemy["type"]) => {
    switch (type) {
      case "slime":
        return <div className="text-green-600">Ѯ</div>;
      case "skeleton":
        return <Skull className="w-4 h-4 text-gray-700" />;
      case "ghost":
        return <div className="text-purple-500">Ꝋ</div>;
      case "mage":
        return <div className="text-blue-600">Ψ</div>;
      case "boss":
        return <Swords className="w-4 h-4 text-red-600" />;
      default:
        return <div>?</div>;
    }
  };

  // Get icon for item type
  const getItemIcon = (type: Item["type"]) => {
    switch (type) {
      case "health":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "ammo":
        return <div className="text-yellow-500">•</div>;
      case "shield":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "damage":
        return <Swords className="w-4 h-4 text-orange-500" />;
      case "range":
        return <Crosshair className="w-4 h-4 text-purple-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle chat form submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage();
  };

  // Render the game interface
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Game board and controls */}
        <div className="flex-1">
          {/* Connection status */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">WebSocket Roguelike</h2>
            <div className="text-sm">
              {demoMode ? (
                <span className="flex items-center text-yellow-700">
                  <WifiOff className="w-4 h-4 mr-1" />
                  Demo Mode (Offline)
                </span>
              ) : connected ? (
                <span className="flex items-center text-green-700">
                  <Wifi className="w-4 h-4 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center text-red-700">
                  <WifiOff className="w-4 h-4 mr-1" />
                  Disconnected - Trying to reconnect...
                </span>
              )}
            </div>
          </div>
          
          {/* Game board */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-lg font-semibold">Level {gameState.level}</div>
              <div className="text-sm text-gray-600">Turn {gameState.turn}</div>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="grid grid-flow-row gap-0 p-2 bg-gray-100 rounded">
                {room.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((cell, x) => renderCell(cell, x, y))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Game status messages */}
            {gameState.status === "victory" && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-center">
                <p className="font-bold text-lg">Victory!</p>
                <p>You've completed all the challenges!</p>
              </div>
            )}
            
            {gameState.status === "defeat" && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-center">
                <p className="font-bold text-lg">Defeat!</p>
                <p>Your robot has been destroyed!</p>
                <button
                  onClick={initializeRoom}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {/* Controls */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div />
              <button
                onClick={() => movePlayer(0, -1)}
                disabled={isAnimating || gameState.status !== "playing"}
                className="p-2 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                ↑
              </button>
              <div />
              <button
                onClick={() => movePlayer(-1, 0)}
                disabled={isAnimating || gameState.status !== "playing"}
                className="p-2 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                ←
              </button>
              <div />
              <button
                onClick={() => movePlayer(1, 0)}
                disabled={isAnimating || gameState.status !== "playing"}
                className="p-2 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                →
              </button>
              <div />
              <button
                onClick={() => movePlayer(0, 1)}
                disabled={isAnimating || gameState.status !== "playing"}
                className="p-2 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                ↓
              </button>
              <div />
            </div>
            
            <div className="mt-4 text-sm text-gray-600 text-center">
              Use arrow keys or WASD to move
            </div>
          </div>
          
          {/* Chat interface */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" /> 
              Players Chat
            </h3>
            
            <div className="h-32 overflow-y-auto p-2 bg-gray-50 rounded mb-2">
              {combatLog.map((log, i) => (
                <div
                  key={i}
                  className={`text-sm mb-1 ${
                    log.type === "attack"
                      ? "text-blue-600"
                      : log.type === "damage"
                        ? "text-red-600"
                        : log.type === "heal"
                          ? "text-green-600"
                          : log.type === "portal"
                            ? "text-purple-600"
                            : log.type === "join" || log.type === "leave"
                              ? "text-gray-500 italic"
                              : "text-gray-700"
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
            
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded"
                disabled={!connected && !demoMode}
              />
              <button
                type="submit"
                disabled={(!connected && !demoMode) || !chatMessage.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Send
              </button>
            </form>
          </div>
        </div>
        
        {/* Right sidebar - Game stats and player info */}
        <div className="w-full lg:w-64 space-y-4">
          {/* Player status */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 text-red-500 mr-1" /> Health
                  </span>
                  <span>{robot.health}/{robot.maxHealth}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(robot.health / robot.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center">
                    <div className="w-4 h-4 text-yellow-500 mr-1 flex items-center justify-center">•</div> Ammo
                  </span>
                  <span>{robot.ammo}/{robot.maxAmmo}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(robot.ammo / robot.maxAmmo) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <span>Level</span>
                <span>{gameState.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Kills</span>
                <span>{gameState.kills}</span>
              </div>
              <div className="flex justify-between">
                <span>Items</span>
                <span>{gameState.itemsCollected}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Damage</span>
                  <span>{robot.damage}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(robot.damage / 30) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Defense</span>
                  <span>{robot.defense}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(robot.defense / 20) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Range</span>
                  <span>{robot.attackRange}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(robot.attackRange / 8) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Online players */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" /> Players ({otherPlayers.length + 1})
            </h2>
            <div className="space-y-2">
              {/* Current player */}
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: robot.color || "#4444FF" }}
                />
                <span>{robot.name || "You"} (You)</span>
              </div>
              
              {/* Other players */}
              {otherPlayers.map((player, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: player.color || "#888888" }}
                  />
                  <span>{player.name || `Player ${player.clientId?.substring(0, 6) || index}`}</span>
                </div>
              ))}
              
              {otherPlayers.length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  No other players online
                </div>
              )}
            </div>
          </div>
          
          {/* Combat log */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-2">Combat Log</h2>
            <div className="space-y-1">
              {combatLog.map((log, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    log.type === "attack"
                      ? "text-blue-600"
                      : log.type === "damage"
                        ? "text-red-600"
                        : log.type === "heal"
                          ? "text-green-600"
                          : log.type === "portal"
                            ? "text-purple-600"
                            : "text-gray-600"
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          {showLegend && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Legend</h2>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <Bot className="w-4 h-4 text-blue-600 mr-2" />
                  <span>Player</span>
                </div>
                <div className="flex items-center">
                  <Skull className="w-4 h-4 text-gray-700 mr-2" />
                  <span>Skeleton</span>
                </div>
                <div className="flex items-center">
                  <div className="text-green-600 mr-2">Ѯ</div>
                  <span>Slime</span>
                </div>
                <div className="flex items-center">
                  <div className="text-purple-500 mr-2">Ꝋ</div>
                  <span>Ghost</span>
                </div>
                <div className="flex items-center">
                  <div className="text-blue-600 mr-2">Ψ</div>
                  <span>Mage</span>
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 text-red-500 mr-2" />
                  <span>Health</span>
                </div>
                <div className="flex items-center">
                  <div className="text-yellow-500 mr-2">•</div>
                  <span>Ammo</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-blue-500 mr-2" />
                  <span>Shield</span>
                </div>
                <div className="flex items-center">
                  <Swords className="w-4 h-4 text-orange-500 mr-2" />
                  <span>Damage</span>
                </div>
                <div className="flex items-center">
                  <Crosshair className="w-4 h-4 text-purple-500 mr-2" />
                  <span>Range</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-500 w-4 h-4 rounded mr-2 flex items-center justify-center text-white text-xs">⊛</div>
                  <span>Portal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WSSRogueHDraft;
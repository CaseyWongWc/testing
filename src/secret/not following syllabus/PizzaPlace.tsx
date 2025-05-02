import React, { useState, useEffect, useCallback } from 'react';
import { ChefHat, DollarSign, Trash2, Timer, User, Coffee, Pizza, Star } from 'lucide-react';

// Keep existing interfaces from before

// Add new states and types
interface Order {
  id: string;
  recipe: Recipe;
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  customer: string;
  satisfaction: number;
  timePlaced: number;
}

interface DialogueLine {
  text: string;
  speaker: string;
  duration: number;
}

interface GridCell {
  type: 'empty' | 'wall' | 'oven' | 'counter' | 'table' | 'chair' | 'storage' | 'plant' | 'decoration' | 'tv';
  occupied?: boolean;
  content?: string;
  cleanLevel?: number;
  dialogue?: DialogueLine;
  decorationType?: string;
}

const RECIPES: Recipe[] = [
  {
    name: 'Margherita',
    ingredients: ['dough', 'tomato', 'cheese'],
    cookTime: 10,
    price: 12
  },
  {
    name: 'Pepperoni',
    ingredients: ['dough', 'tomato', 'cheese', 'pepperoni'],
    cookTime: 12,
    price: 14
  }
];

const GRID_SIZE = { width: 20, height: 15 };

const DIALOGUE_LINES = [
  { text: "Welcome to Pizza Palace!", speaker: "cashier", duration: 3000 },
  { text: "One delicious pizza coming right up!", speaker: "chef", duration: 3000 },
  { text: "Need to clean this spot...", speaker: "janitor", duration: 2000 },
  { text: "I'm so hungry!", speaker: "customer", duration: 2000 }
];

const DECORATIONS = [
  { type: 'plant', icon: '🌿' },
  { type: 'tv', icon: '📺' },
  { type: 'decoration', icon: '🎨' }
];

const PizzaPlace: React.FC = () => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [npcs, setNPCs] = useState<NPC[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({
    dough: 50,
    tomato: 50,
    cheese: 50,
    pepperoni: 30
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [cleaningQueue, setCleaningQueue] = useState<Position[]>([]);
  const [earnings, setEarnings] = useState(0);

  // Pathfinding helper function
  const findPath = (start: Position, end: Position): Position[] => {
    const queue: Position[] = [start];
    const visited = new Set<string>();
    const parent = new Map<string, Position>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      if (current.x === end.x && current.y === end.y) {
        const path: Position[] = [];
        let pos: Position | undefined = current;
        while (pos) {
          path.unshift(pos);
          pos = parent.get(`${pos.x},${pos.y}`);
        }
        return path;
      }

      if (!visited.has(key)) {
        visited.add(key);
        const neighbors = [
          { x: current.x + 1, y: current.y },
          { x: current.x - 1, y: current.y },
          { x: current.x, y: current.y + 1 },
          { x: current.x, y: current.y - 1 }
        ].filter(pos => 
          pos.x >= 0 && pos.x < GRID_SIZE.width && 
          pos.y >= 0 && pos.y < GRID_SIZE.height &&
          grid[pos.y][pos.x].type !== 'wall'
        );

        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.x},${neighbor.y}`;
          if (!visited.has(neighborKey)) {
            queue.push(neighbor);
            parent.set(neighborKey, current);
          }
        }
      }
    }
    return [];
  };

  // NPC behavior function
  const updateNPCs = useCallback(() => {
    setNPCs(prevNPCs => {
      return prevNPCs.map(npc => {
        switch (npc.type) {
          case 'chef': {
            // Chef logic
            const pendingOrders = orders.filter(o => o.status === 'pending');
            if (pendingOrders.length > 0 && !npc.target) {
              const order = pendingOrders[0];
              const ovenPos = { x: 4, y: 4 }; // Example oven position
              const path = findPath(npc.position, ovenPos);
              return {
                ...npc,
                target: ovenPos,
                state: 'cooking',
                path: path
              };
            }
            break;
          }
          case 'cashier': {
            // Cashier logic - stay at counter and process orders
            if (Math.random() < 0.1 && orders.length < 5) {
              const newOrder: Order = {
                id: `order_${Date.now()}`,
                recipe: RECIPES[Math.floor(Math.random() * RECIPES.length)],
                status: 'pending',
                customer: `customer_${Date.now()}`,
                satisfaction: 100,
                timePlace: Date.now()
              };
              setOrders(prev => [...prev, newOrder]);
            }
            break;
          }
          case 'janitor': {
            // Janitor logic
            if (cleaningQueue.length > 0 && !npc.target) {
              const nextSpot = cleaningQueue[0];
              const path = findPath(npc.position, nextSpot);
              return {
                ...npc,
                target: nextSpot,
                state: 'cleaning',
                path: path
              };
            }
            break;
          }
          case 'customer': {
            // Customer logic
            if (!npc.target) {
              const availableSeats = grid.flatMap((row, y) => 
                row.map((cell, x) => ({ x, y, cell }))
              ).filter(pos => pos.cell.type === 'chair' && !pos.cell.occupied);

              if (availableSeats.length > 0) {
                const seat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
                const path = findPath(npc.position, seat);
                return {
                  ...npc,
                  target: seat,
                  state: 'finding_seat',
                  path: path
                };
              }
            }
            break;
          }
        }
        return npc;
      });
    });
  }, [grid, orders, cleaningQueue]);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Update NPCs
      updateNPCs();

      // Update orders
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'pending' && Math.random() < 0.1) {
            return { ...order, status: 'cooking' };
          }
          if (order.status === 'cooking' && Math.random() < 0.1) {
            return { ...order, status: 'ready' };
          }
          return order;
        })
      );

      // Add cleaning tasks
      if (Math.random() < 0.05) {
        const newCleaningSpot = {
          x: Math.floor(Math.random() * GRID_SIZE.width),
          y: Math.floor(Math.random() * GRID_SIZE.height)
        };
        setCleaningQueue(prev => [...prev, newCleaningSpot]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, updateNPCs]);

  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = Array(GRID_SIZE.height)
      .fill(null)
      .map((_, y) =>
        Array(GRID_SIZE.width)
          .fill(null)
          .map((_, x) => ({
            type: 'empty',
            cleanLevel: 100,
            x,
            y
          }))
      );

    // Add decorations
    for (let y = 1; y < GRID_SIZE.height - 1; y += 4) {
      for (let x = 1; x < GRID_SIZE.width - 1; x += 4) {
        if (Math.random() < 0.3 && newGrid[y][x].type === 'empty') {
          const decoration = DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)];
          newGrid[y][x].type = decoration.type as any;
          newGrid[y][x].decorationType = decoration.icon;
        }
      }
    }
    setGrid(newGrid);
  }, []);

  const renderCell = (cell: GridCell, npc?: NPC) => {
    switch (cell.type) {
      case 'wall':
        return <div className="w-full h-full bg-gray-800" />;
      case 'oven':
        return <Timer className="w-6 h-6 text-red-500" />;
      case 'counter':
        return <Coffee className="w-6 h-6 text-brown-500" />;
      case 'table':
        return <div className="w-full h-full bg-yellow-200 rounded" />;
      case 'chair':
        return <div className="w-full h-full bg-yellow-100 rounded-full" />;
      case 'storage':
        return <Pizza className="w-6 h-6 text-orange-500" />;
      case 'plant':
        return <div className="text-lg">🌿</div>;
      case 'tv':
        return <div className="text-lg">📺</div>;
      case 'decoration':
        return <div className="text-lg">🎨</div>;
      default:
        return null;
    }
  };

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">Pizza Place Simulation</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2 rounded hover:opacity-90 transition-opacity ${
                isRunning ? 'bg-red-500' : 'bg-green-500'
              } text-white cursor-pointer`}
            >
              {isRunning ? 'Stop' : 'Start'} Simulation
            </button>
            
            <button
              onClick={() => {
                setNPCs(initializeNPCs());
                setGrid(initializeGrid());
                setEarnings(0);
                setOrders([]);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reset
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded shadow">
              <span className="text-sm text-gray-600">Speed:</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={1}
                onChange={(e) => {
                  // Add speed control logic here
                }}
                className="w-24 cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className="text-xl font-bold bg-green-100 px-4 py-2 rounded">
          Earnings: ${earnings}
        </div>
      </div>

      <div className="grid gap-0.5 bg-gray-100 p-2 rounded-lg">
        {grid.map((row, y) => (
          <div key={y} className="flex gap-0.5">
            {row.map((cell, x) => {
              const npc = npcs.find(n => n.position.x === x && n.position.y === y);
              return (
                <div
                  key={`${x}-${y}`}
                  className="relative"
                >
                  <div className={`w-8 h-8 flex items-center justify-center ${
                    cell.cleanLevel && cell.cleanLevel < 50 ? 'bg-yellow-100' : 'bg-white'
                  }`}>
                    {renderCell(cell, npc)}
                  </div>
                  {npc?.dialogue && (
                    <div className="absolute -top-8 left-0 bg-white border border-gray-200 rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                      {npc.dialogue.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Inventory</h3>
          <ul>
            {Object.entries(inventory).map(([item, quantity]) => (
              <li key={item} className="flex justify-between">
                <span className="capitalize">{item}</span>
                <span>{quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Active Orders</h3>
          <ul>
            {orders.map(order => (
              <li key={order.id} className="flex justify-between items-center mb-2">
                <span>{order.recipe.name}</span>
                <span className="flex items-center">
                  <Star className={`w-4 h-4 ${
                    order.satisfaction > 70 ? 'text-yellow-500' : 'text-gray-400'
                  }`} />
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Active NPCs</h3>
          <ul>
            {npcs.map(npc => (
              <li key={npc.id} className="flex justify-between">
                <span className="capitalize">{npc.type}</span>
                <span>{npc.state}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PizzaPlace;
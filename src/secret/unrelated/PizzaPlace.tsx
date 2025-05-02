import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChefHat, DollarSign, Utensils, Trash2, User, ShoppingBag, Pizza, Clock, Pause, Play, Clipboard, Plus, Minus } from 'lucide-react';

// Types
type TerrainType = 'kitchen' | 'counter' | 'dining' | 'walkway' | 'entrance' | 'trash';
type NPCType = 'customer' | 'chef' | 'waiter';
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'eaten';
type PizzaTopping = 'cheese' | 'pepperoni' | 'mushrooms' | 'olives' | 'bacon' | 'pineapple';

// Interfaces
interface GridCell {
  type: TerrainType;
  occupied: boolean;
  npcId?: number;
}

interface NPC {
  id: number;
  type: NPCType;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  state: string;
  path: {x: number, y: number}[];
  orderId?: number;
  color: string;
}

interface PizzaOrder {
  id: number;
  customerId: number;
  status: OrderStatus;
  toppings: PizzaTopping[];
  preparationProgress: number;
  tableNumber?: number;
  placedAt: number;
  completedAt?: number;
}

interface SimulationStats {
  customersServed: number;
  revenue: number;
  pizzasMade: number;
  satisfaction: number;
}

const PizzaPlace: React.FC = () => {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [orders, setOrders] = useState<PizzaOrder[]>([]);
  const [nextId, setNextId] = useState(1);
  const [simulating, setSimulating] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    customersServed: 0,
    revenue: 0,
    pizzasMade: 0,
    satisfaction: 100,
  });
  const [simSpeed, setSimSpeed] = useState(1);
  const [selectedCell, setSelectedCell] = useState<{x: number, y: number} | null>(null);

  // Initialize a pre-defined layout
  useEffect(() => {
    const initialGrid: GridCell[][] = [
      // K = Kitchen, C = Counter, D = Dining, W = Walkway, E = Entrance, T = Trash
      ['E', 'W', 'W', 'C', 'C', 'C', 'W', 'W', 'W', 'T'].map(type => ({
        type: convertLetterToTerrain(type),
        occupied: false
      })),
      ['W', 'K', 'K', 'K', 'K', 'K', 'K', 'W', 'W', 'W'].map(type => ({
        type: convertLetterToTerrain(type),
        occupied: false
      })),
      ['W', 'K', 'K', 'K', 'K', 'K', 'K', 'W', 'D', 'D'].map(type => ({
        type: convertLetterToTerrain(type),
        occupied: false
      })),
      ['W', 'K', 'K', 'K', 'K', 'K', 'K', 'W', 'D', 'D'].map(type => ({
        type: convertLetterToTerrain(type),
        occupied: false
      })),
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'D', 'D'].map(type => ({
        type: convertLetterToTerrain(type),
        occupied: false
      })),
      ['D', 'D', 'W', 'D', 'D', 'W', 'D', 'D', 'D', 'D'].map(type => ({
        type: convertLetterToTerrain(type),
        occupied: false
      }))
    ];

    setGrid(initialGrid);
    initializeNPCs(initialGrid);
  }, []);

  // Initialize some NPCs
  const initializeNPCs = (initialGrid: GridCell[][]) => {
    const initialNpcs: NPC[] = [];
    
    // Add a chef in the kitchen
    initialNpcs.push({
      id: 1,
      type: 'chef',
      x: 3,
      y: 2,
      state: 'idle',
      path: [],
      color: 'text-yellow-600',
    });
    
    // Add a waiter near the counter
    initialNpcs.push({
      id: 2,
      type: 'waiter',
      x: 5,
      y: 0,
      state: 'idle',
      path: [],
      color: 'text-blue-600',
    });

    setNpcs(initialNpcs);
    setNextId(3);
  };

  const convertLetterToTerrain = (letter: string): TerrainType => {
    switch(letter) {
      case 'K': return 'kitchen';
      case 'C': return 'counter';
      case 'D': return 'dining';
      case 'W': return 'walkway';
      case 'E': return 'entrance';
      case 'T': return 'trash';
      default: return 'walkway';
    }
  };

  const getTerrainStyle = (type: TerrainType): string => {
    switch(type) {
      case 'kitchen':
        return 'bg-yellow-100 hover:bg-yellow-200';
      case 'counter':
        return 'bg-blue-100 hover:bg-blue-200';
      case 'dining':
        return 'bg-green-100 hover:bg-green-200';
      case 'walkway':
        return 'bg-gray-100 hover:bg-gray-200';
      case 'entrance':
        return 'bg-purple-100 hover:bg-purple-200';
      case 'trash':
        return 'bg-red-100 hover:bg-red-200';
      default:
        return 'bg-gray-100';
    }
  };

  const getTerrainIcon = (type: TerrainType) => {
    switch(type) {
      case 'kitchen':
        return <ChefHat className="w-6 h-6 text-yellow-600" />;
      case 'counter':
        return <DollarSign className="w-6 h-6 text-blue-600" />;
      case 'dining':
        return <Utensils className="w-6 h-6 text-green-600" />;
      case 'entrance':
        return <MapPin className="w-6 h-6 text-purple-600" />;
      case 'trash':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      default:
        return null;
    }
  };

  const getNPCIcon = (npc: NPC) => {
    switch(npc.type) {
      case 'customer':
        return <User className={`w-6 h-6 ${npc.color}`} />;
      case 'chef':
        return <ChefHat className={`w-6 h-6 ${npc.color}`} />;
      case 'waiter':
        return <ShoppingBag className={`w-6 h-6 ${npc.color}`} />;
    }
  };

  // Add a random customer
  const addCustomer = () => {
    // Start at entrance (0, 0)
    const newNpc: NPC = {
      id: nextId,
      type: 'customer',
      x: 0,
      y: 0,
      state: 'entering',
      path: [],
      color: `text-${['red', 'blue', 'green', 'purple', 'pink'][Math.floor(Math.random() * 5)]}-500`,
    };
    
    setNpcs(prev => [...prev, newNpc]);
    setNextId(prev => prev + 1);
    
    // Find an open dining spot
    const diningSpots = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[y][x].type === 'dining' && !grid[y][x].occupied) {
          diningSpots.push({x, y});
        }
      }
    }
    
    if (diningSpots.length > 0) {
      const targetSpot = diningSpots[Math.floor(Math.random() * diningSpots.length)];
      
      // Update the NPC to target this spot
      setNpcs(prev => prev.map(npc => 
        npc.id === newNpc.id ? {...npc, targetX: targetSpot.x, targetY: targetSpot.y, state: 'finding-seat'} : npc
      ));
      
      // Mark cell as soon-to-be occupied
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[targetSpot.y][targetSpot.x].occupied = true;
        return newGrid;
      });
    }
  };

  // Place a new order
  const placeOrder = (customerId: number, tableNumber: number) => {
    // Generate random toppings
    const availableToppings: PizzaTopping[] = ['cheese', 'pepperoni', 'mushrooms', 'olives', 'bacon', 'pineapple'];
    const toppingCount = Math.floor(Math.random() * 3) + 1; // 1-3 toppings
    const selectedToppings: PizzaTopping[] = [];
    
    for (let i = 0; i < toppingCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableToppings.length);
      selectedToppings.push(availableToppings[randomIndex]);
      availableToppings.splice(randomIndex, 1);
    }
    
    const newOrder: PizzaOrder = {
      id: orders.length + 1,
      customerId,
      status: 'pending',
      toppings: selectedToppings,
      preparationProgress: 0,
      tableNumber,
      placedAt: Date.now(),
    };
    
    setOrders(prev => [...prev, newOrder]);
    
    // Update customer state
    setNpcs(prev => prev.map(npc => 
      npc.id === customerId ? {...npc, state: 'waiting-for-food', orderId: newOrder.id} : npc
    ));
  };

  // Simulation tick function
  useEffect(() => {
    if (!simulating) return;
    
    const interval = setInterval(() => {
      // Update NPCs
      setNpcs(prev => {
        const newNpcs = [...prev];
        
        newNpcs.forEach(npc => {
          // Customer logic
          if (npc.type === 'customer') {
            if (npc.state === 'finding-seat' && npc.targetX !== undefined && npc.targetY !== undefined) {
              // Move toward target seat
              if (npc.x !== npc.targetX || npc.y !== npc.targetY) {
                // Simple movement - just move one step closer
                // In a full implementation, this would use pathfinding
                if (npc.x < npc.targetX) npc.x++;
                else if (npc.x > npc.targetX) npc.x--;
                
                if (npc.y < npc.targetY) npc.y++;
                else if (npc.y > npc.targetY) npc.y--;
              } else {
                // Reached seat, place order
                npc.state = 'ordering';
                placeOrder(npc.id, npc.x + npc.y); // Use position as table number
              }
            }
            
            // Eating logic
            if (npc.state === 'eating' && npc.orderId) {
              const order = orders.find(o => o.id === npc.orderId);
              if (order && order.status === 'delivered') {
                // Increment eating progress
                order.preparationProgress += 10;
                
                if (order.preparationProgress >= 100) {
                  // Finished eating
                  npc.state = 'leaving';
                  order.status = 'eaten';
                  order.completedAt = Date.now();
                  
                  // Update stats
                  setStats(prev => ({
                    ...prev,
                    customersServed: prev.customersServed + 1,
                    revenue: prev.revenue + 10 + (order.toppings.length * 2),
                  }));
                }
              }
            }
            
            // Leaving logic
            if (npc.state === 'leaving') {
              // Move toward exit
              if (npc.x !== 0 || npc.y !== 0) {
                if (npc.x > 0) npc.x--;
                else if (npc.y > 0) npc.y--;
              } else {
                // Reached exit, remove NPC
                return newNpcs.filter(n => n.id !== npc.id);
              }
            }
          }
          
          // Chef logic
          if (npc.type === 'chef') {
            // Find pending orders
            const pendingOrder = orders.find(o => o.status === 'pending');
            if (pendingOrder) {
              npc.state = 'cooking';
              pendingOrder.status = 'preparing';
              
              // Progress the order preparation
              pendingOrder.preparationProgress += 5;
              
              if (pendingOrder.preparationProgress >= 100) {
                pendingOrder.status = 'ready';
                npc.state = 'idle';
                
                // Update stats
                setStats(prev => ({
                  ...prev,
                  pizzasMade: prev.pizzasMade + 1,
                }));
              }
            } else {
              npc.state = 'idle';
            }
          }
          
          // Waiter logic
          if (npc.type === 'waiter') {
            // Find ready orders
            const readyOrder = orders.find(o => o.status === 'ready');
            if (readyOrder) {
              npc.state = 'delivering';
              readyOrder.status = 'delivered';
              
              // Find customer with this order
              const customer = newNpcs.find(n => n.orderId === readyOrder.id);
              if (customer) {
                customer.state = 'eating';
              }
            } else {
              npc.state = 'idle';
            }
          }
        });
        
        return newNpcs;
      });
      
      // Randomly add customers sometimes
      if (Math.random() < 0.05 * simSpeed) {
        addCustomer();
      }
      
    }, 1000 / simSpeed);
    
    return () => clearInterval(interval);
  }, [simulating, grid, orders, simSpeed]);

  const handleCellClick = (x: number, y: number) => {
    setSelectedCell({x, y});
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Pizza Place Simulation</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSimulating(!simulating)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {simulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {simulating ? 'Pause' : 'Start'}
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSimSpeed(prev => Math.max(0.5, prev - 0.5))}
              className="bg-gray-200 p-1 rounded-lg"
              disabled={simSpeed <= 0.5}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="mx-1">Speed: {simSpeed}x</span>
            <button 
              onClick={() => setSimSpeed(prev => Math.min(3, prev + 0.5))}
              className="bg-gray-200 p-1 rounded-lg"
              disabled={simSpeed >= 3}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div>
          <div className="grid gap-1 bg-gray-200 p-2 rounded-lg">
            {grid.map((row, y) => (
              <div key={y} className="flex gap-1">
                {row.map((cell, x) => {
                  const npc = npcs.find(n => n.x === x && n.y === y);
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`w-16 h-16 ${getTerrainStyle(cell.type)} 
                        flex items-center justify-center rounded-lg 
                        transition-colors cursor-pointer
                        ${selectedCell?.x === x && selectedCell?.y === y ? 'ring-2 ring-blue-500' : ''}
                      `}
                      onClick={() => handleCellClick(x, y)}
                    >
                      {npc ? getNPCIcon(npc) : getTerrainIcon(cell.type)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-2">Legend</h3>
              <div className="grid grid-cols-2 gap-2">
                {['kitchen', 'counter', 'dining', 'walkway', 'entrance', 'trash'].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${getTerrainStyle(type as TerrainType)} rounded flex items-center justify-center`}>
                      {getTerrainIcon(type as TerrainType)}
                    </div>
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-2">NPCs</h3>
              <div className="grid grid-cols-1 gap-2">
                {['customer', 'chef', 'waiter'].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      {type === 'customer' && <User className="w-5 h-5 text-blue-600" />}
                      {type === 'chef' && <ChefHat className="w-5 h-5 text-yellow-600" />}
                      {type === 'waiter' && <ShoppingBag className="w-5 h-5 text-green-600" />}
                    </div>
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-80">
          {/* Restaurant Stats */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-blue-500" />
              Restaurant Stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="font-bold">{stats.customersServed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="font-bold">${stats.revenue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pizzas Made</p>
                <p className="font-bold">{stats.pizzasMade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Satisfaction</p>
                <p className="font-bold">{stats.satisfaction}%</p>
              </div>
            </div>
          </div>
          
          {/* Active Orders */}
          <div className="p-4 bg-white rounded-lg shadow flex-grow overflow-y-auto max-h-80">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Pizza className="w-5 h-5 text-orange-500" />
              Active Orders ({orders.filter(o => o.status !== 'eaten').length})
            </h3>
            
            {orders.filter(o => o.status !== 'eaten').length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No active orders</p>
            ) : (
              <div className="space-y-3">
                {orders.filter(o => o.status !== 'eaten').map(order => (
                  <div key={order.id} className="p-2 bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">Order #{order.id}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Table {order.tableNumber}</p>
                    <div className="flex gap-1 mt-1">
                      {order.toppings.map(topping => (
                        <span key={topping} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {topping}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            order.status === 'preparing' ? 'bg-blue-500' :
                            order.status === 'delivered' ? 'bg-purple-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${order.preparationProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {order.status === 'preparing' ? 'Cooking' : 
                           order.status === 'delivered' ? 'Eating' : 'Progress'}
                        </span>
                        <span>{order.preparationProgress}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor((Date.now() - order.placedAt) / 1000)}s ago
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Cell Info */}
          {selectedCell && (
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-bold mb-2">Cell Info</h3>
              <p>Position: ({selectedCell.x}, {selectedCell.y})</p>
              <p>Type: {grid[selectedCell.y][selectedCell.x].type}</p>
              <p>Occupied: {grid[selectedCell.y][selectedCell.x].occupied ? 'Yes' : 'No'}</p>
              
              {npcs.find(n => n.x === selectedCell.x && n.y === selectedCell.y) && (
                <div className="mt-2">
                  <h4 className="font-semibold">NPC Info</h4>
                  <p>Type: {npcs.find(n => n.x === selectedCell.x && n.y === selectedCell.y)?.type}</p>
                  <p>State: {npcs.find(n => n.x === selectedCell.x && n.y === selectedCell.y)?.state}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold mb-2">Actions</h3>
            <div className="flex gap-2">
              <button 
                onClick={addCustomer}
                className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaPlace;
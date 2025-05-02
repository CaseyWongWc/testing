
import React, { useState, useEffect, useCallback } from 'react';
import { ChefHat, DollarSign, Trash2, Timer, User, Coffee, Pizza } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface NPC {
  id: string;
  type: 'chef' | 'cashier' | 'janitor' | 'customer';
  position: Position;
  state: string;
  target?: Position;
  inventory?: string[];
  money?: number;
  patience?: number;
  order?: string;
}

interface GridCell {
  type: 'empty' | 'wall' | 'oven' | 'counter' | 'table' | 'chair' | 'storage';
  occupied?: boolean;
  content?: string;
  cleanLevel?: number;
}

interface Recipe {
  name: string;
  ingredients: string[];
  cookTime: number;
  price: number;
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

  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = Array(GRID_SIZE.height).fill(null).map(() =>
      Array(GRID_SIZE.width).fill(null).map(() => ({ type: 'empty' }))
    );

    // Add walls
    for (let x = 0; x < GRID_SIZE.width; x++) {
      newGrid[0][x].type = 'wall';
      newGrid[GRID_SIZE.height - 1][x].type = 'wall';
    }
    for (let y = 0; y < GRID_SIZE.height; y++) {
      newGrid[y][0].type = 'wall';
      newGrid[y][GRID_SIZE.width - 1].type = 'wall';
    }

    // Add kitchen area
    for (let x = 2; x < 6; x++) {
      newGrid[2][x].type = 'counter';
      newGrid[4][x].type = 'oven';
    }

    // Add tables and chairs
    for (let y = 2; y < GRID_SIZE.height - 2; y += 3) {
      for (let x = 8; x < GRID_SIZE.width - 2; x += 4) {
        newGrid[y][x].type = 'table';
        newGrid[y + 1][x].type = 'chair';
        newGrid[y - 1][x].type = 'chair';
      }
    }

    return newGrid;
  }, []);

  const initializeNPCs = useCallback(() => {
    const newNPCs: NPC[] = [
      {
        id: 'chef1',
        type: 'chef',
        position: { x: 2, y: 3 },
        state: 'idle',
        inventory: []
      },
      {
        id: 'cashier1',
        type: 'cashier',
        position: { x: 2, y: 1 },
        state: 'idle',
        inventory: []
      },
      {
        id: 'janitor1',
        type: 'janitor',
        position: { x: GRID_SIZE.width - 2, y: 1 },
        state: 'patrolling',
      }
    ];
    return newNPCs;
  }, []);

  useEffect(() => {
    setGrid(initializeGrid());
    setNPCs(initializeNPCs());
  }, [initializeGrid, initializeNPCs]);

  const renderCell = (cell: GridCell, npc?: NPC) => {
    if (npc) {
      switch (npc.type) {
        case 'chef':
          return <ChefHat className="w-6 h-6 text-yellow-500" />;
        case 'cashier':
          return <DollarSign className="w-6 h-6 text-green-500" />;
        case 'janitor':
          return <Trash2 className="w-6 h-6 text-blue-500" />;
        case 'customer':
          return <User className="w-6 h-6 text-purple-500" />;
      }
    }

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
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Pizza Place Simulation</h2>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-4 py-2 rounded ${
            isRunning ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {isRunning ? 'Stop' : 'Start'} Simulation
        </button>
      </div>

      <div className="grid gap-0.5 bg-gray-100 p-2 rounded-lg">
        {grid.map((row, y) => (
          <div key={y} className="flex gap-0.5">
            {row.map((cell, x) => {
              const npc = npcs.find(n => n.position.x === x && n.position.y === y);
              return (
                <div
                  key={`${x}-${y}`}
                  className="w-8 h-8 bg-white flex items-center justify-center"
                >
                  {renderCell(cell, npc)}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
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

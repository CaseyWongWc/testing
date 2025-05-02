import React, { useState, useEffect } from 'react';
import { MapPin, ChefHat, DollarSign, Utensils, Trash2 } from 'lucide-react';

type TerrainType = 'kitchen' | 'counter' | 'dining' | 'walkway' | 'entrance' | 'trash';

interface GridCell {
  type: TerrainType;
  occupied: boolean;
}

const PizzaPlace: React.FC = () => {
  const [grid, setGrid] = useState<GridCell[][]>([]);

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
  }, []);

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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Pizza Place Simulation</h2>
      <div className="grid gap-1 bg-gray-200 p-2 rounded-lg">
        {grid.map((row, y) => (
          <div key={y} className="flex gap-1">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`w-16 h-16 ${getTerrainStyle(cell.type)} 
                  flex items-center justify-center rounded-lg 
                  transition-colors cursor-pointer`}
              >
                {getTerrainIcon(cell.type)}
              </div>
            ))}
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
      </div>
    </div>
  );
};

export default PizzaPlace;
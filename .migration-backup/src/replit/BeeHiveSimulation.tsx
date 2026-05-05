
import React, { useState, useEffect } from 'react';
import { Hexagon, Bot } from 'lucide-react';

interface Bee {
  id: number;
  x: number;
  y: number;
  hiveId: string;
  hasHoney: boolean;
}

interface Hive {
  id: string;
  name: string;
  x: number;
  y: number;
  honey: number;
  maxHoney: number;
}

interface HoneySpot {
  x: number;
  y: number;
  amount: number;
}

const BeeHiveSimulation: React.FC = () => {
  const gridSize = { width: 20, height: 15 };
  const [hives, setHives] = useState<Hive[]>([
    { id: 'a', name: 'Beehive A', x: 2, y: 2, honey: 50, maxHoney: 100 },
    { id: 'b', name: 'Beehive B', x: 10, y: 7, honey: 50, maxHoney: 100 },
    { id: 'c', name: 'Beehive C', x: 17, y: 12, honey: 50, maxHoney: 100 }
  ]);
  
  const [bees, setBees] = useState<Bee[]>([]);
  const [honeySpots, setHoneySpots] = useState<HoneySpot[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Initialize bees for each hive
    const initialBees: Bee[] = [];
    hives.forEach(hive => {
      for (let i = 0; i < 3; i++) {
        initialBees.push({
          id: initialBees.length,
          x: hive.x,
          y: hive.y,
          hiveId: hive.id,
          hasHoney: false
        });
      }
    });
    setBees(initialBees);
  }, []);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // Random honey spawning
      if (Math.random() < 0.1) {
        setHoneySpots(prev => [...prev, {
          x: Math.floor(Math.random() * gridSize.width),
          y: Math.floor(Math.random() * gridSize.height),
          amount: Math.floor(Math.random() * 20) + 10
        }]);
      }

      // Update bee positions
      setBees(prev => prev.map(bee => {
        const homeHive = hives.find(h => h.id === bee.hiveId)!;
        
        if (bee.hasHoney) {
          // Return to hive
          const dx = Math.sign(homeHive.x - bee.x);
          const dy = Math.sign(homeHive.y - bee.y);
          
          if (bee.x === homeHive.x && bee.y === homeHive.y) {
            setHives(prev => prev.map(h => 
              h.id === bee.hiveId 
                ? { ...h, honey: Math.min(h.maxHoney, h.honey + 5) }
                : h
            ));
            return { ...bee, hasHoney: false };
          }
          
          return {
            ...bee,
            x: bee.x + (dx || 0),
            y: bee.y + (dy || 0)
          };
        } else {
          // Look for honey
          const nearbyHoney = honeySpots.find(h => 
            Math.abs(h.x - bee.x) <= 1 && Math.abs(h.y - bee.y) <= 1
          );
          
          if (nearbyHoney) {
            setHoneySpots(prev => prev.filter(h => h !== nearbyHoney));
            return { ...bee, hasHoney: true };
          }
          
          // Random movement
          return {
            ...bee,
            x: Math.max(0, Math.min(gridSize.width - 1, bee.x + (Math.random() < 0.5 ? -1 : 1))),
            y: Math.max(0, Math.min(gridSize.height - 1, bee.y + (Math.random() < 0.5 ? -1 : 1)))
          };
        }
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating, hives]);

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-4 py-2 rounded ${
            isSimulating ? 'bg-red-500' : 'bg-blue-500'
          } text-white`}
        >
          {isSimulating ? 'Stop' : 'Start'} Simulation
        </button>
      </div>

      <div className="flex gap-8">
        <div
          className="grid gap-0.5 bg-gray-200 p-2 rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${gridSize.width}, 1.5rem)`,
            gridTemplateRows: `repeat(${gridSize.height}, 1.5rem)`
          }}
        >
          {Array(gridSize.height).fill(0).map((_, y) =>
            Array(gridSize.width).fill(0).map((_, x) => (
              <div
                key={`${x}-${y}`}
                className="bg-white flex items-center justify-center relative"
              >
                {hives.map(hive => hive.x === x && hive.y === y && (
                  <Hexagon key={hive.id} className="w-5 h-5 text-yellow-600 absolute" />
                ))}
                {bees.map(bee => bee.x === x && bee.y === y && (
                  <Bot
                    key={bee.id}
                    className={`w-4 h-4 absolute ${
                      bee.hasHoney ? 'text-yellow-500' : 'text-gray-500'
                    }`}
                  />
                ))}
                {honeySpots.map((spot, i) => spot.x === x && spot.y === y && (
                  <div
                    key={i}
                    className="w-2 h-2 bg-yellow-300 rounded-full absolute"
                  />
                ))}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          {hives.map(hive => (
            <div key={hive.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">{hive.name}</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Honey</span>
                    <span>{hive.honey}/{hive.maxHoney}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${(hive.honey / hive.maxHoney) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Bees: {bees.filter(b => b.hiveId === hive.id).length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeeHiveSimulation;


import React, { useState } from 'react';
import PizzaPlace from './pizzaplacefiles/PizzaPlace';
import { Pizza, PlusCircle } from 'lucide-react';

const UnrelatedMenu: React.FC = () => {
  const [activeScene, setActiveScene] = useState<'pizza' | null>(null);

  const scenes = [
    {
      id: 'pizza',
      name: 'Pizza Place Simulation',
      description: 'Manage a pizzeria with NPCs, orders, and customer satisfaction',
      icon: <Pizza className="w-5 h-5 text-orange-400" />
    }
  ];

  if (activeScene === 'pizza') {
    return <PizzaPlace />;
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Unrelated Experiments</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setActiveScene(scene.id as any)}
            className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 text-left"
          >
            <div className="flex items-center gap-4 mb-3">
              {scene.icon}
              <h2 className="text-xl font-semibold text-white">{scene.name}</h2>
            </div>
            <p className="text-gray-400">{scene.description}</p>
          </button>
        ))}

        <button className="bg-gray-800/50 p-6 rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-600 transition-all flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-gray-400">
          <PlusCircle className="w-8 h-8" />
          <span>More experiments coming soon...</span>
        </button>
      </div>
    </div>
  );
};

export default UnrelatedMenu;

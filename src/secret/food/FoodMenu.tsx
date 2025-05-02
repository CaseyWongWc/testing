import React, { useState } from 'react';
import { Pizza, Coffee, Utensils, ChevronLeft } from 'lucide-react';
import PizzaPlace from '../unrelated/PizzaPlace';

interface FoodMenuProps {
  onBack: () => void;
}

const FoodMenu: React.FC<FoodMenuProps> = ({ onBack }) => {
  const [activeScene, setActiveScene] = useState<'pizza' | 'coffee' | null>(null);

  const scenes = [
    {
      id: 'pizza',
      name: 'Pizza Place Simulation',
      description: 'Manage a pizzeria with layout visualization, orders, and pizza creation',
      icon: <Pizza className="w-5 h-5 text-orange-400" />
    },
    {
      id: 'coffee',
      name: 'Coffee Shop Simulator',
      description: 'Coming soon - Brew and serve coffee in a cozy shop environment',
      icon: <Coffee className="w-5 h-5 text-brown-400" />
    }
  ];

  // Render active scene
  if (activeScene === 'pizza') {
    return (
      <div className="p-4 bg-gray-900 min-h-screen">
        <button
          onClick={() => setActiveScene(null)}
          className="mb-4 flex items-center text-white hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Food Menu
        </button>
        <PizzaPlace />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-white hover:text-blue-400 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-white">Food Simulations</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setActiveScene(scene.id as 'pizza' | 'coffee')}
            className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 text-left"
            disabled={scene.id !== 'pizza'} // Only enable pizza for now
          >
            <div className="flex items-center gap-4 mb-3">
              {scene.icon}
              <h2 className="text-xl font-semibold text-white">{scene.name}</h2>
            </div>
            <p className="text-gray-400">{scene.description}</p>
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-900/20 rounded-lg">
        <div className="flex items-center gap-2 text-blue-500 mb-2">
          <Utensils className="w-5 h-5" />
          <h3 className="font-semibold">Food Simulator Workshop</h3>
        </div>
        <p className="text-blue-200/70 text-sm">
          These food simulations demonstrate grid-based environmental modeling with different zones
          and interactive elements. More simulations coming soon!
        </p>
      </div>
    </div>
  );
};

export default FoodMenu;
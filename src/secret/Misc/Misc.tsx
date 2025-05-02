import React from "react";
import { Star, Sparkles } from "lucide-react";

interface MiscMenuProps {
  onSelect: (scene: string) => void;
}

const Misc: React.FC<MiscMenuProps> = ({ onSelect }) => {
  const scenes = [
    {
      id: "particle_playground",
      name: "Particle Playground",
      description: "Interactive particle system with unique behaviors",
      icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
    },
    {
      id: "color_mixer",
      name: "Color Mixer",
      description: "Experimental color mixing and pattern generation",
      icon: <Star className="w-5 h-5 text-purple-400" />,
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Misc Zone
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSelect(scene.id)}
            className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              {scene.icon}
              <h3 className="text-lg font-semibold text-white">{scene.name}</h3>
            </div>
            <p className="text-gray-400 text-sm">{scene.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Misc;

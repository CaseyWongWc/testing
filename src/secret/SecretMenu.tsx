import React from 'react';
import { Sparkles, Code, Lock, AlertTriangle, Gamepad2 } from 'lucide-react';

interface SecretMenuProps {
  onNavigate: (path: string) => void;
}

const SecretMenu: React.FC<SecretMenuProps> = ({ onNavigate }) => {
  const sections = [
    {
      id: 'impossible',
      name: 'Experimental Features',
      description: 'Pushing the boundaries of what\'s possible',
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      path: 'might be impossible to make'
    },
    {
      id: 'incompatible',
      name: 'Compatibility Lab',
      description: 'Testing unconventional combinations',
      icon: <Code className="w-6 h-6 text-blue-500" />,
      path: 'might be incompatable'
    },
    {
      id: '3dworld',
      name: '3D World',
      description: 'Exploring three-dimensional space',
      icon: <Lock className="w-6 h-6 text-green-500" />,
      path: 'not following syllabus/3dworld'
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      description: 'Specialized or unique scenes',
      icon: <Gamepad2 className="w-6 h-6 text-yellow-500" />,
      path: 'for entertainment'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 
            className="text-4xl font-bold mb-4 cursor-pointer hover:text-blue-400 transition-colors"
            onClick={() => onNavigate('exit')}
          >
            Secret Laboratory
          </h1>
          <p className="text-gray-400">Breaking the boundaries of conventional development</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => onNavigate(section.path)}
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 text-left cursor-pointer select-none"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onNavigate(section.path);
                }
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                {section.icon}
                <h2 className="text-xl font-semibold">{section.name}</h2>
              </div>
              <p className="text-gray-400">{section.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-yellow-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Experimental Zone</h3>
          </div>
          <p className="text-yellow-200/70 text-sm">
            These features are experimental and may push the limits of current implementation.
            Expect the unexpected!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecretMenu;
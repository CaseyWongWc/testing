import React, { useState } from 'react';
import ZombiesAhh from './ZombiesAhh';
import EmptyClassroom from './EmptyClassroom';

const Combat: React.FC = () => {
  const [activeScene, setActiveScene] = useState<'zombies' | 'classroom'>('zombies');

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveScene('zombies')}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === 'zombies'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Zombies Ahh!
        </button>
        <button
          onClick={() => setActiveScene('classroom')}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === 'classroom'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Empty Classroom
        </button>
      </div>

      {activeScene === 'zombies' && <ZombiesAhh />}
      {activeScene === 'classroom' && <EmptyClassroom />}
    </div>
  );
};

export default Combat;
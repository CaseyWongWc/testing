import React from 'react';
import { Spawner } from './Spawner';

const Scene8: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-2">Entity Spawner System</h2>
        <p className="text-gray-700 mb-2">
          This simulation demonstrates a dynamic spawner system with configurable parameters:
        </p>
        <ul className="list-disc pl-5 text-gray-700 mb-4">
          <li><span className="font-semibold text-purple-500">Capacity</span> - Maximum number of entities that can exist at once</li>
          <li><span className="font-semibold text-orange-500">Frequency</span> - How often new entities spawn (in seconds)</li>
          <li><span className="font-semibold text-blue-500">Types</span> - Different entity types with varying behaviors</li>
          <li><span className="font-semibold text-green-500">Direction</span> - Controls spawn location and movement patterns</li>
        </ul>
        <p className="text-gray-700 italic">
          The spawner will generate entities until reaching capacity, then wait for entities to be removed before spawning more.
        </p>
      </div>
      
      <Spawner
        width={30}
        height={20}
        wallDensity={0.2}
      />
    </div>
  );
};

export default Scene8;
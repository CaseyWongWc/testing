import React from 'react';
import { MultiValuedItemCollector } from './MultiValuedItemCollector';

const Scene7: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-2">Multi-Valued Item Collection System</h2>
        <p className="text-gray-700 mb-2">
          This simulation demonstrates a robot with a threshold-based collection system where items have multiple value types:
        </p>
        <ul className="list-disc pl-5 text-gray-700 mb-4">
          <li><span className="font-semibold text-red-500">Strength</span> - Affects the robot's ability to carry items</li>
          <li><span className="font-semibold text-yellow-500">Gold</span> - Represents monetary value</li>
          <li><span className="font-semibold text-green-500">Food</span> - Sustains the robot's energy</li>
          <li><span className="font-semibold text-blue-500">Water</span> - Maintains robot's cooling systems</li>
        </ul>
        <p className="text-gray-700 mb-1">
          The robot dynamically adjusts its collection priorities based on which resource falls below its threshold.
        </p>
        <p className="text-gray-700 italic">
          Items can have positive or negative values for any attribute - making decisions more complex!
        </p>
      </div>
      
      <MultiValuedItemCollector
        width={25}
        height={20}
        wallDensity={0.2}
        itemCount={20}
      />
    </div>
  );
};

export default Scene7;
import React from 'react';
import MultiValuedItemCollector from './MultiValuedItemCollector';

const Scene7: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Scene 7: Robot with Multi-Valued Item Collection</h1>
      <p className="mb-6 text-gray-600">
        In this scene, a robot collects items with different values (strength, gold, food, water). 
        The robot uses a threshold system to prioritize collecting specific items based on its current inventory.
        When a value falls below its threshold, the robot will prioritize finding items of that type.
      </p>
      
      <MultiValuedItemCollector />
    </div>
  );
};

export default Scene7;
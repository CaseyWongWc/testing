import React, { useState } from 'react';
import Priority from './Priority';
import WeightedDecisions from './WeightedDecisions';
import BeeHiveSimulation from './BeeHiveSimulation';
import AIEcosystem from './AIEcosystem';
import ErrorBoundary from '../components/ErrorBoundary';

const ReplitScene: React.FC = () => {
  const [scene, setScene] = useState<string>('initial');

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => setScene('priority')}
          className={`px-4 py-2 rounded transition-colors ${
            scene === 'priority'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Priority
        </button>
        <button
          onClick={() => setScene('scene1')}
          className={`px-4 py-2 rounded transition-colors ${
            scene === 'scene1'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Scene 1
        </button>
        <button
          onClick={() => setScene('scene2')}
          className={`px-4 py-2 rounded transition-colors ${
            scene === 'scene2'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Scene 2
        </button>
        {[3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => setScene(`scene${num}`)}
            className={`px-4 py-2 rounded transition-colors ${
              scene === `scene${num}`
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Scene {num}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {scene === 'priority' && <ErrorBoundary><Priority /></ErrorBoundary>}
        {scene === 'scene1' && <ErrorBoundary><WeightedDecisions /></ErrorBoundary>}
        {scene === 'scene2' && <ErrorBoundary><WeightedDecisions /></ErrorBoundary>}
        {scene === 'scene3' && <ErrorBoundary><BeeHiveSimulation /></ErrorBoundary>}
        {scene === 'scene4' && <ErrorBoundary><AIEcosystem /></ErrorBoundary>}
        {scene === 'scene5' && <div>Scene 5 Content</div>}
        {scene === 'scene6' && <div>Scene 6 Content</div>}
        {scene === 'scene7' && <div>Scene 7 Content</div>}
        {scene === 'scene8' && <div>Scene 8 Content</div>}
        {scene === 'scene9' && <div>Scene 9 Content</div>}
        {scene === 'initial' && <div>Select a scene to begin</div>}
      </div>
    </div>
  );
};

export default ReplitScene;
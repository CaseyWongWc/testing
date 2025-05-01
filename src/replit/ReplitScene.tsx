import React, { useState } from 'react';
import Priority from './Priority';
import WeightedDecisions from './WeightedDecisions';
import Pathfinder from './Pathfinder';
import BeeHiveSimulation from './BeeHiveSimulation';
import AIEcosystem from './AIEcosystem';
import TagGame from './TagGame';
import { MultiValuedItemCollector } from './MultiValuedItemCollector';
import ErrorBoundary from '../components/ErrorBoundary';
import { Spawner } from './Spawner';

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
      
      <div className="flex gap-4 mb-8 flex-wrap">
        <h3 className="w-full text-lg font-medium text-gray-700 mb-2">Advanced Simulations</h3>
        {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
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
        {scene === 'scene2' && <ErrorBoundary><Pathfinder /></ErrorBoundary>}
        {scene === 'scene3' && <ErrorBoundary><BeeHiveSimulation /></ErrorBoundary>}
        {scene === 'scene4' && <ErrorBoundary><AIEcosystem /></ErrorBoundary>}
        {scene === 'scene5' && <ErrorBoundary><TagGame width={25} height={15} wallDensity={0.25} robotCount={4} /></ErrorBoundary>}
        {scene === 'scene6' && <ErrorBoundary><RobotTrading /></ErrorBoundary>}
        {scene === 'scene7' && <ErrorBoundary><MultiValuedItemCollector width={25} height={20} wallDensity={0.2} itemCount={20} /></ErrorBoundary>}
        {scene === 'scene8' && <ErrorBoundary><Spawner width={30} height={20} wallDensity={0.2} /></ErrorBoundary>}
        {scene === 'scene9' && <div>Scene 9 Content</div>}
        
        {/* Advanced Simulations (Scenes 10-20) */}
        {scene === 'scene10' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Entity-Component System</h2>
            <p className="text-gray-600 mb-4">
              A simulation demonstrating how entities with component-based architecture can be used for more complex AI behaviors.
              Based on the ObjectInstance and Player hierarchy.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 10: Entity-Component Framework (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene11' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Perception System</h2>
            <p className="text-gray-600 mb-4">
              A simulation of how AI agents perceive and interpret their environment through vision, hearing, and other senses.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 11: Perception System (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene12' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Decision Making Framework</h2>
            <p className="text-gray-600 mb-4">
              Advanced decision-making algorithms including behavior trees, utility systems, and planning.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 12: Decision Making (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene13' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Pathfinding and Navigation</h2>
            <p className="text-gray-600 mb-4">
              Advanced pathfinding algorithms and navigation systems for complex environments.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 13: Pathfinding (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene14' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Learning System</h2>
            <p className="text-gray-600 mb-4">
              A framework for agent learning through reinforcement, neural networks, and genetic algorithms.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 14: Learning System (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene15' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Multi-Agent Coordination</h2>
            <p className="text-gray-600 mb-4">
              Simulation of how multiple agents can coordinate activities and communicate to achieve common goals.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 15: Multi-Agent Coordination (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene16' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Emotional and Social Intelligence</h2>
            <p className="text-gray-600 mb-4">
              A system for modeling emotional responses and social interactions between AI agents.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 16: Emotional Intelligence (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene17' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Goal-Oriented Action Planning</h2>
            <p className="text-gray-600 mb-4">
              GOAP implementation allowing agents to formulate plans to achieve specific goals.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 17: GOAP (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene18' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Memory and Knowledge Base</h2>
            <p className="text-gray-600 mb-4">
              A framework for long-term and short-term agent memory, allowing for learning and adaptation.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 18: Memory System (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene19' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Language Processing</h2>
            <p className="text-gray-600 mb-4">
              Natural language processing capabilities for AI agents to understand and generate language.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 19: Language Processing (Coming Soon)</p>
            </div>
          </div>
        )}
        {scene === 'scene20' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">Complete AI Architecture</h2>
            <p className="text-gray-600 mb-4">
              A comprehensive simulation that combines all previous components into a fully-featured AI architecture.
            </p>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-center text-gray-500 py-8">Scene 20: Complete AI Framework (Coming Soon)</p>
            </div>
          </div>
        )}
        
        {scene === 'initial' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">AI Simulation Framework</h2>
            <p className="text-gray-600 mb-4">
              Select a scene from above to explore different AI simulation components and frameworks.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Scenes 1-9:</strong> Basic AI simulations and behaviors</li>
              <li><strong>Scenes 10-20:</strong> Advanced AI frameworks and architectures</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplitScene;
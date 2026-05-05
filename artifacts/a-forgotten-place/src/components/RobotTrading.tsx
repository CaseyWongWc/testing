import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, HelpCircle, Play, Pause, Timer, FastForward, Database, ArrowRight, Scale, Package, Brain } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  weight: number;
  value: number;
  color: string;
}

interface Robot {
  id: number;
  name: string;
  color: string;
  inventory: {
    [key: string]: number; // resourceId -> quantity
  };
  priorities: {
    [key: string]: number; // resourceId -> priority (0-1)
  };
  credits: number;
  strategy: 'balanced' | 'aggressive' | 'conservative';
  lastDecision: string;
  aiThoughts: string;
}

interface Trade {
  offeredBy: number;
  offeredTo: number;
  resourceId: string;
  quantity: number;
  price: number;
  accepted: boolean;
  reason: string;
  timestamp: number;
}

const RESOURCES: Resource[] = [
  { id: 'metal', name: 'Metal', weight: 2, value: 10, color: 'gray' },
  { id: 'energy', name: 'Energy', weight: 0.5, value: 15, color: 'yellow' },
  { id: 'crystal', name: 'Crystal', weight: 1, value: 20, color: 'blue' },
  { id: 'data', name: 'Data', weight: 0.1, value: 25, color: 'purple' }
];

const ROBOT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];
const ROBOT_COLORS = ['blue', 'red', 'green', 'purple'];

const RobotTrading: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null);
  
  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const initializeRobots = useCallback(() => {
    const newRobots: Robot[] = [];
    
    for (let i = 0; i < 4; i++) {
      const inventory: { [key: string]: number } = {};
      const priorities: { [key: string]: number } = {};
      
      // Randomly distribute initial resources and priorities
      RESOURCES.forEach(resource => {
        inventory[resource.id] = Math.floor(Math.random() * 10);
        priorities[resource.id] = Math.random();
      });

      newRobots.push({
        id: i,
        name: ROBOT_NAMES[i],
        color: ROBOT_COLORS[i],
        inventory,
        priorities,
        credits: 1000,
        strategy: ['balanced', 'aggressive', 'conservative'][Math.floor(Math.random() * 3)] as 'balanced' | 'aggressive' | 'conservative',
        lastDecision: '',
        aiThoughts: ''
      });
    }

    setRobots(newRobots);
    setTrades([]);
  }, []);

  useEffect(() => {
    initializeRobots();
  }, [initializeRobots]);

  const calculateResourceValue = (resource: Resource, quantity: number, robot: Robot): number => {
    const currentQuantity = robot.inventory[resource.id] || 0;
    const priority = robot.priorities[resource.id] || 0;
    
    // Base value calculation
    let value = resource.value * quantity;
    
    // Apply priority multiplier
    value *= (1 + priority);
    
    // Apply scarcity/abundance modifier
    const scarcityMultiplier = Math.max(0.5, Math.min(2, 5 / (currentQuantity + 1)));
    value *= scarcityMultiplier;
    
    // Apply strategy-based modifiers
    switch (robot.strategy) {
      case 'aggressive':
        value *= 1.2; // More willing to trade
        break;
      case 'conservative':
        value *= 0.8; // Less willing to trade
        break;
      default:
        break;
    }
    
    return value;
  };

  const evaluateTrade = (
    offeredBy: Robot,
    offeredTo: Robot,
    resource: Resource,
    quantity: number,
    price: number
  ): { accept: boolean; reason: string } => {
    const thoughts: string[] = [];
    
    // Seller evaluation
    const sellerValue = calculateResourceValue(resource, quantity, offeredBy);
    thoughts.push(
      `Seller (${offeredBy.name}) evaluation:`,
      `- Resource value to seller: ${sellerValue.toFixed(2)}`,
      `- Offered price: ${price}`,
      `- Current quantity: ${offeredBy.inventory[resource.id]}`
    );

    if (offeredBy.inventory[resource.id] < quantity) {
      return { 
        accept: false, 
        reason: 'Insufficient resources for trade' 
      };
    }

    // Buyer evaluation
    const buyerValue = calculateResourceValue(resource, quantity, offeredTo);
    thoughts.push(
      `\nBuyer (${offeredTo.name}) evaluation:`,
      `- Resource value to buyer: ${buyerValue.toFixed(2)}`,
      `- Required credits: ${price}`,
      `- Current credits: ${offeredTo.credits}`
    );

    if (offeredTo.credits < price) {
      return { 
        accept: false, 
        reason: 'Insufficient credits for trade' 
      };
    }

    // Decision making
    const profitMargin = (price - sellerValue) / sellerValue;
    const valueRatio = buyerValue / price;

    thoughts.push(
      `\nTrade Analysis:`,
      `- Seller profit margin: ${(profitMargin * 100).toFixed(1)}%`,
      `- Buyer value ratio: ${valueRatio.toFixed(2)}`
    );

    // Update AI thoughts
    setRobots(prev => prev.map(r => {
      if (r.id === offeredBy.id || r.id === offeredTo.id) {
        return {
          ...r,
          aiThoughts: thoughts.join('\n')
        };
      }
      return r;
    }));

    if (profitMargin > 0.1 && valueRatio > 1.1) {
      return {
        accept: true,
        reason: 'Mutually beneficial trade'
      };
    } else if (profitMargin <= 0.1) {
      return {
        accept: false,
        reason: 'Insufficient profit margin for seller'
      };
    } else {
      return {
        accept: false,
        reason: 'Price too high for buyer'
      };
    }
  };

  const executeTrade = (trade: Trade) => {
    setRobots(prev => prev.map(robot => {
      if (robot.id === trade.offeredBy) {
        return {
          ...robot,
          inventory: {
            ...robot.inventory,
            [trade.resourceId]: (robot.inventory[trade.resourceId] || 0) - trade.quantity
          },
          credits: robot.credits + trade.price,
          lastDecision: `Sold ${trade.quantity} ${trade.resourceId} for ${trade.price} credits`
        };
      }
      if (robot.id === trade.offeredTo) {
        return {
          ...robot,
          inventory: {
            ...robot.inventory,
            [trade.resourceId]: (robot.inventory[trade.resourceId] || 0) + trade.quantity
          },
          credits: robot.credits - trade.price,
          lastDecision: `Bought ${trade.quantity} ${trade.resourceId} for ${trade.price} credits`
        };
      }
      return robot;
    }));
  };

  const generateTrade = () => {
    const seller = robots[Math.floor(Math.random() * robots.length)];
    let buyer;
    do {
      buyer = robots[Math.floor(Math.random() * robots.length)];
    } while (buyer.id === seller.id);

    const resource = RESOURCES[Math.floor(Math.random() * RESOURCES.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const basePrice = resource.value * quantity;
    const price = Math.floor(basePrice * (0.8 + Math.random() * 0.4)); // ±20% variation

    const evaluation = evaluateTrade(seller, buyer, resource, quantity, price);
    
    const trade: Trade = {
      offeredBy: seller.id,
      offeredTo: buyer.id,
      resourceId: resource.id,
      quantity,
      price,
      accepted: evaluation.accept,
      reason: evaluation.reason,
      timestamp: Date.now()
    };

    if (evaluation.accept) {
      executeTrade(trade);
    }

    setTrades(prev => [trade, ...prev].slice(0, 10));
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!isSimulating) return;

      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = (1000 / simulationSpeed);

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;
        generateTrade();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isSimulating) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isSimulating, simulationSpeed, robots]);

  return (
    <div className="flex gap-8">
      <div className="space-y-4">
        {robots.map(robot => (
          <div 
            key={robot.id}
            className={`bg-white p-4 rounded-lg shadow-md w-80 ${
              selectedRobotId === robot.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedRobotId(robot.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Bot className={`w-5 h-5 text-${robot.color}-500`} />
              <h3 className="font-semibold">{robot.name}</h3>
              <span className="text-sm text-gray-500 ml-auto">{robot.strategy}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credits</span>
                <span className="font-medium">{robot.credits}</span>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-gray-600 mb-1">Inventory</div>
                {RESOURCES.map(resource => (
                  <div key={resource.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${resource.color}-500`} />
                      <span className="text-sm">{resource.name}</span>
                    </div>
                    <span className="text-sm font-medium">{robot.inventory[resource.id] || 0}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-gray-600 mb-1">Priorities</div>
                {RESOURCES.map(resource => (
                  <div key={resource.id} className="flex justify-between items-center">
                    <span className="text-sm">{resource.name}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${resource.color}-500`}
                        style={{ width: `${(robot.priorities[resource.id] || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedRobotId === robot.id && robot.aiThoughts && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">AI Thoughts</span>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-gray-600">
                  {robot.aiThoughts}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={initializeRobots}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset Simulation
          </button>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? 'Stop' : 'Start'} Simulation
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
            <Timer className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 w-12">{simulationSpeed.toFixed(1)}x</span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
              className="w-24"
            />
            <FastForward className="w-4 h-4 text-gray-600" />
          </div>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>

        {showLegend && (
          <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4">
            {RESOURCES.map(resource => (
              <div key={resource.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-${resource.color}-500`} />
                <span className="text-sm text-gray-600">
                  {resource.name} (Value: {resource.value}, Weight: {resource.weight})
                </span>
              </div>
            ))}
            <div className="w-full border-t pt-2">
              <div className="text-sm text-gray-600">
                Trading Strategies:
              </div>
              <div className="mt-1 space-y-1">
                <div className="text-sm">
                  • Balanced - Standard value assessment
                </div>
                <div className="text-sm">
                  • Aggressive - 20% higher value tolerance
                </div>
                <div className="text-sm">
                  • Conservative - 20% lower value tolerance
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Recent Trades
          </h3>
          <div className="space-y-3">
            {trades.map((trade, index) => {
              const seller = robots.find(r => r.id === trade.offeredBy);
              const buyer = robots.find(r => r.id === trade.offeredTo);
              const resource = RESOURCES.find(r => r.id === trade.resourceId);
              
              if (!seller || !buyer || !resource) return null;

              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    trade.accepted ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className={`w-4 h-4 text-${seller.color}-500`} />
                    <ArrowRight className="w-4 h-4" />
                    <Bot className={`w-4 h-4 text-${buyer.color}-500`} />
                    <div className="ml-2">
                      <span className={`w-2 h-2 rounded-full bg-${resource.color}-500 inline-block mr-1`} />
                      {trade.quantity} {resource.name}
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Scale className="w-4 h-4 text-gray-500" />
                      {trade.price}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {trade.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobotTrading;
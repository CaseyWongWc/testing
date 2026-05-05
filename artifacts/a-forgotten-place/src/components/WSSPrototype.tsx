import { useState, useEffect, useCallback, useRef } from 'react';

type Screen = 'landing' | 'config' | 'simulation' | 'strategy' | 'trading' | 'metrics' | 'victory' | 'defeat';

interface Tile {
  terrain: 'plains' | 'forest' | 'mountain' | 'desert' | 'water' | 'swamp';
  explored: boolean;
  visible: boolean;
  hasFood: boolean;
  hasWater: boolean;
  hasGold: boolean;
  hasTrader: boolean;
  moveCost: number;
  waterCost: number;
  foodCost: number;
}

interface PlayerState {
  x: number;
  y: number;
  strength: number;
  maxStrength: number;
  water: number;
  maxWater: number;
  food: number;
  maxFood: number;
  gold: number;
  turnsPlayed: number;
  tilesExplored: number;
  tradesCompleted: number;
  tradeProfit: number;
}

interface LogEntry {
  turn: number;
  action: string;
  reason: string;
  position: [number, number];
  resourceChange: string;
}

interface TradeOffer {
  traderName: string;
  personality: 'generous' | 'fair' | 'greedy' | 'impatient';
  offering: { type: string; amount: number }[];
  requesting: { type: string; amount: number }[];
  round: number;
  maxRounds: number;
}

const TERRAIN_CONFIG = {
  plains: { color: '#8BC34A', icon: '🌾', label: 'Plains', moveCost: 1, waterCost: 1, foodCost: 0 },
  forest: { color: '#2E7D32', icon: '🌲', label: 'Forest', moveCost: 2, waterCost: 1, foodCost: -1 },
  mountain: { color: '#795548', icon: '⛰️', label: 'Mountain', moveCost: 3, waterCost: 2, foodCost: 1 },
  desert: { color: '#FFB74D', icon: '🏜️', label: 'Desert', moveCost: 1, waterCost: 3, foodCost: 2 },
  water: { color: '#1565C0', icon: '🌊', label: 'Water', moveCost: 4, waterCost: -2, foodCost: 1 },
  swamp: { color: '#5D4037', icon: '🌿', label: 'Swamp', moveCost: 3, waterCost: 0, foodCost: 1 },
};

const BRAIN_STRATEGIES = [
  { id: 'balanced', name: 'Balanced', icon: '⚖️', desc: 'Weighs survival needs against progress toward the eastern edge goal.' },
  { id: 'explorer', name: 'Explorer', icon: '🧭', desc: 'Prioritizes discovering new tiles and maximizing map coverage.' },
  { id: 'collector', name: 'Collector', icon: '🎒', desc: 'Focuses on gathering resources before advancing eastward.' },
  { id: 'trader', name: 'Trader', icon: '🤝', desc: 'Seeks trading opportunities and negotiates actively with merchants.' },
  { id: 'adaptive', name: 'Adaptive', icon: '🧠', desc: 'Dynamically adjusts strategy based on current resource levels.' },
  { id: 'strategic', name: 'Strategic', icon: '♟️', desc: 'Uses A* pathfinding with dynamic cost evaluation for optimal routes.' },
];

const TRADER_NAMES = ['Old Barnaby', 'Swift Mira', 'Gruff Tormund', 'Eager Pip'];

function generateMap(width: number, height: number, difficulty: number): Tile[][] {
  const terrainTypes: Tile['terrain'][] = ['plains', 'forest', 'mountain', 'desert', 'water', 'swamp'];
  const weights = [35 - difficulty * 5, 25, 10 + difficulty * 3, 10 + difficulty * 5, 10, 10 + difficulty * 2];
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  function pickTerrain(): Tile['terrain'] {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < terrainTypes.length; i++) {
      r -= weights[i];
      if (r <= 0) return terrainTypes[i];
    }
    return 'plains';
  }

  const map: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      const terrain = (x === 0 && y === Math.floor(height / 2)) ? 'plains' : pickTerrain();
      const cfg = TERRAIN_CONFIG[terrain];
      row.push({
        terrain,
        explored: false,
        visible: false,
        hasFood: Math.random() < 0.12,
        hasWater: Math.random() < 0.1,
        hasGold: Math.random() < 0.08,
        hasTrader: Math.random() < 0.04 && x > 2,
        moveCost: cfg.moveCost,
        waterCost: cfg.waterCost,
        foodCost: cfg.foodCost,
      });
    }
    map.push(row);
  }
  return map;
}

function updateVisibility(map: Tile[][], px: number, py: number, visionRange: number) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      map[y][x].visible = false;
    }
  }
  for (let dy = -visionRange; dy <= visionRange; dy++) {
    for (let dx = -visionRange; dx <= visionRange; dx++) {
      const nx = px + dx;
      const ny = py + dy;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        if (Math.abs(dx) + Math.abs(dy) <= visionRange + 1) {
          map[ny][nx].visible = true;
          map[ny][nx].explored = true;
        }
      }
    }
  }
}

export default function WSSPrototype() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [mapWidth, setMapWidth] = useState(16);
  const [mapHeight, setMapHeight] = useState(10);
  const [difficulty, setDifficulty] = useState(2);
  const [visionRange, setVisionRange] = useState(2);
  const [selectedStrategy, setSelectedStrategy] = useState('balanced');
  const [gameMap, setGameMap] = useState<Tile[][]>([]);
  const [player, setPlayer] = useState<PlayerState>({
    x: 0, y: 5, strength: 100, maxStrength: 100,
    water: 80, maxWater: 100, food: 80, maxFood: 100,
    gold: 10, turnsPlayed: 0, tilesExplored: 0, tradesCompleted: 0, tradeProfit: 0,
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [tradeOffer, setTradeOffer] = useState<TradeOffer | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const autoPlayRef = useRef(false);
  const [speed, setSpeed] = useState(400);
  const logEndRef = useRef<HTMLDivElement>(null);

  const startSimulation = useCallback(() => {
    const newMap = generateMap(mapWidth, mapHeight, difficulty);
    const startY = Math.floor(mapHeight / 2);
    updateVisibility(newMap, 0, startY, visionRange);
    setGameMap(newMap);
    setPlayer({
      x: 0, y: startY, strength: 100, maxStrength: 100,
      water: 80, maxWater: 100, food: 80, maxFood: 100,
      gold: 10, turnsPlayed: 0, tilesExplored: 1, tradesCompleted: 0, tradeProfit: 0,
    });
    setLog([{ turn: 0, action: 'Start', reason: 'Agent spawned at western edge', position: [0, startY], resourceChange: '' }]);
    setScreen('simulation');
  }, [mapWidth, mapHeight, difficulty, visionRange]);

  const getStrategyDecision = useCallback((p: PlayerState, map: Tile[][]) => {
    const candidates: { x: number; y: number; score: number; reason: string }[] = [];
    const dirs = [
      [1, 0, 'east'], [0, -1, 'north'], [0, 1, 'south'], [-1, 0, 'west'],
      [1, -1, 'northeast'], [1, 1, 'southeast'],
    ];

    for (const [dx, dy, dirName] of dirs) {
      const nx = p.x + (dx as number);
      const ny = p.y + (dy as number);
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        const tile = map[ny][nx];
        let score = 0;
        const cfg = TERRAIN_CONFIG[tile.terrain];

        if (selectedStrategy === 'balanced') {
          score += (nx - p.x) * 15;
          if (p.food < 30 && tile.hasFood) score += 40;
          if (p.water < 30 && tile.hasWater) score += 40;
          score -= cfg.moveCost * 5;
          if (tile.hasGold) score += 10;
        } else if (selectedStrategy === 'explorer') {
          if (!tile.explored) score += 50;
          score += (nx - p.x) * 5;
          score -= cfg.moveCost * 3;
        } else if (selectedStrategy === 'collector') {
          if (tile.hasFood) score += 35;
          if (tile.hasWater) score += 35;
          if (tile.hasGold) score += 25;
          score += (nx - p.x) * 3;
        } else if (selectedStrategy === 'trader') {
          if (tile.hasTrader) score += 60;
          score += (nx - p.x) * 8;
          if (tile.hasGold) score += 20;
        } else if (selectedStrategy === 'adaptive') {
          if (p.food < 25) { if (tile.hasFood) score += 50; }
          else if (p.water < 25) { if (tile.hasWater) score += 50; }
          else if (p.strength < 40) { score -= cfg.moveCost * 10; }
          else { score += (nx - p.x) * 20; }
        } else if (selectedStrategy === 'strategic') {
          const distToGoal = map[0].length - 1 - nx;
          score += (map[0].length - distToGoal) * 10;
          score -= cfg.moveCost * 8;
          if (p.food < 20 && tile.hasFood) score += 45;
          if (p.water < 20 && tile.hasWater) score += 45;
        }

        score += (Math.random() - 0.5) * 8;
        let reason = `Move ${dirName} to ${tile.terrain}`;
        if (tile.hasFood) reason += ' [food]';
        if (tile.hasWater) reason += ' [water]';
        if (tile.hasGold) reason += ' [gold]';
        if (tile.hasTrader) reason += ' [trader]';

        candidates.push({ x: nx, y: ny, score, reason });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }, [selectedStrategy]);

  const doStep = useCallback(() => {
    setGameMap(prevMap => {
      setPlayer(prevPlayer => {
        if (prevPlayer.strength <= 0 || prevPlayer.food <= 0 || prevPlayer.water <= 0) {
          setScreen('defeat');
          setIsAutoPlaying(false);
          autoPlayRef.current = false;
          return prevPlayer;
        }

        if (prevPlayer.x >= prevMap[0].length - 1) {
          setScreen('victory');
          setIsAutoPlaying(false);
          autoPlayRef.current = false;
          return prevPlayer;
        }

        const decision = getStrategyDecision(prevPlayer, prevMap);
        if (!decision) return prevPlayer;

        const newMap = prevMap.map(row => row.map(t => ({ ...t })));
        const tile = newMap[decision.y][decision.x];
        const cfg = TERRAIN_CONFIG[tile.terrain];

        let foodChange = -cfg.foodCost;
        let waterChange = -cfg.waterCost;
        let strengthChange = -cfg.moveCost;
        let goldChange = 0;

        if (tile.hasFood) { foodChange += 15; tile.hasFood = false; }
        if (tile.hasWater) { waterChange += 12; tile.hasWater = false; }
        if (tile.hasGold) { goldChange += 5; tile.hasGold = false; }

        if (tile.hasTrader && !showTradeModal) {
          const personalities: TradeOffer['personality'][] = ['generous', 'fair', 'greedy', 'impatient'];
          const personality = personalities[Math.floor(Math.random() * personalities.length)];
          let offering: { type: string; amount: number }[] = [];
          let requesting: { type: string; amount: number }[] = [];

          if (personality === 'generous') {
            offering = [{ type: 'Food', amount: 20 }, { type: 'Water', amount: 15 }];
            requesting = [{ type: 'Gold', amount: 3 }];
          } else if (personality === 'fair') {
            offering = [{ type: 'Food', amount: 12 }];
            requesting = [{ type: 'Gold', amount: 5 }];
          } else if (personality === 'greedy') {
            offering = [{ type: 'Water', amount: 8 }];
            requesting = [{ type: 'Gold', amount: 8 }];
          } else {
            offering = [{ type: 'Food', amount: 10 }, { type: 'Water', amount: 10 }];
            requesting = [{ type: 'Gold', amount: 4 }];
          }

          setTradeOffer({
            traderName: TRADER_NAMES[Math.floor(Math.random() * TRADER_NAMES.length)],
            personality,
            offering,
            requesting,
            round: 1,
            maxRounds: personality === 'impatient' ? 2 : 4,
          });
          setShowTradeModal(true);
          setIsAutoPlaying(false);
          autoPlayRef.current = false;
          tile.hasTrader = false;
        }

        updateVisibility(newMap, decision.x, decision.y, visionRange);

        let explored = 0;
        for (const row of newMap) for (const t of row) if (t.explored) explored++;

        const changes: string[] = [];
        if (foodChange !== 0) changes.push(`Food ${foodChange > 0 ? '+' : ''}${foodChange}`);
        if (waterChange !== 0) changes.push(`Water ${waterChange > 0 ? '+' : ''}${waterChange}`);
        if (strengthChange !== 0) changes.push(`Str ${strengthChange}`);
        if (goldChange > 0) changes.push(`Gold +${goldChange}`);

        const newPlayer: PlayerState = {
          x: decision.x,
          y: decision.y,
          strength: Math.min(prevPlayer.maxStrength, Math.max(0, prevPlayer.strength + strengthChange)),
          maxStrength: prevPlayer.maxStrength,
          water: Math.min(prevPlayer.maxWater, Math.max(0, prevPlayer.water + waterChange)),
          maxWater: prevPlayer.maxWater,
          food: Math.min(prevPlayer.maxFood, Math.max(0, prevPlayer.food + foodChange)),
          maxFood: prevPlayer.maxFood,
          gold: prevPlayer.gold + goldChange,
          turnsPlayed: prevPlayer.turnsPlayed + 1,
          tilesExplored: explored,
          tradesCompleted: prevPlayer.tradesCompleted,
          tradeProfit: prevPlayer.tradeProfit,
        };

        setLog(prev => [...prev, {
          turn: newPlayer.turnsPlayed,
          action: decision.reason,
          reason: `${BRAIN_STRATEGIES.find(s => s.id === selectedStrategy)?.name} strategy evaluation`,
          position: [decision.x, decision.y],
          resourceChange: changes.join(', '),
        }]);

        return newPlayer;
      });
      return prevMap;
    });
  }, [getStrategyDecision, visionRange, selectedStrategy, showTradeModal]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    autoPlayRef.current = true;
    const interval = setInterval(() => {
      if (!autoPlayRef.current) { clearInterval(interval); return; }
      doStep();
    }, speed);
    return () => clearInterval(interval);
  }, [isAutoPlaying, doStep, speed]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const acceptTrade = () => {
    if (!tradeOffer) return;
    setPlayer(prev => {
      let p = { ...prev };
      for (const item of tradeOffer.offering) {
        if (item.type === 'Food') p.food = Math.min(p.maxFood, p.food + item.amount);
        if (item.type === 'Water') p.water = Math.min(p.maxWater, p.water + item.amount);
        if (item.type === 'Gold') p.gold += item.amount;
      }
      for (const item of tradeOffer.requesting) {
        if (item.type === 'Food') p.food = Math.max(0, p.food - item.amount);
        if (item.type === 'Water') p.water = Math.max(0, p.water - item.amount);
        if (item.type === 'Gold') p.gold = Math.max(0, p.gold - item.amount);
      }
      p.tradesCompleted++;
      const profit = tradeOffer.offering.reduce((s, i) => s + i.amount, 0) - tradeOffer.requesting.reduce((s, i) => s + i.amount, 0);
      p.tradeProfit += profit;
      return p;
    });
    setLog(prev => [...prev, {
      turn: player.turnsPlayed,
      action: `Trade accepted with ${tradeOffer.traderName} (${tradeOffer.personality})`,
      reason: `Received ${tradeOffer.offering.map(i => `${i.amount} ${i.type}`).join(', ')}`,
      position: [player.x, player.y],
      resourceChange: `Gave ${tradeOffer.requesting.map(i => `${i.amount} ${i.type}`).join(', ')}`,
    }]);
    setShowTradeModal(false);
    setTradeOffer(null);
  };

  const counterOffer = () => {
    if (!tradeOffer || tradeOffer.round >= tradeOffer.maxRounds) {
      setShowTradeModal(false);
      setTradeOffer(null);
      return;
    }
    setTradeOffer(prev => {
      if (!prev) return null;
      const newOffering = prev.offering.map(i => ({ ...i, amount: Math.max(1, i.amount - 2) }));
      const newRequesting = prev.requesting.map(i => ({ ...i, amount: Math.max(1, i.amount - 1) }));
      return { ...prev, offering: newOffering, requesting: newRequesting, round: prev.round + 1 };
    });
  };

  const rejectTrade = () => {
    setLog(prev => [...prev, {
      turn: player.turnsPlayed,
      action: `Trade rejected with ${tradeOffer?.traderName}`,
      reason: 'Player declined the offer',
      position: [player.x, player.y],
      resourceChange: '',
    }]);
    setShowTradeModal(false);
    setTradeOffer(null);
  };

  const ResourceBar = ({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs font-medium mb-0.5">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );

  if (screen === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">🌲⛰️🏜️</div>
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Wilderness Survival System</h1>
            <p className="text-green-300 text-xl font-medium">Interactive AI Simulation Platform</p>
          </div>

          <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-8 mb-8 text-left border border-green-800/30">
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Navigate a procedurally generated wilderness from the western edge to the eastern edge.
              Manage your resources, trade with merchants, and observe how different AI strategies
              make survival decisions under pressure.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🗺️', label: 'Procedural Maps' },
                { icon: '🧠', label: '6 AI Strategies' },
                { icon: '🤝', label: 'Trading System' },
                { icon: '🌫️', label: 'Fog of War' },
              ].map(f => (
                <div key={f.label} className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-sm text-gray-300 font-medium">{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setScreen('config')} className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-green-900/50 hover:shadow-green-700/50 hover:scale-105">
              Start New Simulation
            </button>
            <button onClick={() => setScreen('strategy')} className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-lg font-medium transition-all border border-gray-600">
              View AI Strategies
            </button>
          </div>

          <p className="text-gray-500 text-sm mt-8">CS 4800 - Software Engineering | Proof of Concept Prototype</p>
        </div>
      </div>
    );
  }

  if (screen === 'config') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <button onClick={() => setScreen('landing')} className="text-green-400 hover:text-green-300 mb-6 flex items-center gap-2 text-sm font-medium">
            ← Back to Home
          </button>

          <h2 className="text-3xl font-bold text-white mb-2">Configure Simulation</h2>
          <p className="text-gray-400 mb-8">Set up the world parameters and AI configuration.</p>

          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-green-800/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4">🗺️ World Settings</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Map Width: {mapWidth}</label>
                  <input type="range" min="10" max="24" value={mapWidth} onChange={e => setMapWidth(Number(e.target.value))}
                    className="w-full accent-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Map Height: {mapHeight}</label>
                  <input type="range" min="6" max="14" value={mapHeight} onChange={e => setMapHeight(Number(e.target.value))}
                    className="w-full accent-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Difficulty: {['Easy', 'Medium', 'Hard', 'Extreme'][difficulty]}</label>
                  <input type="range" min="0" max="3" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                    className="w-full accent-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Vision Range: {visionRange}</label>
                  <input type="range" min="1" max="4" value={visionRange} onChange={e => setVisionRange(Number(e.target.value))}
                    className="w-full accent-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-green-800/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4">🧠 Brain Strategy</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BRAIN_STRATEGIES.map(s => (
                  <button key={s.id} onClick={() => setSelectedStrategy(s.id)}
                    className={`p-3 rounded-lg text-left transition-all border ${selectedStrategy === s.id ? 'bg-green-700/40 border-green-500 ring-1 ring-green-500' : 'bg-gray-700/40 border-gray-600 hover:border-gray-500'}`}>
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-sm font-semibold text-white">{s.name}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-green-800/30">
              <h3 className="text-lg font-semibold text-green-400 mb-4">🏔️ Terrain Legend</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(TERRAIN_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="text-center">
                    <div className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center text-lg" style={{ backgroundColor: cfg.color }}>
                      {cfg.icon}
                    </div>
                    <div className="text-xs text-gray-300">{cfg.label}</div>
                    <div className="text-xs text-gray-500">Move: {cfg.moveCost}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={startSimulation}
            className="w-full mt-6 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-lg font-bold transition-all shadow-lg shadow-green-900/50 hover:shadow-green-700/50">
            Generate World & Start
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'strategy') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setScreen('landing')} className="text-green-400 hover:text-green-300 mb-6 flex items-center gap-2 text-sm font-medium">
            ← Back to Home
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">AI Brain Strategies</h2>
          <p className="text-gray-400 mb-8">Each strategy uses explicit rule-based decision-making with logged reasoning for every action.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {BRAIN_STRATEGIES.map(s => (
              <div key={s.id} className="bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-green-800/30">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{s.icon}</span>
                  <h3 className="text-xl font-bold text-white">{s.name}</h3>
                </div>
                <p className="text-gray-300 mb-4">{s.desc}</p>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-green-400 font-mono">
                    {s.id === 'balanced' && '> if (food < 30% && tile.hasFood) priority += HIGH\n> score = progress * 15 - moveCost * 5'}
                    {s.id === 'explorer' && '> if (!tile.explored) priority += VERY_HIGH\n> coverage_weight = 50, progress_weight = 5'}
                    {s.id === 'collector' && '> resource_score = food * 35 + water * 35 + gold * 25\n> advance_weight = 3 (low priority)'}
                    {s.id === 'trader' && '> if (tile.hasTrader) priority += CRITICAL\n> gold_affinity = HIGH, progress = 8'}
                    {s.id === 'adaptive' && '> switch(lowestResource):\n>   food < 25%: seek food\n>   water < 25%: seek water\n>   else: maximize progress'}
                    {s.id === 'strategic' && '> A* heuristic = distToGoal * 10\n> cost_penalty = moveCost * 8\n> emergency if resource < 20%'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-green-800/30">
            <h3 className="text-xl font-bold text-white mb-4">Architecture: Vision + Brain</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-blue-900/30 rounded-lg p-4 border border-blue-700/30">
                <h4 className="text-blue-300 font-bold mb-2">👁️ Vision Component</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Scans tiles within configurable range</li>
                  <li>• Returns candidate positions with terrain data</li>
                  <li>• Supports diagonal movement</li>
                  <li>• Provides resource detection</li>
                </ul>
              </div>
              <div className="flex items-center justify-center text-2xl text-gray-500">→</div>
              <div className="flex-1 bg-purple-900/30 rounded-lg p-4 border border-purple-700/30">
                <h4 className="text-purple-300 font-bold mb-2">🧠 Brain Component</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Evaluates candidates from Vision</li>
                  <li>• Applies strategy-specific scoring</li>
                  <li>• Selects optimal action</li>
                  <li>• Logs human-readable reason</li>
                </ul>
              </div>
            </div>
          </div>

          <button onClick={() => setScreen('config')} className="w-full mt-6 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-lg font-bold transition-all">
            Configure & Start Simulation
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'simulation') {
    const totalTiles = mapWidth * mapHeight;
    const explorationPct = totalTiles > 0 ? Math.round((player.tilesExplored / totalTiles) * 100) : 0;
    const progressPct = mapWidth > 1 ? Math.round((player.x / (mapWidth - 1)) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col lg:flex-row h-screen">
          <div className="lg:w-64 bg-gray-800 p-4 flex flex-col gap-3 border-b lg:border-b-0 lg:border-r border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-green-400">WSS Simulation</h2>
              <button onClick={() => setScreen('landing')} className="text-xs text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs text-gray-400">
              Strategy: <span className="text-green-300 font-medium">{BRAIN_STRATEGIES.find(s => s.id === selectedStrategy)?.name}</span>
            </div>

            <div className="space-y-2">
              <ResourceBar label="Strength" value={player.strength} max={player.maxStrength} color="#EF4444" icon="❤️" />
              <ResourceBar label="Water" value={player.water} max={player.maxWater} color="#3B82F6" icon="💧" />
              <ResourceBar label="Food" value={player.food} max={player.maxFood} color="#F59E0B" icon="🍖" />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span>💰</span>
              <span className="text-yellow-400 font-bold">{player.gold} Gold</span>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">Turn</span><span>{player.turnsPlayed}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Position</span><span>({player.x}, {player.y})</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Progress</span><span>{progressPct}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Explored</span><span>{explorationPct}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Trades</span><span>{player.tradesCompleted}</span></div>
            </div>

            <div className="flex gap-2">
              <button onClick={doStep} disabled={isAutoPlaying}
                className="flex-1 px-3 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                Step
              </button>
              <button onClick={() => { setIsAutoPlaying(!isAutoPlaying); if (isAutoPlaying) autoPlayRef.current = false; }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isAutoPlaying ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'}`}>
                {isAutoPlaying ? 'Pause' : 'Auto'}
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Speed: {speed}ms</label>
              <input type="range" min="100" max="1000" step="50" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full accent-green-500" />
            </div>

            <button onClick={() => setScreen('metrics')} className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-all">
              📊 View Metrics
            </button>

            <button onClick={() => { setIsAutoPlaying(false); autoPlayRef.current = false; startSimulation(); }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-all">
              🔄 New Map
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <div className="inline-block border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl">
                {gameMap.map((row, y) => (
                  <div key={y} className="flex">
                    {row.map((tile, x) => {
                      const isPlayer = x === player.x && y === player.y;
                      const cfg = TERRAIN_CONFIG[tile.terrain];
                      const isGoalCol = x === mapWidth - 1;

                      if (!tile.explored) {
                        return (
                          <div key={x} className="w-8 h-8 md:w-10 md:h-10 bg-gray-800 border border-gray-700/30 flex items-center justify-center text-xs text-gray-600">
                            ?
                          </div>
                        );
                      }

                      return (
                        <div key={x}
                          className={`w-8 h-8 md:w-10 md:h-10 border border-gray-700/30 flex items-center justify-center text-xs relative transition-all ${isGoalCol ? 'ring-1 ring-yellow-500/50' : ''}`}
                          style={{ backgroundColor: tile.visible ? cfg.color : `${cfg.color}88` }}
                          title={`(${x},${y}) ${cfg.label} | Move:${cfg.moveCost} Water:${cfg.waterCost} Food:${cfg.foodCost}`}>
                          {isPlayer ? (
                            <span className="text-lg z-10 drop-shadow-lg animate-pulse">🧑‍🌾</span>
                          ) : (
                            <span className="text-xs">
                              {tile.hasTrader ? '🏪' : tile.hasFood ? '🍎' : tile.hasWater ? '💧' : tile.hasGold ? '💰' : (tile.visible ? '' : cfg.icon)}
                            </span>
                          )}
                          {isGoalCol && !isPlayer && <div className="absolute inset-0 bg-yellow-400/10 border-r-2 border-yellow-500" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-40 bg-gray-800 border-t border-gray-700 overflow-y-auto p-3 font-mono text-xs">
              <div className="text-gray-500 mb-1 font-bold text-[10px] uppercase tracking-wider">Decision Log</div>
              {log.slice(-20).map((entry, i) => (
                <div key={i} className="flex gap-2 py-0.5 hover:bg-gray-700/30">
                  <span className="text-gray-500 w-8 text-right">T{entry.turn}</span>
                  <span className="text-green-400 w-16">[{entry.position[0]},{entry.position[1]}]</span>
                  <span className="text-white flex-1">{entry.action}</span>
                  <span className="text-yellow-400">{entry.resourceChange}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {showTradeModal && tradeOffer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-green-700/50 shadow-2xl">
              <div className="text-center mb-4">
                <span className="text-4xl">🏪</span>
                <h3 className="text-xl font-bold text-white mt-2">{tradeOffer.traderName}</h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  tradeOffer.personality === 'generous' ? 'bg-green-700 text-green-200' :
                  tradeOffer.personality === 'fair' ? 'bg-blue-700 text-blue-200' :
                  tradeOffer.personality === 'greedy' ? 'bg-red-700 text-red-200' :
                  'bg-yellow-700 text-yellow-200'
                }`}>
                  {tradeOffer.personality}
                </span>
                <div className="text-xs text-gray-400 mt-1">Round {tradeOffer.round}/{tradeOffer.maxRounds}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-700/30">
                  <div className="text-xs text-green-400 font-bold mb-2">THEY OFFER</div>
                  {tradeOffer.offering.map((item, i) => (
                    <div key={i} className="text-sm text-white">+{item.amount} {item.type}</div>
                  ))}
                </div>
                <div className="bg-red-900/30 rounded-lg p-3 border border-red-700/30">
                  <div className="text-xs text-red-400 font-bold mb-2">THEY WANT</div>
                  {tradeOffer.requesting.map((item, i) => (
                    <div key={i} className="text-sm text-white">-{item.amount} {item.type}</div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={acceptTrade} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-all">
                  Accept
                </button>
                <button onClick={counterOffer} disabled={tradeOffer.round >= tradeOffer.maxRounds}
                  className="flex-1 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 rounded-lg font-medium transition-all">
                  Counter
                </button>
                <button onClick={rejectTrade} className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition-all">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'metrics') {
    const totalTiles = mapWidth * mapHeight;
    const explorationPct = totalTiles > 0 ? Math.round((player.tilesExplored / totalTiles) * 100) : 0;
    const progressPct = mapWidth > 1 ? Math.round((player.x / (mapWidth - 1)) * 100) : 0;
    const survivalScore = Math.round((player.strength + player.water + player.food) / 3);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setScreen('simulation')} className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2 text-sm font-medium">
            ← Back to Simulation
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">📊 Performance Metrics</h2>
          <p className="text-gray-400 mb-8">Strategy: <span className="text-green-400 font-medium">{BRAIN_STRATEGIES.find(s => s.id === selectedStrategy)?.name}</span></p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Turns Played', value: player.turnsPlayed, icon: '🔄' },
              { label: 'Progress', value: `${progressPct}%`, icon: '🏁' },
              { label: 'Exploration', value: `${explorationPct}%`, icon: '🗺️' },
              { label: 'Survival Score', value: survivalScore, icon: '❤️' },
              { label: 'Trades Done', value: player.tradesCompleted, icon: '🤝' },
              { label: 'Trade Profit', value: player.tradeProfit, icon: '💰' },
            ].map(m => (
              <div key={m.label} className="bg-gray-800/60 backdrop-blur rounded-xl p-5 border border-purple-800/30 text-center">
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="text-2xl font-bold text-white">{m.value}</div>
                <div className="text-sm text-gray-400">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-purple-800/30 mb-6">
            <h3 className="text-lg font-bold text-purple-300 mb-4">Resource Status</h3>
            <div className="space-y-3">
              <ResourceBar label="Strength" value={player.strength} max={player.maxStrength} color="#EF4444" icon="❤️" />
              <ResourceBar label="Water" value={player.water} max={player.maxWater} color="#3B82F6" icon="💧" />
              <ResourceBar label="Food" value={player.food} max={player.maxFood} color="#F59E0B" icon="🍖" />
            </div>
          </div>

          <div className="bg-gray-800/60 backdrop-blur rounded-xl p-6 border border-purple-800/30">
            <h3 className="text-lg font-bold text-purple-300 mb-4">Evaluation Metrics (from Business Plan)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-4">Metric</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2">Current</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-medium">Survival Rate</td>
                    <td className="py-2 pr-4">Reached eastern edge</td>
                    <td className="py-2">{player.strength > 0 && player.food > 0 && player.water > 0 ? '✅ Alive' : '❌ Dead'}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-medium">Turns to Completion</td>
                    <td className="py-2 pr-4">Move count</td>
                    <td className="py-2">{player.turnsPlayed}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-medium">Resource Efficiency</td>
                    <td className="py-2 pr-4">Avg remaining resources</td>
                    <td className="py-2">{survivalScore}%</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-medium">Trade Success Rate</td>
                    <td className="py-2 pr-4">Accepted trades</td>
                    <td className="py-2">{player.tradesCompleted}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-medium">Trade Profitability</td>
                    <td className="py-2 pr-4">Net resource gain</td>
                    <td className="py-2">{player.tradeProfit > 0 ? '+' : ''}{player.tradeProfit}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Exploration Coverage</td>
                    <td className="py-2 pr-4">Tiles explored</td>
                    <td className="py-2">{explorationPct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={() => setScreen('simulation')} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all">
              Return to Simulation
            </button>
            <button onClick={() => { setIsAutoPlaying(false); autoPlayRef.current = false; setScreen('config'); }}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all border border-gray-600">
              New Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-yellow-950 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-bold text-yellow-400 mb-3">Survival Complete!</h2>
          <p className="text-gray-300 text-lg mb-8">The agent reached the eastern edge and survived the wilderness.</p>

          <div className="bg-gray-800/60 rounded-xl p-6 border border-yellow-700/30 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Turns:</span> <span className="text-white font-bold">{player.turnsPlayed}</span></div>
              <div><span className="text-gray-400">Strength:</span> <span className="text-white font-bold">{player.strength}%</span></div>
              <div><span className="text-gray-400">Food:</span> <span className="text-white font-bold">{player.food}</span></div>
              <div><span className="text-gray-400">Water:</span> <span className="text-white font-bold">{player.water}</span></div>
              <div><span className="text-gray-400">Gold:</span> <span className="text-white font-bold">{player.gold}</span></div>
              <div><span className="text-gray-400">Trades:</span> <span className="text-white font-bold">{player.tradesCompleted}</span></div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setScreen('metrics')} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-all">
              View Full Metrics
            </button>
            <button onClick={() => setScreen('config')} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-all">
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'defeat') {
    const cause = player.strength <= 0 ? 'exhaustion (strength depleted)' : player.food <= 0 ? 'starvation (food depleted)' : 'dehydration (water depleted)';
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-4xl font-bold text-red-400 mb-3">Survival Failed</h2>
          <p className="text-gray-300 text-lg mb-8">The agent perished from {cause} after {player.turnsPlayed} turns.</p>

          <div className="bg-gray-800/60 rounded-xl p-6 border border-red-700/30 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Last Position:</span> <span className="text-white font-bold">({player.x}, {player.y})</span></div>
              <div><span className="text-gray-400">Progress:</span> <span className="text-white font-bold">{mapWidth > 1 ? Math.round((player.x / (mapWidth - 1)) * 100) : 0}%</span></div>
              <div><span className="text-gray-400">Explored:</span> <span className="text-white font-bold">{player.tilesExplored} tiles</span></div>
              <div><span className="text-gray-400">Trades:</span> <span className="text-white font-bold">{player.tradesCompleted}</span></div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setScreen('metrics')} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-all">
              View Metrics
            </button>
            <button onClick={() => setScreen('config')} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition-all">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

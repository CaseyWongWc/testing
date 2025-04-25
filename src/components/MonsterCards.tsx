import React, { useState, useEffect, useRef } from 'react';
import { Bot, HelpCircle, Play, Pause, Timer, FastForward, ArrowRight, Shield, Swords, Zap, Brain, Coins, History, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MonsterCard {
  id: number;
  name: string;
  attack: number;
  defense: number;
  speed: number;
  cost: number;
}

interface Trade {
  card: MonsterCard;
  cost: number;
  timestamp: number;
  accepted: boolean;
  aiReasoning?: string;
}

interface Robot {
  money: number;
  cards: MonsterCard[];
  lastDecision: string;
  aiThoughts: string;
}

interface RobotAction {
  type: 'accept' | 'reject' | 'leave';
  cardName: string;
  reason: string;
  timestamp: number;
}

interface OfferEvaluation {
  valueScore: number;
  worthiness: number;
  recommendation: 'accept' | 'reject';
  reasons: string[];
  statComparison: {
    attack: { current: number; change: number };
    defense: { current: number; change: number };
    speed: { current: number; change: number };
  };
}

const INITIAL_CARDS = [
  {
    id: 0.1,
    name: 'Pikachu',
    attack: 3,
    defense: 2,
    speed: 4,
    cost: 90
  },
  {
    id: 0.2,
    name: 'Snorlax',
    attack: 1,
    defense: 5,
    speed: -1,
    cost: 50
  }
];

const POKEMON_NAMES = [
  'Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle', 'Mewtwo',
  'Gengar', 'Gyarados', 'Dragonite', 'Snorlax', 'Eevee',
  'Jigglypuff', 'Machamp', 'Alakazam', 'Lapras', 'Vaporeon'
];

const INITIAL_MONEY = 100;
const MONEY_PER_TRADE = 10;

const calculateCardValue = (card: MonsterCard): number => {
  // Calculate base value from positive stats
  const positiveValue = Math.max(0, card.attack) + Math.max(0, card.defense) + Math.max(0, card.speed);
  
  // Calculate penalties from negative stats
  const negativeValue = Math.abs(Math.min(0, card.attack)) + 
                       Math.abs(Math.min(0, card.defense)) + 
                       Math.abs(Math.min(0, card.speed));
  
  // Return final value
  return positiveValue - (negativeValue * 0.5);
};

const MonsterCards: React.FC = () => {
  const [robot, setRobot] = useState<Robot>({
    money: INITIAL_MONEY,
    cards: INITIAL_CARDS,
    lastDecision: '',
    aiThoughts: ''
  });
  
  const [currentCard, setCurrentCard] = useState<MonsterCard | null>(null);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showLegend, setShowLegend] = useState(true);
  const [aiMode, setAiMode] = useState<'balanced' | 'aggressive' | 'defensive'>('balanced');
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [decisionTimer, setDecisionTimer] = useState<number>(0);
  const [robotActions, setRobotActions] = useState<RobotAction[]>([]);
  const [continuousPlay, setContinuousPlay] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<OfferEvaluation | null>(null);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const leaveButtonRef = useRef<HTMLButtonElement>(null);

  const generateMonsterCard = (): MonsterCard => {
    const generateStat = () => {
      const isNegative = Math.random() < 0.2;
      const value = Math.floor(Math.random() * 5) + 1;
      return isNegative ? -value : value;
    };

    const attack = generateStat();
    const defense = generateStat();
    const speed = generateStat();
    
    const cost = Math.max(10, Math.floor(
      (Math.abs(attack) + Math.abs(defense) + Math.abs(speed)) * 10 -
      (attack < 0 ? 20 : 0) -
      (defense < 0 ? 20 : 0) -
      (speed < 0 ? 20 : 0)
    ));
    
    return {
      id: Math.random(),
      name: POKEMON_NAMES[Math.floor(Math.random() * POKEMON_NAMES.length)],
      attack,
      defense,
      speed,
      cost
    };
  };

  const executeAiAction = (action: 'accept' | 'reject' | 'leave', card: MonsterCard) => {
    if (!isAiEnabled) return;

    switch (action) {
      case 'accept':
        if (robot.money >= card.cost) {
          acceptButtonRef.current?.click();
        } else {
          rejectButtonRef.current?.click();
        }
        break;
      case 'reject':
        rejectButtonRef.current?.click();
        break;
      case 'leave':
        leaveButtonRef.current?.click();
        break;
    }

    setRobotActions(prev => [{
      type: action,
      cardName: card.name,
      reason: robot.aiThoughts.split('\n').pop() || 'Decision based on current strategy',
      timestamp: Date.now()
    }, ...prev.slice(0, 4)]);
  };

  const evaluateTrade = (card: MonsterCard) => {
    let valueScore = 0;
    let thoughts = [];
    const cardMetrics = calculateCardValue(card);
    let actionReason = '';

    setEvaluationProgress(0);
    const evalInterval = setInterval(() => {
      setEvaluationProgress(prev => {
        if (prev >= 100) {
          clearInterval(evalInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    const avgStats = {
      attack: robot.cards.reduce((acc, c) => acc + c.attack, 0) / robot.cards.length,
      defense: robot.cards.reduce((acc, c) => acc + c.defense, 0) / robot.cards.length,
      speed: robot.cards.reduce((acc, c) => acc + c.speed, 0) / robot.cards.length,
    };

    thoughts.push(
      "Current Collection Analysis:",
      `Average Stats: Attack=${avgStats.attack.toFixed(1)}, Defense=${avgStats.defense.toFixed(1)}, Speed=${avgStats.speed.toFixed(1)}`,
      "\nNew Card Analysis:"
    );

    switch (aiMode) {
      case 'aggressive':
        valueScore = (
          Math.max(0, card.attack) * 4 + 
          Math.max(0, card.speed) * 3 + 
          Math.max(0, card.defense)
        ) / 8;
        
        valueScore -= Math.abs(Math.min(0, card.attack)) * 2;
        valueScore -= Math.abs(Math.min(0, card.speed)) * 1.5;
        valueScore -= Math.abs(Math.min(0, card.defense)) * 0.5;

        thoughts.push(
          "Aggressive Evaluation:",
          `Attack value (${Math.max(0, card.attack) * 4}/20)`,
          `Speed value (${Math.max(0, card.speed) * 3}/15)`,
          `Defense value (${Math.max(0, card.defense)}/5)`,
          `Negative stat penalties: -${Math.abs(Math.min(0, card.attack)) * 2 + Math.abs(Math.min(0, card.speed)) * 1.5 + Math.abs(Math.min(0, card.defense)) * 0.5}`,
          `Card power rating: ${valueScore.toFixed(2)}`
        );
        break;

      case 'defensive':
        valueScore = (
          Math.max(0, card.defense) * 4 + 
          Math.max(0, card.attack) + 
          Math.max(0, card.speed)
        ) / 6;
        
        valueScore -= Math.abs(Math.min(0, card.defense)) * 3;
        valueScore -= Math.abs(Math.min(0, card.attack)) * 0.5;
        valueScore -= Math.abs(Math.min(0, card.speed)) * 0.5;

        thoughts.push(
          "Defensive Evaluation:",
          `Defense value (${Math.max(0, card.defense) * 4}/20)`,
          `Support stats (${Math.max(0, card.attack) + Math.max(0, card.speed)}/10)`,
          `Negative stat penalties: -${Math.abs(Math.min(0, card.defense)) * 3 + Math.abs(Math.min(0, card.attack)) * 0.5 + Math.abs(Math.min(0, card.speed)) * 0.5}`,
          `Card power rating: ${valueScore.toFixed(2)}`
        );
        break;

      case 'balanced':
      default:
        valueScore = (
          Math.max(0, card.attack) * 2 + 
          Math.max(0, card.defense) * 2 + 
          Math.max(0, card.speed) * 2
        ) / 6;
        
        valueScore -= Math.abs(Math.min(0, card.attack));
        valueScore -= Math.abs(Math.min(0, card.defense));
        valueScore -= Math.abs(Math.min(0, card.speed));

        thoughts.push(
          "Balanced Evaluation:",
          `Positive stats value: ${(Math.max(0, card.attack) + Math.max(0, card.defense) + Math.max(0, card.speed)) * 2}/30`,
          `Negative stats penalty: -${Math.abs(Math.min(0, card.attack)) + Math.abs(Math.min(0, card.defense)) + Math.abs(Math.min(0, card.speed))}`,
          `Card power rating: ${valueScore.toFixed(2)}`
        );
        break;
    }

    const costRatio = card.cost / robot.money;
    const thresholds = {
      aggressive: 0.6,
      defensive: 0.8,
      balanced: 0.7
    };

    const threshold = thresholds[aiMode];
    const worthiness = valueScore / (costRatio * threshold);
    
    actionReason = worthiness > 1 
      ? `Good value (${worthiness.toFixed(2)}) for money and aligns with ${aiMode} strategy`
      : `Poor value (${worthiness.toFixed(2)}) or doesn't align with ${aiMode} strategy`;

    setCurrentEvaluation({
      valueScore,
      worthiness,
      recommendation: worthiness > 1 ? 'accept' : 'reject',
      reasons: [
        `${card.name} offers ${valueScore.toFixed(1)} value in ${aiMode} mode`,
        `Cost ratio: ${(costRatio * 100).toFixed(1)}% of current money`,
        actionReason
      ],
      statComparison: {
        attack: { 
          current: avgStats.attack, 
          change: card.attack - avgStats.attack 
        },
        defense: { 
          current: avgStats.defense, 
          change: card.defense - avgStats.defense 
        },
        speed: { 
          current: avgStats.speed, 
          change: card.speed - avgStats.speed 
        }
      }
    });

    setRobot(prev => ({
      ...prev,
      aiThoughts: thoughts.join('\n')
    }));

    const shouldAccept = worthiness > 1;
    const action = shouldAccept ? 'accept' : 'reject';
    
    if (isAiEnabled) {
      setTimeout(() => {
        executeAiAction(action, card);
      }, 5000);
    }

    return shouldAccept;
  };

  const handleTrade = (accept: boolean) => {
    if (!currentCard) return;
    
    if (accept && robot.money < currentCard.cost) {
      const reason = `Cannot afford ${currentCard.name} (Cost: ${currentCard.cost}, Money: ${robot.money})`;
      
      setRobot(prev => ({
        ...prev,
        money: prev.money + MONEY_PER_TRADE,
        lastDecision: reason,
        aiThoughts: isAiEnabled ? `${prev.aiThoughts}\n${reason}` : ''
      }));

      if (isAiEnabled) {
        setRobotActions(prev => [{
          type: 'reject',
          cardName: currentCard.name,
          reason,
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]);
      }

      setTrades(prev => [{
        card: currentCard,
        cost: currentCard.cost,
        timestamp: Date.now(),
        accepted: false,
        aiReasoning: reason
      }, ...prev.slice(0, 9)]);

      if (continuousPlay) {
        const newCard = generateMonsterCard();
        setCurrentCard(newCard);
        if (isAiEnabled) {
          evaluateTrade(newCard);
        }
      } else {
        setCurrentCard(null);
      }
      return;
    }
    
    if (accept) {
      const reason = `Accepted trade for ${currentCard.name}`;
      setRobot(prev => ({
        ...prev,
        money: prev.money - currentCard.cost + MONEY_PER_TRADE,
        cards: [...prev.cards, currentCard],
        lastDecision: reason,
        aiThoughts: isAiEnabled ? `${prev.aiThoughts}\n${reason}` : ''
      }));

      if (isAiEnabled) {
        setRobotActions(prev => [{
          type: 'accept',
          cardName: currentCard.name,
          reason,
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]);
      }
    } else {
      const reason = `Rejected trade for ${currentCard.name}`;
      setRobot(prev => ({
        ...prev,
        money: prev.money + MONEY_PER_TRADE,
        lastDecision: reason,
        aiThoughts: isAiEnabled ? `${prev.aiThoughts}\n${reason}` : ''
      }));

      if (isAiEnabled) {
        setRobotActions(prev => [{
          type: 'reject',
          cardName: currentCard.name,
          reason,
          timestamp: Date.now()
        }, ...prev.slice(0, 4)]);
      }
    }

    setTrades(prev => [{
      card: currentCard,
      cost: currentCard.cost,
      timestamp: Date.now(),
      accepted: accept,
      aiReasoning: robot.aiThoughts
    }, ...prev.slice(0, 9)]);

    if (continuousPlay) {
      const newCard = generateMonsterCard();
      setCurrentCard(newCard);
      if (isAiEnabled) {
        evaluateTrade(newCard);
      }
    } else {
      setCurrentCard(null);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      if (!continuousPlay) return;

      if (!currentCard) {
        const newCard = generateMonsterCard();
        setCurrentCard(newCard);
        
        if (isAiEnabled) {
          evaluateTrade(newCard);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (continuousPlay) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [continuousPlay, currentCard, isAiEnabled]);

  return (
    <div className="flex gap-8">
      <div className="w-64 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Robot Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  Money
                </span>
                <span>{robot.money}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${(robot.money / 200) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                +{MONEY_PER_TRADE} coins per trade
              </div>
            </div>
            
            {isAiEnabled && decisionTimer > 0 && (
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Decision Timer
                  </span>
                  <span>{Math.ceil(decisionTimer)}s</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${(decisionTimer / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Last Decision: {robot.lastDecision || 'None'}
          </div>
          {isAiEnabled && robot.aiThoughts && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="font-medium">AI Thoughts</span>
              </div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {robot.aiThoughts}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Collected Cards ({robot.cards.length})</h2>
          <div className="space-y-2">
            {robot.cards.map(card => (
              <div key={card.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{card.name}</div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Swords className="w-4 h-4" /> {card.attack}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" /> {card.defense}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" /> {card.speed}
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {card.cost}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <button
            onClick={() => {
              setRobot({
                money: INITIAL_MONEY,
                cards: [],
                lastDecision: '',
                aiThoughts: ''
              });
              setTrades([]);
              setCurrentCard(null);
              setContinuousPlay(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
          <button
            onClick={() => {
              if (continuousPlay) {
                setContinuousPlay(false);
              } else {
                setContinuousPlay(true);
                if (!currentCard) {
                  const newCard = generateMonsterCard();
                  setCurrentCard(newCard);
                  
                  if (isAiEnabled) {
                    evaluateTrade(newCard);
                  }
                }
              }
            }}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              continuousPlay
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {continuousPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {continuousPlay ? 'Stop' : 'Start'} Continuous Play
          </button>
          <button
            onClick={() => {
              setIsAiEnabled(!isAiEnabled);
              setRobot(prev => ({ ...prev, aiThoughts: '' }));
            }}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              isAiEnabled 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            {isAiEnabled ? 'Disable AI' : 'Enable AI'}
          </button>
          {isAiEnabled && (
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => setAiMode('balanced')}
                className={`px-4 py-2 transition-colors ${
                  aiMode === 'balanced'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Balanced
              </button>
              <button
                onClick={() => setAiMode('aggressive')}
                className={`px-4 py-2 transition-colors ${
                  aiMode === 'aggressive'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Aggressive
              </button>
              <button
                onClick={() => setAiMode('defensive')}
                className={`px-4 py-2 transition-colors ${
                  aiMode === 'defensive'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Defensive
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
            <Timer className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 w-12">{moveSpeed.toFixed(1)}x</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={moveSpeed}
              onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
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
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600">Attack (1-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Defense (1-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">Speed (1-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">Cost in Coins</span>
            </div>
            {isAiEnabled && (
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600">AI Mode: {aiMode}</span>
              </div>
            )}
          </div>
        )}

        {currentCard && (
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>Current Offer</span>
              {isAiEnabled && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Analyzing...</span>
                </div>
              )}
            </h3>
            <div className="space-y-4">
              <div className="text-center text-2xl font-medium">{currentCard.name}</div>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <Swords className="w-8 h-8 text-orange-500 mx-auto mb-1" />
                  <div className="text-xl font-bold">{currentCard.attack}</div>
                  <div className="text-sm text-gray-600">Attack</div>
                </div>
                <div className="text-center">
                  <Shield className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                  <div className="text-xl font-bold">{currentCard.defense}</div>
                  <div className="text-sm text-gray-600">Defense</div>
                </div>
                <div className="text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                  <div className="text-xl font-bold">{currentCard.speed}</div>
                  <div className="text-sm text-gray-600">Speed</div>
                </div>
              </div>
              
              {isAiEnabled && currentEvaluation && (
                <div className="space-y-3 border-t border-b py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">AI Evaluation</span>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${evaluationProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  {evaluationProgress === 100 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Recommendation:</span>
                        <div className={`flex items-center gap-1 ${
                          currentEvaluation.recommendation === 'accept' 
                            ? 'text-green-500' 
                            : 'text-red-500'
                        }`}>
                          {currentEvaluation.recommendation === 'accept' 
                            ? <ThumbsUp className="w-4 h-4" />
                            : <ThumbsDown className="w-4 h-4" />
                          }
                          <span className="capitalize">{currentEvaluation.recommendation}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {Object.entries(currentEvaluation.statComparison).map(([stat, values]) => (
                          <div key={stat} className="flex justify-between items-center text-sm">
                            <span className="capitalize">{stat}:</span>
                            <div className="flex items-center gap-2">
                              <span>{values.current.toFixed(1)}</span>
                              <span className={values.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {values.change >= 0 ? '+' : ''}{values.change.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm text-gray-600">
                        {currentEvaluation.reasons.map((reason, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span>•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="text-center font-medium mb-2">Trade Cost</div>
                <div className="flex items-center justify-center gap-2 text-xl">
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <span className="text-red-500">{currentCard.cost}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  ref={acceptButtonRef}
                  onClick={() => handleTrade(true)}
                  className={`flex-1 px-4 py-2 rounded transition-colors ${
                    robot.money >= currentCard.cost
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                  disabled={isAiEnabled}
                >
                  Accept Trade
                </button>
                <button
                  ref={rejectButtonRef}
                  onClick={() => handleTrade(false)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  disabled={isAiEnabled}
                >
                  Reject Trade
                </button>
                <button
                  ref={leaveButtonRef}
                  onClick={() => {
                    if (currentCard) {
                      setCurrentCard(null);
                      setTrades(prev => [{
                        card: currentCard,
                        cost: currentCard.cost,
                        timestamp: Date.now(),
                        accepted: false
                      }, ...prev.slice(0, 9)]);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  disabled={isAiEnabled}
                >
                  Leave Trade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="w-80 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            Robot Actions
          </h3>
          <div className="space-y-2">
            {robotActions.map((action, index) => (
              <div 
                key={index}
                className={`p-2 rounded ${
                  action.type === 'accept' 
                    ? 'bg-green-50' 
                    : action.type === 'reject'
                    ? 'bg-red-50'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bot className={`w-4 h-4 ${
                    action.type === 'accept'
                      ? 'text-green-500'
                      : action.type === 'reject'
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`} />
                  <span className="font-medium">
                    {action.type === 'accept' ? 'Accepted' : action.type === 'reject' ? 'Rejected' : 'Left'} {action.cardName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{action.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FastForward className="w-5 h-5 text-blue-500" />
            Trade History
          </h3>
          <div className="space-y-3">
            {trades.map((trade, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${
                  trade.accepted ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{trade.card.name}</div>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span>{trade.card.attack}A</span>
                      <span>{trade.card.defense}D</span>
                      <span>{trade.card.speed}S</span>
                      <span className="flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {trade.cost}
                      </span>
                    </div>
                    {trade.aiReasoning && (
                      <div className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">
                        {trade.aiReasoning}
                      </div>
                    )}
                  </div>
                  <div className={`text-sm ${
                    trade.accepted ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trade.accepted ? 'Accepted' : 'Declined'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonsterCards;
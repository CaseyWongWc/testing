import React, { useState, useEffect, useRef } from 'react';
import { Bot, HelpCircle, Play, Pause, Timer, FastForward, Trophy, Brain, Swords } from 'lucide-react';

interface Robot {
  id: number;
  name: string;
  color: string;
  wins: number;
  lastMove: 'rock' | 'paper' | 'scissors' | null;
  strategy: 'random' | 'learning' | 'pattern';
  moveHistory: ('rock' | 'paper' | 'scissors')[];
}

interface Match {
  robot1Move: 'rock' | 'paper' | 'scissors';
  robot2Move: 'rock' | 'paper' | 'scissors';
  winner: number | null;
  timestamp: number;
}

const RockPaperScissors: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([
    {
      id: 1,
      name: 'Alpha',
      color: 'blue',
      wins: 0,
      lastMove: null,
      strategy: 'random',
      moveHistory: []
    },
    {
      id: 2,
      name: 'Beta',
      color: 'red',
      wins: 0,
      lastMove: null,
      strategy: 'learning',
      moveHistory: []
    }
  ]);

  const [matches, setMatches] = useState<Match[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveSpeed, setMoveSpeed] = useState(1.0);
  const [showLegend, setShowLegend] = useState(true);
  const [totalGames, setTotalGames] = useState(0);
  const [draws, setDraws] = useState(0);

  const lastFrameTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const determineWinner = (move1: 'rock' | 'paper' | 'scissors', move2: 'rock' | 'paper' | 'scissors'): number | null => {
    if (move1 === move2) return null;
    if (
      (move1 === 'rock' && move2 === 'scissors') ||
      (move1 === 'paper' && move2 === 'rock') ||
      (move1 === 'scissors' && move2 === 'paper')
    ) {
      return 1;
    }
    return 2;
  };

  const getNextMove = (robot: Robot): 'rock' | 'paper' | 'scissors' => {
    const moves: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
    
    switch (robot.strategy) {
      case 'learning':
        // Simple learning: Counter the most common move from opponent
        if (robot.moveHistory.length > 0) {
          const opponentHistory = robots.find(r => r.id !== robot.id)?.moveHistory || [];
          if (opponentHistory.length > 0) {
            const mostCommonMove = opponentHistory
              .reduce((acc, move) => {
                acc[move] = (acc[move] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
            
            const predictedMove = Object.entries(mostCommonMove)
              .sort((a, b) => b[1] - a[1])[0][0] as 'rock' | 'paper' | 'scissors';
            
            // Return counter move
            if (predictedMove === 'rock') return 'paper';
            if (predictedMove === 'paper') return 'scissors';
            return 'rock';
          }
        }
        return moves[Math.floor(Math.random() * moves.length)];

      case 'pattern':
        // Use a simple pattern: rock -> paper -> scissors -> repeat
        const lastMove = robot.moveHistory[robot.moveHistory.length - 1];
        if (!lastMove) return 'rock';
        if (lastMove === 'rock') return 'paper';
        if (lastMove === 'paper') return 'scissors';
        return 'rock';

      case 'random':
      default:
        return moves[Math.floor(Math.random() * moves.length)];
    }
  };

  const playRound = () => {
    const robot1Move = getNextMove(robots[0]);
    const robot2Move = getNextMove(robots[1]);
    
    const winner = determineWinner(robot1Move, robot2Move);
    
    setRobots(prev => prev.map(robot => ({
      ...robot,
      lastMove: robot.id === 1 ? robot1Move : robot2Move,
      moveHistory: [...robot.moveHistory, robot.id === 1 ? robot1Move : robot2Move],
      wins: winner === robot.id ? robot.wins + 1 : robot.wins
    })));

    setMatches(prev => [{
      robot1Move,
      robot2Move,
      winner,
      timestamp: Date.now()
    }, ...prev.slice(0, 9)]);

    setTotalGames(prev => prev + 1);
    if (winner === null) {
      setDraws(prev => prev + 1);
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (!isAnimating) return;

      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      accumulatedTimeRef.current += deltaTime;
      const frameTime = moveSpeed * 1000;

      if (accumulatedTimeRef.current >= frameTime) {
        accumulatedTimeRef.current = 0;
        playRound();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, moveSpeed]);

  const getMoveIcon = (move: 'rock' | 'paper' | 'scissors' | null) => {
    switch (move) {
      case 'rock': return '✊';
      case 'paper': return '✋';
      case 'scissors': return '✌️';
      default: return '❔';
    }
  };

  return (
    <div className="flex gap-8">
      <div className="space-y-4">
        {robots.map(robot => (
          <div 
            key={robot.id}
            className={`bg-white p-6 rounded-lg shadow-md w-80`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Bot className={`w-6 h-6 text-${robot.color}-500`} />
              <h3 className="text-xl font-bold">{robot.name}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-4xl">{getMoveIcon(robot.lastMove)}</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{robot.wins}</div>
                  <div className="text-sm text-gray-600">Wins</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Strategy
                  </span>
                  <span className="capitalize">{robot.strategy}</span>
                </div>
                <select
                  value={robot.strategy}
                  onChange={(e) => setRobots(prev => prev.map(r => 
                    r.id === robot.id 
                      ? { ...r, strategy: e.target.value as 'random' | 'learning' | 'pattern' }
                      : r
                  ))}
                  className="w-full mt-2 p-2 border rounded"
                  disabled={isAnimating}
                >
                  <option value="random">Random</option>
                  <option value="learning">Learning</option>
                  <option value="pattern">Pattern</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white p-6 rounded-lg shadow-md w-80">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Statistics
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Games:</span>
              <span>{totalGames}</span>
            </div>
            <div className="flex justify-between">
              <span>Draws:</span>
              <span>{draws}</span>
            </div>
            <div className="flex justify-between">
              <span>Win Rate:</span>
              <span>
                {robots[0].name}: {totalGames > 0 ? ((robots[0].wins / totalGames) * 100).toFixed(1) : 0}%
                <br />
                {robots[1].name}: {totalGames > 0 ? ((robots[1].wins / totalGames) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          <button
            onClick={() => {
              setRobots(prev => prev.map(robot => ({
                ...robot,
                wins: 0,
                lastMove: null,
                moveHistory: []
              })));
              setMatches([]);
              setTotalGames(0);
              setDraws(0);
              setIsAnimating(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset Game
          </button>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAnimating ? 'Stop' : 'Start'} Game
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded">
            <Timer className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 w-12">{moveSpeed.toFixed(1)}s</span>
            <input
              type="range"
              min="0.2"
              max="2"
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
              <span className="text-2xl">✊</span>
              <span className="text-sm text-gray-600">Rock (beats Scissors)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✋</span>
              <span className="text-sm text-gray-600">Paper (beats Rock)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✌️</span>
              <span className="text-sm text-gray-600">Scissors (beats Paper)</span>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Swords className="w-6 h-6 text-purple-500" />
            Match History
          </h3>
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg ${
                  match.winner === null 
                    ? 'bg-gray-50' 
                    : match.winner === 1 
                    ? 'bg-blue-50'
                    : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-3xl">{getMoveIcon(match.robot1Move)}</div>
                    <div className="text-sm text-gray-600">{robots[0].name}</div>
                  </div>
                  <div className="text-xl font-bold">VS</div>
                  <div className="text-center">
                    <div className="text-3xl">{getMoveIcon(match.robot2Move)}</div>
                    <div className="text-sm text-gray-600">{robots[1].name}</div>
                  </div>
                </div>
                <div className="text-center mt-2 text-sm">
                  {match.winner === null 
                    ? "Draw!" 
                    : `${robots[match.winner - 1].name} wins!`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissors;
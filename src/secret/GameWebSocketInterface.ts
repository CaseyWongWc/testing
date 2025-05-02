import React, { useEffect, useState } from 'react';
import { WebSocketClient } from '../utils/WebSocketClient';
import { Bot, HelpCircle } from 'lucide-react';

// Import game types
import { 
  Player, Enemy, Cell, AmmoCache, Spawner, GameState,
  GameUpdateMessage, PlayerActionMessage, GameStatusMessage
} from './GameTypes';

/**
 * Custom hook for WebSocket game communication
 */
export const useGameWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [gameUpdates, setGameUpdates] = useState<GameUpdateMessage[]>([]);
  const [playerActions, setPlayerActions] = useState<PlayerActionMessage[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatusMessage | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsClient.initializeSocket();

    // Set up connection status handlers
    wsClient.onConnect(() => {
      setIsConnected(true);
    });

    wsClient.onDisconnect(() => {
      setIsConnected(false);
    });

    // Game update handler
    const handleGameUpdate = (data: GameUpdateMessage) => {
      setLastMessage(data);
      setGameUpdates(prev => [...prev, data]);
    };

    // Player action handler
    const handlePlayerAction = (data: PlayerActionMessage) => {
      setLastMessage(data);
      setPlayerActions(prev => [...prev, data]);
      
      // You can add additional logic here to update local state based on actions
    };

    // Game status handler
    const handleGameStatus = (data: GameStatusMessage) => {
      setLastMessage(data);
      setGameStatus(data);
    };

    // Register message handlers
    wsClient.on('game_update', handleGameUpdate);
    wsClient.on('player_action', handlePlayerAction);
    wsClient.on('game_status', handleGameStatus);

    // Clean up on unmount
    return () => {
      wsClient.off('game_update', handleGameUpdate);
      wsClient.off('player_action', handlePlayerAction);
      wsClient.off('game_status', handleGameStatus);
    };
  }, []);

  /**
   * Send a game update to all connected clients
   */
  const sendGameUpdate = (
    players: Player[], 
    enemies: Enemy[], 
    gameState: GameState, 
    map?: Cell[][]
  ) => {
    return wsClient.send('game_update', {
      players,
      enemies,
      gameState,
      map
    });
  };

  /**
   * Send a player action to the server
   */
  const sendPlayerAction = (
    playerId: number,
    action: PlayerActionMessage['action']
  ) => {
    return wsClient.send('player_action', {
      playerId,
      action
    });
  };

  /**
   * Send a game status update
   */
  const sendGameStatus = (
    status: 'start' | 'pause' | 'resume' | 'end',
    wave?: number,
    day?: number
  ) => {
    return wsClient.send('game_status', {
      status,
      wave,
      day
    });
  };

  /**
   * Clear game update history
   */
  const clearUpdates = () => {
    setGameUpdates([]);
    setPlayerActions([]);
  };

  return {
    isConnected,
    lastMessage,
    gameUpdates,
    playerActions,
    gameStatus,
    sendGameUpdate,
    sendPlayerAction,
    sendGameStatus,
    clearUpdates
  };
};

interface WebSocketConnectionStatusProps {
  className?: string;
}

export const WebSocketConnectionStatus: React.FC<WebSocketConnectionStatusProps> = ({ className }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState<number | null>(null);

  useEffect(() => {
    const client = WebSocketClient.getInstance();

    const handleConnect = () => {
      setIsConnected(true);
      setLastPing(Date.now());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handlePong = () => {
      setLastPing(Date.now());
    };

    client.on('connect', handleConnect);
    client.on('disconnect', handleDisconnect);
    client.on('pong', handlePong);

    // Ping every 5 seconds
    const pingInterval = setInterval(() => {
      client.send({ type: 'ping' });
    }, 5000);

    return () => {
      client.off('connect', handleConnect);
      client.off('disconnect', handleDisconnect);
      client.off('pong', handlePong);
      clearInterval(pingInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-1 text-xs">
      <div 
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
        title={isConnected ? 'Connected' : 'Disconnected'}
      />
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      {lastPing && <span className="text-gray-500">({Math.floor((Date.now() - lastPing) / 1000)}s)</span>}
    </div>
  );
};

/**
 * Player connection status component
 */
export const PlayerConnectionStatus: React.FC<{
  playerId: number;
  isConnected: boolean;
  playerName: string;
}> = ({ playerId, isConnected, playerName }) => {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
      <Bot size={16} className={isConnected ? 'text-green-500' : 'text-red-500'} />
      <span className="text-sm font-medium">{playerName}</span>
      <div 
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
      />
    </div>
  );
};

export default useGameWebSocket;
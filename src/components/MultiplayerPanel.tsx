import { useState, useEffect } from 'react';
import { WebSocketConnectionStatus } from '../secret/GameWebSocketInterface';
import { Bot, Users } from 'lucide-react';
import wsClient from '../utils/WebSocketClient';

interface MultiplayerPanelProps {
  className?: string;
}

const MultiplayerPanel: React.FC<MultiplayerPanelProps> = ({ className = '' }) => {
  const [playerCount, setPlayerCount] = useState(0);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    // Initialize WebSocket connection
    wsClient.initializeSocket();

    // Set up message handlers
    const handleRoomUpdate = (data: any) => {
      if (data.playerCount !== undefined) {
        setPlayerCount(data.playerCount);
      }
    };

    const handleJoinResponse = (data: any) => {
      if (data.success && data.playerId) {
        setPlayerId(data.playerId);
        setIsJoined(true);
      }
    };

    wsClient.on('room_update', handleRoomUpdate);
    wsClient.on('join_response', handleJoinResponse);

    // Clean up on unmount
    return () => {
      wsClient.off('room_update', handleRoomUpdate);
      wsClient.off('join_response', handleJoinResponse);
    };
  }, []);

  const joinGame = () => {
    if (!playerName.trim()) return;
    
    wsClient.send('join_game', {
      name: playerName,
      roomCode: roomCode || undefined
    });
  };

  const leaveGame = () => {
    if (playerId === null) return;
    
    wsClient.send('leave_game', {
      playerId
    });
    
    setPlayerId(null);
    setIsJoined(false);
  };

  const createRoom = () => {
    wsClient.send('create_room', {});
  };

  return (
    <div className={`bg-gray-800 text-white p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Multiplayer</h3>
        <WebSocketConnectionStatus />
      </div>
      
      {!isJoined ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Room Code (optional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none"
              placeholder="Enter room code to join"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={joinGame}
              className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
              disabled={!playerName.trim()}
            >
              <Users size={16} />
              <span>Join Game</span>
            </button>
            
            <button
              onClick={createRoom}
              className="px-3 py-2 bg-purple-600 rounded hover:bg-purple-700"
            >
              Create Room
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-green-500" />
              <span>{playerName}</span>
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">ID: {playerId}</span>
            </div>
            <button
              onClick={leaveGame}
              className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-700"
            >
              Leave
            </button>
          </div>
          
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-sm text-gray-300 mb-1">Players in room:</div>
            <div className="flex items-center gap-1">
              <Users size={16} className="text-blue-400" />
              <span>{playerCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerPanel;
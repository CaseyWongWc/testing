import { useState, useEffect, useRef } from 'react';
import wsClient from '../utils/WebSocketClient';

interface WebSocketStatusProps {
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = '' }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'chat' | 'game_update' | 'player_action'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsClient.initializeSocket();

    // Set up connection status handlers
    wsClient.onConnect(() => {
      setConnected(true);
      console.log('WebSocket connected (from component)');
    });

    wsClient.onDisconnect(() => {
      setConnected(false);
      console.log('WebSocket disconnected (from component)');
    });

    // Set up message handler for all messages
    const handleMessage = (data: any) => {
      setMessages(prev => [...prev, { ...data, receivedAt: new Date().toISOString() }]);
    };

    wsClient.on('connect', handleMessage);
    wsClient.on('game_update', handleMessage);
    wsClient.on('player_action', handleMessage);
    wsClient.on('pong', handleMessage);
    wsClient.on('chat', handleMessage);

    // Clean up on unmount
    return () => {
      wsClient.off('connect', handleMessage);
      wsClient.off('game_update', handleMessage);
      wsClient.off('player_action', handleMessage);
      wsClient.off('pong', handleMessage);
      wsClient.off('chat', handleMessage);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (messageText.trim() === '') return;
    
    let payload: any = {};
    
    switch (messageType) {
      case 'chat':
        payload = { message: messageText.trim() };
        break;
      case 'game_update':
        try {
          payload = JSON.parse(messageText);
        } catch (e) {
          payload = { error: 'Invalid JSON', message: messageText };
        }
        break;
      case 'player_action':
        try {
          payload = JSON.parse(messageText);
        } catch (e) {
          payload = { 
            playerId: 1, 
            action: {
              type: 'move',
              target: { x: 10, y: 10 }
            }
          };
        }
        break;
    }
    
    const success = wsClient.send(messageType, payload);
    if (success) {
      setMessages(prev => [...prev, { 
        type: `${messageType} (sent)`, 
        ...payload, 
        sentAt: new Date().toISOString() 
      }]);
      setMessageText('');
    }
  };

  const sendPing = () => {
    wsClient.send('ping', {});
    setMessages(prev => [...prev, { 
      type: 'ping (sent)', 
      sentAt: new Date().toISOString() 
    }]);
  };

  const reconnect = () => {
    wsClient.close();
    setTimeout(() => {
      wsClient.initializeSocket();
    }, 500);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className={`bg-gray-800 text-white p-4 rounded-lg ${className}`}>
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={sendPing}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
          >
            Ping
          </button>
          <button 
            onClick={reconnect}
            className="px-3 py-1 bg-purple-600 rounded hover:bg-purple-700 text-sm"
          >
            Reconnect
          </button>
          <button 
            onClick={clearMessages}
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex mb-2">
        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value as any)}
          className="bg-gray-700 rounded-l px-2 py-2 focus:outline-none"
        >
          <option value="chat">Chat</option>
          <option value="game_update">Game Update</option>
          <option value="player_action">Player Action</option>
        </select>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 px-3 py-2 bg-gray-700 focus:outline-none"
          placeholder={
            messageType === 'chat' 
              ? "Enter chat message..." 
              : "Enter JSON payload..."
          }
        />
        <button 
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 rounded-r hover:bg-blue-700"
        >
          Send
        </button>
      </div>
      
      <div className="h-60 overflow-y-auto bg-gray-900 p-2 rounded text-xs">
        {messages.length === 0 ? (
          <div className="text-gray-500 italic">No messages yet...</div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div key={index} className="mb-2">
                <div className="font-semibold text-blue-400 flex justify-between">
                  <span>{msg.type}</span>
                  <span className="text-gray-500 text-xs">
                    {msg.sentAt || msg.receivedAt || ''}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto text-green-200">
                  {JSON.stringify(msg, (key, value) => 
                    key === 'type' || key === 'sentAt' || key === 'receivedAt' 
                      ? undefined 
                      : value, 2)}
                </pre>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        <p>Server WebSocket URL: {window.location.protocol === "https:" ? "wss:" : "ws:"}//{window.location.host}/ws</p>
        <p>Connected clients: {connected ? "1" : "0"}</p>
      </div>
    </div>
  );
};

export default WebSocketStatus;
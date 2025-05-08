import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  clientId: string;
  type: string;
  message: string;
  timestamp: string;
}

// Mock data for when the WebSocket server isn't available
const mockInitialMessages: Message[] = [
  {
    clientId: "system",
    type: "system",
    message: "Welcome to the WebSocket Chat demo",
    timestamp: new Date().toISOString()
  },
  {
    clientId: "server",
    type: "chat",
    message: "This is a demonstration of real-time WebSocket chat functionality",
    timestamp: new Date().toISOString()
  },
  {
    clientId: "server",
    type: "chat",
    message: "In a production environment, messages would be sent and received in real-time between all connected clients",
    timestamp: new Date().toISOString()
  }
];

const WebSocketChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockInitialMessages);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>("demo-user");
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      if (connectionAttempts >= 3) {
        console.log('Switching to demo mode after multiple failed connection attempts');
        setDemoMode(true);
        setMessages(mockInitialMessages);
        return;
      }

      // Get the protocol (wss for https, ws for http)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Use port 3001 for WebSocket connection with the current host
      const hostWithoutPort = window.location.hostname;
      
      // Create WebSocket URL with the ws path
      const wsUrl = `${protocol}//${hostWithoutPort}:3001/ws`;
      console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
      
      try {
        // Create new WebSocket connection
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Handle connection open
        socket.onopen = () => {
          console.log('WebSocket connection established');
          setConnected(true);
          setConnectionAttempts(0); // Reset connection attempts
          
          // Add a system message
          setMessages(prev => [...prev, {
            clientId: 'system',
            type: 'system',
            message: 'Connected to the server',
            timestamp: new Date().toISOString()
          }]);
        };
        
        // Handle incoming messages
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as Message;
            console.log('Received message:', data);
            
            // If this is the initial connection, store the client ID
            if (data.type === 'connect' && data.clientId) {
              setClientId(data.clientId);
            }
            
            // Add the message to our messages array
            setMessages(prev => [...prev, data]);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };
        
        // Handle connection close
        socket.onclose = () => {
          console.log('WebSocket connection closed');
          setConnected(false);
          
          // Add a system message
          setMessages(prev => [...prev, {
            clientId: 'system',
            type: 'system',
            message: 'Disconnected from the server',
            timestamp: new Date().toISOString()
          }]);
          
          // Increment connection attempts
          setConnectionAttempts(prev => prev + 1);
          
          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };
        
        // Handle connection errors
        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          
          // Add an error message
          setMessages(prev => [...prev, {
            clientId: 'system',
            type: 'error',
            message: 'Connection error occurred',
            timestamp: new Date().toISOString()
          }]);
          
          // We'll let onclose handle the reconnection
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionAttempts(prev => prev + 1);
        
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      }
    };
    
    // Initialize connection
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectionAttempts]);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send a message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    
    const timestamp = new Date().toISOString();
    
    if (demoMode) {
      // In demo mode, simulate sending a message
      const userMessage: Message = {
        clientId: clientId || 'user',
        type: 'chat',
        message: input,
        timestamp: timestamp
      };
      
      // Add the message to our state
      setMessages(prev => [...prev, userMessage]);
      
      // Simulate a response after a short delay
      setTimeout(() => {
        const responses = [
          "That's interesting! Tell me more.",
          "I understand what you mean.",
          "Thanks for sharing that information.",
          "Could you elaborate on that?",
          "That's a great point!"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage: Message = {
          clientId: 'server',
          type: 'chat',
          message: randomResponse,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, 1000);
      
      setInput('');
      return;
    }
    
    // Normal WebSocket mode
    if (!socketRef.current || !connected) return;
    
    const message = {
      type: 'chat',
      message: input,
      timestamp: timestamp
    };
    
    socketRef.current.send(JSON.stringify(message));
    setInput('');
  }, [input, connected, demoMode, clientId]);
  
  // Handle message input form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };
  
  // Format the timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-3">
        <h2 className="text-lg font-semibold">WebSocket Chat</h2>
        <div className="text-sm">
          {demoMode ? (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
              Demo Mode (Server connection unavailable)
            </span>
          ) : connected ? (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              Connected (ID: {clientId || 'connecting...'})
            </span>
          ) : (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
              Disconnected - Trying to reconnect...
            </span>
          )}
        </div>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, index) => {
          const isSystem = msg.clientId === 'system';
          const isCurrentUser = msg.clientId === clientId;
          const isJoinLeave = msg.type === 'user_joined' || msg.type === 'user_left';
          
          if (isSystem || isJoinLeave) {
            return (
              <div 
                key={index} 
                className="text-center my-2"
              >
                <span className={`inline-block px-3 py-1 text-sm rounded-full
                  ${isJoinLeave ? 'bg-blue-100 text-blue-800' : 
                    msg.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
                >
                  {msg.message}
                </span>
              </div>
            );
          }
          
          return (
            <div 
              key={index} 
              className={`mb-3 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`rounded-lg px-4 py-2 max-w-xs
                  ${isCurrentUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'}`}
              >
                {!isCurrentUser && (
                  <div className="text-xs font-medium mb-1">
                    {msg.clientId.substring(0, 6)}
                  </div>
                )}
                <div>{msg.message}</div>
                <div className={`text-xs mt-1 text-right
                  ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-gray-200">
        <div className="flex p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!connected && !demoMode}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={(!connected && !demoMode) || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
      
      {demoMode && (
        <div className="bg-yellow-50 p-3 text-sm border-t border-yellow-100">
          <p className="text-yellow-800">
            <strong>Demo Mode Active:</strong> The WebSocket server is currently unavailable. 
            You are using a simulated chat interface. Messages are not being sent to a real server.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebSocketChat;
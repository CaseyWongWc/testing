import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface DrawData {
  clientId: string;
  color: string;
  points: Point[];
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  clientId: string;
  data?: any;
  timestamp: string;
}

interface ClientInfo {
  id: string;
  color: string;
  isDrawing: boolean;
}

const CollaborativeDrawing: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentClient, setCurrentClient] = useState<ClientInfo | null>(null);
  const [clients, setClients] = useState<Map<string, ClientInfo>>(new Map());
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const currentDrawingRef = useRef<Point[]>([]);
  const lastPositionRef = useRef<Point | null>(null);
  
  // Generate a random color
  const getRandomColor = () => {
    const colors = [
      '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', 
      '#ffff00', '#ff8000', '#8000ff', '#0080ff', '#ff0080'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      if (connectionAttempts >= 3) {
        console.log('Switching to demo mode after multiple failed connection attempts');
        setDemoMode(true);
        setConnected(true);
        
        // Create a demo client
        const demoClientId = 'demo-user-' + Math.random().toString(36).substring(2, 6);
        const demoColor = getRandomColor();
        
        setCurrentClient({
          id: demoClientId,
          color: demoColor,
          isDrawing: false
        });
        
        // Add some demo clients
        const demoClients = new Map<string, ClientInfo>();
        demoClients.set('demo-1', {
          id: 'demo-1',
          color: getRandomColor(),
          isDrawing: false
        });
        
        setClients(demoClients);
        return;
      }

      // Get the protocol (wss for https, ws for http)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // In Replit environment, we need to use the same host
      const host = window.location.host;
      
      // Create WebSocket URL with the ws path
      const wsUrl = `${protocol}//${host}/ws`;
      console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
      
      try {
        // Create new WebSocket connection
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        
        // Handle connection open
        socket.onopen = () => {
          console.log('Drawing WebSocket connection established');
          setConnected(true);
          setConnectionAttempts(0); // Reset connection attempts
        };
        
        // Handle incoming messages
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            
            // Handle different message types
            switch (message.type) {
              case 'connect':
                // This is our client ID from the server
                const newClientColor = getRandomColor();
                const clientInfo = {
                  id: message.clientId,
                  color: newClientColor,
                  isDrawing: false
                };
                setCurrentClient(clientInfo);
                setCurrentColor(newClientColor);
                break;
                
              case 'user_joined':
                // Another user joined
                if (message.clientId !== currentClient?.id) {
                  setClients(prev => {
                    const newClients = new Map(prev);
                    newClients.set(message.clientId, {
                      id: message.clientId,
                      color: getRandomColor(),
                      isDrawing: false
                    });
                    return newClients;
                  });
                }
                break;
                
              case 'user_left':
                // A user left
                setClients(prev => {
                  const newClients = new Map(prev);
                  newClients.delete(message.clientId);
                  return newClients;
                });
                break;
                
              case 'draw_start':
                // Another user started drawing
                if (message.clientId !== currentClient?.id) {
                  setClients(prev => {
                    const newClients = new Map(prev);
                    const client = newClients.get(message.clientId);
                    if (client) {
                      client.isDrawing = true;
                      newClients.set(message.clientId, client);
                    } else {
                      newClients.set(message.clientId, {
                        id: message.clientId,
                        color: message.data.color || getRandomColor(),
                        isDrawing: true
                      });
                    }
                    return newClients;
                  });
                }
                break;
                
              case 'draw_end':
                // Another user stopped drawing
                if (message.clientId !== currentClient?.id) {
                  setClients(prev => {
                    const newClients = new Map(prev);
                    const client = newClients.get(message.clientId);
                    if (client) {
                      client.isDrawing = false;
                      newClients.set(message.clientId, client);
                    }
                    return newClients;
                  });
                }
                break;
                
              case 'draw_data':
                // Received drawing data from another user
                if (message.clientId !== currentClient?.id && message.data) {
                  drawRemoteStroke(message.data);
                }
                break;
                
              case 'clear_canvas':
                // Clear the canvas
                clearCanvas();
                break;
            }
          } catch (error) {
            console.error('Error parsing drawing message:', error);
          }
        };
        
        // Handle connection close
        socket.onclose = () => {
          console.log('Drawing WebSocket connection closed');
          setConnected(false);
          
          // Increment connection attempts
          setConnectionAttempts(prev => prev + 1);
          
          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };
        
        // Handle connection errors
        socket.onerror = (error) => {
          console.error('Drawing WebSocket error:', error);
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
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions to match its display size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // Clear the canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);
  
  // Handle clear button click
  const handleClearCanvas = useCallback(() => {
    clearCanvas();
    
    // Send clear command to other users
    if (socketRef.current && connected && currentClient) {
      socketRef.current.send(JSON.stringify({
        type: 'clear_canvas',
        clientId: currentClient.id,
        timestamp: new Date().toISOString()
      }));
    }
  }, [connected, currentClient, clearCanvas]);
  
  // Draw a line on the canvas
  const drawLine = useCallback((start: Point, end: Point, color: string, width: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);
  
  // Draw a remote user's stroke
  const drawRemoteStroke = useCallback((data: DrawData) => {
    if (!data.points || data.points.length < 2) return;
    
    // Get client info to determine color
    const clientInfo = clients.get(data.clientId);
    const color = clientInfo?.color || data.color || '#000000';
    
    // Draw each segment of the stroke
    for (let i = 1; i < data.points.length; i++) {
      drawLine(data.points[i-1], data.points[i], color, strokeWidth);
    }
  }, [clients, drawLine, strokeWidth]);
  
  // Handle mouse/touch down event
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!connected || !currentClient) return;
    
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Store the starting point
    lastPositionRef.current = { x, y };
    currentDrawingRef.current = [{ x, y }];
    
    // Send draw start message
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({
        type: 'draw_start',
        clientId: currentClient.id,
        data: {
          color: currentColor
        },
        timestamp: new Date().toISOString()
      }));
    }
  }, [connected, currentClient, currentColor]);
  
  // Handle mouse/touch move event
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPositionRef.current || !connected || !currentClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw the line segment
    drawLine(lastPositionRef.current, { x, y }, currentColor, strokeWidth);
    
    // Update the last position
    lastPositionRef.current = { x, y };
    currentDrawingRef.current.push({ x, y });
  }, [isDrawing, connected, currentClient, currentColor, strokeWidth, drawLine]);
  
  // Handle mouse/touch up event
  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !connected || !currentClient) return;
    
    setIsDrawing(false);
    
    // Send the complete stroke data
    if (socketRef.current && currentDrawingRef.current.length > 1) {
      socketRef.current.send(JSON.stringify({
        type: 'draw_data',
        clientId: currentClient.id,
        data: {
          clientId: currentClient.id,
          color: currentColor,
          points: currentDrawingRef.current,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }));
      
      // Send draw end message
      socketRef.current.send(JSON.stringify({
        type: 'draw_end',
        clientId: currentClient.id,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Reset drawing state
    lastPositionRef.current = null;
    currentDrawingRef.current = [];
  }, [isDrawing, connected, currentClient, currentColor]);
  
  // Handle color change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentColor(e.target.value);
  };
  
  // Handle stroke width change
  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrokeWidth(parseInt(e.target.value));
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Collaborative Drawing</h2>
        <div className="text-sm">
          {demoMode ? (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
              Demo Mode (Server connection unavailable)
            </span>
          ) : connected ? (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
              Disconnected - Trying to reconnect...
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col p-4 bg-gray-50">
        {demoMode && (
          <div className="bg-yellow-50 p-3 mb-4 text-sm border-b border-yellow-100 rounded-lg">
            <p className="text-yellow-800">
              <strong>Demo Mode Active:</strong> The WebSocket server is currently unavailable. 
              You are using a simulated drawing interface. Strokes are not being shared with other users.
            </p>
          </div>
        )}
        
        <div className="border-2 border-gray-300 rounded-lg mb-4 bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-[400px] touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="color-picker" className="text-sm font-medium text-gray-700">
              Color:
            </label>
            <input
              type="color"
              id="color-picker"
              value={currentColor}
              onChange={handleColorChange}
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="stroke-width" className="text-sm font-medium text-gray-700">
              Stroke Width:
            </label>
            <input
              type="range"
              id="stroke-width"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={handleStrokeWidthChange}
              className="w-32"
            />
            <span className="text-sm text-gray-600 w-6">{strokeWidth}</span>
          </div>
          
          <button
            onClick={handleClearCanvas}
            className="ml-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Clear Canvas
          </button>
        </div>
        
        {connected && currentClient && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div 
              className="px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: currentClient.color, color: 'white' }}
            >
              You
            </div>
            {Array.from(clients.values()).map(client => (
              <div 
                key={client.id}
                className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                style={{ backgroundColor: client.color, color: 'white' }}
              >
                User {client.id.substring(0, 6)}
                {client.isDrawing && (
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeDrawing;
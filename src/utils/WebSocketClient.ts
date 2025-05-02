/**
 * WebSocketClient.ts
 * A utility for managing WebSocket connections in the application
 */

// Define types for WebSocket messages
export type WebSocketMessageType = 
  | 'connect'
  | 'game_update'
  | 'player_action'
  | 'ping'
  | 'pong'
  | 'join_game'
  | 'join_response'
  | 'leave_game'
  | 'leave_response'
  | 'create_room'
  | 'create_room_response'
  | 'list_rooms'
  | 'room_list'
  | 'room_update';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
  [key: string]: any;
}

export interface GameUpdateMessage extends WebSocketMessage {
  type: 'game_update';
  data: any;
}

export interface PlayerActionMessage extends WebSocketMessage {
  type: 'player_action';
  playerId: number;
  action: string;
  data?: any;
}

export interface Room {
  id: string;
  code: string;
  playerCount: number;
  isDefault: boolean;
}

// WebSocket connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Event callback types
type MessageCallback = (message: any) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private messageListeners: Map<string, Set<MessageCallback>> = new Map();
  private statusListeners: Set<StatusCallback> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private playerId: number | null = null;
  private roomId: string | null = null;

  constructor() {
    // Determine if we're in the Replit environment
    const isReplit = window.location.hostname.includes('.repl.co');
    
    // Determine protocol based on the page protocol
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss:' : 'ws:';
    
    // Get the host from the current page
    const host = window.location.host;
    
    // Determine the path - in Replit, we might need a different approach
    const path = '/ws';
    
    // Construct the WebSocket URL
    this.url = `${protocol}//${host}${path}`;
    
    console.log(`WebSocketClient: Initialized with URL: ${this.url}`);
    console.log(`WebSocketClient: Running on Replit: ${isReplit}`);
    console.log(`WebSocketClient: Using secure protocol: ${isSecure}`);
  }

  // Connect to the WebSocket server
  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.updateStatus('connecting');
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.updateStatus('error');
      this.scheduleReconnect();
    }
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      // If player is in a game, send leave message
      if (this.playerId && this.roomId) {
        this.sendMessage({
          type: 'leave_game',
          playerId: this.playerId,
          roomId: this.roomId
        });
      }
      
      this.socket.close();
      this.socket = null;
    }
    
    this.updateStatus('disconnected');
    this.playerId = null;
    this.roomId = null;
  }

  // Send a message to the server
  sendMessage(message: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket is not connected');
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Join a game room
  joinGame(playerName: string, roomCode?: string): void {
    this.sendMessage({
      type: 'join_game',
      name: playerName,
      roomCode: roomCode
    });
  }

  // Leave the current game
  leaveGame(): void {
    if (!this.playerId) {
      console.warn('Cannot leave game: Not in a game');
      return;
    }
    
    this.sendMessage({
      type: 'leave_game',
      playerId: this.playerId
    });
  }

  // Create a new game room
  createRoom(): void {
    this.sendMessage({
      type: 'create_room'
    });
  }

  // Get list of available rooms
  listRooms(): void {
    this.sendMessage({
      type: 'list_rooms'
    });
  }

  // Send a game update to all players in the room
  sendGameUpdate(data: any): void {
    this.sendMessage({
      type: 'game_update',
      data: data
    });
  }

  // Send a player action to all players in the room
  sendPlayerAction(action: string, data?: any): void {
    if (!this.playerId) {
      console.warn('Cannot send player action: Not in a game');
      return;
    }
    
    this.sendMessage({
      type: 'player_action',
      playerId: this.playerId,
      action: action,
      data: data
    });
  }

  // Add a message listener for a specific message type
  addMessageListener(type: WebSocketMessageType, callback: MessageCallback): void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, new Set());
    }
    
    this.messageListeners.get(type)?.add(callback);
  }

  // Remove a message listener
  removeMessageListener(type: WebSocketMessageType, callback: MessageCallback): void {
    const listeners = this.messageListeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Add a status change listener
  addStatusListener(callback: StatusCallback): void {
    this.statusListeners.add(callback);
    
    // Immediately call with current status
    callback(this.status);
  }

  // Remove a status change listener
  removeStatusListener(callback: StatusCallback): void {
    this.statusListeners.delete(callback);
  }

  // Get the current connection status
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Get the current player ID (if joined a game)
  getPlayerId(): number | null {
    return this.playerId;
  }

  // Get the current room ID (if joined a room)
  getRoomId(): string | null {
    return this.roomId;
  }

  // Handle socket open event
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.updateStatus('connected');
    this.startPingInterval();
  }

  // Handle received messages
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
      
      // Handle join_response message to set playerId and roomId
      if (message.type === 'join_response' && message.success) {
        this.playerId = message.playerId;
        this.roomId = message.room.id;
      }
      
      // Handle leave_response message to clear playerId and roomId
      if (message.type === 'leave_response' && message.success) {
        this.playerId = null;
        this.roomId = null;
      }
      
      // Notify all listeners for this message type
      const listeners = this.messageListeners.get(message.type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            console.error('Error in message listener callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle socket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.updateStatus('disconnected');
    this.clearTimers();
    this.scheduleReconnect();
  }

  // Handle socket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.updateStatus('error');
  }

  // Update connection status and notify listeners
  private updateStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      
      // Notify all status listeners
      this.statusListeners.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in status listener callback:', error);
        }
      });
    }
  }

  // Start the ping interval to keep the connection alive
  private startPingInterval(): void {
    this.clearTimers();
    
    this.pingInterval = window.setInterval(() => {
      this.sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }, 30000); // Send ping every 30 seconds
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer === null) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        
        // Try to connect with the current URL
        console.log(`Attempting to reconnect to: ${this.url}`);
        this.connect();
        
        // If we're in a Replit environment, try a fallback URL if this reconnect fails
        if (window.location.hostname.includes('.repl.co')) {
          // Set a timer to try a fallback in case the reconnect fails
          window.setTimeout(() => {
            if (this.status !== 'connected') {
              this.tryFallbackConnection();
            }
          }, 3000);
        }
      }, 5000); // Try to reconnect after 5 seconds
    }
  }
  
  // Try a fallback connection if the main one fails
  private tryFallbackConnection(): void {
    console.log('Trying fallback WebSocket connection...');
    
    // If we're using secure, try non-secure as a fallback, or vice versa
    const isSecure = this.url.startsWith('wss:');
    const protocol = isSecure ? 'ws:' : 'wss:';
    const host = window.location.host;
    
    // Try directly connecting to port 3001
    const fallbackUrl = `${protocol}//${host.split(':')[0]}:3001/ws`;
    
    console.log(`Fallback WebSocket URL: ${fallbackUrl}`);
    
    try {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      
      this.socket = new WebSocket(fallbackUrl);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      // Update the url if this connection works
      this.socket.addEventListener('open', () => {
        this.url = fallbackUrl;
        console.log(`Successfully connected using fallback URL: ${fallbackUrl}`);
      });
    } catch (error) {
      console.error('Error creating fallback WebSocket connection:', error);
    }
  }

  // Clear all timers
  private clearTimers(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Create and export a singleton instance
export const webSocketClient = new WebSocketClient();
export default webSocketClient;
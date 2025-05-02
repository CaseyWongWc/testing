// WebSocketClient.ts
// A utility class to handle WebSocket connections and communication

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2 seconds
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSocket();
  }

  /**
   * Initialize the WebSocket connection
   */
  initializeSocket(): void {
    try {
      // Determine the WebSocket URL based on the current protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Handle both Replit and local development environments
      let host = window.location.host;
      // When using vite dev server, we need to adjust the port
      if (host.includes('localhost') || host.includes('0.0.0.0')) {
        host = host.replace(/:(5173|3001)/, ':5000');
      } 
      
      const wsUrl = `${protocol}//${host}/ws`;
      
      // Create a new WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      console.log(`Attempting to connect to WebSocket server at ${wsUrl}`);
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    console.log('Connected to WebSocket server');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000; // Reset delay
    
    // Start ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.send('ping', {});
    }, 30000); // Send ping every 30 seconds
    
    // Call all connect handlers
    this.connectHandlers.forEach(handler => handler());
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);
      
      // If it's a pong response, we don't need to do anything further
      if (message.type === 'pong') {
        return;
      }
      
      // Call appropriate message handlers based on message type
      if (this.messageHandlers.has(message.type)) {
        const handlers = this.messageHandlers.get(message.type) || [];
        handlers.forEach(handler => handler(message));
      }
    } catch (error) {
      console.error('Error processing message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    this.isConnected = false;
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Call all disconnect handlers
    this.disconnectHandlers.forEach(handler => handler());
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
      
      // Use exponential backoff for reconnection attempts
      setTimeout(() => {
        this.reconnectAttempts++;
        this.initializeSocket();
      }, this.reconnectDelay);
      
      // Increase delay for next attempt (exponential backoff)
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Cap at 30 seconds
    } else {
      console.error('Maximum reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  send(type: string, data: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      const message: WebSocketMessage = {
        type,
        ...data,
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Register a handler for specific message types
   */
  on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)?.push(handler);
  }

  /**
   * Register a handler for connection event
   */
  onConnect(handler: ConnectionHandler): void {
    this.connectHandlers.push(handler);
    // If already connected, call handler immediately
    if (this.isConnected) {
      handler();
    }
  }

  /**
   * Register a handler for disconnection event
   */
  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandlers.push(handler);
  }

  /**
   * Remove a handler for specific message types
   */
  off(messageType: string, handler: MessageHandler): void {
    if (this.messageHandlers.has(messageType)) {
      const handlers = this.messageHandlers.get(messageType) || [];
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client closed connection');
      
      // Clear ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    }
  }

  /**
   * Check if the WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const wsClient = new WebSocketClient();
export default wsClient;
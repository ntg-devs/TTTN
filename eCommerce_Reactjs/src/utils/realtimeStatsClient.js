import io from 'socket.io-client';

/**
 * Real-time Stats Client
 * Handles WebSocket connections for real-time KOL statistics updates
 */
class RealtimeStatsClient {
  constructor() {
    this.socket = null;
    this.kolId = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  /**
   * Connect to the real-time stats WebSocket
   * @param {string} serverUrl - Socket.IO server URL
   * @param {number} kolId - KOL user ID
   * @param {string} token - JWT authentication token
   */
  connect(serverUrl, kolId, token) {
    try {
      this.kolId = kolId;
      
      // Initialize socket connection
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Set up event listeners
      this.setupEventListeners(token);
      
      console.log(`Connecting to real-time stats for KOL ${kolId}...`);
    } catch (error) {
      console.error('Error connecting to real-time stats:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up socket event listeners
   * @param {string} token - JWT authentication token
   */
  setupEventListeners(token) {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('Connected to real-time stats server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Subscribe to KOL stats updates
      this.socket.emit('subscribeKolStats', {
        kolId: this.kolId,
        token: token
      });
      
      this.triggerEvent('connected', { kolId: this.kolId });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.handleConnectionError(error);
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from real-time stats server:', reason);
      this.isConnected = false;
      this.triggerEvent('disconnected', { reason });
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.attemptReconnect(token);
      }
    });

    // Stats update received
    this.socket.on('statsUpdate', (data) => {
      console.log('Received stats update:', data);
      this.triggerEvent('statsUpdate', data);
    });

    // Global stats update received
    this.socket.on('globalStatsUpdate', (data) => {
      console.log('Received global stats update:', data);
      this.triggerEvent('globalStatsUpdate', data);
    });

    // Stats error
    this.socket.on('statsError', (error) => {
      console.error('Stats error:', error);
      this.triggerEvent('error', error);
    });
  }

  /**
   * Handle connection errors and attempt reconnection
   * @param {Error} error - Connection error
   */
  handleConnectionError(error) {
    this.isConnected = false;
    this.triggerEvent('error', error);
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.triggerEvent('maxReconnectAttemptsReached', { attempts: this.reconnectAttempts });
    }
  }

  /**
   * Attempt to reconnect to the server
   * @param {string} token - JWT authentication token
   */
  attemptReconnect(token) {
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, this.reconnectDelay);
    
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  /**
   * Disconnect from the real-time stats server
   */
  disconnect() {
    if (this.socket) {
      // Unsubscribe from stats updates
      this.socket.emit('unsubscribeKolStats', {
        kolId: this.kolId
      });
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.kolId = null;
    this.eventHandlers.clear();
    
    console.log('Disconnected from real-time stats server');
  }

  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Trigger event handlers
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  triggerEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current connection status
   * @returns {Object} Connection status information
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      kolId: this.kolId,
      reconnectAttempts: this.reconnectAttempts,
      hasSocket: !!this.socket
    };
  }

  /**
   * Request immediate stats refresh
   */
  requestStatsRefresh() {
    if (this.socket && this.isConnected) {
      this.socket.emit('requestStatsRefresh', {
        kolId: this.kolId
      });
    }
  }
}

// Create singleton instance
const realtimeStatsClient = new RealtimeStatsClient();

export default realtimeStatsClient;
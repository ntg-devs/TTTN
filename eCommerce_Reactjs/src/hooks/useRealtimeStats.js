import { useState, useEffect, useCallback, useRef } from 'react';
import realtimeStatsClient from '../utils/realtimeStatsClient';

/**
 * Custom hook for real-time KOL statistics
 * @param {Object} options - Hook options
 * @param {number} options.kolId - KOL user ID
 * @param {string} options.token - JWT authentication token
 * @param {boolean} options.autoConnect - Whether to auto-connect on mount
 * @param {string} options.serverUrl - Socket.IO server URL
 * @returns {Object} Real-time stats state and controls
 */
const useRealtimeStats = (options = {}) => {
  const {
    kolId,
    token,
    autoConnect = true,
    serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:6969'
  } = options;

  // State
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Refs to prevent stale closures
  const statsRef = useRef(stats);
  const isConnectedRef = useRef(isConnected);

  // Update refs when state changes
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Event handlers
  const handleConnected = useCallback((data) => {
    console.log('Real-time stats connected:', data);
    setIsConnected(true);
    setIsConnecting(false);
    setError(null);
  }, []);

  const handleDisconnected = useCallback((data) => {
    console.log('Real-time stats disconnected:', data);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const handleStatsUpdate = useCallback((data) => {
    console.log('Stats update received:', data);
    setStats(data.stats);
    setLastUpdate(new Date(data.timestamp));
    setError(null);
  }, []);

  const handleGlobalStatsUpdate = useCallback((data) => {
    console.log('Global stats update received:', data);
    setGlobalStats(data.globalStats);
    setStats(data.kolStats);
    setLastUpdate(new Date(data.timestamp));
    setError(null);
  }, []);

  const handleError = useCallback((error) => {
    console.error('Real-time stats error:', error);
    setError(error);
    setIsConnecting(false);
  }, []);

  const handleMaxReconnectAttempts = useCallback((data) => {
    console.error('Max reconnection attempts reached:', data);
    setError(new Error('Failed to reconnect to real-time stats server'));
    setIsConnecting(false);
    setIsConnected(false);
  }, []);

  // Connect function
  const connect = useCallback(() => {
    if (!kolId || !token) {
      setError(new Error('KOL ID and token are required'));
      return;
    }

    if (isConnectedRef.current) {
      console.log('Already connected to real-time stats');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      realtimeStatsClient.connect(serverUrl, kolId, token);
    } catch (error) {
      setError(error);
      setIsConnecting(false);
    }
  }, [kolId, token, serverUrl]);

  // Disconnect function
  const disconnect = useCallback(() => {
    realtimeStatsClient.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setStats(null);
    setGlobalStats(null);
    setError(null);
  }, []);

  // Refresh stats function
  const refreshStats = useCallback(() => {
    realtimeStatsClient.requestStatsRefresh();
  }, []);

  // Set up event listeners
  useEffect(() => {
    realtimeStatsClient.on('connected', handleConnected);
    realtimeStatsClient.on('disconnected', handleDisconnected);
    realtimeStatsClient.on('statsUpdate', handleStatsUpdate);
    realtimeStatsClient.on('globalStatsUpdate', handleGlobalStatsUpdate);
    realtimeStatsClient.on('error', handleError);
    realtimeStatsClient.on('maxReconnectAttemptsReached', handleMaxReconnectAttempts);

    return () => {
      realtimeStatsClient.off('connected', handleConnected);
      realtimeStatsClient.off('disconnected', handleDisconnected);
      realtimeStatsClient.off('statsUpdate', handleStatsUpdate);
      realtimeStatsClient.off('globalStatsUpdate', handleGlobalStatsUpdate);
      realtimeStatsClient.off('error', handleError);
      realtimeStatsClient.off('maxReconnectAttemptsReached', handleMaxReconnectAttempts);
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleStatsUpdate,
    handleGlobalStatsUpdate,
    handleError,
    handleMaxReconnectAttempts
  ]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && kolId && token && !isConnectedRef.current && !isConnecting) {
      connect();
    }
  }, [autoConnect, kolId, token, connect, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Fallback polling for when WebSocket is not available
  const [pollingInterval, setPollingInterval] = useState(null);

  const startPolling = useCallback(() => {
    if (pollingInterval) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${serverUrl}/api/affiliate/realtime-stats?kolId=${kolId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.errCode === 0) {
            setStats(data.data.kolStats);
            setLastUpdate(new Date(data.data.timestamp));
            setError(null);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        setError(error);
      }
    }, 30000); // Poll every 30 seconds

    setPollingInterval(interval);
  }, [serverUrl, kolId, token, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Start polling as fallback if WebSocket fails
  useEffect(() => {
    if (error && !isConnected && kolId && token) {
      console.log('Starting polling as fallback for real-time stats');
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [error, isConnected, kolId, token, startPolling, stopPolling]);

  return {
    // State
    stats,
    globalStats,
    isConnected,
    isConnecting,
    error,
    lastUpdate,
    
    // Actions
    connect,
    disconnect,
    refreshStats,
    
    // Utilities
    getConnectionStatus: () => realtimeStatsClient.getStatus(),
    
    // Polling controls (for fallback)
    startPolling,
    stopPolling,
    isPolling: !!pollingInterval
  };
};

export default useRealtimeStats;
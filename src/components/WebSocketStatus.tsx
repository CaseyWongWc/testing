import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import webSocketClient, { ConnectionStatus } from '../utils/WebSocketClient';

interface WebSocketStatusProps {
  showLabel?: boolean;
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  showLabel = true, 
  className = '' 
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(webSocketClient.getStatus());
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    // Add status listener when component mounts
    webSocketClient.addStatusListener(handleStatusChange);
    
    // Remove status listener when component unmounts
    return () => {
      webSocketClient.removeStatusListener(handleStatusChange);
    };
  }, []);

  // Monitor status and show reconnect button if disconnected for too long
  useEffect(() => {
    if (status === 'disconnected' || status === 'error') {
      const timer = setTimeout(() => {
        setShowReconnect(true);
      }, 10000);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowReconnect(false);
    }
  }, [status]);

  // Handle status change from WebSocketClient
  const handleStatusChange = (newStatus: ConnectionStatus) => {
    setStatus(newStatus);
  };

  // Manual reconnect handler
  const handleReconnect = () => {
    webSocketClient.connect();
    setShowReconnect(false);
  };

  // Status-specific styling
  const getStatusColor = (): string => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-blue-500';
      case 'disconnected':
        return 'text-gray-400';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  // Get status label text
  const getStatusText = (): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Not Connected';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {status === 'connected' || status === 'connecting' ? (
          <Wifi size={16} />
        ) : (
          <WifiOff size={16} />
        )}
        {showLabel && <span className="text-sm font-medium">{getStatusText()}</span>}
      </div>
      
      {showReconnect && (
        <button
          onClick={handleReconnect}
          className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

export default WebSocketStatus;
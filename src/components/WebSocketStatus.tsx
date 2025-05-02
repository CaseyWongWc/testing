import React, { useEffect, useState } from 'react';
import webSocketClient, { ConnectionStatus } from '../utils/WebSocketClient';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface WebSocketStatusProps {
  showText?: boolean;
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showText = true,
  className = '',
  onConnect,
  onDisconnect
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(webSocketClient.getStatus());
  
  useEffect(() => {
    // Connect to WebSocket when component mounts
    webSocketClient.connect();
    
    // Listen for status changes
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      
      if (newStatus === 'connected' && onConnect) {
        onConnect();
      } else if ((newStatus === 'disconnected' || newStatus === 'error') && onDisconnect) {
        onDisconnect();
      }
    };
    
    webSocketClient.addStatusListener(handleStatusChange);
    
    // Clean up when component unmounts
    return () => {
      webSocketClient.removeStatusListener(handleStatusChange);
    };
  }, [onConnect, onDisconnect]);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="text-green-500" size={18} />;
      case 'connecting':
        return <Wifi className="text-yellow-500 animate-pulse" size={18} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={18} />;
      case 'disconnected':
      default:
        return <WifiOff className="text-gray-500" size={18} />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'disconnected':
      default:
        return 'text-gray-600';
    }
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {getStatusIcon()}
      {showText && (
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;
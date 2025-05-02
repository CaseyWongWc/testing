
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Folder } from 'lucide-react';
import SecretMenu from '../secret/SecretMenu';

interface SecretPanelProps {
  isOpen: boolean;
}

const SecretPanel: React.FC<SecretPanelProps> = ({ isOpen }) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setOpacity(1), 50);
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    if (path === 'exit') {
      setOpacity(0);
      setTimeout(() => setIsVisible(false), 500);
    } else {
      console.log(`Navigating to ${path}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="h-full overflow-auto">
        <SecretMenu onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

export default SecretPanel;

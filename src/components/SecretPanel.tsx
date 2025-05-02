
import React from 'react';
import { Lock, Unlock, Folder } from 'lucide-react';

interface SecretPanelProps {
  isOpen: boolean;
}

const SecretPanel: React.FC<SecretPanelProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    console.log(`Navigating to ${path}`);
    // Here you can implement actual navigation logic
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50">
      <div className="h-full overflow-auto">
        <SecretMenu onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

export default SecretPanel;

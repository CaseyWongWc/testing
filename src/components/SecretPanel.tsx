
import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface SecretPanelProps {
  isOpen: boolean;
}

const SecretPanel: React.FC<SecretPanelProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Secret Panel</h2>
      <div className="space-y-4">
        <p>This is a secret panel with special content</p>
      </div>
    </div>
  );
};

export default SecretPanel;

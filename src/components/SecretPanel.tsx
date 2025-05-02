
import React from 'react';
import { Lock, Unlock, Folder } from 'lucide-react';

interface SecretPanelProps {
  isOpen: boolean;
}

const SecretPanel: React.FC<SecretPanelProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  const secretFolders = [
    'might be impossible to make',
    'might be incompatable',
    'storymode',
    'zplaceholder0',
    'zplaceholder1'
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Unlock className="w-5 h-5" />
        Secret Panel
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {secretFolders.map((folder) => (
          <button
            key={folder}
            className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left"
            onClick={() => console.log(`Navigating to ${folder}`)}
          >
            <Folder className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">{folder}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SecretPanel;

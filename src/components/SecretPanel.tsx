import React, { useState, useEffect } from 'react';
import SecretMenu from '../secret/SecretMenu';
import UnrelatedMenu from '../secret/unrelated/UnrelatedMenu';
import EntertainmentMenu from '../secret/entertainment/EntertainmentMenu';
import CityOfTheDamned from '../secret/CityOfTheDamned';

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

  const [currentView, setCurrentView] = useState<string>('main');

  const handleNavigate = (path: string) => {
    if (path === 'exit') {
      setOpacity(0);
      setTimeout(() => setIsVisible(false), 500);
    } else {
      setCurrentView(path);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'unrelated':
        return <UnrelatedMenu onNavigate={handleNavigate} />;
      case 'for entertainment':
        return <EntertainmentMenu onSelect={(scene) => console.log(scene)} />;
      case 'cityofdamned':
        return <CityOfTheDamned />;
      case 'main':
      default:
        return <SecretMenu onNavigate={handleNavigate} />;
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="h-full overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default SecretPanel;
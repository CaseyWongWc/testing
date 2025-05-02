
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ArrowIconProps {
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const ArrowIcon: React.FC<ArrowIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '',
  onClick,
  isActive = false
}) => {
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all hover:scale-110 ${
        isActive ? 'text-green-500 shadow-lg shadow-green-500/50' : ''
      } ${className}`}
    >
      <ArrowRight size={size} color={isActive ? '#22c55e' : color} />
    </button>
  );
};

export default ArrowIcon;

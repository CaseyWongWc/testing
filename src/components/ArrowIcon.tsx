
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ArrowIconProps {
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
}

const ArrowIcon: React.FC<ArrowIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '',
  onClick
}) => {
  return (
    <button 
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-transform hover:scale-110 ${className}`}
    >
      <ArrowRight size={size} color={color} />
    </button>
  );
};

export default ArrowIcon;

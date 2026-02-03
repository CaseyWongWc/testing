
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ArrowIconProps {
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  isButton?: boolean;
}

const ArrowIcon: React.FC<ArrowIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '',
  onClick,
  isActive = false,
  isButton = true
}) => {
  const commonClasses = `inline-flex items-center justify-center transition-all hover:scale-110 ${
    isActive ? 'text-red-500 animate-pulse shadow-lg shadow-red-500/50' : ''
  } ${className}`;
  
  if (isButton) {
    return (
      <button 
        onClick={onClick}
        className={commonClasses}
        type="button"
      >
        <ArrowRight size={size} color={isActive ? '#ef4444' : color} />
      </button>
    );
  }
  
  return (
    <span 
      onClick={onClick}
      className={`${commonClasses} cursor-pointer`}
    >
      {isButton ? (
        <ArrowRight size={size} color={isActive ? '#ef4444' : color} />
      ) : (
        <span style={{ fontSize: `${size}px`, color: isActive ? '#ef4444' : color }}>𓂀</span>
      )}
    </span>
  );
};

export default ArrowIcon;

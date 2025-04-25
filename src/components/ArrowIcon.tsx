import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ArrowIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ArrowIcon: React.FC<ArrowIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <ArrowRight size={size} color={color} />
    </div>
  );
};

export default ArrowIcon;
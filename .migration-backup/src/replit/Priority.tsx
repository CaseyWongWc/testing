
import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';

const Priority: React.FC = () => {
  const [mapSize, setMapSize] = useState({ width: 10, height: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - mapSize.width,
      y: e.clientY - mapSize.height
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = Math.max(5, Math.min(20, e.clientX - startPos.x));
    const newHeight = Math.max(5, Math.min(20, e.clientY - startPos.y));
    
    setMapSize({
      width: Math.floor(newWidth),
      height: Math.floor(newHeight)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        I have to take a dookie but I'm in the desert and I'm late for class
      </h1>

      <div 
        className="relative inline-block"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="grid gap-0.5 bg-gray-200 p-2 rounded-lg shadow-md">
          {Array(mapSize.height).fill(0).map((_, y) => (
            <div key={y} className="flex gap-0.5">
              {Array(mapSize.width).fill(0).map((_, x) => (
                <div
                  key={`${x}-${y}`}
                  className="w-8 h-8 bg-white flex items-center justify-center transition-colors rounded-sm"
                />
              ))}
            </div>
          ))}
        </div>
        
        <div
          className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 flex items-center justify-center rounded-bl cursor-se-resize text-white"
          onMouseDown={handleMouseDown}
        >
          <Maximize2 className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default Priority;

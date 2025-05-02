import React, { useState } from 'react';

interface EntertainmentMenuProps {
  onSelect?: (scene: string) => void;
}

function EntertainmentMenu({ onSelect }: EntertainmentMenuProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const startRogueLike = () => {
    setActiveGame('rogue_like');
    if (onSelect) onSelect('rogue_like');
  };

  return (
    <div>
      <h1>Entertainment Menu</h1>
      <button onClick={startRogueLike}>Start Roguelike Game</button>
      {activeGame === 'rogue_like' ? (
        <RogueLikerevised onBack={() => setActiveGame(null)} />
      ) : null}
    </div>
  );
}

interface RogueLikeRevisedProps {
  onBack: () => void;
}

function RogueLikerevised({ onBack }: RogueLikeRevisedProps) {
  return (
    <div>
      <h1>Roguelike Game</h1>
      <button onClick={onBack}>Back to Menu</button>
      {/* Game content would go here */}
    </div>
  );
}

export default EntertainmentMenu;
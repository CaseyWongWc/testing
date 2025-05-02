import React, { useState } from 'react';

function EntertainmentMenu() {
  const [activeGame, setActiveGame] = useState(null);

  const startRogueLike = () => {
    setActiveGame('rogue_like');
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

function RogueLikerevised({ onBack }) {
  return (
    <div>
      <h1>Roguelike Game</h1>
      <button onClick={onBack}>Back to Menu</button>
      {/* Game content would go here */}
    </div>
  );
}

export default EntertainmentMenu;
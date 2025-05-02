import React, { useState } from 'react';
import { Play, Pause, SkipForward, Settings, RefreshCw, HelpCircle, Power, Save } from 'lucide-react';
// import { WebSocketConnectionStatus } from './GameWebSocketInterface';
import { GameState } from './GameTypes';

interface MainMenuProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkipWave: () => void;
  onShowSettings: () => void;
  onShowHelp: () => void;
  onEnd: () => void;
  onSave: () => void;
  gameState: GameState;
  isPlaying: boolean;
  isMultiplayer: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onStart,
  onPause,
  onResume,
  onReset,
  onSkipWave,
  onShowSettings,
  onShowHelp,
  onEnd,
  onSave,
  gameState,
  isPlaying,
  isMultiplayer
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const handleReset = () => {
    if (isPlaying) {
      setShowConfirmReset(true);
    } else {
      onReset();
    }
  };

  const handleEnd = () => {
    if (isPlaying) {
      setShowConfirmEnd(true);
    } else {
      onEnd();
    }
  };

  const confirmReset = () => {
    onReset();
    setShowConfirmReset(false);
  };

  const confirmEnd = () => {
    onEnd();
    setShowConfirmEnd(false);
  };

  const cancelAction = () => {
    setShowConfirmReset(false);
    setShowConfirmEnd(false);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">City of the Damned</h2>
        
        {isMultiplayer && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Multiplayer:</span>
            <WebSocketConnectionStatus />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-4">
        {!isPlaying ? (
          <button 
            onClick={onStart} 
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 p-2 rounded"
            title="Start Game"
          >
            <Play size={16} />
            <span>Start</span>
          </button>
        ) : (
          <>
            {gameState.gameStatus !== 'completed' && (
              isPlaying ? (
                <button 
                  onClick={onPause} 
                  className="flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-700 p-2 rounded"
                  title="Pause Game"
                >
                  <Pause size={16} />
                  <span>Pause</span>
                </button>
              ) : (
                <button 
                  onClick={onResume} 
                  className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 p-2 rounded"
                  title="Resume Game"
                >
                  <Play size={16} />
                  <span>Resume</span>
                </button>
              )
            )}
          </>
        )}
        
        <button 
          onClick={handleReset}
          className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 p-2 rounded"
          title="Reset Game"
        >
          <RefreshCw size={16} />
          <span>Reset</span>
        </button>
        
        <button 
          onClick={onSkipWave}
          disabled={!isPlaying || gameState.gameStatus === 'completed'}
          className={`flex items-center justify-center gap-1 ${
            !isPlaying || gameState.gameStatus === 'completed' 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          } p-2 rounded`}
          title="Skip to Next Wave"
        >
          <SkipForward size={16} />
          <span>Skip</span>
        </button>
        
        <button 
          onClick={onSave}
          disabled={!isPlaying}
          className={`flex items-center justify-center gap-1 ${
            !isPlaying ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          } p-2 rounded`}
          title="Save Game"
        >
          <Save size={16} />
          <span>Save</span>
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={onShowSettings}
          className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 p-2 rounded"
          title="Game Settings"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        
        <button 
          onClick={onShowHelp}
          className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 p-2 rounded"
          title="Help"
        >
          <HelpCircle size={16} />
          <span>Help</span>
        </button>
        
        <button 
          onClick={handleEnd}
          className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 p-2 rounded"
          title="End Game"
        >
          <Power size={16} />
          <span>End Game</span>
        </button>
      </div>
      
      <div className="mt-4 text-sm">
        <div className="flex justify-between mb-1">
          <span>Day: {gameState.day}</span>
          <span>Time: {gameState.time}</span>
        </div>
        <div className="flex justify-between">
          <span>Wave: {gameState.wave}</span>
          <span>Enemies Killed: {gameState.enemiesKilled}</span>
        </div>
      </div>
      
      {/* Confirmation Dialog for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">Reset Game?</h3>
            <p className="mb-4">Are you sure you want to reset the game? All progress will be lost.</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={cancelAction}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog for End Game */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">End Game?</h3>
            <p className="mb-4">Are you sure you want to end the game? All progress will be lost.</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={cancelAction}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmEnd}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
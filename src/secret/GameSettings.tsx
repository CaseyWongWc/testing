import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface GameSettingsData {
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  playerCount: number;
  dayLength: number;
  nightLength: number;
  fogOfWar: boolean;
  friendlyFire: boolean;
  permadeath: boolean;
  showTutorial: boolean;
  soundVolume: number;
  musicVolume: number;
}

interface GameSettingsProps {
  settings: GameSettingsData;
  onSave: (settings: GameSettingsData) => void;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
  onEnd: () => void;
  isMultiplayer: boolean;
  isPlaying: boolean;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  settings,
  onSave,
  onClose,
  onStart,
  onStop,
  onEnd,
  isMultiplayer,
  isPlaying
}) => {
  const [localSettings, setLocalSettings] = useState<GameSettingsData>({...settings});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setLocalSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'range') {
      setLocalSettings(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else if (name === 'playerCount') {
      setLocalSettings(prev => ({
        ...prev,
        [name]: Math.max(1, Math.min(4, parseInt(value)))
      }));
    } else if (name === 'dayLength' || name === 'nightLength') {
      setLocalSettings(prev => ({
        ...prev,
        [name]: Math.max(60, Math.min(600, parseInt(value)))
      }));
    } else {
      setLocalSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-5 text-white relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-4">Game Settings</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  value={localSettings.difficulty}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                  <option value="nightmare">Nightmare</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Player Count</label>
                <input
                  type="number"
                  name="playerCount"
                  min="1"
                  max={isMultiplayer ? "8" : "4"}
                  value={localSettings.playerCount}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                  disabled={isMultiplayer}
                />
                {isMultiplayer && (
                  <p className="text-xs text-gray-400 mt-1">Player count is determined by connections in multiplayer mode</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Day Length (seconds)</label>
                <input
                  type="number"
                  name="dayLength"
                  min="60"
                  max="600"
                  value={localSettings.dayLength}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Night Length (seconds)</label>
                <input
                  type="number"
                  name="nightLength"
                  min="60"
                  max="600"
                  value={localSettings.nightLength}
                  onChange={handleChange}
                  className="w-full bg-gray-700 rounded p-2 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="fogOfWar"
                  name="fogOfWar"
                  checked={localSettings.fogOfWar}
                  onChange={handleChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="fogOfWar" className="text-sm font-medium">Fog of War</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="friendlyFire"
                  name="friendlyFire"
                  checked={localSettings.friendlyFire}
                  onChange={handleChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="friendlyFire" className="text-sm font-medium">Friendly Fire</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="permadeath"
                  name="permadeath"
                  checked={localSettings.permadeath}
                  onChange={handleChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="permadeath" className="text-sm font-medium">Permadeath</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTutorial"
                  name="showTutorial"
                  checked={localSettings.showTutorial}
                  onChange={handleChange}
                  className="h-4 w-4 mr-2"
                />
                <label htmlFor="showTutorial" className="text-sm font-medium">Show Tutorial</label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Sound Volume: {Math.round(localSettings.soundVolume * 100)}%
              </label>
              <input
                type="range"
                name="soundVolume"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.soundVolume}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Music Volume: {Math.round(localSettings.musicVolume * 100)}%
              </label>
              <input
                type="range"
                name="musicVolume"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.musicVolume}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div className="border-t border-gray-700 my-4 pt-4">
              <h3 className="text-lg font-semibold mb-3">Game Control</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStart();
                  }}
                  className={`px-4 py-2 ${isPlaying ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} rounded flex items-center justify-center`}
                  disabled={isPlaying}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Start Game
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to stop the current game? All progress will be paused.")) {
                      onClose();
                      onStop();
                    }
                  }}
                  className={`px-4 py-2 ${!isPlaying ? 'bg-gray-600 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'} rounded flex items-center justify-center`}
                  disabled={!isPlaying}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  Stop Game
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to end the current game? All progress will be lost.")) {
                      onClose();
                      onEnd();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                  End Game
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameSettings;
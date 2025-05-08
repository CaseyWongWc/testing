import { useState } from "react";
import MazeGame from "./components/MazeGame";
import TerrainGame from "./components/TerrainGame";
import FruitCollector from "./components/FruitCollector";
import MultiGoalRobot from "./components/MultiGoalRobot";
import FollowMeGame from "./components/FollowMeGame";
import GuessingGame from "./components/GuessingGame";
import WhatsYourNameGame from "./components/WhatsYourNameGame";
import RGBTerrainNavigator from "./components/RGBTerrainNavigator";
import RobotTrading from "./components/RobotTrading";
import MonsterCards from "./components/MonsterCards";
import Combat from "./combat/Combat.tsx";
import ReplitScene from "./replit/ReplitScene";
import BeeHiveSimulation from "./replit/BeeHiveSimulation";
import ArrowIcon from "./components/ArrowIcon";
import { MultiValuedItemCollector } from "./replit/MultiValuedItemCollector";
import WebSocketChat from "./components/WebSocketChat";
import CollaborativeDrawing from "./components/CollaborativeDrawing";

type GameType =
  | "maze"
  | "multivalued"
  | "terrain"
  | "fruit"
  | "multigoal"
  | "follow"
  | "guessing"
  | "whatsyourname"
  | "rgbterrain"
  | "trading"
  | "other-apps"
  | "combat"
  | "replit"
  | "wss-chat"
  | "wss-drawing"
  | "tag"
  | "rogue"
  | "scene7"
  | "scene8";

function App() {
  const [activeGame, setActiveGame] = useState<GameType>("maze");
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(15);
  const [wallDensity, setWallDensity] = useState(0.3);
  const [roughness, setRoughness] = useState(0.8);
  const [terrainIntensity, setTerrainIntensity] = useState(0.5);
  const [goalCount, setGoalCount] = useState(5);
  const [robotCount, setRobotCount] = useState(3);
  const [showWebSocketComponents, setShowWebSocketComponents] = useState(false);
  const [showWebSocketButtons, setShowWebSocketButtons] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-center w-full mb-2">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-bold text-blue-600 flex items-center">
                AI Simulation Framework{" "}
                <ArrowIcon 
                  size={24} 
                  color="#2563eb" 
                  className="ml-2 cursor-pointer" 
                  isActive={activeGame === "other-apps"}
                  onClick={() => setActiveGame(activeGame === "other-apps" ? "maze" : "other-apps")}
                  isButton={true}
                />
              </h1>
              <button
                onClick={() => setShowWebSocketComponents(!showWebSocketComponents)}
                className={`px-4 py-2 ${showWebSocketComponents ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'} rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2`}
              >
                <ArrowIcon 
                  size={16} 
                  color={showWebSocketComponents ? '#1d4ed8' : '#854d0e'} 
                  className={showWebSocketComponents ? 'rotate-90 transition-transform' : 'rotate-0 transition-transform'} 
                  isActive={showWebSocketComponents}
                  isButton={false}
                />
                {showWebSocketComponents ? 'Hide WebSocket Panel' : 'Show WebSocket Panel'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveGame("maze")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "maze"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Maze Solver
            </button>
            <button
              onClick={() => setActiveGame("terrain")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "terrain"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Terrain Navigator
            </button>
            <button
              onClick={() => setActiveGame("rgbterrain")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "rgbterrain"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              RGB Navigator
            </button>
            <button
              onClick={() => setActiveGame("fruit")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "fruit"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Fruit Collector
            </button>
            <button
              onClick={() => setActiveGame("multigoal")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "multigoal"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Multi-Goal Robot
            </button>
            <button
              onClick={() => setActiveGame("follow")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "follow"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Follow Me
            </button>
            <button
              onClick={() => setActiveGame("guessing")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "guessing"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Guessing Game
            </button>
            <button
              onClick={() => setActiveGame("whatsyourname")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "whatsyourname"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              What's Your Name?
            </button>
            <button
              onClick={() => setActiveGame("tag")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "tag"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Tag Game
            </button>
            <button
              onClick={() => setActiveGame("multivalued")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "multivalued"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Multi-Valued Items
            </button>
            <button
              onClick={() => setActiveGame("rogue")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "rogue"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              MonsterCards
            </button>
            
            {/* Other Apps button is always visible */}
            <button
              onClick={() => setActiveGame("other-apps")}
              className={`px-4 py-2 rounded transition-colors ${
                activeGame === "other-apps"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              Other Apps
            </button>
            
            {/* WebSocket buttons are visible only when not showing WebSocket panel 
                and either we're on a WebSocket page OR the WebSocket buttons are shown */}
            {!showWebSocketComponents && ((activeGame === "wss-chat" || activeGame === "wss-drawing") || showWebSocketButtons) && (
              <>
                <button
                  onClick={() => setActiveGame("wss-chat")}
                  className={`px-4 py-2 rounded transition-colors ${
                    activeGame === "wss-chat"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  WebSocket Chat
                </button>
                <button
                  onClick={() => setActiveGame("wss-drawing")}
                  className={`px-4 py-2 rounded transition-colors ${
                    activeGame === "wss-drawing"
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Collaborative Drawing
                </button>
              </>
            )}
          </div>

          {activeGame !== "rgbterrain" &&
            activeGame !== "trading" &&
            activeGame !== "rogue" &&
            activeGame !== "other-apps" &&
            activeGame !== "combat" &&
            activeGame !== "scene7" &&
            activeGame !== "scene8" &&
            activeGame !== "wss-chat" &&
            activeGame !== "wss-drawing" && (
              <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-4">
                <div>
                  <label
                    htmlFor="width"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Width
                  </label>
                  <input
                    type="number"
                    id="width"
                    min="5"
                    max="50"
                    value={width}
                    onChange={(e) =>
                      setWidth(
                        Math.max(
                          5,
                          Math.min(50, parseInt(e.target.value) || 5),
                        ),
                      )
                    }
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="height"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Height
                  </label>
                  <input
                    type="number"
                    id="height"
                    min="5"
                    max="50"
                    value={height}
                    onChange={(e) =>
                      setHeight(
                        Math.max(
                          5,
                          Math.min(50, parseInt(e.target.value) || 5),
                        ),
                      )
                    }
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {activeGame === "whatsyourname" && (
                  <div>
                    <label
                      htmlFor="robotCount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Number of Robots
                    </label>
                    <input
                      type="number"
                      id="robotCount"
                      min="2"
                      max="5"
                      value={robotCount}
                      onChange={(e) =>
                        setRobotCount(
                          Math.max(
                            2,
                            Math.min(5, parseInt(e.target.value) || 2),
                          ),
                        )
                      }
                      className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
                {(activeGame === "maze" ||
                  activeGame === "fruit" ||
                  activeGame === "multigoal" ||
                  activeGame === "follow" ||
                  activeGame === "whatsyourname") && (
                  <div>
                    <label
                      htmlFor="wallDensity"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Wall Density
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="wallDensity"
                        min="0"
                        max="1"
                        step="0.05"
                        value={wallDensity}
                        onChange={(e) =>
                          setWallDensity(parseFloat(e.target.value))
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-gray-600 w-12">
                        {(wallDensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
                {(activeGame === "terrain" ||
                  activeGame === "multigoal" ||
                  activeGame === "guessing") && (
                  <>
                    <div>
                      <label
                        htmlFor="roughness"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Terrain Roughness
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          id="roughness"
                          min="0"
                          max="1"
                          step="0.05"
                          value={roughness}
                          onChange={(e) =>
                            setRoughness(parseFloat(e.target.value))
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {(roughness * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="terrainIntensity"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Terrain Intensity
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          id="terrainIntensity"
                          min="0"
                          max="1"
                          step="0.05"
                          value={terrainIntensity}
                          onChange={(e) =>
                            setTerrainIntensity(parseFloat(e.target.value))
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {(terrainIntensity * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {activeGame === "multigoal" && (
                  <div>
                    <label
                      htmlFor="goalCount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Number of Goals
                    </label>
                    <input
                      type="number"
                      id="goalCount"
                      min="1"
                      max="20"
                      value={goalCount}
                      onChange={(e) =>
                        setGoalCount(
                          Math.max(
                            1,
                            Math.min(20, parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
        </div>

        {activeGame === "maze" && (
          <MazeGame width={width} height={height} wallDensity={wallDensity} />
        )}
        {activeGame === "terrain" && (
          <TerrainGame width={width} height={height} roughness={roughness} />
        )}
        {activeGame === "rgbterrain" && (
          <RGBTerrainNavigator width={20} height={15} />
        )}
        {activeGame === "fruit" && (
          <FruitCollector
            width={width}
            height={height}
            wallDensity={wallDensity}
            fruitCount={10}
          />
        )}
        {activeGame === "multigoal" && (
          <MultiGoalRobot
            width={width}
            height={height}
            wallDensity={wallDensity}
            roughness={roughness}
            terrainIntensity={terrainIntensity}
            goalCount={goalCount}
          />
        )}
        {activeGame === "follow" && (
          <FollowMeGame
            width={width}
            height={height}
            wallDensity={wallDensity}
            stopInterval={3}
          />
        )}
        {activeGame === "guessing" && (
          <GuessingGame width={width} height={height} roughness={roughness} />
        )}
        {activeGame === "whatsyourname" && (
          <WhatsYourNameGame
            width={width}
            height={height}
            wallDensity={wallDensity}
            robotCount={robotCount}
          />
        )}
        {activeGame === "tag" && <BeeHiveSimulation />}
        {activeGame === "multivalued" && <MultiValuedItemCollector />}
        {activeGame === "rogue" && <MonsterCards />}
        {activeGame === "other-apps" && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveGame("combat")}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
              >
                Combat
              </button>
              <button
                onClick={() => setActiveGame("replit")}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
              >
                Replit
              </button>
              
              {/* Toggle button for WebSocket buttons visibility */}
              <button
                onClick={() => setShowWebSocketButtons(!showWebSocketButtons)}
                className={`px-6 py-3 ${showWebSocketButtons ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'} rounded-lg hover:opacity-90 transition-colors text-lg font-medium flex items-center justify-center col-span-2`}
              >
                <ArrowIcon 
                  size={18} 
                  color={showWebSocketButtons ? '#4f46e5' : '#4b5563'} 
                  className={showWebSocketButtons ? 'rotate-90 transition-transform mr-2' : 'rotate-0 transition-transform mr-2'} 
                  isActive={showWebSocketButtons}
                  isButton={false}
                />
                <span>{showWebSocketButtons ? 'Hide WebSocket Buttons' : 'Show WebSocket Buttons'}</span>
              </button>
              
              {/* WebSocket buttons visible only when showWebSocketButtons is true and showWebSocketComponents is false */}
              {showWebSocketButtons && !showWebSocketComponents && (
                <>
                  <button
                    onClick={() => setActiveGame("wss-chat")}
                    className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    <span>WebSocket Chat</span>
                    <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  </button>
                  <button
                    onClick={() => setActiveGame("wss-drawing")}
                    className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    <span>Collaborative Drawing</span>
                    <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  </button>
                </>
              )}
              
              {/* Toggle WebSocket panel button (shown when showWebSocketButtons is true) */}
              {showWebSocketButtons && showWebSocketComponents && (
                <button
                  onClick={() => setShowWebSocketComponents(false)}
                  className="px-6 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-lg font-medium flex items-center justify-center col-span-2"
                >
                  <ArrowIcon 
                    size={18} 
                    color="#1d4ed8" 
                    className="rotate-90 transition-transform mr-2" 
                    isActive={true}
                    isButton={false}
                  />
                  <span>Hide WebSocket Panel</span>
                </button>
              )}
            </div>
          </div>
        )}
        {activeGame === "combat" && <Combat />}
        {activeGame === "replit" && <ReplitScene />}
        {/* WebSocket components are rendered based on activeGame and showWebSocketComponents state */}
        {showWebSocketComponents && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">WebSocket Chat</h3>
              <WebSocketChat />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Collaborative Drawing</h3>
              <CollaborativeDrawing />
            </div>
          </div>
        )}
        {!showWebSocketComponents && activeGame === "wss-chat" && <WebSocketChat />}
        {!showWebSocketComponents && activeGame === "wss-drawing" && <CollaborativeDrawing />}
        
      </div>
    </div>
  );
}

export default App;

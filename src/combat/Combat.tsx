import React, { useState } from "react";
import ZombiesAhh from "./ZombiesAhh";
import EmptyClassroom from "./EmptyClassroom";
import RogueLikeGame from "./RogueLikeGame";
import WSSRogueHDraft from "./WSSRogueHDraft";
import WSSTwo from "./WSSTwo";
import WSSPhase0 from "./WSSPhase0";
import { Wifi, Compass, Skull, Map } from "lucide-react";

const Combat: React.FC = () => {
  const [activeScene, setActiveScene] = useState<
    "wssphase0" | "zombies" | "classroom" | "rogue" | "wssrogue" | "wsstwo"
  >("wssphase0");

  if (activeScene === "wssphase0") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="shrink-0 bg-gray-950 border-b border-gray-700 px-3 py-1 flex gap-2">
          <button
            onClick={() => setActiveScene("zombies")}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
          >
            ← Other Simulations
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <WSSPhase0 />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setActiveScene("wssphase0")}
          className="px-4 py-2 rounded transition-colors flex items-center gap-2 bg-red-900 hover:bg-red-800 text-red-100 border border-red-600 font-bold"
        >
          <Map className="w-4 h-4" /> A Forgotten Place (Phase 0)
        </button>
        <button
          onClick={() => setActiveScene("zombies")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "zombies" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Zombies Ahh!
        </button>
        <button
          onClick={() => setActiveScene("classroom")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "classroom" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Empty Classroom
        </button>
        <button
          onClick={() => setActiveScene("rogue")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "rogue" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Rogue Like
        </button>
        <button
          onClick={() => setActiveScene("wssrogue")}
          className={`px-4 py-2 rounded transition-colors flex items-center ${
            activeScene === "wssrogue" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Wifi className="w-4 h-4 mr-1" /> WS Rogue (Draft)
        </button>
        <button
          onClick={() => setActiveScene("wsstwo")}
          className={`px-4 py-2 rounded transition-colors flex items-center ${
            activeScene === "wsstwo" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Compass className="w-4 h-4 mr-1" /> Wilderness Survival
        </button>
      </div>

      {activeScene === "zombies" && <ZombiesAhh />}
      {activeScene === "classroom" && <EmptyClassroom />}
      {activeScene === "rogue" && <RogueLikeGame />}
      {activeScene === "wssrogue" && <WSSRogueHDraft />}
      {activeScene === "wsstwo" && <WSSTwo />}
    </div>
  );
};

export default Combat;

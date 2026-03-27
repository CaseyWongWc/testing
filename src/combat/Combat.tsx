import React, { useState } from "react";
import ZombiesAhh from "./ZombiesAhh";
import EmptyClassroom from "./EmptyClassroom";
import RogueLikeGame from "./RogueLikeGame";
import WSSRogueHDraft from "./WSSRogueHDraft";
import WSSTwo from "./WSSTwo";
import WSSPhase0 from "./WSSPhase0";
import WSSPhase1 from "./WSSPhase1";
import WSSPhase2 from "./WSSPhase2";
import WSSPhase3 from "./WSSPhase3";
import { Wifi, Compass, Map, FlaskConical } from "lucide-react";

type Scene =
  | "wssphase2" | "wssphase3" | "wssphase1" | "wssphase0"
  | "zombies" | "classroom" | "rogue" | "wssrogue" | "wsstwo";

const Combat: React.FC = () => {
  const [activeScene, setActiveScene] = useState<Scene>("wssphase2");

  if (activeScene === "wssphase2") {
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
          <WSSPhase2 />
        </div>
      </div>
    );
  }

  if (activeScene === "wssphase3") {
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
          <WSSPhase3 />
        </div>
      </div>
    );
  }

  if (activeScene === "wssphase1") {
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
          <WSSPhase1 />
        </div>
      </div>
    );
  }

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
          onClick={() => setActiveScene("wssphase2")}
          className="px-4 py-2 rounded transition-colors flex items-center gap-2 bg-red-900 hover:bg-red-800 text-red-100 border border-red-600 font-bold"
        >
          <Map className="w-4 h-4" /> A Forgotten Place (Phase 2) ★
        </button>
        <button
          onClick={() => setActiveScene("wssphase3")}
          className="px-4 py-2 rounded transition-colors flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-600"
        >
          <FlaskConical className="w-4 h-4" /> Phase 3 (Experimental)
        </button>
        <button
          onClick={() => setActiveScene("wssphase1")}
          className="px-4 py-2 rounded transition-colors flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-500"
        >
          <Map className="w-4 h-4" /> Phase 1 (Combat)
        </button>
        <button
          onClick={() => setActiveScene("wssphase0")}
          className="px-4 py-2 rounded transition-colors flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-500"
        >
          <Map className="w-4 h-4" /> Phase 0 (Foundation)
        </button>
        <button
          onClick={() => setActiveScene("zombies")}
          className="px-4 py-2 rounded transition-colors bg-gray-100 hover:bg-gray-200"
        >
          Zombies Ahh!
        </button>
        <button
          onClick={() => setActiveScene("classroom")}
          className="px-4 py-2 rounded transition-colors bg-gray-100 hover:bg-gray-200"
        >
          Empty Classroom
        </button>
        <button
          onClick={() => setActiveScene("rogue")}
          className="px-4 py-2 rounded transition-colors bg-gray-100 hover:bg-gray-200"
        >
          Rogue Like
        </button>
        <button
          onClick={() => setActiveScene("wssrogue")}
          className="px-4 py-2 rounded transition-colors flex items-center bg-gray-100 hover:bg-gray-200"
        >
          <Wifi className="w-4 h-4 mr-1" /> WS Rogue (Draft)
        </button>
        <button
          onClick={() => setActiveScene("wsstwo")}
          className="px-4 py-2 rounded transition-colors flex items-center bg-gray-100 hover:bg-gray-200"
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

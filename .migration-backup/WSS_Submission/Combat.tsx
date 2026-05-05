import React, { useState } from "react";
import ZombiesAhh from "./ZombiesAhh";
import EmptyClassroom from "./EmptyClassroom";
import RogueLikeGame from "./RogueLikeGame";
import WSSRogueHDraft from "./WSSRogueHDraft";
import WSSTwo from "./WSSTwo";
import { Wifi, Compass } from "lucide-react";

const Combat: React.FC = () => {
  const [activeScene, setActiveScene] = useState<
    "zombies" | "classroom" | "rogue" | "wssrogue" | "wsstwo"
  >("zombies");

  return (
    <div className="p-8">
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setActiveScene("zombies")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "zombies"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Zombies Ahh!
        </button>
        <button
          onClick={() => setActiveScene("classroom")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "classroom"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Empty Classroom
        </button>
        <button
          onClick={() => setActiveScene("rogue")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "rogue"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Rogue Like
        </button>
        <button
          onClick={() => setActiveScene("wssrogue")}
          className={`px-4 py-2 rounded transition-colors flex items-center ${
            activeScene === "wssrogue"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          <Wifi className="w-4 h-4 mr-1" /> WS Rogue (Draft)
        </button>
        <button
          onClick={() => setActiveScene("wsstwo")}
          className={`px-4 py-2 rounded transition-colors flex items-center ${
            activeScene === "wsstwo"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
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

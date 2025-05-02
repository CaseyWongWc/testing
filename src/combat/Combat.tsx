import React, { useState } from "react";
import ZombiesAhh from "./ZombiesAhh";
import EmptyClassroom from "./EmptyClassroom";
import RogueLikeGame from "./RogueLikeGame";
import CombatInterface from "./CombatInterface";

const Combat: React.FC = () => {
  const [activeScene, setActiveScene] = useState<
    "zombies" | "classroom" | "rogue" | "combat"
  >("zombies");

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-8">
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
          onClick={() => setActiveScene("combat")}
          className={`px-4 py-2 rounded transition-colors ${
            activeScene === "combat"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Combat Interface
        </button>
      </div>

      {activeScene === "zombies" && <ZombiesAhh />}
      {activeScene === "classroom" && <EmptyClassroom />}
      {activeScene === "rogue" && <RogueLikeGame />}
      {activeScene === "combat" && <CombatInterface />}
    </div>
  );
};

export default Combat;

interface RogueLikeGameProps {
  onBack?: () => void;
}

const RogueLikeGame: React.FC<RogueLikeGameProps> = ({ onBack }) => {
  // ... rest of the RogueLikeGame component remains unchanged ...

  return (
    <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mr-4"
        >
          Back
        </button>
        <div className="flex gap-4 items-center">
          {/* ... rest of the UI remains unchanged ... */}
        </div>
      </div>
  );
};

export default RogueLikeGame;
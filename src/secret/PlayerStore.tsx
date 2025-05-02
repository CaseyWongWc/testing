import React from 'react';
import { ShoppingBag, CircleDollarSign, Shield, Zap, Target, Package2, ArrowRight, ArrowUp } from 'lucide-react';

interface PlayerStoreProps {
  player: {
    currency: number;
    stats: {
      strength: number;
      agility: number;
      endurance: number; 
      perception: number;
    };
  };
  onUpgradeStat: (stat: 'strength' | 'agility' | 'endurance' | 'perception') => void;
  onBuyWeapon: (weaponId: number) => void;
  onBuyAmmo: (ammoType: 'primary' | 'secondary') => void;
  onClose: () => void;
}

const PlayerStore: React.FC<PlayerStoreProps> = ({ player, onUpgradeStat, onBuyWeapon, onBuyAmmo, onClose }) => {
  // Stat upgrade cost increases with stat level
  const getStatUpgradeCost = (currentLevel: number) => {
    return 50 * currentLevel;
  };

  // Weapon catalog with various options available for purchase
  const weapons = [
    {
      id: 1,
      name: "Combat Shotgun",
      type: "primary",
      damage: 35,
      price: 200,
      rarity: "uncommon",
      description: "High damage at close range, spread pattern"
    },
    {
      id: 2,
      name: "Assault Rifle",
      type: "primary",
      damage: 22,
      price: 250,
      rarity: "uncommon",
      description: "Balanced damage and fire rate"
    },
    {
      id: 3, 
      name: "Sniper Rifle",
      type: "primary",
      damage: 65,
      price: 300,
      rarity: "rare",
      description: "High damage at long range, slow fire rate"
    },
    {
      id: 4,
      name: "Heavy Pistol",
      type: "secondary",
      damage: 25,
      price: 150,
      rarity: "uncommon",
      description: "Strong secondary weapon with decent range"
    },
    {
      id: 5,
      name: "Submachine Gun",
      type: "secondary",
      damage: 12,
      price: 180,
      rarity: "uncommon",
      description: "Fast firing rate, low damage per shot"
    },
    {
      id: 6,
      name: "Combat Knife",
      type: "melee",
      damage: 30,
      price: 100,
      rarity: "uncommon",
      description: "Silent and deadly at close range"
    },
    {
      id: 7,
      name: "Tactical Axe",
      type: "melee",
      damage: 40,
      price: 120,
      rarity: "rare",
      description: "Slower but more powerful melee weapon"
    }
  ];

  // Ammo prices
  const ammoPrices = {
    primary: 50, // Price for 30 primary ammo
    secondary: 30  // Price for 20 secondary ammo
  };

  // Helper function to get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-200";
      case "uncommon":
        return "text-green-400";
      case "rare":
        return "text-blue-400";
      case "epic":
        return "text-purple-400";
      case "legendary":
        return "text-yellow-300";
      default:
        return "text-white";
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 w-3/4 max-w-4xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" /> Survivor Supply Store
          </h2>
          <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
            <CircleDollarSign className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{player.currency}</span>
          </div>
        </div>

        {/* Stat Upgrades Section */}
        <div className="mb-8">
          <h3 className="text-xl text-gray-200 mb-4 border-b border-gray-600 pb-2">Stat Upgrades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  <span className="text-gray-200">Strength</span>
                </div>
                <span className="text-red-400 font-bold">Lv. {player.stats.strength}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">Increases melee damage</p>
              <button 
                onClick={() => onUpgradeStat('strength')}
                disabled={player.currency < getStatUpgradeCost(player.stats.strength)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  player.currency >= getStatUpgradeCost(player.stats.strength) 
                    ? 'bg-red-800 hover:bg-red-700' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  {getStatUpgradeCost(player.stats.strength)}
                </span>
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-400" />
                  <span className="text-gray-200">Agility</span>
                </div>
                <span className="text-green-400 font-bold">Lv. {player.stats.agility}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">Increases movement speed and dodge chance</p>
              <button 
                onClick={() => onUpgradeStat('agility')}
                disabled={player.currency < getStatUpgradeCost(player.stats.agility)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  player.currency >= getStatUpgradeCost(player.stats.agility) 
                    ? 'bg-green-800 hover:bg-green-700' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  {getStatUpgradeCost(player.stats.agility)}
                </span>
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-200">Endurance</span>
                </div>
                <span className="text-blue-400 font-bold">Lv. {player.stats.endurance}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">Increases max health and energy</p>
              <button 
                onClick={() => onUpgradeStat('endurance')}
                disabled={player.currency < getStatUpgradeCost(player.stats.endurance)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  player.currency >= getStatUpgradeCost(player.stats.endurance) 
                    ? 'bg-blue-800 hover:bg-blue-700' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  {getStatUpgradeCost(player.stats.endurance)}
                </span>
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-200">Perception</span>
                </div>
                <span className="text-purple-400 font-bold">Lv. {player.stats.perception}</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">Increases visibility range and critical hit chance</p>
              <button 
                onClick={() => onUpgradeStat('perception')}
                disabled={player.currency < getStatUpgradeCost(player.stats.perception)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  player.currency >= getStatUpgradeCost(player.stats.perception) 
                    ? 'bg-purple-800 hover:bg-purple-700' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  {getStatUpgradeCost(player.stats.perception)}
                </span>
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ammo Purchases */}
        <div className="mb-8">
          <h3 className="text-xl text-gray-200 mb-4 border-b border-gray-600 pb-2">Ammunition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-yellow-300" />
                  <span className="text-gray-200">Primary Ammo</span>
                </div>
                <span className="text-yellow-300">+30 rounds</span>
              </div>
              <button 
                onClick={() => onBuyAmmo('primary')}
                disabled={player.currency < ammoPrices.primary}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  player.currency >= ammoPrices.primary 
                    ? 'bg-yellow-800 hover:bg-yellow-700' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  {ammoPrices.primary}
                </span>
                <span>Purchase</span>
              </button>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-gray-300" />
                  <span className="text-gray-200">Secondary Ammo</span>
                </div>
                <span className="text-gray-300">+20 rounds</span>
              </div>
              <button 
                onClick={() => onBuyAmmo('secondary')}
                disabled={player.currency < ammoPrices.secondary}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  player.currency >= ammoPrices.secondary 
                    ? 'bg-gray-500 hover:bg-gray-400 text-black' 
                    : 'bg-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CircleDollarSign className="h-4 w-4" />
                  {ammoPrices.secondary}
                </span>
                <span>Purchase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Weapons */}
        <div>
          <h3 className="text-xl text-gray-200 mb-4 border-b border-gray-600 pb-2">Weapons</h3>
          <div className="grid grid-cols-1 gap-4">
            {weapons.map(weapon => (
              <div key={weapon.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getRarityColor(weapon.rarity)}`}>
                      {weapon.name}
                    </span>
                    <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                      {weapon.type}
                    </span>
                  </div>
                  <span className="text-red-400">DMG: {weapon.damage}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{weapon.description}</p>
                <button 
                  onClick={() => onBuyWeapon(weapon.id)}
                  disabled={player.currency < weapon.price}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    player.currency >= weapon.price 
                      ? 'bg-indigo-800 hover:bg-indigo-700' 
                      : 'bg-gray-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <CircleDollarSign className="h-4 w-4" />
                    {weapon.price}
                  </span>
                  <span className="flex items-center gap-1">
                    Purchase <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-red-800 hover:bg-red-700 rounded-lg"
          >
            Close Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerStore;
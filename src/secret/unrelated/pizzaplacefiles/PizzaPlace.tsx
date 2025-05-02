
import React from 'react';
import { MapPin, ChefHat, DollarSign, Utensils, Trash2, User, ShoppingBag, Pizza, Clock, Pause, Play, Clipboard, Plus, Minus } from 'lucide-react';
import PizzaOrderSystem from './PizzaOrderSystem';

const PizzaPlace: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pizza Place</h1>
      <PizzaOrderSystem />
    </div>
  );
};

export default PizzaPlace;

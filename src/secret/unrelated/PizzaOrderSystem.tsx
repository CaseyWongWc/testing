import React, { useState } from 'react';
import { Pizza, Check, Plus, Minus, X } from 'lucide-react';

type PizzaSize = 'small' | 'medium' | 'large';
type PizzaBase = 'thin' | 'regular' | 'thick' | 'stuffed';
type PizzaTopping = 'cheese' | 'pepperoni' | 'mushrooms' | 'olives' | 'bacon' | 'pineapple' | 'onions' | 'peppers';

interface PizzaOrder {
  id: number;
  size: PizzaSize;
  base: PizzaBase;
  toppings: PizzaTopping[];
  price: number;
  specialInstructions?: string;
}

interface PizzaOrderSystemProps {
  onSubmitOrder: (order: PizzaOrder) => void;
  onClose: () => void;
}

const PizzaOrderSystem: React.FC<PizzaOrderSystemProps> = ({ onSubmitOrder, onClose }) => {
  const [size, setSize] = useState<PizzaSize>('medium');
  const [base, setBase] = useState<PizzaBase>('regular');
  const [toppings, setToppings] = useState<PizzaTopping[]>(['cheese']);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const sizes: { type: PizzaSize; label: string; price: number }[] = [
    { type: 'small', label: 'Small', price: 8.99 },
    { type: 'medium', label: 'Medium', price: 10.99 },
    { type: 'large', label: 'Large', price: 12.99 },
  ];
  
  const bases: { type: PizzaBase; label: string; price: number }[] = [
    { type: 'thin', label: 'Thin Crust', price: 0 },
    { type: 'regular', label: 'Regular', price: 0 },
    { type: 'thick', label: 'Thick Crust', price: 1.5 },
    { type: 'stuffed', label: 'Stuffed Crust', price: 2.5 },
  ];
  
  const allToppings: { type: PizzaTopping; label: string; price: number }[] = [
    { type: 'cheese', label: 'Cheese', price: 0 },
    { type: 'pepperoni', label: 'Pepperoni', price: 1.5 },
    { type: 'mushrooms', label: 'Mushrooms', price: 1 },
    { type: 'olives', label: 'Olives', price: 1 },
    { type: 'bacon', label: 'Bacon', price: 1.5 },
    { type: 'pineapple', label: 'Pineapple', price: 1 },
    { type: 'onions', label: 'Onions', price: 0.75 },
    { type: 'peppers', label: 'Peppers', price: 1 },
  ];
  
  const calculatePrice = (): number => {
    // Base price from size
    const sizePrice = sizes.find(s => s.type === size)?.price || 0;
    
    // Add base price
    const basePrice = bases.find(b => b.type === base)?.price || 0;
    
    // Add toppings
    const toppingsPrice = toppings.reduce((total, topping) => {
      const price = allToppings.find(t => t.type === topping)?.price || 0;
      return total + price;
    }, 0);
    
    return parseFloat((sizePrice + basePrice + toppingsPrice).toFixed(2));
  };
  
  const toggleTopping = (topping: PizzaTopping) => {
    if (topping === 'cheese') return; // Always keep cheese
    
    if (toppings.includes(topping)) {
      setToppings(toppings.filter(t => t !== topping));
    } else {
      if (toppings.length < 5) { // Limit to 5 toppings including cheese
        setToppings([...toppings, topping]);
      }
    }
  };
  
  const handleSubmit = () => {
    const order: PizzaOrder = {
      id: Math.floor(Math.random() * 10000),
      size,
      base,
      toppings,
      price: calculatePrice(),
      specialInstructions: specialInstructions || undefined,
    };
    
    onSubmitOrder(order);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Pizza className="w-5 h-5 mr-2 text-orange-500" />
          Create Pizza Order
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Size selection */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Size</h3>
        <div className="flex gap-2">
          {sizes.map((sizeOption) => (
            <button
              key={sizeOption.type}
              className={`flex-1 py-2 rounded-lg border ${
                size === sizeOption.type 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setSize(sizeOption.type)}
            >
              <div className="text-center">
                {sizeOption.label}
                <div className="text-sm text-gray-500">${sizeOption.price}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Base selection */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Crust</h3>
        <div className="grid grid-cols-2 gap-2">
          {bases.map((baseOption) => (
            <button
              key={baseOption.type}
              className={`py-2 px-3 rounded-lg border ${
                base === baseOption.type 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setBase(baseOption.type)}
            >
              <div className="text-center">
                {baseOption.label}
                {baseOption.price > 0 && (
                  <div className="text-sm text-gray-500">+${baseOption.price}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Toppings selection */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Toppings</h3>
          <span className="text-xs text-gray-500">
            {toppings.length}/5 selected
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {allToppings.map((topping) => (
            <button
              key={topping.type}
              disabled={topping.type === 'cheese'} // Cheese is always selected
              className={`py-2 px-3 rounded-lg border text-left flex justify-between items-center ${
                toppings.includes(topping.type) 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${topping.type === 'cheese' ? 'opacity-75' : ''}`}
              onClick={() => toggleTopping(topping.type)}
            >
              <span>{topping.label}</span>
              {topping.price > 0 && (
                <span className="text-sm text-gray-500">+${topping.price}</span>
              )}
              {toppings.includes(topping.type) && (
                <Check className="w-4 h-4 text-orange-500" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Special instructions */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Special Instructions</h3>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={2}
          placeholder="E.g., extra crispy, cut in squares, etc."
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
        />
      </div>
      
      {/* Total and submit */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <span className="text-gray-500">Total:</span>
          <span className="text-xl font-bold ml-2">${calculatePrice()}</span>
        </div>
        
        <button
          className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg flex items-center"
          onClick={handleSubmit}
        >
          <Check className="w-4 h-4 mr-1" />
          Place Order
        </button>
      </div>
    </div>
  );
};

export default PizzaOrderSystem;
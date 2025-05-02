import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChefHat, DollarSign, Utensils, Trash2, User, ShoppingBag, Pizza, Clock, Pause, Play, Clipboard, Plus, Minus } from 'lucide-react';
import PizzaOrderSystem from './PizzaOrderSystem';

//This is a React functional component.  It likely needs a render function to be complete.
const PizzaPlace = () => {
  return (
    <div>
      <h1>Pizza Place</h1>
      <PizzaOrderSystem />
    </div>
  );
};


export default PizzaPlace;
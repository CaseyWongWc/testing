
import React, { useState } from 'react';

interface TradeOffer {
  offerGold: number;
  offerWater: number;
  offerFood: number;
  requestGold: number;
  requestWater: number;
  requestFood: number;
}

interface TraderState {
  patience: number;
  greed: number;
  type: 'patient' | 'aggressive' | 'balanced';
}

export const TraderInteraction: React.FC = () => {
  const [traderState, setTraderState] = useState<TraderState>({
    patience: Math.random() * 5 + 3, // 3-8 counter offers before leaving
    greed: Math.random() * 0.4 + 0.8, // 0.8-1.2 multiplier for value assessment
    type: Math.random() < 0.33 ? 'patient' : Math.random() < 0.5 ? 'aggressive' : 'balanced'
  });

  const evaluateOffer = (offer: TradeOffer): 'accept' | 'counter' | 'reject' => {
    // Base value calculations
    const offeredValue = offer.offerGold + (offer.offerWater * 2) + (offer.offerFood * 2);
    const requestedValue = offer.requestGold + (offer.requestWater * 2) + (offer.requestFood * 2);
    
    // Apply trader personality
    const valueRatio = offeredValue / (requestedValue * traderState.greed);

    if (traderState.patience <= 0) {
      return 'reject'; // Trader leaves if out of patience
    }

    if (valueRatio >= 1) {
      return 'accept';
    }

    if (valueRatio >= 0.7) {
      setTraderState(prev => ({...prev, patience: prev.patience - 1}));
      return 'counter';
    }

    return 'reject';
  };

  return null; // UI implementation
};

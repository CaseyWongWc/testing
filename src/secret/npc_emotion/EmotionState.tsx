
import React from 'react';

export type EmotionType = 'happy' | 'sad' | 'angry' | 'neutral' | 'excited' | 'worried' | 'curious';

export interface EmotionState {
  current: EmotionType;
  intensity: number; // 0-1
  duration: number;  // in ms
  triggers: string[];
  lastChanged: number;
}

export interface EmotionalResponse {
  type: EmotionType;
  dialogue: string;
  action?: string;
  probability: number;
}

export const defaultEmotions: Record<EmotionType, EmotionalResponse[]> = {
  happy: [
    { type: 'happy', dialogue: "This is wonderful!", probability: 0.7 },
    { type: 'happy', dialogue: "I'm so glad!", probability: 0.3 }
  ],
  sad: [
    { type: 'sad', dialogue: "Things aren't going well...", probability: 0.6 },
    { type: 'sad', dialogue: "I need a moment...", probability: 0.4 }
  ],
  angry: [
    { type: 'angry', dialogue: "This is unacceptable!", probability: 0.8 },
    { type: 'angry', dialogue: "I've had enough!", probability: 0.2 }
  ],
  neutral: [
    { type: 'neutral', dialogue: "I see.", probability: 0.5 },
    { type: 'neutral', dialogue: "Understood.", probability: 0.5 }
  ],
  excited: [
    { type: 'excited', dialogue: "This is amazing!", probability: 0.6 },
    { type: 'excited', dialogue: "I can't wait!", probability: 0.4 }
  ],
  worried: [
    { type: 'worried', dialogue: "I'm not sure about this...", probability: 0.7 },
    { type: 'worried', dialogue: "We should be careful.", probability: 0.3 }
  ],
  curious: [
    { type: 'curious', dialogue: "How interesting...", probability: 0.6 },
    { type: 'curious', dialogue: "Tell me more!", probability: 0.4 }
  ]
};

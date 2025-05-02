
import { EmotionState, EmotionType, EmotionalResponse, defaultEmotions } from './EmotionState';

export class EmotionEngine {
  private state: EmotionState;
  private readonly decayRate: number = 0.1;
  private readonly updateInterval: number = 1000;

  constructor(initialEmotion: EmotionType = 'neutral') {
    this.state = {
      current: initialEmotion,
      intensity: 0.5,
      duration: 0,
      triggers: [],
      lastChanged: Date.now()
    };
  }

  public processStimulus(trigger: string, intensity: number): EmotionalResponse {
    const now = Date.now();
    const timeDiff = now - this.state.lastChanged;
    
    // Apply emotional decay
    this.state.intensity = Math.max(0, this.state.intensity - (this.decayRate * (timeDiff / 1000)));
    
    // Process new emotion
    const newEmotion = this.determineNewEmotion(trigger, intensity);
    const responses = defaultEmotions[newEmotion];
    
    // Update state
    this.state = {
      current: newEmotion,
      intensity: intensity,
      duration: 0,
      triggers: [...this.state.triggers, trigger],
      lastChanged: now
    };

    // Select response based on probability
    const random = Math.random();
    let cumulative = 0;
    for (const response of responses) {
      cumulative += response.probability;
      if (random <= cumulative) {
        return response;
      }
    }
    
    return responses[0];
  }

  private determineNewEmotion(trigger: string, intensity: number): EmotionType {
    // Simple mapping of triggers to emotions
    const triggerMap: Record<string, EmotionType> = {
      'praise': 'happy',
      'threat': 'angry',
      'mystery': 'curious',
      'danger': 'worried',
      'success': 'excited',
      'failure': 'sad',
      'default': 'neutral'
    };

    return triggerMap[trigger] || 'neutral';
  }

  public getCurrentState(): EmotionState {
    return { ...this.state };
  }
}

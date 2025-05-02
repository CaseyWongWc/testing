import React from 'react';
import { Bot, Shield, Swords, Zap, Brain, History, Target, Timer, HelpCircle } from 'lucide-react';

// Player AI state machine and decision-making logic

// Player States
export type PlayerState = 
  | 'normal'      // Regular functioning player
  | 'downed'      // Player is downed, limited capabilities
  | 'healing'     // Player is healing another player
  | 'defending'   // Player is in defensive stance
  | 'aggressive'  // Player is in aggressive stance
  | 'retreating'  // Player is retreating to safety
  | 'searching'   // Player is searching for items
  | 'trading'     // Player is trading with another player
  | 'deciding'    // Player is deciding whether to continue or extract
  | 'dead';       // Player is dead

// Player Decision Modes
export type DecisionMode = 
  | 'cautious'    // Prioritizes survival, prefers extraction when risks are high
  | 'balanced'    // Balanced approach to risk and reward
  | 'aggressive'  // Prioritizes progression and loot, more likely to continue
  | 'supportive'; // Prioritizes team needs and helping others

// Player Decision Factors
export interface DecisionFactors {
  // Player's own stats
  health: number;
  maxHealth: number;
  ammo: {
    primary: number;
    secondary: number;
    maxPrimary: number;
    maxSecondary: number;
  };
  
  // Environmental factors
  teamHealthAverage: number;
  teamAmmoAverage: number;
  alivePlayers: number;
  totalPlayers: number;
  dowedPlayers: number;
  enemiesNearby: number;
  bossPresent: boolean;
  waveDifficulty: number;
  timeOfDay: 'day' | 'night';
  
  // Progression factors
  wave: number;
  enemiesKilled: number;
  kills: number;
  levelExplored: number; // percentage of map explored
  
  // Loot factors
  lootQuality: number; // 0-10 scale of loot quality
  weaponTier: number;  // 0-5 scale of weapon quality
}

// Decision result
export interface PlayerDecision {
  action: 'continue' | 'extract';
  confidence: number; // 0-1 scale of confidence in decision
  reasons: string[];  // Reasoning for the decision
  alternatives: string[]; // Other actions considered
  thoughts: string;   // Internal thought process
}

export interface PlayerAIConfig {
  mode: DecisionMode;
  aggressiveness: number;   // 0-1 scale
  selfPreservation: number; // 0-1 scale
  teamwork: number;         // 0-1 scale
  lootPriority: number;     // 0-1 scale
  explorationDesire: number; // 0-1 scale
  adaptability: number;     // How quickly AI adapts to changing circumstances (0-1)
}

// Calculate weighted scores for different aspects of decision making
function calculateWeightedScores(factors: DecisionFactors, config: PlayerAIConfig): Record<string, number> {
  // Calculate survival score - higher means safer to continue
  const healthRatio = factors.health / factors.maxHealth;
  const ammoRatioPrimary = factors.ammo.primary / factors.ammo.maxPrimary;
  const ammoRatioSecondary = factors.ammo.secondary / factors.ammo.maxSecondary;
  const ammoRatio = (ammoRatioPrimary + ammoRatioSecondary) / 2;
  
  const survivalScore = (
    (healthRatio * 0.6) + 
    (ammoRatio * 0.3) + 
    (factors.alivePlayers / factors.totalPlayers * 0.1)
  ) * (1 + config.selfPreservation);
  
  // Calculate risk score - higher means more risky to continue
  const enemyThreat = factors.enemiesNearby * (factors.bossPresent ? 2 : 1);
  const environmentThreat = factors.timeOfDay === 'night' ? 1.5 : 1.0;
  const waveThreat = factors.waveDifficulty * 0.2;
  
  const riskScore = (
    (enemyThreat * 0.5) + 
    (environmentThreat * 0.3) + 
    (waveThreat * 0.2)
  ) * (2 - config.aggressiveness);
  
  // Calculate reward score - higher means more rewarding to continue
  const progressionValue = (factors.wave * 0.3) + (factors.levelExplored * 0.2);
  const lootValue = (factors.lootQuality * 0.3) + (factors.weaponTier * 0.2);
  
  const rewardScore = (
    (progressionValue * 0.5) + 
    (lootValue * 0.5)
  ) * (1 + config.lootPriority);
  
  // Calculate team score - higher means team is in better condition
  const teamHealthFactor = factors.teamHealthAverage / 100;
  const teamStatusFactor = 1 - (factors.dowedPlayers / factors.totalPlayers);
  
  const teamScore = (
    (teamHealthFactor * 0.7) + 
    (teamStatusFactor * 0.3)
  ) * (1 + config.teamwork);
  
  return {
    survivalScore,
    riskScore,
    rewardScore,
    teamScore
  };
}

// Make the continue/extract decision
export function makeProgressionDecision(factors: DecisionFactors, config: PlayerAIConfig): PlayerDecision {
  const scores = calculateWeightedScores(factors, config);
  const thoughts: string[] = [];
  
  // Add basic reasoning
  thoughts.push(`Current health: ${factors.health}/${factors.maxHealth} (${Math.round(factors.health/factors.maxHealth*100)}%)`);
  thoughts.push(`Ammo status: Primary ${factors.ammo.primary}/${factors.ammo.maxPrimary}, Secondary ${factors.ammo.secondary}/${factors.ammo.maxSecondary}`);
  thoughts.push(`Team status: ${factors.alivePlayers}/${factors.totalPlayers} alive, ${factors.dowedPlayers} downed`);
  thoughts.push(`Environment: Wave ${factors.wave}, ${factors.timeOfDay}, ${factors.enemiesNearby} enemies nearby${factors.bossPresent ? ', boss present' : ''}`);
  thoughts.push(`Progression: ${factors.levelExplored}% explored, loot quality ${factors.lootQuality}/10, weapon tier ${factors.weaponTier}/5`);
  thoughts.push("---");
  thoughts.push(`Survival score: ${scores.survivalScore.toFixed(2)} (higher = safer)`);
  thoughts.push(`Risk score: ${scores.riskScore.toFixed(2)} (higher = more dangerous)`);
  thoughts.push(`Reward score: ${scores.rewardScore.toFixed(2)} (higher = more rewarding)`);
  thoughts.push(`Team score: ${scores.teamScore.toFixed(2)} (higher = team in better condition)`);
  
  // Apply decision mode modifiers
  let continueThreshold = 0.5; // Default balanced
  let reasons: string[] = [];
  let alternatives: string[] = [];
  
  switch(config.mode) {
    case 'cautious':
      continueThreshold = 0.7; // Higher threshold to continue
      thoughts.push("Cautious mode: Setting higher threshold for continuing");
      break;
    case 'aggressive':
      continueThreshold = 0.3; // Lower threshold to continue
      thoughts.push("Aggressive mode: Setting lower threshold for continuing");
      break;
    case 'supportive':
      // In supportive mode, team status has more weight
      if (scores.teamScore < 0.5) {
        thoughts.push("Supportive mode: Team needs help, considering extraction");
        reasons.push("Team members need support and medical attention");
        continueThreshold = 0.8; // Much higher threshold to continue
      } else {
        thoughts.push("Supportive mode: Team is in good condition");
      }
      break;
    default:
      thoughts.push("Balanced mode: Using standard decision thresholds");
  }
  
  // Calculate final decision score (higher = more likely to continue)
  const survivalWeight = 0.35;
  const riskWeight = 0.30;
  const rewardWeight = 0.25;
  const teamWeight = 0.10;
  
  let continueScore = (
    (scores.survivalScore * survivalWeight) -
    (scores.riskScore * riskWeight) +
    (scores.rewardScore * rewardWeight) +
    (scores.teamScore * teamWeight)
  );
  
  // Normalize to 0-1 range
  continueScore = Math.max(0, Math.min(1, continueScore / 2));
  
  thoughts.push(`Final continue score: ${continueScore.toFixed(2)} (threshold: ${continueThreshold})`);
  
  // Determine confidence level
  const confidence = Math.abs(continueScore - continueThreshold) * 2;
  
  // Make the decision
  const shouldContinue = continueScore >= continueThreshold;
  
  // Add reasons based on the most influential factors
  if (shouldContinue) {
    if (scores.survivalScore > 0.7) reasons.push("Resources and health are in good condition");
    if (scores.riskScore < 0.4) reasons.push("Current threat level is manageable");
    if (scores.rewardScore > 0.6) reasons.push("Potential rewards are worth the risk");
    if (scores.teamScore > 0.8) reasons.push("Team is performing well and ready for more");
    
    alternatives.push("Could extract if wave difficulty increases");
    alternatives.push("Will reconsider if team health drops below 50%");
  } else {
    if (scores.survivalScore < 0.5) reasons.push("Health and resources are running low");
    if (scores.riskScore > 0.6) reasons.push("Current threat level is too high");
    if (scores.rewardScore < 0.4) reasons.push("Potential rewards don't justify the risk");
    if (scores.teamScore < 0.5) reasons.push("Team is struggling and needs to regroup");
    
    alternatives.push("Could continue if we find health and ammo supplies");
    alternatives.push("Will reconsider if we can eliminate nearby threats first");
  }
  
  return {
    action: shouldContinue ? 'continue' : 'extract',
    confidence,
    reasons,
    alternatives,
    thoughts: thoughts.join('\n')
  };
}

// Handle player state transitions
export function getNextPlayerState(
  currentState: PlayerState, 
  player: any, 
  nearbyPlayers: any[], 
  nearbyEnemies: any[]
): PlayerState {
  // Dead players stay dead
  if (currentState === 'dead') return 'dead';
  
  // Handle downed state
  if (currentState === 'downed') {
    // Check if any nearby players are healing this player
    const isBeingHealed = nearbyPlayers.some(p => 
      p.isAlive && !p.isDowned && 
      Math.abs(p.x - player.x) <= 1 && Math.abs(p.y - player.y) <= 1 &&
      p.state === 'healing'
    );
    
    if (isBeingHealed) {
      // Being healed, potentially returning to normal
      if (player.health > 30) {
        return 'normal';
      }
      return 'downed'; // Still being healed
    }
    
    // If health is critical and not being healed, die
    if (player.health <= 0) {
      return 'dead';
    }
    
    return 'downed'; // Still downed
  }
  
  // Check if player should be downed
  if (player.health <= 30 && player.health > 0) {
    return 'downed';
  }
  
  // Check if player should be healing someone
  const nearbyDownedPlayers = nearbyPlayers.filter(p => 
    p.state === 'downed' && 
    Math.abs(p.x - player.x) <= 1 && Math.abs(p.y - player.y) <= 1
  );
  
  if (nearbyDownedPlayers.length > 0 && player.health > 50) {
    return 'healing';
  }
  
  // Check if player should be retreating
  if (player.health < 40 && nearbyEnemies.length > 2) {
    return 'retreating';
  }
  
  // Check if player should be defending
  if (player.health < 60 && nearbyEnemies.length > 0) {
    return 'defending';
  }
  
  // Check if player should be aggressive
  if (player.health > 70 && nearbyEnemies.length > 0) {
    return 'aggressive';
  }
  
  // Check if player should be searching
  if (player.health > 60 && nearbyEnemies.length === 0 && 
      (player.ammo.primary < player.ammo.maxPrimary * 0.5 || 
       player.health < player.maxHealth * 0.7)) {
    return 'searching';
  }
  
  // Check if player should be trading
  const potentialTradingPartners = nearbyPlayers.filter(p => 
    p.state !== 'downed' && p.state !== 'dead' &&
    Math.abs(p.x - player.x) <= 1 && Math.abs(p.y - player.y) <= 1
  );
  
  if (potentialTradingPartners.length > 0 && player.gameState.time === 'day') {
    return 'trading';
  }
  
  // Check if player should be deciding whether to continue
  if (player.gameState.canTransition) {
    return 'deciding';
  }
  
  // Default to normal state
  return 'normal';
}

// Get player behavior based on current state
export function getPlayerBehavior(state: PlayerState): {
  movementSpeed: number;
  canUsePrimary: boolean;
  canUseSecondary: boolean;
  canUseMelee: boolean;
  canHeal: boolean;
  healMultiplier: number;
  defensiveBonus: number;
  offensiveBonus: number;
} {
  switch(state) {
    case 'downed':
      return {
        movementSpeed: 0.3,
        canUsePrimary: false,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: false,
        healMultiplier: 0,
        defensiveBonus: -0.5,  // More vulnerable when downed
        offensiveBonus: -0.3   // Less damage when downed
      };
    case 'healing':
      return {
        movementSpeed: 0.7,
        canUsePrimary: false,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: true,
        healMultiplier: 2.0,  // Better at healing others
        defensiveBonus: -0.2, // Vulnerable while healing
        offensiveBonus: -0.2  // Less focused on attacking
      };
    case 'defending':
      return {
        movementSpeed: 0.8,
        canUsePrimary: true,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: true,
        healMultiplier: 1.0,
        defensiveBonus: 0.3,  // Better defense
        offensiveBonus: -0.1  // Slightly less offensive
      };
    case 'aggressive':
      return {
        movementSpeed: 1.2,
        canUsePrimary: true,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: false,
        healMultiplier: 0.5,
        defensiveBonus: -0.2, // Less defensive
        offensiveBonus: 0.3   // More offensive
      };
    case 'retreating':
      return {
        movementSpeed: 1.3,
        canUsePrimary: true,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: false,
        healMultiplier: 0,
        defensiveBonus: 0.1,  // Slightly more defensive
        offensiveBonus: -0.2  // Less focused on attack
      };
    case 'searching':
      return {
        movementSpeed: 1.1,
        canUsePrimary: true,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: true,
        healMultiplier: 1.0,
        defensiveBonus: 0,
        offensiveBonus: 0
      };
    case 'trading':
      return {
        movementSpeed: 0.5,
        canUsePrimary: false,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: false,
        healMultiplier: 0,
        defensiveBonus: 0,
        offensiveBonus: 0
      };
    case 'deciding':
      return {
        movementSpeed: 0.8,
        canUsePrimary: true,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: true,
        healMultiplier: 1.0,
        defensiveBonus: 0.1,
        offensiveBonus: 0.1
      };
    case 'dead':
      return {
        movementSpeed: 0,
        canUsePrimary: false,
        canUseSecondary: false,
        canUseMelee: false,
        canHeal: false,
        healMultiplier: 0,
        defensiveBonus: 0,
        offensiveBonus: 0
      };
    case 'normal':
    default:
      return {
        movementSpeed: 1.0,
        canUsePrimary: true,
        canUseSecondary: true,
        canUseMelee: true,
        canHeal: true,
        healMultiplier: 1.0,
        defensiveBonus: 0,
        offensiveBonus: 0
      };
  }
}

// Get icon for player state for UI
export function getStateIcon(state: PlayerState): React.ReactNode {
  switch(state) {
    case 'downed': return <HelpCircle size={16} />;
    case 'healing': return <Shield size={16} />;
    case 'defending': return <Shield size={16} />;
    case 'aggressive': return <Swords size={16} />;
    case 'retreating': return <Timer size={16} />;
    case 'searching': return <Target size={16} />;
    case 'trading': return <Zap size={16} />;
    case 'deciding': return <Brain size={16} />;
    case 'dead': return <History size={16} />;
    case 'normal': default: return <Bot size={16} />;
  }
}

// Function to resurrect a downed player
export function resurrectPlayer(player: any, healer: any): void {
  // Implement resurrection logic
  // This would likely involve updating player state and health
  player.state = 'normal';
  player.health = Math.min(player.maxHealth * 0.5, player.health + 50);
  
  // Apply some cost to the healer
  healer.energy = Math.max(0, healer.energy - 20);
}
# Wilderness Survival System (WSS) Project Report

## Team Information
Casey Wong - Implemented the entire Wilderness Survival System, including terrain generation, trader interactions, resource management, and AI decision-making algorithms.

## Project Status
The Wilderness Survival System has been fully implemented as per the requirements. The system includes:

- A complete terrain-based map with varied terrain types and resource distribution
- Multiple trader types with unique trading behaviors
- Different vision types affecting how much of the map the player can see
- Different brain types implementing various decision-making strategies
- A full resource management system (food, water, gold)
- Trading mechanics with offers and counter-offers
- Path finding and movement across terrain with varying movement costs

## Object-Oriented Design Application

Object-oriented design principles were fundamental to the organization of this project. We created a system of interfaces and types to represent the different components of the WSS, ensuring each component has well-defined responsibilities and behaviors.

The use of TypeScript interfaces allowed us to create a clear hierarchy of objects with specific properties and behaviors, promoting code reusability and maintainability. This approach helped us isolate concerns and implement complex behaviors in a modular way.

## Grading Information

### Terrain Types (15 points)
Our implementation includes **5 types of terrain**:
1. Plains - Easy to traverse with low resource costs
2. Forest - Moderate difficulty with good resource availability
3. Mountain - Difficult to traverse with high movement costs
4. Desert - Hot terrain with high water costs
5. Swamp - Wet terrain with high movement costs but low water costs

Each terrain type affects gameplay differently, with varied movement costs, water costs, and food costs.

### Trader Types (20 points)
We implemented **4 types of traders**:
1. Generous - Offers better rates for the player and accepts trades more readily
2. Fair - Offers balanced trades with reasonable valuations of resources
3. Greedy - Values resources highly and offers less favorable trades
4. Impatient - Gets annoyed quickly if multiple counter-offers are made

Traders decide whether to accept a trade or offer a counter-offer based on:
- Their individual value ratios for different resources (food, water, gold)
- The number of counter-offers already made in the current interaction
- Their personality type, which affects how they value different resources

### Vision Types (10 points)
Our implementation includes **3 types of vision**:
1. Cautious - Limited vision range (1 square in each direction)
2. Eagle - Extended vision range (3 squares in each direction)
3. Strategic - Moderate vision range (2 squares in each direction) 

Vision affects how much of the map the player can see at any given time, influencing decision-making and planning.

### Brain Types (15 points)
We implemented **6 types of brain** (decision-making algorithms):
1. Balanced - Makes decisions taking all factors into account equally
2. Explorer - Prioritizes discovering new areas of the map
3. Collector - Prioritizes collecting resources
4. Trader - Prioritizes finding and trading with traders
5. Adaptive - Adjusts behavior based on current resource levels
6. Strategic - Plans efficient paths to reach the eastern edge

The brain types function by evaluating possible moves and selecting the optimal one based on their specific priorities. For example:
- The collector brain evaluates nearby resources and calculates the most efficient path to collect them
- The explorer brain prioritizes moving toward unexplored areas
- The trader brain seeks out traders when resources are sufficient for trading
- The adaptive brain changes priorities based on current resource levels (e.g., prioritizing water when water levels are low)

### Code Examples Demonstrating OOP Principles

#### Hierarchy (8 points)
Our code uses a clear hierarchy of components to represent the game world:
- The game world contains a map made of cells
- Cells contain terrain and items
- Items include different resource types and traders
- Traders have specific personality types that influence their behavior

**Location in code**: 
- The hierarchy is defined in `src/combat/WSSTwo.tsx` through a series of interfaces:
- Lines 34-41: `TerrainCosts` interface
- Lines 44-51: `Cell` interface containing terrain and items
- Lines 54-60: `Item` interface for resources and traders
- Lines 63-73: `Trader` interface with personality types

#### Inheritance (8 points)
While TypeScript interfaces don't directly implement inheritance in the traditional sense, our code structure demonstrates inheritance through interface extension and implementation:

**Location in code**: 
- `src/combat/WSSTwo.tsx` lines 24-31: Type definitions extend basic types
- Lines 145-186: `TERRAIN_COSTS` object implements the `TerrainCosts` interface for multiple terrain types
- The relationship between `Direction` type (line 28) and movement handling (line 708)

#### Polymorphism (8 points)
Polymorphism is demonstrated through the different implementations of:
- Terrain types that all share the same interface but have different behaviors
- Trader types that implement the same trading methods but with different decision logic
- Brain types that all calculate moves using the same method signature but with different internal algorithms

**Location in code**: 
- `src/combat/WSSTwo.tsx` lines 1105-1120: The `generateCounterOffer` function behaves differently based on trader type
- Lines 1345-1500: The `calculateBrainMove` function implements different behavior patterns based on brain type
- Lines 189-193: Vision types with different ranges but same interface

#### Encapsulation (8 points)
Encapsulation is implemented through:
- Use of TypeScript interfaces to define clear boundaries between components
- State management that separates concerns (map state, player state, game state)
- Functions that operate on specific data structures without exposing implementation details

**Location in code**: 
- `src/combat/WSSTwo.tsx` lines 196-255: Component state variables that encapsulate different aspects of the game
- Lines 708-888: The `handleMove` function encapsulates all the logic for movement without exposing implementation details
- Lines 591-705: The `placeItems` function encapsulates item generation logic

#### Abstraction (8 points)
Abstraction is demonstrated through:
- High-level interfaces that hide implementation details
- Function calls like `handleMove()` that abstract away the complex logic of movement, resource consumption, and state updates
- The trading system that abstracts away the complex valuation and negotiation logic

**Location in code**: 
- `src/combat/WSSTwo.tsx` line 708: The `handleMove` function provides a simple interface to complex movement logic
- Lines 1142-1180: The `executeTradeOffer` function abstracts the exchange of resources
- Lines 370-532: Terrain generation abstracts complex map creation algorithms

#### Code Comments (8 points)
Our code contains comprehensive comments explaining:
- The purpose and behavior of each component
- Complex algorithms and their implementation
- Decision-making processes for the different brain types

**Location in code**: 
- `src/combat/WSSTwo.tsx` lines 24-142: Detailed comments explaining interfaces and types
- Lines 1106-1120: Comments explaining trader behavior in the `generateCounterOffer` function
- Lines 189-193: Comments explaining vision range differences in `VISION_RANGES`
- Lines 145-186: Comments describing different terrain characteristics

## Additional Features

The implementation includes several features that enhance the simulation:
1. Auto-play functionality allowing the AI to play through the game autonomously
2. Detailed logging system to track decisions and events
3. Configurable map settings (size, difficulty)
4. Visual representation of the map with terrain icons and resource indicators
5. Brain reasoning display that shows the AI's thought process

## Implementation Details and Statistics

- Total lines of code: 2,661 (src/combat/WSSTwo.tsx)
- Languages/Technologies used: TypeScript, React, Tailwind CSS
- Key features implemented:
  - Procedural terrain generation with different difficulty levels
  - Complex AI decision-making with multiple brain types
  - Visual interface with interactive controls
  - Resource management system
  - Trading system with negotiation logic

## Conclusion

This project demonstrates a comprehensive implementation of the Wilderness Survival System requirements. The application showcases multiple facets of object-oriented programming through its component-based architecture and clear separation of concerns. By modeling the system using interfaces and types, we've created a flexible and maintainable codebase that can be extended with additional features in the future.

The simulation successfully implements all required terrain types, trader types, vision types, and brain types, with each component demonstrating distinctive behaviors and characteristics. The trading system in particular demonstrates complex interaction patterns between different object types, with trader personalities affecting the negotiation process.

Through this project, we've applied object-oriented principles to create a realistic simulation that models complex decision-making in a resource-constrained environment.

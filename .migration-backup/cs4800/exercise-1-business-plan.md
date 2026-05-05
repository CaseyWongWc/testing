# Business Plan: "A Forgotten Place" (WSS2)
## Zero-Player Survival Horror Simulation
### CS 4800 Software Engineering | Casey Wong
### Date: February 2026 | Version 2.0

---

## 1. Executive Summary

### 1.1 Business Concept

**"A Forgotten Place"** is a zero-player survival horror game where AI-controlled survivors navigate procedurally generated maps, fight zombie hordes and hostile humans, complete objectives to unseal rift portals, and attempt evacuation across sequential maps. Inspired by COD Cold War Zombies: Onslaught and Dinogen Online, the game combines real-time AI decision-making with survival horror mechanics in an observable, hands-off experience.

Unlike traditional games where the player controls characters directly, the user acts as an **Observer** — configuring settings, watching AI survivors make autonomous life-or-death decisions, and evaluating their performance through a grading system (S/A/B/C/D/F). This creates a unique product that serves both as entertainment and as a demonstration of advanced AI systems, procedural generation, and real-time simulation architecture.

The project evolved from the original Wilderness Survival System (WSS1), a grid-based pathfinding prototype, into a full-scale survival horror simulation with combat, faction systems, loot economies, and multi-agent coordination.

### 1.2 Target Market

**Primary Market Segments:**

1. **Zero-Player / Idle Game Enthusiasts** — Players who enjoy watching AI-driven simulations unfold (Dwarf Fortress, RimWorld spectator mode, idle games). Growing niche with dedicated communities on Reddit, Discord, and YouTube.
2. **Survival Horror Fans** — Gamers interested in zombie survival scenarios, roguelike progression, and emergent storytelling through AI behavior.
3. **Computer Science Students & Educators** — Learners studying AI decision-making, pathfinding, procedural generation, and OOP design patterns. The transparent architecture makes it an ideal teaching tool.

**Secondary Market Segments:**

1. **Game Development Researchers** — Teams prototyping AI behavior systems, procedural map generation, or multi-agent coordination.
2. **Content Creators & Streamers** — YouTubers and streamers who cover simulation/idle games, AI experiments, or roguelike content.
3. **Hobbyist Modders** — Players who want to create custom biomes, enemy types, or AI personality configurations.

### 1.3 Proposed Solution

"A Forgotten Place" addresses several gaps in the current gaming landscape:

- **The "I just want to watch" gap** — Many survival games require constant player input. This game lets you set up a run and watch the drama unfold, perfect for background entertainment or streaming.
- **The AI transparency gap** — Most game AI is a black box. This game's modular Brain architecture (Sense → Decide → Act) with 5 distinct personality types makes AI behavior observable, explainable, and educational.
- **The procedural variety gap** — Each run generates a unique map with different biomes, building layouts, loot distributions, and enemy placements, ensuring high replayability.
- **The academic demonstration gap** — The codebase is designed to produce clean UML diagrams, use case analyses, and architecture documents, making it a strong portfolio piece and coursework deliverable.

**Core Gameplay Loop:**
1. Observer configures settings (difficulty, biome, loot density, number of survivors)
2. Game generates a procedural map with terrain, buildings, loot, spawners, and objectives
3. AI survivors autonomously navigate, fight, scavenge, and complete objectives
4. Once all objectives are complete, the Rift Portal unseals and survivors attempt evacuation
5. Between maps, survivors trade at the Survivor Market
6. Run continues across sequential maps with escalating difficulty until all survivors die or evacuate
7. Observer receives a letter grade (S/A/B/C/D/F) based on performance

### 1.4 Team

| Role | Responsibilities |
|------|-----------------|
| Product Owner / Designer | Game design decisions, system specifications, roadmap definition, scope control |
| Developer | Architecture design, React/TypeScript implementation, AI brain systems, procedural generation |
| Business Analyst | Requirements gathering, use case development, UML diagrams, documentation |
| QA Engineer | Test strategy, test cases, results validation, traceability matrix |

Note: In academic context, one individual fulfills multiple roles.

---

## 2. Product Overview

### 2.1 Core Features

#### Real-Time AI Simulation Engine
- **60 ticks/second** game loop with hybrid tick-based + event-driven AI brain architecture
- **5 AI personality types:** Balanced, Aggressive, Cautious, Survivalist, Money-Driven — each producing distinct survival strategies
- **Autonomous decision-making:** Survivors independently navigate, fight, flee, scavenge, help teammates, and activate objectives without player input
- **Availability-based cooperation:** Any survivor who can help a teammate will do so, regardless of personality

#### Procedural Map Generation
- **Multi-biome support:** Rural, Urban, Military, Industrial environments with biome-specific building templates
- **Stamp-based building system:** 12-20 building templates placed procedurally with interior dressing (furniture, loot containers, cover points)
- **Themed loot containers:** Hospital buildings contain medical supplies, military buildings contain weapons/ammo, residential buildings contain mixed low-tier items
- **Difficulty-driven loot quality:** Higher difficulty maps produce better loot, with a mild distance-from-spawn nudge

#### Combat System
- **3 weapon classes:** Fists (infinite, low damage), Melee (durability-based, breaks after use), Guns (ammo-based, reload mechanics)
- **Noise mechanic:** Gunfire attracts nearby enemies, creating risk/reward decisions between silent melee and loud ranged combat
- **Armor system:** Tiered armor (None/Light/Medium/Heavy) with its own durability
- **Friendly fire ON:** Full damage to allies, forcing AI to make careful targeting decisions
- **Simultaneous group combat:** Multiple survivors and enemies can engage in the same area

#### Faction System
- **PLAYER_TEAM:** AI survivors working together toward evacuation
- **HOSTILE:** Zombies (spawned from Corruption Nests) and hostile humans (carrying valuable loot)
- **NEUTRAL:** Potential future expansion for non-combatant NPCs

#### Run Structure & Progression
- **Sequential maps:** Map 1 → Rift Portal → Survivor Market → Map 2 → ... with roguelike escalation
- **Objective types:** ActivateSwitch, Survive, Extract, DestroyNests, Collect, Rescue
- **Performance grading:** S/A/B/C/D/F based on objectives completed, survivors evacuated, time, and loot collected
- **Charms & Lucky Items:** Modifiers that affect difficulty and loot quality between runs

#### Observer Controls
- **Camera modes:** Observer Grid (all survivors), Survivor Cam (follow one), Free Cam (pan anywhere), Free Zoom
- **Game speed slider:** Speed up, slow down, or pause the simulation
- **Pre-game settings:** Difficulty, loot distribution slider, biome selection, survivor count, friendly fire toggle, loot respawn toggle
- **HUD:** Progressive objective reveal, survivor health/status, compass indicators

### 2.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend Framework | React 18 + TypeScript | Type safety, component reusability, large ecosystem |
| Build Tool | Vite 5 | Fast HMR, modern ESM bundling |
| Styling | Tailwind CSS 3 | Rapid iteration, utility-first approach |
| Icons | lucide-react | Consistent icon library, tree-shakeable |
| Backend Server | Express 5 (Node.js) | Lightweight, handles WebSocket + static serving |
| Real-time Communication | WebSocket (ws library) | Low-latency updates for collaborative features |
| Rendering | HTML5 Canvas | High-performance 2D rendering for game world |
| Pathfinding | A* on grid | Industry-standard, well-documented, efficient for tile grids |
| State Management | React hooks (useState/useEffect) | Simple, no external dependency, fits component-per-simulation pattern |
| Version Control | Git | Standard, supports collaboration and checkpoint rollback |

### 2.3 AI-Specific Requirements

"A Forgotten Place" uses **classical/explainable AI** rather than opaque machine learning, making every decision traceable and debuggable:

#### Brain Architecture
- **Sense → Decide → Act loop** running every tick (60Hz) with fallback to every 5 ticks (12Hz) under high entity counts
- **Event-driven interrupts** for urgent situations: took damage, critically low health, out of ammo, stamina exhausted
- **Radio-gated team awareness:** Survivors without a radio only react to what they personally see; radio items unlock team-wide information sharing

#### Decision Tree
Each brain evaluates conditions and selects from: **Fight, Flee, Scavenge, Barricade, Activate Objective, Help Teammate**

| Decision | Trigger Conditions |
|----------|-------------------|
| Fight | Health > 30%, has weapon, enemy in range |
| Flee | Health < 30%, out of ammo, morale low |
| Scavenge | No immediate threats, resources low |
| Activate Objective | Path to objective is safe, no higher-priority threats |
| Help Teammate | Ally in danger nearby, agent has capacity to help |

#### Personality-Driven Weapon Selection
- **Aggressive:** Goes all-in with best weapon, wastes ammo freely
- **Cautious:** Saves ammo for emergencies, prefers melee
- **Survivalist:** Uses cheapest option available, hoards resources
- **Money-Driven:** Calculates cost-benefit before engaging
- **Balanced:** Adapts loadout to current situation

#### Performance Metrics
| Metric | Description |
|--------|-------------|
| Survival Rate | Percentage of survivors evacuating per run |
| Objectives Completed | Count and percentage of map objectives finished |
| Run Grade | S/A/B/C/D/F letter grade based on composite score |
| Average Time per Map | Ticks elapsed from map start to evacuation |
| Loot Efficiency | Value of loot collected vs. available on map |
| Combat K/D Ratio | Enemies killed vs. survivors lost |

### 2.4 Blockchain-Specific Requirements

Blockchain technology is **not required** for the core product and would introduce unnecessary complexity.

**Optional Future Consideration: Run Verification**
- Hash of map seed + AI decision sequence + final outcome could be stored for verifiable speedrun/challenge leaderboards
- Deferred indefinitely; timestamped replay logs provide sufficient verification for academic and entertainment purposes

---

## 3. Market Analysis

### 3.1 Industry Overview

"A Forgotten Place" operates at the intersection of three growing segments:

1. **Zero-Player / Idle Games** — A rapidly growing genre with titles like Cookie Clicker, Melvor Idle, and Dwarf Fortress proving that "watching things happen" can be deeply engaging. The zero-player niche (fully autonomous AI) is underserved compared to incremental/idle games.

2. **Survival Horror Games** — A $5B+ market segment with consistent demand. Zombie survival specifically remains one of the most popular themes in gaming (DayZ, Project Zomboid, 7 Days to Die, COD Zombies).

3. **Roguelike / Procedural Generation Games** — Titles like Hades, Dead Cells, and Slay the Spire have proven that procedural content + escalating difficulty + run-based structure creates high replay value.

**Market Trends:**
- Growing interest in AI-driven content and "AI plays games" content on YouTube/Twitch
- Increasing demand for background/passive entertainment (watch while working)
- Rise of "digital ant farms" — simulations people observe for emergent behavior
- Academic demand for explainable AI demonstration tools

### 3.2 Target Market & Competitive Analysis

#### Competitive Landscape

| Alternative | Strengths | Limitations | WSS2 Advantage |
|------------|-----------|-------------|----------------|
| Dwarf Fortress | Deep simulation, massive scope | Extremely steep learning curve, ASCII graphics | Accessible UI, focused scope, visual clarity |
| RimWorld | Polished, moddable, active community | Player-directed (not zero-player), $35 price | Fully autonomous AI, free/open-source |
| Project Zomboid | Realistic survival, multiplayer | Player-controlled, complex controls | Zero-player observation, simpler onboarding |
| COD Zombies | AAA production, massive audience | Player-controlled, no procedural maps | AI-driven, procedural maps, academic value |
| Generic AI Demos | Simple, educational | No gameplay depth, boring to watch | Full game experience with educational architecture |

#### WSS2 Differentiation
1. **Zero-player uniqueness** — Very few survival horror games are fully AI-driven
2. **Explainable AI architecture** — Every decision is traceable through the Brain system
3. **Academic dual-purpose** — Playable game AND software engineering coursework deliverable
4. **Procedural variety** — Every run is unique through map generation + AI personality combinations
5. **Accessible observation** — Multiple camera modes make it easy to watch and understand

---

## 4. Marketing and Sales Strategy

### 4.1 Marketing Channels

**Primary Channels:**
- **Course Demonstrations** — Live demos in CS 4800 and related courses showcasing AI behavior, OOP design, and real-time systems
- **GitHub Repository** — Open-source release with comprehensive documentation, architecture diagrams, and contribution guidelines
- **YouTube/Twitch Content** — "AI Survivors vs Zombie Horde" gameplay recordings showing emergent behavior and dramatic moments
- **Reddit Communities** — r/gamedev, r/roguelikes, r/incremental_games, r/artificialintelligence, r/compsci
- **Discord Servers** — Game dev, indie games, and AI enthusiast communities

**Content Strategy:**
- **Highlight Reels** — Short clips of dramatic AI moments (last survivor clutch evacuation, personality-driven decisions, friendly fire incidents)
- **Architecture Deep-Dives** — Blog posts and videos explaining the Brain system, procedural generation, and combat engine
- **"Can the AI Survive?" Challenges** — Community-suggested difficult configurations to test AI capabilities

### 4.2 Customer Acquisition

- **Zero-friction access** — Web-based, runs in browser, no installation required
- **Instant engagement** — Click "Start Run" and immediately watch AI survivors in action
- **Shareability** — Interesting runs generate stories worth sharing ("My aggressive survivor shot the cautious one by accident")
- **Academic pipeline** — CS students discover it through coursework, continue using it for personal projects

### 4.3 Growth Strategy & Monetization

**Phase 1: Academic & Portfolio (Months 1-6)**
- Open-source release, portfolio centerpiece
- Course demonstrations, student project fairs
- Build initial community through Reddit/Discord

**Phase 2: Community Growth (Months 6-18)**
- Modding support (custom biomes, enemy types, AI personalities)
- Challenge mode with community-created scenarios
- Streaming-friendly features (overlay integration, event highlights)

**Phase 3: Sustainable Model (Months 18+)**
- **Freemium model:** Core game free; premium cosmetic sprite packs, custom biome packs
- **Educational licensing:** Classroom packages with assignment templates and grading tools
- **Community marketplace:** User-created content packs

**Revenue Projections (Conservative):**

| Revenue Stream | Year 1 | Year 2 | Year 3 |
|---------------|--------|--------|--------|
| Cosmetic/Content Packs | $0 | $3,000 | $15,000 |
| Educational Licenses | $0 | $5,000 | $20,000 |
| Streaming/Content Partnerships | $0 | $2,000 | $8,000 |
| **Total** | **$0** | **$10,000** | **$43,000** |

---

## 5. Risk Analysis

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Performance with many AI agents | High | Brain tick rate fallback (every tick → every 5 ticks), entity count profiling |
| Procedural map quality variance | Medium | Building stamp library with placement rules, quality validation pass |
| Combat balance issues | Medium | Playtesting with different personality combinations, tuning via config |
| Browser rendering limits (Canvas) | Medium | Tile culling, viewport-only rendering, sprite batching |

### Market Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Niche audience (zero-player) | Medium | Dual positioning: game + educational tool |
| Content creator disinterest | Low | Built-in dramatic moments from AI behavior + friendly fire |
| Competition from AAA titles | Low | Different genre (zero-player vs player-controlled) |

### Project Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Scope creep | High | Phased roadmap (Phase 0-8), strict MVP definition |
| Single developer | High | Modular architecture, comprehensive documentation, version control |
| Academic deadline pressure | Medium | Prioritize deliverables that serve both game and coursework |

---

## 6. Implementation Roadmap

### MVP Scope (Course Timeline)

**Phase 0: Foundation**
- Game loop, entity system, grid world, basic rendering
- Survivor movement on grid with smooth interpolation

**Phase 1: Core Gameplay**
- Combat engine (fists, melee, guns), enemy spawners
- Basic procedural map generation with buildings
- AI Brain system with 2-3 personality types

**Phase 2: Objectives & Progression**
- Objective system, Rift Portal, map transitions
- Survivor Market between maps
- Run grading system

**Phase 3: Polish & Delivery**
- Camera system, HUD, game speed controls
- Balance tuning, bug fixes
- Documentation deliverables for CS 4800

### Post-Course Roadmap
- Phase 4-8: Advanced biomes, full personality roster, modding support, multiplayer observation, community features

---

## 7. Conclusion

"A Forgotten Place" occupies a unique position in gaming: a zero-player survival horror experience where AI agents create emergent stories through autonomous decision-making. By combining the engagement of zombie survival with the transparency of explainable AI, the project serves dual purposes as both an entertaining simulation and a comprehensive software engineering deliverable.

The modular architecture — with clearly separated Brain, Combat, Map Generation, and Entity systems — produces clean UML diagrams, traceable decisions, and measurable performance metrics. This makes it an ideal portfolio piece, academic project, and foundation for future expansion.

With 37 locked design decisions, comprehensive system specifications, and a phased development roadmap, the project is ready to transition from design into implementation.

---

*Source: WSS2 "A Forgotten Place" Design Documents (Notion)*
*Created for CS 4800 Software Engineering — Spring 2026*

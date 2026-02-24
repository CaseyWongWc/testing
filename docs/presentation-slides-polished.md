# WSS2 "A Forgotten Place" — Presentation Slides (Polished Draft)

> **How to use this:** Copy each slide's content into your Canva slides. Speaker notes go into the notes section below each slide. All fixes from the review are applied here.

---

## SLIDE 1 — Title

**Title:** Wilderness Survival Systems — WSS2
**Subtitle:** Feature-Rich Survival Simulation
**Presented by:** Casey Wong

---

## SLIDE 2 — Executive Pitch

**Heading:** Executive Pitch

**Card 1: REAL-TIME SIMULATION**
WSS2 offers an engaging real-time multi-agent survival simulation, allowing players to explore, manage resources, and complete objectives while navigating a rich wilderness environment.

**Card 2: MODULAR AI ARCHITECTURE**
The unique modular AI architecture separates perception from decision-making, enabling measurable strategy comparisons and providing deep insights into AI behavior dynamics within the simulation.

**Speaker Notes:**
WSS2 is a zero-player survival simulation — meaning the AI controls everything. You set it up, hit go, and watch. What makes it unique is the modular brain system. Each agent has a Vision module that gathers sensory data, and a separate Brain module that makes decisions based on that data. This separation means we can swap out brains, compare strategies side-by-side, and actually measure which AI performs better in the same situation. It's both a game and a research tool for studying AI decision-making.

---

## SLIDE 3 — Product Goals and Outcomes

**Heading:** Product Goals and Outcomes

**Card 1: STABLE CORE LOOP**
Our primary objective is to deliver a stable, replayable core loop where agents complete objectives, unlock the rift portal, and coordinate their evacuation seamlessly, ensuring engaging gameplay.

**Card 2: OBSERVABLE AI BEHAVIOR**
We aim to make AI behavior observable and debuggable, enabling developers to analyze intent selection and event-driven interrupts, fostering a deeper understanding of AI interactions during gameplay.

**Speaker Notes:**
Two big goals here. First — a stable core loop. That means the game consistently runs from start to finish without crashing. Agents spawn, they explore, they fight, they complete objectives, they unlock the portal, and they evacuate. Every run. Reliably. Second — observability. We want you to be able to watch any agent, see exactly what it's thinking, why it made a decision, and what it plans to do next. This is critical for debugging but it's also what makes the simulation fun to watch. You're not just seeing random movement — you're seeing reasoning.

---

## SLIDE 4 — End-to-End System Flow Overview

**Heading:** End-to-End System Flow Overview

**Card 1: SENSE**
The system begins by updating vision and fog states, detecting threats, loot, traders, and objectives, enabling agents to maintain situational awareness in real-time.

**Card 2: DECIDE**
Agents evaluate their self-status, goals, and urgency to select intents, while immediate interruptions arise from critical events to ensure quick reactions to changes in the environment.

**Card 3: ACT**
In this phase, agents execute moves, interact, fight, trade, or accomplish objectives, translating decisions into physical actions within the simulation to progress towards survival goals.

**Speaker Notes:**
This is the heartbeat of WSS2 — the Sense-Decide-Act loop. Every single tick, every agent goes through this cycle. Sense: the Vision module scans the surroundings — what tiles can I see? Are there zombies? Loot? Other survivors? Decide: the Brain module takes all that input and picks an intent — should I run, fight, scavenge, or trade? Act: the agent actually does it — moves, shoots, picks up items, negotiates. This runs 60 times per second. The key innovation is that Sense and Decide are separate modules, so you can swap them independently.

---

## SLIDE 5 — Locked Scope

**Heading:** Locked Scope

**Key specs (show as bullet points or cards):**
- **60 ticks per second** — Real-time combat and movement
- **Rift Portal evacuation** — Agents must complete objectives to unseal the exit portal and evacuate
- **Friendly fire ON** — Full damage to allies forces smart AI positioning
- **Melee durability** — Weapons break after use, requiring resource management
- **Reload mechanics** — Guns have reload times; agents can move during reloads
- **Sub-tile movement** — Grid-based world with smooth entity positioning
- **Fog of war** — Shared team vision with fog mechanics

**Speaker Notes:**
These are the design decisions we've locked in — they're not changing. The simulation runs at 60 ticks per second, which is fast enough for smooth real-time combat. Agents need to complete objectives like activating switches or destroying enemy nests before they can unseal the rift portal and evacuate. Friendly fire is always on, which forces the AI to be smart about positioning — you can't just spray bullets if your teammate is in the way. Melee weapons have durability and will break. Guns need to be reloaded, but agents can keep moving while reloading. And the world uses fog of war — agents only see what's in their line of sight, and the team shares vision.

---

## SLIDE 6 — World and Map Design

**Heading:** World and Map Design

**Card 1: CONFIGURABLE MAP SIZES**
WSS2 offers flexible map sizes of 30x30, 40x40, and 60x60 grids, accommodating varying survivor counts from 1 to 5. This allows for tailored gameplay experiences.

**Card 2: PROCEDURAL GENERATION**
The game leverages procedural generation techniques for terrain, buildings, and loot placements, ensuring unique environments for each playthrough while enhancing immersion and replayability.

**Speaker Notes:**
The world is procedurally generated — every run is different. We support three map sizes: 30x30 for quick games, 40x40 for standard play, and 60x60 for large-scale simulations with up to 5 survivors. The terrain generator creates biomes, places buildings from a stamp library of 12-20 templates, and scatters loot and enemies. Buildings aren't random boxes — they're weighted by biome type, so you'll find hospitals in urban areas and cabins in forests. Every playthrough gives you a completely new map to explore.

---

## SLIDE 7 — Loot, Economy, and Progression

**Heading:** Loot, Economy, and Progression Overview

**Card 1: LOOT DISTRIBUTION**
Loot is strategically clustered in buildings and limited outdoor spawns, allowing agents to explore and gather resources efficiently while increasing the thrill of discovery in diverse terrains.

**Card 2: LOOT SOURCES**
Loot is generated from pre-placed sources within the environment and drops from defeated human enemies, ensuring a dynamic and rewarding collection experience throughout gameplay.

**Card 3: QUALITY SCALES**
The quality of loot scales with difficulty levels, featuring themed containers that enhance immersion, such as medical vs military supplies, which cater to various survival strategies.

**Speaker Notes:**
Resources and economy are a big part of survival. Loot is more common indoors than outdoors — buildings have containers and scattered items, while outside is sparser. Agents can also get items from trading with merchants or looting defeated enemies. There's a quality scaling system — loot quality is driven primarily by difficulty level, with a mild bonus for items found farther from spawn. Themed containers add immersion: hospitals drop medical supplies, military buildings drop weapons and ammo. This ties directly into the trading system — an agent might find a health potion but decide to trade it for food because their hunger is more urgent. The economy creates interesting decision-making for the AI.

---

## SLIDE 8 — Combat Mechanics

**Heading:** Combat Mechanics and Weaponry Overview

**Card 1: WEAPONS**
The game features a diverse arsenal with melee and ranged weapons, incorporating durability mechanics for realism and strategy in combat scenarios, enhancing the agent's tactical choices.

**Card 2: FRIENDLY FIRE**
Friendly fire mechanics encourage teamwork and coordination among agents, as positioning becomes crucial to avoid unintended damage during intense encounters and chaotic situations.

**Card 3: ARSENAL EXPANSION**
The system supports broad expansion of weapon types and functionalities without disrupting core combat rules, allowing continuous engagement and innovation in gameplay.

**Speaker Notes:**
Combat is real-time at 60 ticks per second. There are three weapon classes: fists, melee weapons, and guns. Melee weapons have durability — they break after enough use, so agents need to manage their arsenal. Guns require reloading, and agents can move while reloading but take a penalty if they get hit during a reload. Friendly fire is always on, which forces the AI to be smart about positioning — no spraying bullets into a crowd with your ally in it. The weapon system is designed to be expandable — we can add new weapon types without rewriting the combat core. There's also a noise mechanic where loud weapons attract more enemies.

---

## SLIDE 9 — AI Architecture / Brain Model

**Heading:** AI Architecture and Brain Model

**Key content:**
The brain model runs on a hybrid tick-based + event-driven system. Every tick, agents go through Sense → Decide → Act.

**5 Brain Types (show as icons/cards):**
1. **Balanced** — Weighs all survival needs equally
2. **Aggressive** — Charges into threats, prioritizes combat
3. **Cautious/Defensive** — Plays it safe, avoids unnecessary risk
4. **Survivalist** — Focuses on resource gathering and self-preservation
5. **Money-Driven** — Prioritizes gold, trading, and economic advantage

**Speaker Notes:**
This is the core innovation. The brain model runs on a hybrid system — tick-based decisions every frame, with event-driven interrupts for urgent situations like getting shot or spotting a zombie. We have 5 different brain types. Balanced tries to do a bit of everything. Aggressive charges into threats and prioritizes combat. Cautious plays it safe and avoids risk when possible. Survivalist focuses on gathering resources and staying alive. Money-Driven prioritizes gold and trading opportunities. You can configure which brain each agent uses, and you can watch how different brains handle the same situation completely differently. The tick rate is configurable too, so you can speed up or slow down the simulation to observe behavior. [TRANSITION: Let me switch over to the live demo now and show you this in action.]

---

## SLIDE 10 — Roadmap / Sprint Plan

**Heading:** Development Roadmap

**Sprint 1 (Feb):** Presentation, business plan, working prototype (WSS1)
**Sprint 2 (Mar):** Phase 0 — Core architecture, map system, entity framework, base AI pipeline
**Sprint 3 (Apr):** Full gameplay loop, all 5 brain types, trading mechanics, combat system
**Sprint 4 (May):** Director AI (adaptive difficulty), UI polish, final presentation

**Risks:**
- Scope creep — managed by locking scope per sprint
- AI complexity vs. timeline — two-person team, bandwidth is limited
- Performance at 60 tps with multiple agents — needs profiling

**Speaker Notes:**
[After the live demo, come back to slides.] Here's our development plan. We're in Sprint 1 right now — this presentation, the business plan, and the prototype you just saw. Sprint 2 in March is Phase 0, where we build the core architecture — the map system, entity framework, and base AI pipeline in the actual codebase. Sprint 3 in April tackles the gameplay loop, the full brain system with all 5 types, and the trading mechanics. Sprint 4 in May is polish — the Director AI that manages difficulty, UI improvements, and our final presentation. For risks — the biggest one is scope creep. WSS started as a simpler project and the vision keeps growing. We're managing that by locking scope per sprint. AI complexity vs. timeline is real, and it's just the two of us, so bandwidth is a factor.

---

## SLIDE 11 — Success Criteria

**Heading:** Success Criteria (Measurable Milestones)

**Show as checklist:**
- [ ] Stable core loop running at 60 ticks/second without crashes
- [ ] AI agents with observable, debuggable decision-making
- [ ] Vision-Brain architecture: modular, swappable, testable
- [ ] All 5 brain types showing genuinely different behavior
- [ ] Functional trading system with NPC merchants
- [x] Working Replit prototype as proof of concept (WSS1)

**Speaker Notes:**
So how do we know we've succeeded? These are our measurable milestones. A stable core loop running at 60 ticks per second — not crashing, not freezing. AI agents that you can actually watch and understand their decisions. The Vision-Brain architecture working as designed — modular, swappable, testable. All 5 brain types showing genuinely different behavior in the same environment. A functional trading system where agents negotiate with NPCs. And the big one for today — we already have a working Replit prototype as proof of concept. That's what you just saw in the demo. We're not starting from zero. We have a foundation and we're building WSS2 on top of it.

---

## SLIDE 12 — Closing / Q&A

**Heading:** WSS2 — The Wilderness Survival System

**Key points:**
- Real-time AI survival simulation
- Procedural worlds with 5 brain strategies
- Full trading economy
- Working prototype available now

**Demo link:** wss-revised.replit.app

**Presented by:** Casey Wong and Raymond Julian

**Speaker Notes:**
That's WSS2 — the Wilderness Survival System. To recap: it's a real-time AI survival simulation with procedural worlds, 5 different brain strategies, a full trading economy, and a working prototype you can try right now at wss-revised.replit.app. We're Casey Wong and Raymond Julian, and we're excited to keep building this over the semester. The live demo link is right there if you want to try it yourself. Any questions?

---

## Summary of Changes Made

1. **Fixed name split** (Slide 1): "Ca | sey Wong" → "Casey Wong"
2. **Brain types corrected** (Slides 9, 10, 11, 12): Changed from 6 types with wrong names (Explorer, Collector, Trader, Adaptive, Strategic) to the 5 locked design types: Balanced, Aggressive, Cautious/Defensive, Survivalist, Money-Driven
3. **Removed date artifacts**: Stripped "1.7.2013" from all speaker notes
4. **Expanded Slide 5** (Locked Scope): Was one sentence, now has 7 bullet points covering all key locked decisions
5. **Filled Slide 9**: Was showing "..." — now has full AI Architecture content with brain types listed
6. **Updated speaker notes**: All notes now match the locked design docs, reference correct brain type count (5), and flow naturally
7. **Added missing speaker notes**: Slides 1-6 now have proper notes (were missing in original)
8. **Consistent terminology**: "players" → "agents" where appropriate (it's a zero-player game)

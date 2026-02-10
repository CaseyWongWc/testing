# "A Forgotten Place" \- Game Design Document (WSS2)

Zero-player survival horror game inspired by COD Cold War Zombies: Onslaught, built on top of existing WSS OOP mechanics. Multiple AI human agents survive against escalating zombie hordes on semi-randomly generated themed maps.

**Working Title:** "A Forgotten Place" (subject to change)

**Previous names:** City of the Damned

**Name inspiration:** Colossal Cave Adventure

# 1\. Core Vision

\[Brain dump your vision here \- what does the dream version look like?\]

## Inspiration

\- COD Cold War Zombies: Onslaught (roaming danger zone, escalating waves, themed maps)  
\- Original WSS class project (OOP principles, A-to-B navigation)  
\- Colossal Cave Adventure (naming inspiration, the feeling of exploring an unknown place)

\- Dinogen Online (human AI behavior \- squad navigation, cover usage, weapon handling, bot intelligence)

# 2\. Existing WSS Building Blocks

These are proven systems from the current WSS project that will carry over:  
\- Maze Solver: Pathfinding algorithms (Recursive Backtracking, Prim's, Recursive Division)  
\- Terrain Navigator: Multiple terrain types with movement/resource costs  
\- Multi-Goal Robot: Weighted pathfinding, resource collection priorities, value connections  
\- Rogue Like: Turn-based combat, AI decision-making (combat mode, confidence), health/ammo/damage/defense stats, enemy types (skeleton, slime, ghost, mage, boss)  
\- Wilderness Survival: Terrain-based survival, resource management (strength, water, food, gold), brain types (balanced, cautious), fog of war  
\- Spawner Objects (Scene 3): Beehive-style spawners that generate entities from a resource pool  
\- MonsterCards: AI trade evaluation, collection strategies (balanced/aggressive/defensive)  
\- Student Priority Simulator: Needs system (health, hunger), priority-based decision making  
\- Tag Game / Follow Me: Pursuit and evasion AI behaviors

# 3\. Map Generation

## Themed Maps

6 confirmed biome types. Maps are semi-randomly generated with themed elements. Cities can be mixed with any natural biome.

BIOME 1: LIGHTLY FORESTED HILLS  
Terrain: Rolling green hills, scattered trees, open spaces  
Structures: Barns, farms, lighthouses, small villas  
Water: Rivers  
Roads: Random cement tiles near villas in road-like shapes  
Feel: Rural, pastoral but abandoned. Wide sight lines with pockets of cover.

BIOME 2: DENSE FOREST  
Terrain: Thick tree coverage, limited visibility, claustrophobic  
Structures: Abandoned military compounds, science laboratories  
Natural features: Caves (see S3), rivers, mountains  
Roads: Empty roads / empty cracked roads  
Feel: Dark, oppressive. Can't see far. Things lurking in the trees.

BIOME 3: DESERT  
Terrain: Open sandy/arid landscape, sparse vegetation  
Structures: Gas stations, small local downtowns, movie theaters, water towers  
Natural features: Cacti  
Rare spawns: Oasis (rare), desert military installations (rare)  
Roads: Partial/broken roads  
Feel: Exposed, resource-scarce. Water is critical. Nowhere to hide.

BIOME 4: ROCKY MOUNTAINS  
Terrain: Elevated rocky terrain, sparse vegetation, sometimes snow  
Structures: At least one rare hidden bunker entryway (infested with enemies \- either evil humans or zombies)  
Roads: Sorta well-kept roads that are slightly overgrown with grass  
Debris: Wreckages, occasional rare burning vehicles  
Resources: Few \- scarcity is the theme  
Feel: Harsh, isolated. The hidden bunker is a high-risk/high-reward objective.

BIOME 5: CITY  
Terrain: Urban grid, concrete, minimal nature  
Structures: LOTS of buildings (see IDEA 7), hospitals, cracked streets  
Debris: Abandoned police vehicles, sometimes fires  
Special: Cities can be MIXED AND MATCHED with any natural biome type  
  \- City \+ Forest \= overgrown urban ruins  
  \- City \+ Desert \= dusty ghost town  
  \- City \+ Snow \= frozen metropolis  
  \- City \+ Mountains \= cliffside settlement  
Feel: Dense, vertical, many hiding spots. CQB combat. Lots of loot but lots of threats.

BIOME 6: SNOW REGION  
Terrain: Frozen tundra, snow-covered ground, mountains  
Structures: Bunkers, old houses, radio stations, broken satellite arrays  
Natural features: Tundra trees, mountain peaks  
Feel: Cold, desolate, isolated. Hypothermia risk (ties into S4 weather). Limited resources.

## Map Structure

\[Grid size? Room-based? Open areas vs corridors? Onslaught zone boundaries?\]

# 4\. AI Human Agents

\[How many AI humans? Do they have names/personalities? Do they work together or independently?\]

\- Personality types (reuse brain types: balanced, aggressive, defensive, cautious)  
\- Stats: Health, Stamina, Hunger(?), Ammo, Damage, Defense, Range  
\- Decision-making: Fight vs flee vs scavenge vs barricade  
\- \[Can they die permanently? Can new ones arrive as reinforcements?\]

# 5\. Zombie / Enemy System

## Spawners

\- Reuse beehive spawner concept as zombie rifts/portals  
\- Resource pool determines spawn capacity (like honey)  
\- Different spawner types: fast/weak horde spawner, slow/strong elite spawner, boss portal  
\- \[Can spawners be destroyed by AI humans? Do they regenerate?\]

## Enemy Types

\- \[List your zombie/enemy types here \- basic zombies, fast runners, tanks, special infected, bosses?\]  
\- \[Do enemies get stronger over time / rounds?\]

# 6\. Onslaught Mechanic

\[How does the Onslaught zone work? Does it move? Shrink? Push humans into new areas?\]

\- Moving danger zone that forces AI humans to relocate  
\- Escalating rounds / waves  
\- \[Does the zone damage humans who stay in it? Instant kill or gradual?\]  
\- \[What triggers the zone to move?\]

# 7\. Combat System

\- Reuse Rogue Like combat: turn-based, damage/defense calculations  
\- Ranged vs melee  
\- Ammo management  
\- \[Real-time or turn-based in the final version?\]  
\- \[Friendly fire between AI humans?\]

# 8\. Resource & Economy System

\- Health pickups, ammo crates, weapon upgrades  
\- Reuse Wilderness Survival resource types (food, water, strength)  
\- \[Crafting? Barricade building? Trading between AI humans?\]  
\- \[Supply drops? Timed events?\]

# 9\. The Horror Element

\[What makes this feel like survival horror vs just a zombie shooter sim?\]

\- Fog of war / limited vision  
\- Sound/detection mechanics?  
\- Permadeath tension  
\- Resource scarcity  
\- \[Jump scare events? Atmospheric elements?\]

# 10\. Win / Lose Conditions

LOSE: All human PlayerAIs die \- game over

WIN: Extraction event triggers (helicopter rescue or similar)  
\- Win probability starts at 0% and increases based on a score system  
\- Score comes from: zombie kills, evil NPC kills, portals destroyed, rounds survived  
\- Fewer surviving PlayerAIs \= HIGHER multiplier (underdog bonus)  
\- Levels keep scaling in difficulty regardless \- the game doesn't get easier  
\- See IDEA 3 in Section 11 for full details on the math/probability system

# 11\. New Mechanics Brainstorm

\[DUMP ALL YOUR IDEAS HERE \- no idea is too crazy\]

## IDEA 1: Factions / Teams \[UNSTABLE \- needs more thought\]

Status: Experimental \- cool concept but unsure where it fits yet

\- Some form of factions or teams among the AI humans and/or enemies  
\- Could mean: rival survivor groups? Friendly vs hostile NPCs? Faction allegiances that affect cooperation?  
\- Open questions: How do factions form? Can they shift? Do factions compete for resources?  
\- \[Flesh this out as other systems solidify \- may emerge naturally from the AI personality system\]

## IDEA 2: Relative Cameras \+ Brain/AI Revamp \[STABLE\]

Status: Core feature \- requires significant rework of existing systems

Each human PlayerAI gets their own relative camera/viewport showing only what THEY can see. This is a major shift from the current god-view.

Requires revamping:  
\- Brain system: AI must make decisions based on LIMITED local information, not global map knowledge  
\- PlayerAI system: Each agent needs independent exploration logic  
\- Exploration: How do AI humans discover the map? Fog of war per agent? Shared vision when nearby?  
\- Finding things: AI needs to search rooms, loot areas, discover resources organically  
\- Help system: AI humans can REQUEST help from teammates (call out for backup, share location)  
\- Help RESPONSE: Other AI humans evaluate whether to respond based on their own situation (parameters TBD)  
\- The team works TOGETHER to reach the next goal/level

Open parameters to define:  
\- How far can an AI human "see"? (vision range)  
\- How does communication work? (radio range? line of sight? proximity?)  
\- What triggers a help request? (low health? surrounded? found something important?)  
\- What factors determine if another AI responds? (distance, own health, personality type, current task)

## IDEA 3: Extraction Score / Win Probability System \[STABLE\]

Status: Core feature \- defines how the game can be WON

Two endings:  
1\. LOSE: All human PlayerAIs die  
2\. WIN: Successful extraction event (helicopter rescue or similar)

How winning works \- Score-based probability system:  
\- At game start, rescue/extraction chance \= 0%  
\- Score accumulates from: zombie kills, evil NPC kills, portals/spawners destroyed(?)  
\- As combined score increases, the probability of a rescue event triggering goes UP  
\- The increase can be tiny (grind it out) or significant (big plays)  
\- Levels/maps continue to generate and scale in difficulty REGARDLESS of score

Multipliers:  
\- FEWER surviving human PlayerAIs \= HIGHER win multiplier (underdog bonus)  
\- If only 1-2 survivors remain but they've been through hell, math rewards them  
\- Philosophy: "If you try hard enough and survive long enough, you WILL win from math"

Factors that increase rescue probability:  
\- Total kill score (zombies \+ evil NPCs)  
\- Portal/spawner score  
\- Rounds survived  
\- Underdog multiplier (fewer survivors \= bigger bonus)  
\- \[Other factors TBD\]

Design intent: The game is ALWAYS winnable but never guaranteed. Creates tension between "we're losing people but our odds are actually going UP"

## IDEA 4: Day/Night Cycle \[STABLE\]

Status: Core feature \- affects multiple systems

A full day/night cycle that impacts gameplay:

Vision effects:  
\- Daytime: Full/normal vision range for PlayerAI  
\- Nighttime: Reduced vision range \- makes exploration harder and scarier  
\- Modifies the relative camera system (IDEA 2\) \- what each PlayerAI can see shrinks at night  
\- Creates natural tension: do you explore during the day and hunker down at night?

Gameplay implications:  
\- Night \= more dangerous (can't see enemies coming, reduced awareness)  
\- Day \= safer window for exploration, scavenging, and trading  
\- Cycle length TBD (how many turns/ticks per day? configurable?)  
\- Could affect enemy behavior too (more aggressive at night? special night-only enemies?)

## IDEA 5: Shop & Trading System \[SEMI-STABLE \- multiple implementation ideas\]

Status: Core feature \- implementation approach TBD

Trading between team members:  
\- Players/PlayerAIs can now trade items, resources, ammo, etc. with each other  
\- Reuses MonsterCards AI trade evaluation logic (balanced/aggressive/defensive strategies)  
\- AI decides whether a trade is worth it based on their current needs and personality

Shop system \- THREE possible implementations:

Option A: Craftable Workbench  
\- Players find/craft a workbench object on the map  
\- Workbench allows purchasing/crafting items  
\- Portable? Fixed location? Requires resources to build?

Option B: Shop Area on Map  
\- A designated square/zone on the map acts as a shop  
\- PlayerAIs must physically travel to this location to buy things  
\- Creates strategic decisions: is it worth the trip? Is the path safe?  
\- Could be randomly placed during map generation

Option C: Sunrise Buy Window \[FAVORITE?\]  
\- Every sunrise (day/night cycle transition), a timed buy window opens  
\- All PlayerAIs get a small window to purchase items  
\- ENEMIES STOP SPAWNING ENTIRELY during this period  
\- Creates a natural "breather" moment \- ties directly into IDEA 4 (Day/Night Cycle)  
\- Buy window duration is a configurable parameter  
\- After the window closes, spawning resumes and the day begins

\[Could combine options \- e.g., sunrise window for basic purchases \+ shop area for rare items?\]  
\[What currency? Gold from kills? A point system? Scavenged resources?\]

**KNOWN DESIGN PROBLEM: No dedicated trader NPC**  
In the original WSS (MonsterCards), trading had a dedicated NPC trader with its own AI evaluation system. In "A Forgotten Place," traders ARE the players/PlayerAIs themselves \- there is no separate trader role or NPC shopkeeper.

This means:  
\- The MonsterCards trade evaluation logic needs to be embedded INTO each PlayerAI's brain  
\- Every survivor is both a buyer AND a seller depending on the situation  
\- Trade decisions become part of the survival AI: "Do I give my medkit to the injured teammate or keep it for myself?"  
\- The shop system (Options A/B/C above) would need to be a UI/menu system rather than an NPC interaction  
\- For Option C (Sunrise Buy Window): who is selling? Is it an abstract "shop" or does trading only happen between players?

Possible solutions:  
\- Abstract shop: Items just appear in a buy menu (no NPC needed, like a vending machine)  
\- Player-to-player only: All trading is between survivors, no external shop  
\- Rescued civilians (S8) could become camp traders if given the right role?  
\- Neutral Faction D NPCs (IDEA 10\) could be wandering traders found on certain maps?

**UPDATED SOLUTION: Survivor Market (roguelike rest stops)**  
Neutral faction NPCs on the map would break the WSS principle of moving from start to finish. BUT they work perfectly as TRANSITION AREAS between maps:

\- After entering a portal (and possibly surviving a boss arena from S9), the team arrives at a small safe zone: the SURVIVOR MARKET  
\- This is a brief roguelike-style break area \- no enemies, no danger  
\- Players can: buy/sell items, trade with each other, heal up, restock ammo  
\- The market is run by neutral NPCs (Faction D) who exist OUTSIDE the main map  
\- Think: Hades-style shop rooms between levels  
\- After the market, the team enters the next randomly generated map

Game flow becomes:  
Map \-\> Portal found \-\> \[Boss Arena chance (S9)\] \-\> Survivor Market (rest/shop) \-\> Next Map

This solves multiple problems:  
\- Gives the trading system a home without breaking map flow  
\- Provides natural pacing breather between intense levels  
\- Neutral NPCs have a purpose without cluttering the main gameplay maps  
\- Preserves the WSS start-to-finish movement principle  
\- Ties into IDEA 5 Options A/B/C \- the market IS the shop

## IDEA 6: Building / Barricade System \[OPTIONAL \- potential camping issue\]

Status: Optional feature \- fun but has a known AI behavior risk

PlayerAIs can build structures/barricades using collected resources:  
\- Walls, barriers, fortifications to block zombie paths  
\- Requires resource cost (wood, scrap, etc.)  
\- Could tie into the workbench from IDEA 5 Option A

KNOWN ISSUE: PlayerAI camping  
\- If building is too effective, AI humans may just fort up and never move to the next level  
\- The game needs forward momentum (onslaught zone, level progression)  
\- Possible solutions:  
  \- Built structures degrade over time / get destroyed by stronger enemies  
  \- Onslaught zone destroys player-built structures when it moves through  
  \- Resource scarcity makes permanent camping unsustainable  
  \- Score/extraction system (IDEA 3\) incentivizes pushing forward  
  \- Building could be limited to temporary/single-night use only  
\- \[This feature may work better as a Phase 3 addition once core loop is solid\]

## IDEA 7: Randomly Generated Themed Structures \[STABLE\]

Status: Core feature \- ties into Map Generation (Section 3\)

Maps contain pre-designed structure templates placed semi-randomly:

Structure types:  
\- Buildings (single-story): houses, shops, sheds, garages  
\- Multi-story buildings: apartments, office buildings, towers (multiple floors to explore)  
\- Basements: underground areas beneath buildings (hidden loot? trapped enemies? darker \= scarier)  
\- \[Other: churches, warehouses, hospitals, schools?\]

Generation approach:  
\- Structure templates are pre-designed but placed randomly on the map grid  
\- Interior layouts can vary (room arrangements, furniture, loot placement)  
\- Themed to match the map (urban maps get apartments, rural maps get cabins, etc.)  
\- Multi-story \= vertical gameplay layer (stairs, elevators?, line of sight between floors)  
\- Basements \= high risk/high reward zones (dark, cramped, but valuable resources)

\[How does vertical movement work on a 2D grid? Floor switching? Separate sub-maps per floor?\]  
\[Do structures provide natural cover/defense without the building system?\]

## IDEA 8: Portal Orb / Level Transition Choice \[UNSTABLE \- emotionally cool but scope concern\]

Status: Experimental \- great concept but unclear on implementation time

When PlayerAIs find the portal orb/goal on the current map:  
\- They get a CHOICE: stay on the current map OR teleport to the next randomly generated themed map  
\- This is NOT automatic \- the team has to decide

Emotional weight:  
\- Staying \= you know the layout, you've built up defenses, you feel safe... but enemies keep scaling  
\- Leaving \= the unknown, a fresh map, new threats, but also new resources and progression  
\- Creates real tension in a zero-player game: watching the AI debate whether to stay or go  
\- The AI personality types (IDEA 2\) would affect this decision (cautious types want to stay, aggressive types want to push forward)

Concerns:  
\- Might be complex to implement the decision-making logic  
\- Could slow game pacing if AI camps too long (same issue as IDEA 6\)  
\- \[May simplify to: portal auto-activates after X turns once found, giving a countdown window\]  
\- \[Or: individual choice \- each PlayerAI decides independently, splitting the party?? That would be wild\]

\[Might remove this feature to keep scope manageable \- revisit after core loop works\]

## IDEA 9: Revised Win Condition \- Helicopter Extraction \[UPDATE to IDEA 3\]

Status: Alternative/replacement for IDEA 3's score-based probability system

New win condition concept:  
\- Instead of a math-based extraction probability, the WIN triggers when ALL surviving PlayerAIs collectively decide to "leave this nightmare"  
\- A helicopter (or similar rescue) arrives when the team consensus is to escape

How it could work:  
\- Each PlayerAI has a hidden "morale" or "had enough" meter  
\- As they suffer losses, fight through hordes, lose teammates, their desire to escape grows  
\- When ALL remaining PlayerAIs reach the threshold \= they call for extraction  
\- Helicopter arrives, game won

Key difference from IDEA 3:  
\- IDEA 3: Win is decided by MATH (score accumulation \+ probability roll)  
\- IDEA 9: Win is decided by AI CONSENSUS (all players emotionally want to leave)  
\- Could combine both: consensus triggers the CALL, but score determines if the helicopter actually makes it

\[Which approach feels more fitting for the game's tone? Or hybrid?\]  
\[Does this replace IDEA 3 entirely or work alongside it?\]

## IDEA 10: Evil Human NPCs / Hostile PlayerAI System \[STABLE \- ties into Factions\]

Status: Core feature \- requires a separate/extended PlayerAI system

Not all humans are friendly. Armed hostile NPCs roam the map:

Enemy types (working names):  
\- Unnamed Mercenaries \- armed, organized, aggressive  
\- Army Remnants \- military survivors gone rogue, well-equipped  
\- \[Other hostile human factions TBD\]

Why this is a serious threat:  
\- Unlike zombies, these enemies have WEAPONS (ranged combat)  
\- They use the SAME PlayerAI intelligence as your survivor team  
\- They can pathfind, take cover, flank, coordinate with each other  
\- They scavenge resources too \- competing for the same loot  
\- Much harder to fight than mindless zombies

Technical architecture:  
\- Requires a SEPARATE PlayerAI system (or extended version of the existing one)  
\- Friendly PlayerAI vs Hostile PlayerAI share the same base class but different goals  
\- Hostile AI goals: hunt survivors, protect territory, hoard resources  
\- Friendly AI goals: survive, cooperate, reach extraction  
\- This is where IDEA 1 (Factions) becomes concrete:  
  \- Faction A: Survivor team (player's side)  
  \- Faction B: Mercenaries/Army remnants (hostile humans)  
  \- Faction C: Zombies/undead (hostile to everyone)  
  \- \[Faction D: Neutral NPCs? Traders? Civilians to rescue?\]

Gameplay impact:  
\- Creates a three-way threat: zombies \+ hostile humans \+ environment  
\- Hostile humans might fight zombies too (enemy of my enemy situation)  
\- Could they be reasoned with? Traded with? Or always hostile?  
\- Adds to the extraction score (IDEA 3\) \- killing armed humans worth more points?

\[Do hostile humans appear on every map or only certain themed maps?\]  
\[Can hostile humans use the shop/trading system too?\]  
\[Are they affected by the onslaught zone the same way?\]

## IDEA 11: Vehicles & Armored Vehicles \[UNSTABLE \- awesome but complex\]

Status: Ambitious feature \- adds a whole new layer of gameplay

A set number of vehicles exist on each map, both civilian and military:

Vehicle types (diverse pool):  
\- Civilian: cars, trucks, vans, motorcycles (transport/escape)  
\- Utility: ambulances (mobile healing?), supply trucks (mobile storage?)  
\- Military/Armored: APCs, humvees, armored trucks (heavy protection \+ firepower)  
\- Technicals: pickup trucks with mounted weapons (used by hostile mercenaries)  
\- \[Broken/repairable vehicles as loot objectives?\]

Who uses them:  
\- Survivor PlayerAIs can find and use vehicles for transport/escape  
\- Hostile HumanAIs (IDEA 10\) ALSO use vehicles \- mercenary camps with parked technicals  
\- Ambush scenarios: a technical with armed hostile HumanAIs rolling into an area

Gameplay scenarios:  
\- Stumbling into a mercenary CAMP with armored vehicles \= massive threat encounter  
\- Getting ambushed by a technical patrol while exploring  
\- Finding a working vehicle \= huge advantage for your survivor team (faster travel, carry more supplies)  
\- Vehicles as mobile cover during firefights  
\- Vehicles need FUEL (another resource to manage?)

Movement on the grid:  
\- Vehicles move multiple tiles per turn (faster than on foot)  
\- Armored vehicles can smash through barricades/weak structures  
\- Loud \= attracts zombies (noise mechanic?)  
\- Can vehicles run over zombies? (lol)

\[How do vehicles work on a tile grid? Occupy multiple tiles? Special movement rules?\]  
\[Can vehicles be damaged/destroyed? Repaired?\]  
\[Are vehicles persistent between levels or map-specific?\]

## Smaller Ideas / Quick Hits

**S1: Defined Weapons System**  
\- Instead of generic "damage" stat, actual named weapons with unique stats  
\- Pistol, shotgun, rifle, melee weapons (bat, axe, knife), etc.  
\- Each weapon has: damage, range, fire rate, ammo type, accuracy  
\- Weapons can be found, looted, traded, dropped  
\- Ties into shop system (IDEA 5\) and hostile humans (IDEA 10\) who carry them  
\- \[Weapon tiers? Common/Rare/Legendary?\]  
\- \[Weapon durability/degradation?\]

**S2: Boss Zombie Types**  
\- Special powerful zombies that appear as major threats  
\- Already have boss type in Rogue Like mode \- expand on this  
\- Could guard portals, loot caches, or key locations  
\- Unique abilities per boss type (tank, spitter, screamer that summons hordes, etc.)  
\- High kill score value for extraction probability (IDEA 3\)  
\- \[Spawn from special boss portals? Appear at round thresholds? Random encounters?\]

**S3: Caves**  
\- Similar concept to buildings (IDEA 7\) but generated DIFFERENTLY  
\- Natural underground structures vs man-made buildings  
\- Winding tunnels, open caverns, dead ends  
\- Different generation algorithm (more organic/random vs structured rooms)  
\- Very dark \= minimal vision even during daytime (ties into IDEA 4\)  
\- High risk/high reward like basements but larger scale  
\- Could contain unique resources, boss zombies, or hidden shortcuts  
\- Fits the "A Forgotten Place" / Colossal Cave vibe perfectly

**S4: Dynamic Weather System**  
\- Weather affects minor GLOBAL stats for all entities on the map  
\- Weather PERSISTS between levels \- carries through portal transitions  
\- Can change slowly (gradual shift) or quickly (sudden storm)

Weather types and effects:  
\- Rain: reduced vision range, slower movement(?), puts out fires(?)  
\- Fog: severely reduced vision (stacks with nighttime from IDEA 4 \= terrifying)  
\- Storm: heavy rain \+ lightning(?), loud \= masks noise, reduced accuracy  
\- Snow/Cold: stamina drain, slower movement, hypothermia risk  
\- Heat: water consumption up, stamina drain  
\- Clear: no modifiers, best conditions

\[Weather transitions: clear \-\> cloudy \-\> rain \-\> storm \-\> clearing?\]  
\[Can PlayerAI factor weather into decisions? "It's foggy, stay close together"?\]  
\[Seasonal progression across levels?\]

**S5: Personality Drift / Adaptive Brain \[CONFIRMED\]**  
\- PlayerAI personality types are NOT static \- they evolve based on experience  
\- After each round or map change, personality/playstyle can shift based on:  
  \- Current resources (low ammo \= shift toward cautious?)  
  \- Who is alive / who died (lost a teammate \= aggressive revenge? or scared cautious?)  
  \- Other factors specific to that PlayerAI's recent experience  
\- A "balanced" survivor who loses everyone might become "aggressive" or "broken"  
\- Creates unique emergent narratives every run  
\- Evaluation happens at natural break points (round end, map transition, major event)

**S6: Sound / Noise Propagation System \[CONFIRMED \- requires extra work\]**  
\- Full noise mechanic that affects zombie attraction and AI awareness  
\- Gunfire \= loud \= attracts zombies from far away  
\- Melee \= quiet \= safer but riskier up close  
\- Vehicles \= very loud \= massive zombie magnet  
\- Storms (S4) can mask noise  
\- SOUND PROPAGATION varies by environment:  
  \- Enclosed sewer/tunnel \= sound travels far, echoes, concentrated  
  \- Open windy grassfield \= sound dissipates faster, wind masks it  
  \- Buildings \= partially contained, muffled through walls  
\- Adds tactical depth: WHERE you fight matters as much as HOW  
\- Extra implementation work but huge gameplay payoff

**S7: Downed State / Last Stand \[CONFIRMED \- previously attempted\]**  
\- When a PlayerAI hits 0 health, they don't die immediately  
\- They enter a DOWNED STATE with a set timer before bleeding out:  
  \- Can crawl/move slowly  
  \- Can only use secondary weapon (pistol)  
  \- Vision reduced, movement heavily limited  
  \- Timer counting down to death  
\- Other PlayerAIs can REVIVE downed teammates (takes time, requires proximity)  
\- Creates rescue missions: "Player B is down\! Do I run to save them or is it too dangerous?"  
\- Previously attempted in the WSS project but removed due to bugs  
\- Ties into help request system (IDEA 2\) \- downed player calls for help

**S8: Rescue Civilians / Expanding Team \[CONFIRMED\]**  
\- Some maps contain unarmed civilian NPCs that can be rescued  
\- Rescued civilians JOIN the survivor team (team expands\!)  
\- But teams can also CONTRACT (deaths, getting separated)  
\- Civilians consume resources (food, water) but can't fight well  
\- Rescued civilians boost extraction score / add to the narrative  
\- Creates tension: saving them is morally right but strategically costly  
\- Could be given weapons from team inventory to become useful  
\- \[Do civilians have personalities too? Or are they generic?\]  
\- \[Can civilians panic and run away, attracting zombies?\]

**S9: Portal Boss Arena Encounters \[STABLE\]**  
\- When entering a portal to the next map, two things happen:  
  1\. Win condition probability INCREASES (reward for progressing)  
  2\. Chance of a BOSS ENCOUNTER appearing also increases  
\- Boss Arena: If triggered, ALL members of the survivor team get pulled into a small/tiny separate map  
\- It's a dedicated boss fight \- confined space, nowhere to run, the whole team vs one powerful boss  
\- Super valuable resources are the reward for winning (rare weapons, large health/ammo caches, big score boost)  
\- Creates a risk/reward moment at every portal: progressing \= closer to winning BUT also closer to a boss fight  
\- The further you progress (more portals entered), the higher the boss encounter chance  
\- Boss difficulty scales with progression too  
\- Ties into S2 (Boss Zombie Types) \- the arena bosses would be the biggest/baddest versions  
\- Ties into IDEA 3/9 (Win Conditions) \- boss kills give massive extraction score boosts  
\- \[Can the team lose members during a boss fight? What happens if they fail \- TPK or retreat?\]  
\- \[Is the boss arena always the same layout or randomly generated too?\]

S10: Survivor Traits / Bonus System  
\- Each survivor PlayerAI spawns with a unique TRAIT that gives them a passive bonus  
\- Traits make each survivor feel distinct and valuable to the team  
\- Losing a survivor with a key trait \= losing that bonus for the whole team

Example traits:  
\- Medic: Faster revive speed / heals nearby allies slowly over time  
\- Sharpshooter: Increased accuracy / range bonus  
\- Scavenger: Finds more loot / better item drops  
\- Mechanic: Can repair vehicles (IDEA 11\) / build barricades faster (IDEA 6\)  
\- Scout: Larger vision range / detects enemies earlier  
\- Leader: Nearby allies get a small stat boost (morale aura)  
\- Pack Mule: Can carry more items / resources  
\- Survivalist: Reduced food/water consumption / weather resistance (S4)  
\- Berserker: Increased melee damage when low health (ties into S7 Last Stand)  
\- Quiet: Reduced noise generation (ties into S6 Sound system)

\- Traits are assigned randomly at spawn \- every run has a different team composition  
\- Ties into S8 (Rescue Civilians) \- do rescued civilians come with traits too?  
\- Ties into S5 (Personality Drift) \- does personality shift affect trait effectiveness?  
\- \[Can traits level up / improve over time?\]  
\- \[Negative traits too? (Coward: flees easier, Loud: generates more noise)\]

**S11: Armour System**  
\- Separate from health \- armour absorbs damage before health takes hits  
\- Armour types: light (vest), medium (tactical gear), heavy (military/riot gear)  
\- Each tier: more protection but potentially slower movement / more noise (ties into S6)  
\- Found as loot, bought from shop (IDEA 5), looted from dead hostile humans (IDEA 10\)  
\- Armour degrades as it takes damage \- eventually breaks and needs replacing  
\- Hostile mercenaries/army remnants would wear armour too \- making them tougher targets  
\- Ties into S1 (Weapons) \- some weapons are better at piercing armour than others  
\- Ties into S9 (Boss Arena) \- boss reward could include rare armour  
\- \[Helmets as separate armour slot? Or just one overall armour stat?\]  
\- \[Can armour be repaired by a Mechanic trait survivor? (S10)\]

**S12: Electricity System \[UNLIKELY \- scope concern\]**  
Status: Probably not viable \- no strong need for it and requires too many new supporting features

\- Power grid / generators that can be activated to power buildings, lights, equipment  
\- Could tie into: night vision (powered lights \= safer areas at night), electric fences, radio communication, powered doors/elevators in multi-story buildings  
\- Generators need fuel (another resource to manage)

Why it's probably too much:  
\- Requires a whole new resource system (electricity as a utility)  
\- Needs generator objects, power lines/radius, powered vs unpowered states for structures  
\- Most of what it enables can be achieved simpler through other systems  
\- Massive feature creep risk

\[PARKED \- revisit only if core game desperately needs it. Cool concept but not essential.\]

NOTE: Even without a full electricity system, atmospheric electrical events could work as simple scripted/random environmental moments. Example: streetlamps in an abandoned city suddenly flickering back on for no explained reason. No gameplay impact, purely eerie atmosphere. Doesn't need a power grid system \- just a visual/mood event. This alone could justify a simplified version of S12 that's JUST cosmetic environmental events rather than a full utility system.

**S13: Natural Wildlife / Huntable Creatures**  
Since "A Forgotten Place" is a THEMED world (not a generic WSS), the maps are alive with natural wildlife. These creatures serve as food sources for survival.

Wildlife by biome:  
\- Forested Hills: Deer, rabbits, chickens (farms), fish (rivers)  
\- Dense Forest: Deer, boar, wolves (dangerous\!), bears (very dangerous\!), birds  
\- Desert: Snakes, lizards, vultures, coyotes, scorpions  
\- Rocky Mountains: Mountain goats, eagles, wolves, few animals (scarce like resources)  
\- City: Rats, stray dogs, pigeons, cats (slim pickings)  
\- Snow Region: Arctic hares, caribou, wolves, polar bears(?)

Gameplay role:  
\- Primary FOOD source \- survivors hunt wildlife to eat and maintain hunger/stamina  
\- Hunting uses ammo (noise from S6\!) or melee (quiet but risky)  
\- Some wildlife is passive (deer, rabbits) \- runs away when approached  
\- Some wildlife is hostile (wolves, bears, boar) \- can attack survivors  
\- Hostile wildlife \= another threat layer alongside zombies and hostile humans  
\- Food can be traded between survivors or sold at Survivor Market

OOP fit:  
\- Wildlife uses the existing Creature class from WSS but with new behaviors  
\- Passive creatures: flee AI (like inverse of Tag Game follow/chase mechanics)  
\- Hostile creatures: territorial AI (attack if too close, otherwise ignore)  
\- Different from zombies: wildlife doesn't seek out humans, it just exists

\[Do creatures respawn on maps or are they finite?\]  
\[Can hostile wildlife attack zombies too? Wolves vs zombies?\]  
\[Cooking mechanic? Raw food vs cooked food \= different hunger restoration?\]

Additional wildlife mechanics:

\- Wildlife can be TOGGLED on/off (game setting \- play with or without wildlife)  
\- Wildlife SPAWNERS exist too (reuses beehive spawner from Scene 3\)  
  \- Dens, nests, burrows that produce wildlife over time  
  \- A deer spawner in the forest, a rat nest in the city sewers, etc.  
  \- Spawner resource pool determines how many animals it produces

Zombie-wildlife interaction:  
\- Zombies can EAT wildlife\! They're not just hunting humans  
\- This means zombies actively reduce the food supply on the map  
\- Creates resource pressure: if you wait too long to hunt, zombies eat everything  
\- Also means zombies have something to do when no humans are nearby (feels more alive)

INFECTED WILDLIFE \[COOL BUT EXTRA WORK\]:  
\- Wildlife that gets attacked by zombies but doesn't die could become INFECTED  
\- Infected deer, infected wolves, infected bears \= zombie animals  
\- Infected wildlife is hostile to everyone (humans AND normal zombies?)  
\- Sounds cool and would be easy to implement from a logic standpoint  
\- BUT requires a lot more sprites (infected version of every animal)  
\- Could be Phase 3+ feature \- add infected variants one animal at a time  
\- Infected bear \= nightmare fuel boss-tier wildlife encounter  
\- \[Can eating infected wildlife make survivors sick? Poisoned food mechanic?\]

**S14: Corrupted Terrain / Meat & Blood Tiles \[EXTRA/OPTIONAL\]**  
\- Terrain tiles can become visually corrupted with meat/blood/gore textures  
\- Shows the spread of zombie corruption across the map  
\- Purely cosmetic / atmospheric \- visual storytelling without dialogue  
\- Could spread outward from zombie spawner portals over time  
\- Heavier corruption \= more zombies have been in that area  
\- Lets survivors visually read the map: "that area looks corrupted, expect heavy zombie presence"  
\- Optional toggle \- can be turned off for performance or preference  
\- Ties into the horror element (Section 9\) \- the world itself is decaying

**S15: Boss Battle Arena Set Maps \[STABLE \- attached to S2/S9\]**  
Unlike the randomly generated maps, boss battle arenas are HAND-CRAFTED set maps. Each one has a unique theme, atmosphere, and boss encounter.

Confirmed Boss Arenas:

1\. HUGE HOSPITAL  
\- Massive multi-floor hospital crawling with enemies  
\- Dark corridors, operating rooms, morgue level  
\- Medical loot everywhere but so are the horrors  
\- Boss: \[TBD \- could be a massive infected patient or failed experiment\]

2\. INTACT EVIL HUMAN FREIGHT SHIP  
\- A military/mercenary freight ship still operational  
\- Hostile human AI enemies (IDEA 10\) \- armed and organized  
\- Tight corridors, cargo holds, deck combat  
\- Boss: Evil human commander or armored mech?

3\. HUGE CATHEDRAL (RAINY NIGHT)  
\- Massive gothic cathedral during a rainstorm at night  
\- Atmospheric: rain, darkness, lightning flashes, stained glass  
\- Eerie and grand \- the horror element at its peak (Section 9\)  
\- Boss: \[TBD \- something unholy fits the setting\]

4\. LUMINOUS CRYSTAL CAVE  
\- Underground cave system lit by glowing crystals  
\- Beautiful but dangerous \- the crystals provide natural light  
\- Contrast to other dark arenas \- visually stunning  
\- Ties into S3 (Caves) but a unique handcrafted version  
\- Boss: \[TBD \- cave-dwelling creature? Crystal guardian?\]

5\. INFESTED PSYCHO-CASINO / HEAVY METAL CARNIVAL  
\- An abandoned carnival/casino fused together  
\- Lots of fire, neon, chaos, destruction  
\- Heavy metal themed \- aggressive, loud, chaotic energy  
\- Slot machines, roller coasters, big top tents, all corrupted  
\- Boss: \[TBD \- ringmaster? Slot machine abomination?\]

6\. THE LABORATORY OF THE EVIL MASTERMIND  
\- Resident Evil-styled secret lab  
\- The source of the infection / corruption  
\- Final boss potential: evil human scientist who TRANSFORMS into a zombie boss mid-fight  
\- Human phase: uses weapons, deploys traps, commands minions  
\- Zombie phase: mutated, powerful, aggressive, terrifying  
\- This is the signature boss encounter \- could be tied to the endgame/win condition

Design notes:  
\- All boss arenas are SET MAPS (pre-designed, not randomly generated)  
\- This means they can be highly detailed and atmospheric  
\- Each arena can have unique mechanics/hazards specific to that setting  
\- Boss arenas trigger via the portal system (S9) \- chance increases with progression  
\- \[Are arenas encountered in a fixed order or randomly selected?\]  
\- \[Can the same arena appear twice in one run?\]  
\- \[Does The Laboratory always appear as the final boss if extraction score is high enough?\]

# 12\. Technical / OOP Architecture

\- Class hierarchy: What objects inherit from what?  
\- Relative camera system per PlayerAI (new)  
\- Brain/AI revamp for local-only decision making (new)  
\- Help request/response communication system (new)  
\- \[Language/framework: Continue with current web stack?\]  
\- \[Performance concerns with many AI agents \+ enemies on large maps?\]

# 13\. Roadmap / Priority

APPROACH: Build the core WSS as intended first, THEN layer ideas on top individually.  
Rule: Only add features that DON'T require dependencies from future/unbuilt ideas.

PHASE 0: FOUNDATION (WSS as intended from rubric)  
\- Get the base WSS working properly as it was meant to be  
\- Robot/PlayerAI navigates from start to finish (A to B)  
\- OOP class hierarchy in place (Robot, Terrain, Creature, Item)  
\- Basic pathfinding working  
\- Basic combat working  
\- Basic resource management (health, ammo)  
\- Spawner system working  
\- Map generation (single biome, simple)  
\- This IS the MVP \- a working WSS that fulfills the original assignment

PHASE 1: INDEPENDENT ADDITIONS (no future dependencies)  
Add these one at a time, each should work standalone:  
\- Multiple AI humans on the same map (team of survivors)  
\- Fog of war / limited vision per player  
\- Basic lose condition (all players die)  
\- Zombie enemies with spawner portals  
\- Simple themed map generation (1-2 biomes)  
\- Basic item pickups (health, ammo, weapons)  
\- Day/night cycle (IDEA 4\) \- just affects vision, no complex dependencies  
\- Wildlife as food sources (S13) \- uses existing Creature class  
\- Armour system (S11) \- just a new stat layer  
\- Defined weapons (S1) \- replaces generic damage stat

PHASE 2: CONNECTED SYSTEMS (some dependencies on Phase 1\)  
\- Relative cameras per PlayerAI (IDEA 2\) \- needs multiple AI humans  
\- Brain revamp for local-only decisions (IDEA 2\) \- needs fog of war  
\- Help request/response system (IDEA 2\) \- needs multiple AI humans  
\- Portal to next map / level progression \- needs map gen  
\- Extraction win condition / score system (IDEA 3/9)  
\- Sound/noise propagation (S6) \- needs weapons \+ enemies  
\- Downed state / revive (S7) \- needs multiple AI humans  
\- Survivor traits (S10) \- needs working PlayerAI  
\- Personality drift (S5) \- needs working brain system  
\- Player-to-player trading \- needs multiple AI humans \+ items  
\- Hostile human NPCs (IDEA 10\) \- needs working PlayerAI to extend

PHASE 3: ADVANCED FEATURES (dependencies on Phase 2\)  
\- Survivor Market between levels \- needs portal system \+ trading  
\- Boss arena encounters (S9/S15) \- needs portal system \+ combat  
\- Dynamic weather (S4) \- needs day/night cycle  
\- All 6 biomes with themed structures (IDEA 7\)  
\- Vehicles (IDEA 11\) \- needs movement \+ noise system  
\- Rescue civilians / expanding team (S8) \- needs faction system  
\- Building/barricade system (IDEA 6\) \- optional, needs resources  
\- Corrupted terrain (S14) \- needs spawner system working

PHASE 4: DREAM FEATURES (if everything else works)  
\- Infected wildlife \- needs wildlife \+ zombie interaction  
\- Factions/teams (IDEA 1\) \- needs hostile humans \+ friendly AI  
\- Portal stay/leave choice (IDEA 8\) \- needs portal \+ AI personality  
\- Set map boss arenas (all 6 handcrafted maps)  
\- Laboratory final boss with transformation  
\- Electricity system (S12) \- probably never but who knows  
\- Full polish, balancing, all sprites, all biome combos


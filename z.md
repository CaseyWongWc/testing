Nice — I can see Perplexity is already updating your Google Doc with the new decisions. That's great!

Here are the areas I'd suggest brainstorming next, roughly in order of what will matter most when you start implementing:

**1\. Loot Distribution** (still open)

-   How is loot spread across maps? Concentrated in buildings vs scattered everywhere?
-   Do loot sockets in building stamps have tiers (common/rare/legendary)?
-   Does loot quality scale with distance from spawn center? With map difficulty?
-   Is loot pre-placed during map gen or does it drop from kills too?

**2\. Brain Decision Model** (still open)

-   Tick-based (brain evaluates every N ticks) vs event-driven (brain reacts to stimuli like "took damage", "heard noise")?
-   Or a hybrid — tick-based baseline with event interrupts for urgent situations?
-   This will heavily affect performance with many entities on screen

**3\. Day/Night Cycle Details**

-   How long is a day/night cycle in real-time seconds?
-   Does nighttime change enemy behavior (more aggressive, faster spawning)?
-   How does it interact with the vision system (reduced radius at night)?

**4\. Specific Objective Mechanics**

-   What does "Survive" actually look like? Survive N ticks in a zone? Defend a point?
-   How does "Rescue" work? Is there an NPC to escort, or just reach a location?
-   How many objectives per map? Does it scale with difficulty?

**5\. Sprite/Visual Details**

-   What does each of the 5 paper-doll layers actually look like at this scale?
-   Color coding for factions (green = survivor, red = hostile, yellow = neutral)?
-   Health bars, status icons above entities?

I'd prioritize **loot distribution** and **brain decision model** since those are your last two officially open questions, and they'll directly impact implementation when you start coding.

Checkpoint made3 minutes ago

Worked for 19 seconds


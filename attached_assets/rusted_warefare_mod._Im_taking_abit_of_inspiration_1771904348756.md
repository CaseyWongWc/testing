<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# rusted warefare mod. Im taking abit of inspiration from this for the wss in the future! check it out and let me know

This is awesome, Casey! You're looking at **Radioactive Survival v1.6 "The A-Life Update"** — a total conversion mod for Rusted Warfare by BTDbu (@Btdbu / Radiorum)[^1_1]. From your screenshots, I can see the mod description screen and what looks like the in-game editor with a survivor entity, inventory panel, and the isometric tile-based world. Let me break down what makes this mod so relevant to WSS2 "A Forgotten Place" and why it's excellent inspiration.

## What Radioactive Survival Is

This is a **post-apocalyptic isometric survival RPG** built entirely within Rusted Warfare's RTS engine[^1_1]. It's inspired by S.T.A.L.K.E.R., Fallout, and other survival games[^1_2]. The "A-Life Update" (v1.6) refers to the **A-Life system** from the S.T.A.L.K.E.R. series — a simulation system where NPCs exist and act autonomously in the game world, pursuing their own goals, traveling between locations, and fighting each other regardless of whether the player is nearby[^1_3]. That's *exactly* the spirit of your zero-player WSS2 concept.

Key features visible from your screenshots and the mod's documentation[^1_1][^1_4]:

- **Isometric tile grid with smooth entity placement** — entities aren't snapped to tiles, they move freely over a tile-based world (sound familiar? That's your hybrid model!)
- **Inventory system** — the second screenshot shows items like AI-2 Kit, Kitchen Knife, Mosin Nagant, Cargo Pants, Military gear with quantity slots
- **Body health system** — EFT-style (Escape from Tarkov), meaning individual body parts take damage separately
- **Temperature system** — 36°C body temp shown in the HUD
- **Crafting via workbench and campfire**
- **Bleeding, poison, skill points** (Strength, Dexterity, Perception, Endurance, Intelligence)
- **Editor mode active** — you're poking around the map editor, which is great for understanding how entity placement works on the grid


## Direct Parallels to WSS2

| Radioactive Survival Feature | WSS2 "A Forgotten Place" Equivalent |
| :-- | :-- |
| A-Life system (NPCs act autonomously) | Your zero-player AI Survivors with Brain/Vision architecture |
| Isometric tile grid + smooth movement | Your hybrid grid pathfinding + smooth real-time movement (Decision 2) |
| EFT body health system | Your modular sprite layers + body-part damage (combat2! tab) |
| Temperature / bleeding / poison | Your status effects system, stamina, hunger/thirst drain |
| Skill points (STR/DEX/PER/END/INT) | Your survivor traits system (S10) — Medic, Sharpshooter, Scout, etc. |
| Crafting workbench system | Your IDEA 5 Shop/Trading with craftable workbench option |
| Weapons with distinct stats (Mosin, Knife) | Your S1 Defined Weapons System with specific named weapons |
| Multiplayer cross-platform | Your Observer Grid UI with multiple survivor viewports |
| Editor Mode | Your pre-game configuration and map generation system |
| Kill points → skill upgrades | Your extraction score system (IDEA 3) and between-map progression |

## What You Can Learn From This

A few things stand out as especially valuable for WSS2:

- **One developer built this.** BTDbu is a solo dev who transformed an entire RTS engine into a survival RPG. That's validation that your ambition — building a survival horror sim on top of WSS components — is achievable with enough iteration[^1_5].
- **The A-Life approach is your Observer Grid.** The reason v1.6 is called "The A-Life Update" is that NPCs now have autonomous behavior cycles beyond just reacting to the player. Your WSS2 design already goes *further* than this — your survivors make Brain-driven decisions with personality types, morale shifts (S5 Personality Drift), and team coordination via radio. You're essentially building a *more sophisticated* A-Life system.
- **Rusted Warfare's engine handles thousands of units** with minimal FPS loss thanks to multi-threaded tech[^1_6]. That's reassuring for your performance concerns about large maps with many AI entities. Your planned hierarchical pathfinding and staggered brain updates should keep things smooth.
- **The mod's community feedback reveals design lessons.** Players asked for an easy mode, guides, and ways to turn off mechanics like sweat/illness[^1_5]. For WSS2, your pre-game settings sliders (loot density, difficulty, wildlife toggle) already address this — you're ahead of the curve on configurability.
- **Maps need embedded assets.** The mod note "Maps are embedded in mod files, no need to download separately" is relevant — your building stamps system (Stamp Library → Placement Rules → Interior Dressing) in the Map Generation page is the right architecture for this.


## My Take

This is a *great* reference game to add to your inspiration list alongside Darkwood, Project Zomboid, Dinogen Online, and the others. It sits in a unique spot: it's an **isometric survival RPG built on top of a grid-based RTS engine** — which is almost exactly what you're doing with WSS2 on top of your existing WSS components. The A-Life philosophy of NPCs living their own lives in the world is the beating heart of what makes your zero-player concept compelling.

I'd recommend adding "Radioactive Survival (Rusted Warfare mod)" to your Lessons from Other Games / Experience Log in Notion, with notes on the A-Life system, the hybrid tile/smooth movement, and the solo-dev scope validation. If you ever get a chance to actually play it (it runs on Android too), spectating the NPC behavior would be just as valuable as your Dinogen Online observation sessions were.

Solid find! 🔥
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_38][^1_39][^1_40][^1_41][^1_42][^1_43][^1_44][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://www.moddb.com/mods/radioactive-survival

[^1_2]: https://www.youtube.com/watch?v=hTEhwYLbv4I

[^1_3]: https://www.reddit.com/r/stalker/comments/1gyezu7/can_someone_explain_like_im_5_what_the_alife/

[^1_4]: https://www.indiedb.com/games/rusted-warfare/downloads/radioactive-survival-v0-9

[^1_5]: https://www.moddb.com/mods/radioactive-survival/downloads/remains-of-the-apocalypse-v1-4-51

[^1_6]: https://www.reddit.com/r/RealTimeStrategy/comments/a2mm7p/rusted_warfare_major_release_v113_huge/

[^1_7]: 13921.jpg

[^1_8]: 13923.jpg

[^1_9]: alright-what-do-you-think-so-f-UywmekbwTFyty5NG35gxhw.md

[^1_10]: WSS GITHUB.md

[^1_11]: pasted-text.txt

[^1_12]: nice-i-can-see-perplexity-is-a-MqG7Zy1QSiKdwSxSw5dX_g.md

[^1_13]: im-up-anr-running-again-sorry-RtcTqBnLR667B8RvUwZE3Q.md

[^1_14]: without-further-ado-since-you-ZJygstQQSE.9QmqgaQ4bVg.md

[^1_15]: hello-i-finished-python-should-U.z59vDWQ0CHnjpMvNup4A.md

[^1_16]: pasted-text.txt

[^1_17]: wss-ideas-SlgSm.C2SDCDPfePLPq9lw.md

[^1_18]: hello-there-i-will-be-focusing-h5TLIPu2SF209Hem5XMxtg.md

[^1_19]: CS3560-L15v2-The-Project

[^1_20]: wss planning

[^1_21]: cs4800 assignments

[^1_22]: WSS-ideas.md

[^1_23]: in class exercise - 1_ cs 4800.03 (s26-regular) software engineering.pdf

[^1_24]: WSS original rubric for OOJ class.txt

[^1_25]: https://www.moddb.com/mods/zombie-survival-rw-mod

[^1_26]: https://www.moddb.com/mods/radioactive-survival/downloads

[^1_27]: https://zombie-survival-rw-mod.en.download.it

[^1_28]: https://www.scribd.com/document/860488271/mod-info

[^1_29]: https://www.indiedb.com/games/rusted-warfare/downloads

[^1_30]: https://www.moddb.com/mods/radioactive-survival/downloads/radioactive-survival-v11

[^1_31]: https://www.indiedb.com/games/rusted-warfare/mods

[^1_32]: https://steamcommunity.com/sharedfiles/filedetails/?id=1743452871

[^1_33]: https://www.youtube.com/channel/UCezoQa_cnf9_Gmij0DlJUIA

[^1_34]: https://www.reddit.com/r/rustedwarfare/comments/1mxk3tr/have_you_ever_played_the_zombie_apocalypse_mod/

[^1_35]: https://x.com/ModDB/status/1779615607266349124

[^1_36]: https://www.youtube.com/watch?v=54270mHNHe0

[^1_37]: https://www.moddb.com/mods/radioactive-survival/videos/radioactive-survival-2-official-trailer-rusted-w

[^1_38]: https://www.youtube.com/watch?v=70Lpba_n7nc

[^1_39]: https://steamcommunity.com/sharedfiles/filedetails/?id=3102310259

[^1_40]: https://www.youtube.com/watch?v=z266wR6kLT8

[^1_41]: https://www.moddb.com/mods/ruins-of-insanity

[^1_42]: https://www.youtube.com/watch?v=PM6EcygcWHw

[^1_43]: https://www.tiktok.com/@rustedwarior/video/7357458527008427269

[^1_44]: https://www.youtube.com/watch?v=rgo2c6GjGtA


---

# thank you! what do you recommend me capture here? or in another thread? (im in phone right now!)

Great question! Since you're on your phone right now, let me give you a **quick capture checklist** — stuff you can screenshot or screen-record while you're playing/browsing Radioactive Survival, then bring back to me or another thread later for analysis.

## Capture Now on Phone (Screenshots/Screen Recordings)

### High Priority — Directly Feeds WSS2 Design

1. **A-Life NPC behavior** — Watch an NPC go about their business autonomously. Screenshot or screen-record them making decisions (fighting, looting, fleeing, wandering). This maps to your **Brain/Vision AI architecture**
2. **Inventory UI layout** — You already have one screenshot showing the item slots (AI-2 Kit, Mosin Nagant, etc.). Get a **full inventory screen** if there is one — how they handle equip slots, backpack capacity, weight. Feeds your **loot system and backpack (1 per survivor) decision**
3. **Map scale / zoom levels** — Zoom all the way out and all the way in. How big does the world feel relative to one entity? This directly informs your **Decision 3 (Map Size)** and **entity scale debate**
4. **Combat in action** — Record a fight between NPCs and enemies. How does real-time combat look on the isometric grid? Feeds your **combat rework for real-time**
5. **Editor Mode panels** — You're already in the editor. Screenshot the **entity placement tools**, terrain palette, and any building/structure stamps. Compare to your **Stamp Library → Placement Rules → Interior Dressing** pipeline

### Medium Priority — Nice

6. **Body health system UI** — If you can find where it shows individual body part damage (the EFT-style system), capture that. Useful reference for your **modular combat/sprite layers**
7. **Crafting/workbench screen** — How does their crafting UI work? Relates to your **IDEA 5 Shop/Trading options**
8. **Day/night transition** — If the mod has one, capture how it looks and how NPC behavior changes. Feeds **IDEA 4 Day/Night Cycle**
9. **Temperature / status effects** — You can see 36°C in your screenshot already. Any bleeding, poison, or hunger indicators? Reference for your **stamina/hunger/thirst drain system**

### Low Priority — Bonus

10. **Death/game over screen** — What happens when you die? Any stats summary?
11. **Settings/config screen** — How much can you customize before playing? Compare to your **pre-game settings sliders**
12. **Any multi-NPC coordination** — If you see NPCs working together, fighting each other, or reacting to each other's actions

## How to Organize

Since you're on phone, the simplest approach:

- **Screenshot everything into a phone album** called "WSS2 References - Radioactive Survival" or similar
- **Quick voice memo or text note** for anything that's hard to capture visually ("NPCs seem to path toward loot before enemies" or "combat feels clunky because X")
- When you're back on PC, dump it all into a **new thread here** or into your **Notion "Lessons from Other Games / Experience Log"** page where the Dinogen Online entry already lives


## For the Next Thread

When you bring the captures back, just say something like:

> *"Here are my Radioactive Survival screenshots/recordings — let's log observations into the Notion Experience Log like we did for Dinogen Online"*

That way whoever picks it up (me, another Perplexity thread, or Replit) knows exactly what to do with them — structured observation notes with **WSS2 design implications** for each finding, just like your 3 Dinogen Online sessions.

Enjoy exploring it! The A-Life NPC behavior (\#1) is the most valuable thing to watch — that's the closest real reference to what your WSS2 zero-player survivors will look like in action. 🎮
<span style="display:none">[^2_1][^2_2]</span>

<div align="center">⁂</div>

[^2_1]: 13921.jpg

[^2_2]: 13923.jpg


# In-Class Exercise 8 — Test Case Specification & Traceability Matrix

**Course:** CS 4800.03 (S26-Regular) — Software Engineering
**Student:** Casey Wong
**Class Project:** WSS2 — *A Forgotten Place* (zero-player survival horror AI simulation)
**Team:** Front-End
**Date:** April 29, 2026

---

## 1. Overview

This document specifies functional test cases for the main use cases of the WSS2 *A Forgotten Place* class project. Eight test cases are provided (the assignment requires at least 5) and cover the player-facing front-end responsibilities: meta-progression (Survivor Market and Permanent Perks), the run loop (start, observe, end), the day/night scoring system, save persistence, and simulation-mode navigation.

Each test case follows an IEEE-829-inspired structure:

- **TC-ID** — unique identifier
- **Title** — short description
- **Linked Use Case** — the use case the test covers
- **Priority** — High / Medium / Low (relative criticality to the player experience)
- **Preconditions** — required state before the test begins
- **Test Steps** — numbered, deterministic actions
- **Test Data** — concrete values used during the test
- **Expected Results** — observable outcomes
- **Pass / Fail Criteria** — single-sentence verdict rule

The complete Traceability Matrix appears in Section 4.

---

## 2. Use Case Catalog (Front-End)

| Use Case ID | Use Case Name | Primary Actor |
|---|---|---|
| UC-FE-01 | Browse and Purchase Gear from Survivor Market | Player |
| UC-FE-02 | Buy or Upgrade a Permanent Perk | Player |
| UC-FE-03 | Configure Loadout and Start a Run | Player |
| UC-FE-04 | Observe Autonomous Survivor AI Combat | Player (passive) |
| UC-FE-05 | Earn Night-Bonus Scrap via Day/Night Cycle | Player + Game Loop |
| UC-FE-06 | View End-of-Run Results and Scrap Breakdown | Player |
| UC-FE-07 | Reset All Progress (Fresh Save) | Player |
| UC-FE-08 | Switch Between Simulation Modes (Phase 3 / Phase 2 / Sandbox) | Player |

---

## 3. Test Case Specifications

### TC-01 — Purchase Gear from Survivor Market deducts scrap and updates inventory

| Field | Value |
|---|---|
| **TC-ID** | TC-01 |
| **Linked Use Case** | UC-FE-01 |
| **Priority** | High |
| **Preconditions** | Player has at least one completed run; current scrap balance ≥ price of the cheapest gear item; the Survivor Market screen is reachable from the meta shell. |
| **Test Steps** | 1. Open the Survivor Market screen.<br>2. Note the displayed scrap balance (`B_before`).<br>3. Locate any affordable gear item; note its price (`P`).<br>4. Click "Buy" on that item.<br>5. Re-read the scrap balance shown in the toolbar (`B_after`).<br>6. Open the loadout / inventory panel and confirm the item is listed. |
| **Test Data** | Any gear item whose price is ≤ `B_before`. |
| **Expected Results** | (a) `B_after === B_before − P`. (b) The purchased item appears in the inventory exactly once. (c) A toast / confirmation message acknowledges the purchase. (d) No console errors. |
| **Pass / Fail** | **PASS** if all four expected results hold; **FAIL** if any one fails. |

---

### TC-02 — Permanent Perk upgrade applies a live multiplier on the next run

| Field | Value |
|---|---|
| **TC-ID** | TC-02 |
| **Linked Use Case** | UC-FE-02 |
| **Priority** | High |
| **Preconditions** | Player has enough scrap to buy one level of the **Scrap Magnet** perk; current Scrap Magnet level recorded as `L_before`. |
| **Test Steps** | 1. Open the Permanent Perks screen.<br>2. Note current scrap balance and Scrap Magnet level.<br>3. Click "Upgrade" on Scrap Magnet.<br>4. Confirm scrap deducted and level shown as `L_before + 1`.<br>5. Start a new run; complete at least one zombie kill and one survivor evacuation.<br>6. End the run and read the post-run scrap breakdown. |
| **Test Data** | Scrap Magnet level transition `L_before → L_before + 1`. Per-level multiplier = 0.10 (10%). |
| **Expected Results** | (a) Perk level visibly increments on the perk screen. (b) The end-of-run "Night Bonus" line and the live HUD pill both reflect the new multiplier (`1 + level × 0.10`). (c) The total scrap added at run-end matches the displayed breakdown to the integer. |
| **Pass / Fail** | **PASS** if the perk level increments and the next run's bonus uses the new multiplier within ±0 scrap of the formula; **FAIL** otherwise. |

---

### TC-03 — Starting a run loads the configured loadout into Phase 3

| Field | Value |
|---|---|
| **TC-ID** | TC-03 |
| **Linked Use Case** | UC-FE-03 |
| **Priority** | High |
| **Preconditions** | Player owns at least one purchasable weapon and has it equipped in the active loadout slot. |
| **Test Steps** | 1. From the meta shell, open the loadout screen.<br>2. Equip a known weapon (e.g., "Pistol") to slot 1.<br>3. Click "Begin Run".<br>4. Wait for the Phase 3 simulation to render (canvas + HUD visible).<br>5. Inspect the active survivor's weapon indicator in the HUD. |
| **Test Data** | Weapon = Pistol (or any equipped item). |
| **Expected Results** | (a) The Phase 3 canvas renders within 3 seconds. (b) The HUD shows the equipped weapon name on the lead survivor. (c) The simulation tick counter begins incrementing from 0. (d) No fallback/default gear is silently substituted. |
| **Pass / Fail** | **PASS** only if the equipped weapon is the one displayed in the HUD when the run starts. |

---

### TC-04 — Survivor AI engages zombies autonomously without player input

| Field | Value |
|---|---|
| **TC-ID** | TC-04 |
| **Linked Use Case** | UC-FE-04 |
| **Priority** | High |
| **Preconditions** | A run is active; at least one survivor is alive; at least one zombie is within line-of-sight of a survivor. |
| **Test Steps** | 1. Start a run with default settings.<br>2. Do **not** provide any input (no keyboard, no mouse).<br>3. Observe the canvas for 30 seconds of simulated time.<br>4. Watch for: survivors moving, survivors firing/striking, zombies taking damage, dead zombies disappearing or showing kill animation. |
| **Test Data** | Default Phase 3 spawn weights (mostly Walkers, a small chance of Runner/Brute). |
| **Expected Results** | (a) At least one survivor changes position autonomously. (b) At least one zombie is killed without player input. (c) The kill counter in the HUD increments. (d) No "stuck" warnings or NaN positions in the dev console. |
| **Pass / Fail** | **PASS** if at least one autonomous kill happens within 30 seconds; **FAIL** if survivors are idle the entire window or zombies never take damage. |

---

### TC-05 — Night-bonus scrap is awarded only for activity during night ticks

| Field | Value |
|---|---|
| **TC-ID** | TC-05 |
| **Linked Use Case** | UC-FE-05 |
| **Priority** | High |
| **Preconditions** | A fresh run is started; player has 0 night kills and 0 night evacuations recorded; Scrap Magnet perk level is known (`L`). |
| **Test Steps** | 1. Start a run and immediately pause until the day/night indicator flips to **NIGHT**.<br>2. Resume; let survivors kill `K` zombies and evacuate `E` survivors entirely during night ticks.<br>3. Observe the live "🌙+N" HUD pill while the kills/evacs accumulate.<br>4. End the run; open the results screen.<br>5. Compare the run-end "Night Bonus" line to the live pill's last value. |
| **Test Data** | `K` = 3 night kills, `E` = 1 night evacuation, multiplier = `1 + L × 0.10`. Expected formula: `round((K × 2 + E × 5) × multiplier)`. |
| **Expected Results** | (a) The HUD pill appears the moment the first night kill or evac occurs and shows the formula value. (b) The pill pulses during night and is static during day. (c) The end-of-run "Night Bonus" line equals the pill's final value to the integer. (d) Day-time kills do **not** contribute to the night bonus. |
| **Pass / Fail** | **PASS** if (a)–(d) all hold; **FAIL** if the pill and the end-of-run breakdown disagree by more than 0 scrap. |

---

### TC-06 — End-of-run results screen shows a correct, itemized scrap breakdown

| Field | Value |
|---|---|
| **TC-ID** | TC-06 |
| **Linked Use Case** | UC-FE-06 |
| **Priority** | Medium |
| **Preconditions** | A run has just ended (either victory via portal evacuation or all survivors dead); the meta-shell scrap total before the run was `S_before`. |
| **Test Steps** | 1. Read the scrap balance on the meta shell before starting the run.<br>2. Play any run to completion.<br>3. On the results screen, record each line item: base kill scrap, evac bonus, night bonus, perk multiplier, and total awarded.<br>4. Click "Continue" and return to the meta shell.<br>5. Read the new scrap balance (`S_after`). |
| **Test Data** | Any completed run. |
| **Expected Results** | (a) Total awarded = sum of itemized line items. (b) `S_after === S_before + total awarded` (exact integer match). (c) No line item is negative. (d) If the run had zero night activity, the night-bonus line is hidden or shown as `+0`. |
| **Pass / Fail** | **PASS** if the meta-shell balance increases by exactly the displayed total. |

---

### TC-07 — Reset All Progress wipes save data and resets meta state

| Field | Value |
|---|---|
| **TC-ID** | TC-07 |
| **Linked Use Case** | UC-FE-07 |
| **Priority** | Medium |
| **Preconditions** | Player has at least one purchased gear item, at least one perk level above 0, and a non-zero scrap balance. |
| **Test Steps** | 1. Note current scrap, owned gear count, and perk levels on the meta shell.<br>2. Open the settings / debug panel and click "Reset All Progress".<br>3. Confirm the destructive-action dialog.<br>4. Reload the browser tab.<br>5. Re-read scrap balance, owned gear, and perk levels. |
| **Test Data** | Any non-empty save state. |
| **Expected Results** | (a) Scrap balance resets to the documented starting value (e.g., 0 or the tutorial grant). (b) All purchased gear is removed from the inventory. (c) All perk levels return to 0. (d) Reload preserves the reset state (the wipe is persisted, not just in-memory). |
| **Pass / Fail** | **PASS** if all three resource categories are at the documented fresh-save defaults both immediately and after reload. |

---

### TC-08 — Simulation-mode picker switches between Phase 3, Phase 2, and Sandbox without leaking state

| Field | Value |
|---|---|
| **TC-ID** | TC-08 |
| **Linked Use Case** | UC-FE-08 |
| **Priority** | Medium |
| **Preconditions** | Application has loaded successfully; at least one run has been started in Phase 3 to ensure runtime state exists. |
| **Test Steps** | 1. From inside Phase 3, click "← Other Simulations" in the top-left.<br>2. From the picker, switch to Phase 2 (the stable backup).<br>3. Verify Phase 2 renders with its own toolbar and HUD.<br>4. Switch to the Zombie AI Sandbox.<br>5. Verify the sandbox renders with its own controls.<br>6. Switch back to Phase 3.<br>7. Verify Phase 3 starts cleanly (no stuck survivors, no leftover zombies from the prior run). |
| **Test Data** | Three simulation modes: Phase 3, Phase 2, Sandbox. |
| **Expected Results** | (a) Each mode renders its own UI without overlap. (b) No console errors during transitions. (c) Phase 2 remains read-only and unmodified from its baseline behavior. (d) Re-entering Phase 3 starts a fresh run state (no zombies / survivors carried across). |
| **Pass / Fail** | **PASS** if all three modes load and Phase 3 is in a clean state on re-entry. |

---

## 4. Traceability Matrix

The matrix below maps each Test Case (rows) to the Use Case it verifies (columns). A filled cell (●) indicates direct coverage. Each use case has at least one test case; no test case is orphaned.

| Test Case ↓ \ Use Case → | UC-FE-01 | UC-FE-02 | UC-FE-03 | UC-FE-04 | UC-FE-05 | UC-FE-06 | UC-FE-07 | UC-FE-08 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **TC-01** Purchase Gear           | ● |   |   |   |   |   |   |   |
| **TC-02** Perk Upgrade Multiplier |   | ● |   |   | ● | ● |   |   |
| **TC-03** Start Run with Loadout  | ● |   | ● |   |   |   |   |   |
| **TC-04** Autonomous AI Combat    |   |   |   | ● |   |   |   |   |
| **TC-05** Night-Bonus Scrap       |   |   |   |   | ● |   |   |   |
| **TC-06** Run Results Breakdown   |   |   |   |   | ● | ● |   |   |
| **TC-07** Reset All Progress      | ● | ● |   |   |   |   | ● |   |
| **TC-08** Simulation-Mode Picker  |   |   | ● |   |   |   |   | ● |
| **Coverage Count per UC**         | **3** | **2** | **2** | **1** | **3** | **2** | **1** | **1** |

**Coverage summary:**
- **8 / 8 use cases** are covered by at least one test case.
- **Most-covered use case:** UC-FE-01 (Market Purchase) and UC-FE-05 (Night Bonus) — 3 test cases each. These are the highest-risk areas because they involve currency math and the recently-shipped night-bonus formula.
- **Least-covered use cases:** UC-FE-04 (AI Combat), UC-FE-07 (Reset), and UC-FE-08 (Picker) — 1 test case each. These are stable, lower-risk areas, but adding regression coverage before final-semester delivery is recommended.

---

## 5. Notes & Assumptions

1. **Front-End Scope Only.** This document covers the front-end team's deliverables only. Back-end concerns (server-side persistence, multiplayer sync, etc.) are out of scope for this in-class exercise per the instructor's note that the two teams work separately.
2. **Save Persistence.** The project currently persists all meta-progression in browser-local storage. TC-07 explicitly verifies the reset flow against this storage layer.
3. **Night-Bonus Formula.** The formula tested in TC-02, TC-05, and TC-06 is `round((nightKills × 2 + nightEvacuations × 5) × scrapMultiplier)`. This formula is implemented in a single shared function (`computeNightBonus`) used by both the live HUD pill and the run-end breakdown, so any drift is caught at module load by the project's dev-time self-test.
4. **No Test Framework Required.** All eight test cases are written as deterministic manual / exploratory test scripts and do not depend on any installed test framework. They can be re-run by hand or scripted later with Playwright if desired.

---

*End of Test Case Specification Document — In-Class Exercise 8.*

# Hardware — Wokwi electrical schematic & firmware

Electrical lane for the project (PLAN.md §8, rubric: **5%**). Owned by **Member B**
(assembles the Wokwi circuit, verifies it, owns electrical Q&A).

## Files

| File | What it is | Status |
|------|-----------|--------|
| `firmware.ino` | Arduino sketch — 7 servos, maps a joint vector to servo angles, idle sweep demo. | **Draft — verify in Wokwi** |
| `diagram.json` | Wokwi wiring: Arduino Uno + 7 servos on pins D2–D8. | **Draft — verify in Wokwi** |
| `wokwi-sim.png` | Screenshot of the running simulation. | ⛔ **TODO — capture from a real Wokwi run** |

## How to run

1. Open [wokwi.com](https://wokwi.com) → **New Project → Arduino Uno**.
2. Paste `firmware.ino` into `sketch.ino` and `diagram.json` into the diagram tab.
3. Press **Play**. The 7 servos sweep automatically.
4. Open the Serial Monitor (115200 baud) and **paste a joint vector in radians**
   — the same `q[]` the web app prints — and the servos jump to that pose, e.g.:
   ```
   [0.0, 1.15, 0.75, 0.0, 0.95, 0.0, 0.45]
   ```

Joint order matches `src/core/chain.ts`: base yaw · shoulder · elbow · forearm
roll · wrist pitch · tool roll · stylus pitch.

## Power note

7× SG90-class servos draw ~100–250 mA each idle and can spike to ~600 mA–1 A at
stall → up to ~3–4 A worst case. Wokwi simulates this fine off the board's 5 V,
but **real hardware needs a separate 5 V supply** (servo V+ off the external
rail, grounds common with the Arduino) — do **not** power all seven from the
Uno's onboard regulator.

## Still to add (needs a real Wokwi run — not fabricated)

- [ ] **Public Wokwi share link:** _(Wokwi → Save → Share → paste the link here)_
- [ ] **`wokwi-sim.png`:** screenshot of the running simulation for the README/slides.
- [ ] Confirm the sweep + serial pose-setting behave as expected, then flip the
      two "Draft" rows above to **Verified**.

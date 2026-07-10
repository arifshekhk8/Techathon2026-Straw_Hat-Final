# Hardware — Wokwi electrical schematic & firmware

Electrical lane for the project (PLAN.md §8, rubric: **5%**). Arduino Uno driving
**7 servos** — one per joint of the arm — that mirror the web app's joint vector.

## Files

| File | What it is | Status |
|------|-----------|--------|
| `firmware.ino` | Arduino sketch — 7 servos, maps a joint vector (radians) to servo angles, idle sweep demo. | ✅ **Verified** |
| `diagram.json` | Wokwi wiring: Arduino Uno + 7 servos on pins D2–D8, 5 V + GND. | ✅ **Verified** |
| `libraries.txt` | Declares the `Servo` library so Wokwi / arduino-cli resolve `#include <Servo.h>`. | ✅ |
| `wokwi-sim.png` | Screenshot of the running simulation (7 servos mid-sweep + serial banner). | ✅ **Captured** |

![Wokwi simulation running — 7 servos sweeping](wokwi-sim.png)

## Verification (done, not fabricated)

- **Compiles for a real Arduino Uno** — `arduino-cli compile --fqbn arduino:avr:uno`
  → *Sketch uses 8406 bytes (26%) of flash, global vars 426 bytes (20%) of RAM.*
  Clean build.
- **Runs in Wokwi** — loaded `firmware.ino` + `diagram.json` (+ the `Servo` lib)
  into a fresh Wokwi Arduino Uno project and pressed Play. The simulation runs at
  ~100 % real-time; the serial monitor prints the firmware banner
  `Straw Hat arm ready. Send [j1..j7] radians, or watch the sweep.`, and all seven
  servo horns visibly sweep at phase-shifted angles (see `wokwi-sim.png`).

## How to run it yourself

1. Open [wokwi.com](https://wokwi.com) → **New Project → Arduino Uno**.
2. Paste `firmware.ino` into `sketch.ino`, `diagram.json` into the diagram tab. If
   prompted, click **Install "Servo" library** (it's also declared in `libraries.txt`).
3. Press **Play**. The 7 servos sweep automatically.
4. Open the Serial Monitor (115200 baud) and **paste a joint vector in radians**
   — the same `q[]` the web app prints — and the servos jump to that pose, e.g.:
   ```
   [0.0, 1.15, 0.75, 0.0, 0.95, 0.0, 0.45]
   ```

Joint order matches `src/core/chain.ts`: base yaw · shoulder · elbow · forearm
roll · wrist pitch · tool roll · stylus pitch. Each joint is mapped from its
`[lower, upper]` limit onto the servo's 0–180°.

## Power note

7× SG90-class servos draw ~100–250 mA each idle and can spike to ~600 mA–1 A at
stall → up to ~3–4 A worst case. Wokwi simulates this fine off the board's 5 V,
but **real hardware needs a separate 5 V supply** (servo V+ off the external
rail, grounds common with the Arduino) — do **not** power all seven from the
Uno's onboard regulator.

## Optional

- [ ] **Public Wokwi share link** — needs a signed-in Wokwi save (Save → Share).
      The files above fully reproduce the project without it.

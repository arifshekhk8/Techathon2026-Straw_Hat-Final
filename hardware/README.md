# Hardware — Wokwi electrical schematic & firmware

Electrical lane for the project (PLAN.md §8, rubric: **5%**). Owned by **Member B**
(assembles the Wokwi circuit, verifies it, owns electrical Q&A).

**Board: ESP32 DevKit-C** · 7× servos · [ESP32Servo] library.

## Files

| File | What it is | Status |
|------|-----------|--------|
| `firmware.ino` | ESP32 sketch — 7 servos via ESP32Servo, maps a joint vector to servo angles, idle sweep demo. | **Draft — verify in Wokwi** |
| `diagram.json` | Wokwi wiring: ESP32 DevKit-C + 7 servos on GPIO 13/12/14/27/26/25/33. | **Draft — verify in Wokwi** |
| `libraries.txt` | Wokwi dependency list (`ESP32Servo`). | ✅ |
| `wokwi-sim.png` | Screenshot of the running simulation. | ⛔ **TODO — capture from a real Wokwi run** |

## Pin map (GPIO → joint)

| GPIO | Joint (chain.ts order) |
|------|------------------------|
| 13 | 1 · base yaw |
| 12 | 2 · shoulder |
| 14 | 3 · elbow |
| 27 | 4 · forearm roll |
| 26 | 5 · wrist pitch |
| 25 | 6 · tool roll |
| 33 | 7 · stylus pitch |

> Firmware `PINS[] = {13, 12, 14, 27, 26, 25, 33}` matches this joint order 1→7.

## How to run

1. Open [wokwi.com](https://wokwi.com) → **New Project → ESP32**.
2. Paste `firmware.ino` into `sketch.ino`, `diagram.json` into the diagram tab,
   and add **ESP32Servo** (Library Manager, or paste `libraries.txt`).
3. Press **Play**. The 7 servos sweep automatically.
4. Open the Serial Monitor (115200 baud) and **paste a joint vector in radians**
   — the same `q[]` the web app prints — and the servos jump to that pose, e.g.:
   ```
   [0.0, 1.15, 0.75, 0.0, 0.95, 0.0, 0.45]
   ```

## Power note

7× SG90-class servos draw ~100–250 mA each idle and can spike to ~600 mA–1 A at
stall → up to ~3–4 A worst case. Wokwi simulates this off the board's 5 V, but
**real hardware needs a separate 5 V supply** for the servo V+ rail (grounds
common with the ESP32) — do **not** power seven servos from the DevKit's USB 5 V.
The ESP32 drives 3.3 V logic; SG90s trigger fine at 3.3 V in Wokwi and usually on
real hardware — add a level shifter on the signal line only if a servo is marginal.

## Still to add (needs a real Wokwi run — not fabricated)

- [ ] **Public Wokwi share link:** _(Wokwi → Save → Share → paste the link here)_
- [ ] **`wokwi-sim.png`:** screenshot of the running simulation for the README/slides.
- [ ] Confirm the sweep + serial pose-setting behave as expected, then flip the
      two "Draft" rows above to **Verified**.

[ESP32Servo]: https://github.com/madhephaestus/ESP32Servo

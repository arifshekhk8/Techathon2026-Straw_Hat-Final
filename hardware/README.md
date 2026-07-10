# Hardware — Wokwi electrical schematic & firmware

Electrical lane for the project (PLAN.md §8, rubric: **5%**). Owned by **Member B**
(assembles the Wokwi circuit from the spec, verifies it, owns electrical Q&A).
Full spec: `internal/PARTNER_PROMPT_hardware.md`.

## Expected contents

| File | What it is |
|------|-----------|
| `diagram.json` | Wokwi circuit definition — export from the Wokwi project ("Save/Share → download `diagram.json`"). |
| `firmware.ino` | Arduino sketch driving the servos (the 6-DOF + stylus joints), mirroring the URDF joint order. |
| `screenshot.png` | Rendered Wokwi schematic image for the README / slides. |

## How it maps to the simulator

The firmware drives the same 7-joint arm the browser app simulates (see
`src/core/chain.ts` for joint order and limits). Keep servo channel order aligned
with `CHAIN[0..6]`: base yaw · shoulder · elbow · forearm roll · wrist pitch ·
tool roll · stylus pitch.

## Wokwi

- Project link: _(add the shareable Wokwi URL here)_
- Power budget: _(add total servo stall/idle current + supply headroom)_

> Committed from Member B's GitHub account. Placeholder until the Wokwi export
> and firmware land.

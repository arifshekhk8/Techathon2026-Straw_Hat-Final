# Techathon 2026 Final — "Dry Run" — Master Plan

> Team Straw Hat · 10 July 2026 · 12-hour onsite final (8 AM–8 PM), IUT Gazipur.
> Companion docs: [PROGRESSION.md](PROGRESSION.md) (step tracker) · [STATE.md](STATE.md) (live state, read this first every session).

## The problem in one sentence

Build a browser-only web app that visualizes a 7-joint (6-DOF + stylus pitch) robotic arm from a provided URDF, drives it through **one shared motion pipeline** from five triggers — dashboard, GUI joystick, keyboard, voice, autonomous PIN entry on a 6-key panel — plus a Wokwi electrical schematic and an architecture story, with an optional LLM agentic voice layer for +10%.

## Rubric (totals 100% + bonus)

| Criterion | Weight |
|---|---|
| Autonomous PIN entry (tip within ±5 mm of each key, in order) | **20%** |
| Visualization & dashboard (URDF renders, live joint states) | 15% |
| Inverse kinematics (target xyz → smooth correct reach) | 15% |
| Voice control (deterministic mapping is the required baseline) | 15% |
| System architecture & concept explanation | 15% |
| Manual control (GUI joystick + keyboard) | 10% |
| Electrical schematic (Wokwi diagram explicitly requested) | 5% |
| Polish & presentation | 5% |
| Phase 3B agentic voice (LLM, safety-gated) | **+10% bonus** |

## Provided inputs (already committed)

- `src/assets/stylus_arm.urdf` — 7 revolute joints, primitive geometry only:
  J1 yaw Z ±π @z0.060 → L0.25 → J2 pitch Y ±2.0944 → L0.25 → J3 pitch Y ±2.618 → L0.25 → J4 roll Z ±π → L0.15 → J5 pitch Y ±2.0944 → L0.25 → J6 roll Z ±π → L0.15 → J7 `stylus_pitch` Y ±2.0944 → fixed TCP `stylus_tip` at local z 0.137.
  **FK anchor: all joints zero ⇒ tip exactly (0, 0, 1.497 m).**
- `src/assets/key.config.json` — keys 1–3 at (0.50/0.55/0.60, +0.05, 0.05), keys 4–6 at (…, −0.05, 0.05), base frame, approach −z.
- `docs/problem-statement.pdf` — original problem PDF.

## Architecture

Pure client-side React + Vite + TS + Tailwind + plain three.js (no react-three-fiber, no backend).
Deps: `three@0.185.1`, `urdf-loader@0.13.1`, `zustand@^5`, `zod@^4`; dev: `vitest`, `@types/three`, Tailwind v4 (`@tailwindcss/vite`). **No new deps after 3 PM.**

```
src/core/     pure TS, zero deps, NO three.js imports, radians/meters, Z-up base frame
              math chain fk jacobian ik seed commands validate plan trajectory executor pin
src/state/    zustand store: q[7], mode, telemetry(10Hz), eventLog, pinProgress
src/three/    SceneManager, loadRobot (?raw + parse()), Panel, TipTrail, chainCheck
src/input/    keyboard.ts, Joystick.tsx
src/voice/    useSpeechRecognition (push-to-talk), grammar.ts, tts.ts, VoicePanel.tsx
src/agent/    groqClient, schema, systemPrompt, agentLoop, AgentPanel — behind UI flag
src/components/ Viewport JointPanel TcpReadout EventLog TopBar PinPad GotoPanel
tests/        vitest on pure core: fk, jacobian, ik, validate, pipeline, grammar
hardware/     wokwi diagram.json + firmware.ino + screenshot   ← Partner (hardware lane)
docs/         architecture.md (mermaid) + exported PNGs        ← docs lane
```

### MotionCommand contract (the judges' architecture story — everything shares it)

```ts
type Source = 'dashboard' | 'joystick' | 'keyboard' | 'voice' | 'agent' | 'auto';
type MotionCommand =
  | { type: 'jog';         delta: [number,number,number]; source: Source }  // base-frame meters
  | { type: 'jogJoint';    joint: number; deltaRad: number; source: Source }
  | { type: 'moveTo';      xyz: [number,number,number]; tipDown?: boolean; source: Source }
  | { type: 'rotateJoint'; joint: number; toRad?: number; deltaRad?: number; source: Source }
  | { type: 'home'; source: Source }
  | { type: 'touchKey';    key: 1|2|3|4|5|6; source: Source }
  | { type: 'typePin';     pin: string; source: Source }
  | { type: 'stop'; source: Source };
// validate(cmd, state): {ok:true}|{ok:false, reason} — ONE deterministic gate for all five inputs
```

Flow: input → MotionCommand → validate() (limits, reach sphere ≤0.97·MAX_REACH from shoulder [0,0,0.310], floor z≥0.005, panel keep-out outside touch) → plan() (IK → segments, atomic reject) → executor.tick(dt) (smoothstep, ≤0.75·vmax) → store.q[7] → render + 10 Hz telemetry.

Invariants: all robot math in Z-up base frame, exactly one `zUpRoot.rotation.x = -π/2`; continuous jog = resolved-rate (1–2 DLS iters/frame from current q), not queued segments; every joint array length **7**; agent has no privileged path.

### IK

Hand-rolled damped least squares: analytic geometric Jacobian (rows `aᵢ × (tip−oᵢ)`), 3 position rows + weighted tip-down rows (k_w 0.5), λ=0.08, dq cap 0.2/iter, limit clamp each step, seed = current pose (fallback Q_READY + perturbations), converge <1 mm, never execute non-converged. Jacobian finite-diff test green **before** debugging IK.

## Build steps (one at a time — tracked in PROGRESSION.md)

1. **Scaffold + deploy pipeline** (30m) — deps, .gitignore w/ .env* in commit #1, assets, hello-world on Vercel. *Done when: URL renders on a phone.*
2. **Render layer** (60m) — SceneManager, URDF in zUpRoot, key panel (top face z=0.05, labeled, idle/target/touched), store, JointPanel sliders (dashboard trigger), TcpReadout, EventLog. *Done when: sliders move all 7 joints, TCP=(0,0,1497mm) at zeros.* → **15%**
3. **FK + pipeline skeleton + keyboard** (45m) — chain/fk + tests, commands/validate, trajectory/executor, keyboard jog (WASD/QE cart, R/F wrist, ESC stop, Space reserved, input-focus guard). *Done when: fk/validate tests green, keyboard jogs.* → ~5%
4. **IK — HARD TIMEBOX 75m** — jacobian+FD test first, DLS, 6 keys ×{hover,touch} <1mm + fuzz, precomputePinPoses + reachability chip, GotoPanel, resolved-rate jog. *Fallback if timebox fires: 6 precomputed key poses (saves PIN 20%).* → **15%**
5. **Autonomous PIN entry** (45m) — per-digit machine: transit→hover(+0.06)→descend(pure −z)→touch(dwell 400ms, success = FK of executed pose ≤5mm, green flash + mm readout; else red/abort)→retract. PinPad + digit strip + TipTrail + pipeline tests. → **20%**
6. **Joystick + jog polish** (35m) — captured pad + Z buttons, velocity smoothing, workspace-limit badge, jog blocked during PIN except stop. → 10%
7. **Deterministic voice + TTS** (60m) — grammar.ts regex parser + ~30 fixtures, **typed command box first** (same parser = wifi-proof), push-to-talk webkitSpeechRecognition, TTS short + cancel-on-PTT. → **15%**
8. **Wokwi + firmware stub** (30m) — **PARTNER LANE**, spec in `internal/PARTNER_PROMPT_hardware.md`. → 5%
9. **GATE, then agentic 3B** (10+50m) — all core green first. Groq `openai/gpt-oss-120b` strict json_schema (fallback `llama-3.3-70b-versatile`), zod `{speech, commands[], needs_clarification}`, live-state system prompt + 3 few-shots, every command through same validate(), rejection → 1 revision → else execute NOTHING + spoken reason, per-command badges, key via localStorage gear (never bundle/repo). *Red-team demo: "slam the arm down two meters" → visible refusal.* → **+10%**
10. **README + diagrams + polish → FREEZE 17:30** — video FIRST, final deploy, secret grep, 2nd-device test, tag `v1.0-submission`. → 15%+5%
11. **Submit portal by 18:15** (hard 18:30) — repo URL, live URL, video, team info, screenshot confirmation.

## Schedule & cut lines

Clocks assume build start ~10:45; if later, shift and reclaim from the 18:30–20:00 rehearsal buffer. **Cut-line order matters, not clocks.** After ~12:30 the app must be demo-able at every hour. Commit each checkpoint; **push once per hour after user approval.**

Cut priority when behind (first→last): Whisper stretch → agent 3B → UI polish → voice(→typed) → joystick (keyboard covers Manual) → live IK(→stored poses). **Never cut:** visualization, PIN, README/architecture, Wokwi, submission.

**Commit rules (user-set):** clear conventional messages; **NEVER add any AI co-author tag or Claude attribution to commits**; push only after Arif approves (~hourly). Repo is **PRIVATE during the day** to hide work from competitors — **MUST be flipped to PUBLIC at the 17:30 freeze checklist, before submission** (`gh repo edit --visibility public`).

## Top risks

1. IK rabbit hole → FD-test first, FK anchor 1.497m, 75-min timebox → precomputed poses.
2. Z-up/Y-up confusion → single zUpRoot, TcpReadout via cached baseInv → hand-built chain fallback.
3. Web Speech dead at venue → push-to-talk, mic pre-granted, hotspot → typed box, same parser.
4. Agent garbage mid-demo → strict schema + zod + gate, UI flag → flip flag off.
5. npm/deploy late failure → all installed + deployed at step 1, redeploy each checkpoint → vite preview locally.
6. Groq key leak → .env* ignored commit #1; `git log -p | grep -iE 'gsk_|groq|api.?key'` before submit.
7. ±5mm dispute → live mm readout, PASS = FK of executed pose, descent pure −z.
8. Demo SPOF → video at freeze, second laptop cloned, tag v1.0-submission.

## Team lanes (honest multi-author history; judges ask "who wrote which part")

| Member | Lane | Commits from own account |
|---|---|---|
| Arif (lead) | Core app + integration, owns main, presents | app code |
| Member B | Hardware: assembles Wokwi circuit from spec, verifies, owns electrical Q&A | `hardware/` |
| Member C | Docs: README sections, contributions/challenges, attribution | `docs/`, README |
| Member D | QA on 2nd laptop, UI copy fixes, demo video, demo script | demo assets |

Each teammate: accept collaborator invite → clone → `git config user.name/email` → work only in their lane paths → push; lead pulls before every push.

## Demo script (5 min)

0:00 deployed URL, arm + live dashboard *(Viz)* · 0:30 keyboard→joystick jog *(Manual)* · 1:15 GotoPanel xyz + one DLS sentence *(IK)* · 2:00 **judge-supplied PIN, green ±5mm badges** *(PIN)* · 3:00 voice "rotate base 30 degrees", agent "tap the 5 key twice then move up a couple centimeters", red-team refusal + line "every LLM command passes the identical deterministic validator as the joystick" *(Voice+Bonus)* · 3:45 money-slide + Wokwi servos sweeping *(Arch+Elec)* · 4:30 future scope, close.

## Attribution (must appear in README)

three.js (MIT) · urdf-loader by gkjohnson (MIT) · Web Speech API (Chrome) · Groq API (gpt-oss-120b / llama-3.3-70b) · Tailwind CSS · Vite · zustand · zod · Wokwi.

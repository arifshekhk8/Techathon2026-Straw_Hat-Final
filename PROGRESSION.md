# Progression Tracker

> Update after every step: mark done, note the time, one line on what actually happened (deviations, cut decisions). Newest notes at the bottom.

## Steps

- [x] **0. Plan approved** — full plan in [PLAN.md](PLAN.md)
- [x] **1. Scaffold + clean repo** — Vite react-ts, folder structure, .gitignore (secrets ignored in commit #1), assets committed (URDF + key.config + problem PDF), tracking docs, deps installed, GitHub repo live (`arifshekhk8/Techathon2026-Straw_Hat-Final`, 3 collaborators invited), Vercel production deploy working (`techathon2026-straw-hat-final.vercel.app`)
- [x] **2. Render layer (15%)** — SceneManager + zUpRoot, URDF via ?raw parse, key panel (6 labeled caps, top z=0.05), zustand store, 7 joint sliders + limit bars, TCP readout @10Hz, event log. Build green. *(visual check pending: arm upright + TCP (0,0,1497))*
- [x] **3. FK + pipeline skeleton + keyboard (~5%)** — pure-TS core (`math/chain/fk/commands/keys/executor/validate`), `MotionController` (jog + eased moves, one validate() gate, writes store.q), keyboard jog (7 joints, hold-to-jog, Esc=stop, 0=home, input-focus guard). 15/15 vitest green — **FK anchor (0,0,1497) proven independently of three.js**; build green. *(Step-2 visual check still pending before IK.)*
- [x] **4. IK — hard timebox 75 min (15%)** — jacobian FD-verified, DLS solver (λ=0.08, dq cap, tip-down weighted), all 6 keys hover+touch <1mm, precomputeKeyPoses (PIN safety net), reachability chips, GotoPanel (xyz→moveTo via IK), resolved-rate Cartesian jog (arrow/Page keys). 20/20 tests + build green.
- [ ] **5. Autonomous PIN entry (20%)** — full 6-digit run, per-key ±5mm badges
- [ ] **6. Joystick + jog polish (10% manual total)** — pad + Z, smooth stop <100ms
- [ ] **7. Deterministic voice + TTS (15%)** — "rotate base 30 degrees" + dictated PIN + typed box offline
- [ ] **8. Wokwi + firmware.ino (5%)** — PARTNER LANE — sim runs, servos sweep from pasted JSON, screenshot committed
- [ ] **9. GATE → agentic 3B (+10%)** — multi-step utterance executes, red-team refusal visible
- [ ] **10. README + diagrams + polish → FREEZE 17:30** — video recorded, final deploy, secret grep, tag v1.0-submission
- [ ] **11. SUBMIT by 18:15 (hard 18:30)** — portal confirmation screenshot

## Checkpoint / cut-line log

| Time | Event / decision |
|---|---|
| ~09:20 | Problem statement received, PDFs read, plan built (design panel: 5 agents) |
| ~10:45 | Clean repo created, step 1 in progress |
| ~10:50 | GitHub repo public + 3 collaborator invites sent; Vercel prod deploy verified (stable alias 200) |
| ~11:10 | Step 2 render layer built, `npm run build` green, dev server on :5173 |
| ~11:15 | Step 3 done: pure FK core + shared validate() + MotionController + keyboard jog. 15/15 tests, build green. FK anchor confirmed in unit test. Awaiting user visual check before IK timebox. |
| ~11:30 | Arif confirmed Step-2 visual check ✓. Attribution: golammoula287 added as co-author on steps 1–2 (his lane), force-pushed `b4208f7`. |
| ~11:35 | Step 4 done (IK) well inside 75-min box. Jacobian FD-verified, DLS, GotoPanel, Cartesian jog, reachability chips. 20/20 tests. **Browser-verified via headless Chrome + CDP**: render+anchor (0,0,1497), all 6 keys green, Go→(549.9,0,150.0) tip-down, +x jog→154mm@0.12m/s, zero page errors. |

## Push log (push only after user approval, ~hourly)

| Time | Commit(s) | Approved by |
|---|---|---|
| ~10:50 | `bbccad1` scaffold (pushed at repo creation) | Arif (repo-creation request) |
| ~11:25 | `dc00e50` render layer + history rewrite (co-author tags stripped, force-push) | Arif (tag-removal request) |
| ~11:30 | Force-push whole main → `b4208f7`. Steps 1–2 rewritten with `Co-authored-by: golammoula287` (his lane on scaffold+render); + docs, Step 3 (FK core), Step 4 IK core. No AI tags. SHAs changed (bbccad1→43db398, dc00e50→2009fa1). Verified no teammate commits clobbered (force-with-lease). | Arif (push request) |

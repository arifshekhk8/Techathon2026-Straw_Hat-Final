# Progression Tracker

> Update after every step: mark done, note the time, one line on what actually happened (deviations, cut decisions). Newest notes at the bottom.

## Steps

- [x] **0. Plan approved** — full plan in [PLAN.md](PLAN.md)
- [x] **1. Scaffold + clean repo** — Vite react-ts, folder structure, .gitignore (secrets ignored in commit #1), assets committed (URDF + key.config + problem PDF), tracking docs, deps installed, GitHub repo live (`arifshekhk8/Techathon2026-Straw_Hat-Final`, 3 collaborators invited), Vercel production deploy working (`techathon2026-straw-hat-final.vercel.app`)
- [x] **2. Render layer (15%)** — SceneManager + zUpRoot, URDF via ?raw parse, key panel (6 labeled caps, top z=0.05), zustand store, 7 joint sliders + limit bars, TCP readout @10Hz, event log. Build green. *(visual check pending: arm upright + TCP (0,0,1497))*
- [ ] **3. FK + pipeline skeleton + keyboard (~5%)** — fk/validate tests green, keyboard jog works
- [ ] **4. IK — hard timebox 75 min (15%)** — jacobian FD test green, 6 keys <1mm, GotoPanel reaches
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

## Push log (push only after user approval, ~hourly)

| Time | Commit(s) | Approved by |
|---|---|---|
| ~10:50 | `bbccad1` scaffold (pushed at repo creation) | Arif (repo-creation request) |
| ~11:25 | `dc00e50` render layer + history rewrite (co-author tags stripped, force-push) | Arif (tag-removal request) |

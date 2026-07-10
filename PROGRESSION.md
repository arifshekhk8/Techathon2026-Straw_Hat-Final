# Progression Tracker

> Update after every step: mark done, note the time, one line on what actually happened (deviations, cut decisions). Newest notes at the bottom.

## Steps

- [x] **0. Plan approved** — full plan in [PLAN.md](PLAN.md)
- [x] **1. Scaffold + clean repo** — Vite react-ts, folder structure, .gitignore (secrets ignored in commit #1), assets committed (URDF + key.config + problem PDF), tracking docs, deps installed, GitHub repo live (`arifshekhk8/Techathon2026-Straw_Hat-Final`, 3 collaborators invited), Vercel production deploy working (`techathon2026-straw-hat-final.vercel.app`)
- [x] **2. Render layer (15%)** — SceneManager + zUpRoot, URDF via ?raw parse, key panel (6 labeled caps, top z=0.05), zustand store, 7 joint sliders + limit bars, TCP readout @10Hz, event log. Build green. *(visual check pending: arm upright + TCP (0,0,1497))*
- [x] **3. FK + pipeline skeleton + keyboard (~5%)** — pure-TS core (`math/chain/fk/commands/keys/executor/validate`), `MotionController` (jog + eased moves, one validate() gate, writes store.q), keyboard jog (7 joints, hold-to-jog, Esc=stop, 0=home, input-focus guard). 15/15 vitest green — **FK anchor (0,0,1497) proven independently of three.js**; build green. *(Step-2 visual check still pending before IK.)*
- [x] **4. IK — hard timebox 75 min (15%)** — jacobian FD-verified, DLS solver (λ=0.08, dq cap, tip-down weighted), all 6 keys hover+touch <1mm, precomputeKeyPoses (PIN safety net), reachability chips, GotoPanel (xyz→moveTo via IK), resolved-rate Cartesian jog (arrow/Page keys). 20/20 tests + build green.
- [x] **5. Autonomous PIN entry (20%)** — PinRunner state machine (transit→settle→pure −z descend→dwell 400ms→retract), success = FK of executed pose ≤5mm, per-key green/red mm badges, key highlights, TipTrail, Esc-abort. pure `pin.ts` + tests. **Browser-verified: PIN 156 → 3/3 within ~1mm.** 24/24 tests + build green.
- [x] **6. Joystick + jog polish (10% manual total)** — GUI joystick (XY pad + Z-hold buttons) on the shared Cartesian jog lane; proportional speed (partial deflection = slower), velocity-smoothed start + sub-100ms smooth stop (CART_TAU 25ms), workspace-limit badge (reach %/floor), jog blocked during PIN except Stop. **Browser-verified:** pad +X → tip 0→50mm; off-singularity Z-down → −45mm; PIN run disables pad. 24/24 tests + build green.
- [x] **7. Deterministic voice + TTS (15%)** — PARTNER LANE (golammoula287 + Meherab + Anamika, PR #1). One mic + one box: deterministic `grammar.ts` (offline, no key) for simple commands, LLM agent fallback for multi-step; both through the shared `validate()`+`dispatch()`. TTS speaks confirm/reject. **Integrated into main** (reconciled stale boolean dispatch → DispatchResult; no conflict w/ Step 6 gear). **Browser-verified**: "rotate base 30°"→J1 30.0° via grammar; out-of-limit rejected by validate (no motion); 50/50 tests.
- [ ] **8. Wokwi + firmware.ino (5%)** — PARTNER LANE — sim runs, servos sweep from pasted JSON, screenshot committed
- [x] **9. GATE → agentic 3B (+10%)** — LLM agent (Groq `gpt-oss-120b` + llama fallback, JSON mode, zod-validated) plans multi-step utterances and runs each through the same gate. **Browser-verified LIVE**: "rotate base 20 then elbow 15" → planned 2 actions → base 20.0°, elbow 15.0°. Red-team refusal path present (validate rejects before any joint moves). *(final red-team demo clip pending)*
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
| ~13:10 | Step 6 done (joystick + jog polish, 10% manual). GUI XY pad + Z-hold buttons on the shared Cartesian jog lane; controller now smooths tip velocity (CART_TAU 25ms → soft start, sub-100ms stop) and scales speed by deflection; workspace-limit badge; jog blocked during PIN (only Stop live). **Browser-verified**: pad +X→50mm, off-singularity Z-down→−45mm, PIN disables pad, no page errors. Note: pure-Z jog from the exact-vertical home is correctly damped (singularity) — badge shows "near reach limit". 24/24 tests + build green. Committed, awaiting push approval. |
| ~14:40 | **Reviewed + integrated PR #1 (Step 7 voice + Step 9 LLM agent)** from golammoula287 (co-authors Meherab, Anamika). Review verdict: architecture sound (voice+agent both funnel through shared `validate()`+`dispatch()`, no store/controller bypass; no secrets; key from localStorage/env), but branch was stale (cut from `4760255`) → merging broke the build (his new `jog` case returned old boolean vs current `DispatchResult`). Merged into gear-main, fixed the `jog` case to return `{ok,reason}`, no gear conflict. Build green, **50/50 tests** (24 core + 26 grammar). Browser-verified deterministic grammar + validate-reject + **live LLM multi-step agent**. |

## Push log (push only after user approval, ~hourly)

| Time | Commit(s) | Approved by |
|---|---|---|
| ~10:50 | `bbccad1` scaffold (pushed at repo creation) | Arif (repo-creation request) |
| ~11:25 | `dc00e50` render layer + history rewrite (co-author tags stripped, force-push) | Arif (tag-removal request) |
| ~11:30 | Force-push whole main → `b4208f7`. Steps 1–2 rewritten with `Co-authored-by: golammoula287` (his lane on scaffold+render); + docs, Step 3 (FK core), Step 4 IK core. No AI tags. SHAs changed (bbccad1→43db398, dc00e50→2009fa1). Verified no teammate commits clobbered (force-with-lease). | Arif (push request) |
| ~11:40 | Fast-forward push → `d2ab283` (Step 4 IK dashboard). History verified 100% claude-free (all commits author+committer = arif; only co-author = golammoula287 on steps 1–2). "claude" in GitHub Contributors sidebar = stale cache from pre-11:25 pushes; recomputes after push. | Arif (push request) |
| ~12:12 | Step 5 (autonomous PIN, 20%) done + browser-verified (PIN 156 → 3/3 keys ~1mm, green badges, tip trail). 24/24 tests. Committed locally, awaiting push approval. | — |
| ~12:18 | Fast-forward push → `d569cb6`: `28af780` (Step 5 PIN) + `d569cb6` (PIN pad UX fix — spaced-default bug). In sync, no clobber. | Arif (push request) |
| ~12:22 | Fast-forward push → `4760255`: push-log doc + `4760255` (dropped rubric-weight label from PIN heading). In sync. | Arif (push request) |
| ~13:15 | Fast-forward push → `487d661`: `1e84e5b` (push-log doc) + `487d661` (inline IK accept/reject status in Go-to-point). In sync, clean history. | Arif (push request) |
| ~13:42 | Push → `b0366b7`: Step 6 commits `3f8f010` (joystick + jog polish) + `b0366b7` (joystick stall/limit badge + jog-release safety net). **Co-author `Anamika-Mallick` added to both** (Arif's call, her lane on manual control) via filter-branch; author/committer = arif, tree identical, no AI tags. Backup ref cleared. | Arif (push request, co-author `Anamika-Mallick`) |
| ~14:10 | Step 6 polish: **jog gear** (Fine 0.35× / Normal 1× / Fast 2.5× / Turbo 5×) scaling both joystick + keyboard jog; base Cartesian rate bumped 0.12→0.16 m/s; per-frame DQ cap now gear-scaled with a hard ceiling (Turbo stays singularity-safe); `[`/`]` keys shift gear; segmented gear UI in joystick panel. **Browser-verified**: Fine ~44 → Turbo ~475 mm/s, keys clamp at both ends, 24/24 tests + build green. Committed, awaiting push approval. | — |
| ~14:45 | Push → `1cb2169`: gear (`100f638`) + **PR #1 voice/agent integration** (`830aaa9` golammoula287 +Meherab+Anamika) + docs + build fix. NOTE: `git pull --rebase` flattened the merge commit and dropped the `jog`→DispatchResult reconciliation, briefly pushing a broken build (`09e12fa`); caught immediately, fixed forward with `1cb2169`. Remote main now green, 50/50 tests, linear history, no AI tags. His commit author preserved (committer became arif via rebase — harmless). PR #1 still shows OPEN on GitHub (rebased SHA ≠ branch SHA, won't auto-close). | Arif (integrate + push request) |

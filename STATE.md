# STATE — read this first in any new session

> Living snapshot. Keep it short; update whenever state changes meaningfully.

## Where we are

- **Current step:** **Step 4 (IK) DONE + browser-verified** (jacobian FD-verified, DLS, GotoPanel, Cartesian jog, reachability chips; 20/20 tests). Next is **Step 5: autonomous PIN entry (20% — the centerpiece).**
- Dev server: `npm run dev` → http://localhost:5173 (running).
- **Verification harness (reusable):** headless Chrome + CDP driver at `scratchpad/cdp.mjs`. `node cdp.mjs <url> <out.png> [snippetFile] [settleMs]` — navigates, runs an async JS snippet (DOM clicks / dispatched KeyboardEvents), screenshots, reports page exceptions. WebGL works via SwiftShader. Use after each step to self-verify before handing Arif his check.
- **It is final-day.** Freeze 17:30, submit by 18:15 (hard 18:30), demo after 18:30.

## Key facts

- New clean repo: `/Users/arif/Documents/Techathon2026-Straw_Hat-Final` (this folder). The OLD prelim project lives at `/Users/arif/Documents/IUT_AI_Agentic_Hackathon` — reference only, no code reuse (rulebook bans pre-written code).
- **GitHub:** repo `arifshekhk8/Techathon2026-Straw_Hat-Final` — **currently PRIVATE** (user choice, hides work from competitors). ⚠️ **MUST flip to PUBLIC before submission — it's on the 17:30 freeze checklist:** `gh repo edit arifshekhk8/Techathon2026-Straw_Hat-Final --visibility public --accept-visibility-change-consequences`. All 3 teammates ACCEPTED collaborator invites (direct push access): meherabmehu, Anamika-Mallick, golammoula287. If organizers mandate a different repo name, rename in Settings (redirects preserved).
- **Commit rule (user-set): NO AI co-author tags / Claude attribution in commit messages, ever.** Human co-authors OK: steps 1–2 credit `Co-authored-by: golammoula287 <146130427+golammoula287@users.noreply.github.com>` (Arif's call, his lane on scaffold+render). Steps 3+ = Arif's lane, no co-author. History rewritten via filter-branch; head `b4208f7` pushed.
- **Vercel:** project `straw-hat3/techathon2026-straw-hat-final`, CLI logged in as arifshekhk8. Stable production URL (use THIS one, it's public): **https://techathon2026-straw-hat-final.vercel.app** — per-deployment URLs 302 to Vercel auth, that's normal. Redeploy: `npx vercel --prod --yes`.
- Provided files committed: `src/assets/stylus_arm.urdf`, `src/assets/key.config.json` (Drive links in PLAN.md context if re-fetch needed).
- FK anchor truth: all joints zero ⇒ TCP (0, 0, 1.497 m). 7 joints, TCP link `stylus_tip`.
- **Groq key: DONE** — `.env.local` created from old project's key (git-ignored, verified).
- Push protocol: **commit freely, push ~hourly only after Arif approves.** Teammates push their own lanes (hardware/, docs/) from their accounts.

## Delegated / parallel work

- **Partner (Member B):** Wokwi schematic + firmware.ino via `internal/PARTNER_PROMPT_hardware.md` — hand him the prompt + he attaches problem PDF + rulebook PDF in his Claude session. Output lands in `hardware/` committed from his GitHub account.
- Member C (docs) and Member D (QA/demo) lanes start once the app has visible features (~step 5).

## Open questions

1. Exact repo name format for the final round (ask organizers) — blocks first push only, not local work.
2. Vercel account ready? (user action) — blocks deployed-URL bonus only.
3. Submission portal URL + exact deadline — confirm with organizers before 17:00.

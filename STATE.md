# STATE — read this first in any new session

> Living snapshot. Keep it short; update whenever state changes meaningfully.

## Where we are

- **Current step:** 2 done (render layer, build green) → next is **Step 3: FK core + pipeline skeleton + keyboard jog** (PLAN.md).
- Dev server: `npm run dev` → http://localhost:5173. Visual checkpoint for user: arm upright, sliders move joints, TCP reads (0, 0, 1497.0) mm at Zero-all.
- **It is final-day.** Freeze 17:30, submit by 18:15 (hard 18:30), demo after 18:30.

## Key facts

- New clean repo: `/Users/arif/Documents/Techathon2026-Straw_Hat-Final` (this folder). The OLD prelim project lives at `/Users/arif/Documents/IUT_AI_Agentic_Hackathon` — reference only, no code reuse (rulebook bans pre-written code).
- **GitHub:** repo `arifshekhk8/Techathon2026-Straw_Hat-Final` — **currently PRIVATE** (user choice, hides work from competitors). ⚠️ **MUST flip to PUBLIC before submission — it's on the 17:30 freeze checklist:** `gh repo edit arifshekhk8/Techathon2026-Straw_Hat-Final --visibility public --accept-visibility-change-consequences`. All 3 teammates ACCEPTED collaborator invites (direct push access): meherabmehu, Anamika-Mallick, golammoula287. If organizers mandate a different repo name, rename in Settings (redirects preserved).
- **Commit rule (user-set): NO AI co-author tags / Claude attribution in commit messages, ever.** History was rewritten once (filter-branch) to strip them; current clean head pushed.
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

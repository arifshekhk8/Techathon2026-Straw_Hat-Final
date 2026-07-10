# STATE — read this first in any new session

> Living snapshot. Keep it short; update whenever state changes meaningfully.

## Where we are

- **Current step:** 1 → finishing scaffold; next is **Step 2: render layer** (PLAN.md).
- **It is final-day.** Freeze 17:30, submit by 18:15 (hard 18:30), demo after 18:30.

## Key facts

- New clean repo: `/Users/arif/Documents/Techathon2026-Straw_Hat-Final` (this folder). The OLD prelim project lives at `/Users/arif/Documents/IUT_AI_Agentic_Hackathon` — reference only, no code reuse (rulebook bans pre-written code).
- **GitHub remote: NOT created yet.** Blockers: confirm final-round repo-name format with organizers, then lead creates public repo + invites 3 teammates as collaborators. Repo must be created after problem release (already satisfied).
- Provided files committed: `src/assets/stylus_arm.urdf`, `src/assets/key.config.json` (Drive links in PLAN.md context if re-fetch needed).
- FK anchor truth: all joints zero ⇒ TCP (0, 0, 1.497 m). 7 joints, TCP link `stylus_tip`.
- Groq key: exists in the OLD project's `.env` — copy into `.env.local` here manually (NEVER commit; `.gitignore` already blocks it).
- Deploy: Vercel — needs user's account/login; hello-world deploy pending.
- Push protocol: **commit freely, push ~hourly only after Arif approves.** Teammates push their own lanes (hardware/, docs/) from their accounts.

## Delegated / parallel work

- **Partner (Member B):** Wokwi schematic + firmware.ino via `internal/PARTNER_PROMPT_hardware.md` — hand him the prompt + he attaches problem PDF + rulebook PDF in his Claude session. Output lands in `hardware/` committed from his GitHub account.
- Member C (docs) and Member D (QA/demo) lanes start once the app has visible features (~step 5).

## Open questions

1. Exact repo name format for the final round (ask organizers) — blocks first push only, not local work.
2. Vercel account ready? (user action) — blocks deployed-URL bonus only.
3. Submission portal URL + exact deadline — confirm with organizers before 17:00.

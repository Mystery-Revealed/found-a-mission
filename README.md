# Found a Mission — Unit 2 Texas History Game

**TEKS 7.2C, 7.2B, 7.9A** · Pattern A engine game (per `D:\Texas History\Common_Build_Standards.md`)

Everyone in class plays the **same Franciscan friar** founding **San Francisco de los
Tejas** among the **Caddo**, 1690–1731. Six chapters × 2 decisions = **12 graded
actions**. Meters: ⛪ **Mission** · 🤝 **Trust** (the heart — if it hits 0 after a
choice, the mission fails early) · 📦 **Supplies**. Ending tiers: *A Mission That
Took Root* / *The Bell Still Rings* / *The Woods Reclaim It* (+ the early-fail
*The Gates Stand Empty*). The debrief teaches the honest arc: 1690 founding →
1693 closing → Hidalgo's letter → 1716 return with Margil → 1719 Chicken War →
**1731 move to the San Antonio River** (the bridge to *Claim the Land*).

## Structure

```
server/          Node + Express + Socket.IO (server-authoritative; answer key lives here)
  src/games/foundAMission.js   the adapter: content bank + answer key
  src/games/_stepGame.js       step-game factory (adds failCheck/failEnding strength check)
client/          React 18 + Vite thin client
  src/components/shared/MissionPanel.jsx   build-status panel (chapel → fields → acequia → herd)
client/public/assets/images/   Higgsfield art (see spec §5)
```

## Run locally

```bash
npm install     # installs server/ + client/ via postinstall
npm test        # 27 server tests: scoring, content bank, GameManager lifecycle
npm run build   # builds client/dist
npm start       # serves game + Command Center on :4600
```

- Students: `http://localhost:4600/`
- Teacher Command Center: `http://localhost:4600/#teacher`

> **Note:** if the D: drive is short on space, run installs/builds from a copy on
> C: — the source here stays deploy-ready (Render builds in the cloud).

## Deploy (Render) & embed (Wix)

1. Push this folder to a GitHub repo (`found-a-mission`).
2. Render → New Web Service → connect the repo. `render.yaml` sets
   `npm install && npm run build` / `node server/src/index.js`.
3. Wix: **Embed a Site** → the Render URL (students on a public page; `#teacher`
   route on a password-protected page). Size ~1000×760; test at phone width.

## Data lifecycle

All session state lives in **server memory** — no database. "End Session" (with
confirmation), the ~2-hour idle sweep, or a server restart erases everything.
The teacher's PDF download is the only lasting record. Display names only.

## Sensitivity (spec §6 — honored in code and tests)

Trust is won by **service and respect, never force** — force options always grade
wrong, with plain feedback. The epidemic chapter is honest at headline level
("the sickness came with the strangers"), grief is shared, and no blame ever
lands on the Caddo or their healers. The Caddo keep their agency: they choose
trade and friendship on their terms and mostly keep their own faith — the text
says so plainly. Tests in `server/test/content.test.js` pin all of this.

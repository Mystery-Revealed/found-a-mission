// foundAMission.js — Unit 2 game adapter: "Found a Mission" (SOLO, one
// class-wide group). Everyone plays the same Franciscan friar founding an East
// Texas mission among the Caddo, 1690–1731. Six chapters × 2 graded decisions =
// 12 graded actions. There is no "pick" and no rival — the whole class walks the
// same forty years, so the Teacher Command Center reports ONE accuracy group.
//
// THE TEACHING IDEA (spec §1): missions had TWO JOBS — spread the faith and
// hold the land for Spain (TEKS 7.2C, 7.2B) — and they succeeded or failed
// mostly on RELATIONS WITH NATIVE PEOPLES. Trust is the game's heart: it is won
// by service and respect, never by force. If Trust ever hits 0 after a choice,
// the mission fails early (the real failure mode) — see failCheck below.
//
// SENSITIVITY (spec §6): the Caddo keep their agency throughout — a strong,
// organized farming nation who welcomed trade and mostly kept their own faith,
// which the text says plainly. Force options ALWAYS grade wrong, with plain
// feedback. The epidemic chapter is honest at a headline level: the sickness
// came with the strangers; grief is shared; no blame ever lands on the Caddo.
// "Losing" East Texas in 1731 while scoring high accuracy IS the real history —
// the debrief honors it and bridges to San Antonio (Claim the Land).
//
// THE ANSWER KEY LIVES HERE, ON THE SERVER (verdicts/effects/feedback). The
// factory ships labels only; the client submits { kind, choiceIndex }.
// Student-facing text is written at a 5th grade reading level.
//
// Every step is a 'decision' (a judgment call) — this is a building/management
// game with a status panel, not a map. ✅ right (+1) · ⚠️ partial (+0.5) · ❌ wrong (0).

import { createStepGame } from './_stepGame.js';

// ---------------------------------------------------------------------------
// Shared board metadata (shipped to clients at match:begin — display info only)
// ---------------------------------------------------------------------------

export const METERS = {
  mission:  { name: 'Mission',  icon: 'mission',  blurb: 'Your buildings, fields, and herd — the mission itself, rising in the pines.' },
  trust:    { name: 'Trust',    icon: 'trust',    blurb: 'Friendship with the Caddo. The heart of everything — if it ever reaches zero, the mission fails.' },
  supplies: { name: 'Supplies', icon: 'supplies', blurb: 'Corn, tools, and cattle. Mexico is months away — you live on what you grow and store.' },
};

// This game has no map, so there are no placed markers. Kept for engine symmetry.
export const MARKERS = {
  mission: { name: 'The mission' },
};

// All three meters begin at 50: a wagon, a bell, and a blessing — and neighbors
// who have not yet decided what to make of you.
const START_METERS = { mission: 50, trust: 50, supplies: 50 };

// Mission Score = mission + trust + supplies (max 300).
export function missionScore(meters) {
  return (meters.mission || 0) + (meters.trust || 0) + (meters.supplies || 0);
}

// Ending tier from the final Mission Score (spec §3).
export const ENDINGS = {
  top: { key: 'top', title: 'A Mission That Took Root',
         text: 'Your mission stood strong for forty years — not because you preached the loudest, but because you served. Your fields fed friend and stranger in hard winters. Your forge and garden were always open. The Caddo chose you as neighbors and traders, on their own terms, and that friendship was the real harvest. When the bell finally traveled to the San Antonio River, it rang over a mission that everyone — Spain and the Tejas alike — remembered with respect.' },
  mid: { key: 'mid', title: 'The Bell Still Rings',
         text: 'It was never easy in the Piney Woods, and some of your choices cost you dearly. But the bell still rings. The mission held on through sickness, hunger, and war, and the Caddo stayed neighbors — a little wary, but neighbors still. Most East Texas missions lived exactly this way: lean, patient, and far from help. When the move to the river came, you carried real lessons with you.' },
  low: { key: 'low', title: 'The Woods Reclaim It',
         text: 'The pines lean over the fences now. The garden went to weeds, the herd is scattered, and the chapel stands quiet in the mist. The Piney Woods were hard on every mission — the supply road was months long, and friendship, once bruised, healed slowly. The friars who lasted put neighbors before walls and service before sermons. There is another chance, and a better river, waiting to the southwest.' },
};

// Early-fail ending: Trust reached zero. No friends, no mission — the real
// failure mode of the East Texas missions.
export const FAIL_ENDING = {
  key: 'failed', title: 'The Gates Stand Empty',
  text: 'Trust ran out — and when trust ran out, the mission was already over. The Caddo were the whole reason a mission could live in the Piney Woods: neighbors, traders, guides, friends. Without their friendship there was no one to serve and no way to last. The real missions lived and died by this same rule. Try again — and this time, come as a guest, not a master.',
};

export function endingFor(score) {
  if (score >= 210) return ENDINGS.top;
  if (score >= 150) return ENDINGS.mid;
  return ENDINGS.low;
}

// Trust is the strength check (spec §3): if it stands at 0 after one of the
// player's own resolved choices, the mission fails early. A chapter event may
// knock Trust TO zero — the very next right choice can still lift it back.
export const failCheck = (meters) => (meters.trust ?? 0) <= 0;

// The universal debrief: two jobs, the Caddo's choice, and the 1731 move to the
// San Antonio River — the bridge to Claim the Land (spec §3, §6).
export const DEBRIEF =
  'Here is the true story your forty years just walked through. In 1690, Fray Damián Massanet helped found San Francisco de los Tejas, the first Spanish mission in East Texas. Spain hurried to build it because a Frenchman, La Salle, had planted a colony on the Texas coast — and Spain wanted this land held. Missions had two jobs: share the Catholic faith, and hold the land for Spain. The mission’s neighbors were the Caddo — strong farming peoples with their own towns, leaders, and faith. Their word for “friends,” Tejas, became the name Texas. The first mission met terrible luck: sickness that came with the Europeans swept the Caddo villages, and by 1693 the friars closed it and marched away. But Fray Francisco Hidalgo never stopped asking Spain to go back. He even wrote to the French governor of Louisiana — and that letter worried Spain so much that in 1716 the missions returned, this time with Father Antonio Margil de Jesús. In 1719 a tiny French raid — remembered as the “Chicken War” — scared the East Texas missions empty for two years. And in 1731, three of them moved for good to the San Antonio River, where the water ran steady, a stone presidio stood close, and the supply road was shorter. There they thrived; Margil’s San José at San Antonio grew so grand it was called the Queen of the Missions. And the Caddo? They stayed in their homeland, farming and trading as they always had — friendly to the end, and true to their own faith. That was always their choice to make. So remember both halves of the lesson: missions lasted where water, roads, protection, and respect came together. That is why the next chapter of Texas history begins on the San Antonio River.';

// ===========================================================================
// THE SIX CHAPTERS, 1690–1731. Trust is the thread through all of them.
// Player-facing text at a 5th grade reading level.
// ===========================================================================

const PHASES = [
  // ---- Chapter 1 — Choosing Ground (1690) ----
  {
    title: 'Choosing Ground', date: '1690 · the Piney Woods', image: 'event_meeting.jpg',
    event: 'The year is 1690. A Frenchman named La Salle planted a colony on the Texas coast, and Spain is alarmed. So Spain has sent YOU — a Franciscan friar with Fray Damián Massanet’s company — into the East Texas Piney Woods with a wagon, a bell, and a blessing. Your orders: build San Francisco de los Tejas, the first mission in East Texas. A mission has two jobs: share the faith, and hold the land for Spain. This is Caddo country. The Caddo are farmers with great grass houses, full storehouses, and their own leaders. The Spanish call them the Tejas — their word for “friends.” Nothing you build will matter without them.',
    steps: [
      {
        kind: 'decision',
        prompt: 'Where do you build the mission?',
        choices: [
          { label: 'Near the Caddo villages and a good creek — close enough to serve, far enough to respect.',
            verdict: 'right', effects: { mission: 10, trust: 10 },
            feedback: 'Massanet built among the Tejas, whose own name meant “friends.” Water and neighbors were the whole plan. A mission is not walls — it is a place people choose to visit.' },
          { label: 'Deep in the woods, apart from everyone — quiet and safe.',
            verdict: 'partial', effects: { mission: 5, trust: -5 },
            feedback: 'Peaceful — and pointless. A mission with no neighbors serves no one. The Caddo wonder why the strangers hide from their friends.' },
          { label: 'On the Caddo’s own planted fields — it is the best soil around.',
            verdict: 'wrong', effects: { trust: -15 },
            feedback: 'Taking planted ground makes enemies of the friends you came to find. Those fields feed families. You would not give up your garden to a stranger either.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'The Caddo leaders come to meet you. What do you do first?',
        choices: [
          { label: 'Bring gifts, learn their names, and ask permission to stay.',
            verdict: 'right', effects: { trust: 15 },
            feedback: 'You sit with the caddí — the village leader — and listen more than you talk. Respect opened more doors in Texas than any sword. The friendship you plant today is the mission’s real foundation.' },
          { label: 'Preach a sermon first — that is what you came for. Talk later.',
            verdict: 'partial', effects: { trust: -5, mission: 5 },
            feedback: 'The Caddo listen politely. They have their own faith, and they came to meet a neighbor, not to be lectured. A little listening first would have gone further.' },
          { label: 'Read a royal proclamation claiming this land for Spain.',
            verdict: 'wrong', effects: { trust: -15 },
            feedback: 'You just told free people, in their own country, that a faraway king owns their home. The leaders walk away. Paper claims do not make friends — and without friends, missions fail.' },
        ],
      },
    ],
  },

  // ---- Chapter 2 — The Building Year (1690–1691) ----
  {
    title: 'The Building Year', date: '1690–1691 · San Francisco de los Tejas', image: 'event_building.jpg',
    event: 'The bell hangs from a pine frame, and the first log walls are rising. Now comes a year of hard, honest work. Everything must be built and grown from what you carried and what the woods give — the supply road from Mexico takes months each way. Caddo neighbors walk over to watch, curious. Some trade corn for iron tools. Every choice this year decides whether the mission can feed itself — and whether anyone will care that it exists.',
    steps: [
      {
        kind: 'decision',
        prompt: 'The building season is short. What comes first?',
        choices: [
          { label: 'Plant the corn and beans first. The chapel walls can rise after the fields are in.',
            verdict: 'right', effects: { supplies: 15, mission: 5 },
            feedback: 'Survival first. Crops and cattle decided which missions lived — a mission that cannot feed itself cannot serve anyone. The corn goes in on time, and winter looks smaller already.' },
          { label: 'Split every day in half — some build, some plant, everything at once.',
            verdict: 'partial', effects: { mission: 5, supplies: 5 },
            feedback: 'Fair — but the frost does not wait for half-finished fields. The harvest comes in thin, and the chapel still has no roof. Hard seasons reward one clear priority.' },
          { label: 'Build the whole mission first, walls to bell tower. The fields can wait a year.',
            verdict: 'wrong', effects: { mission: 10, supplies: -15 },
            feedback: 'A handsome mission with an empty storehouse. When winter comes, hunger walks in through the fine new gate. In the Piney Woods, food was always the first wall.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'How do you invite the Caddo to the mission?',
        choices: [
          { label: 'Open the forge, the garden, and the cattle pen — share tools, teach skills, trade fairly.',
            verdict: 'right', effects: { trust: 15, mission: 5 },
            feedback: 'This is how missions truly drew interest: iron tools, new vegetables, cattle and horses. The Caddo come for useful things and stay to talk. Service opens more doors than sermons ever did.' },
          { label: 'Wait politely inside the mission. The Caddo know where to find you.',
            verdict: 'partial', effects: { mission: 5, trust: -5 },
            feedback: 'Respectful, but distant. Friendship does not grow through a closed gate. The neighbors shrug: the strangers keep to themselves.' },
          { label: 'March into the village and order families to move to the mission.',
            verdict: 'wrong', effects: { trust: -15 },
            feedback: 'The Caddo have homes, farms, and leaders of their own. Ordering free people around makes enemies — and empties your chapel for good. Force never filled a mission with friends.' },
        ],
      },
    ],
  },

  // ---- Chapter 3 — The Sickness (1691; sensitive — honest, grieving, no blame) ----
  {
    title: 'The Sickness', date: '1691 · a hard, sad year', image: 'event_sickroom.jpg',
    eventEffects: { trust: -10 },
    event: 'A terrible fever sweeps through the Caddo villages. Families lose parents, children, elders — so many, so fast. Here is the hard truth: the sickness came with the strangers. People from Europe carried germs that no one in America’s villages had ever met, and no one in 1691 — not you, not anyone — understands why. The Caddo see their loved ones dying while the strangers stay mostly well. Their grief is turning toward you, and honestly — can you blame them? This is the darkest season the mission will ever face.',
    steps: [
      {
        kind: 'decision',
        prompt: 'The fever spreads village to village. What do you do?',
        choices: [
          { label: 'Go to the villages. Nurse the sick openly, carry water, and grieve with the families.',
            verdict: 'right', effects: { trust: 15, supplies: -5 },
            feedback: 'You cannot cure it — no one alive can. But you can sit with the dying, feed the weak, and weep with the living. The Caddo healers work beside you, doing their best, same as you. In the saddest year, showing up is everything.' },
          { label: 'Close the mission gates to protect your own people, and pray for the villages.',
            verdict: 'partial', effects: { mission: 5, trust: -10 },
            feedback: 'Safe — and cold. Fear is human, but the villages will remember who came to help and who hid behind a gate. Trust, already strained, stretches thinner.' },
          { label: 'Blame the Caddo healers — say their old ways are angering God.',
            verdict: 'wrong', effects: { trust: -15 },
            feedback: 'Never. The healers are doing their best for their own people, same as you. Blaming grieving friends for a sickness that came with the strangers is cruel — and false. Nothing kills a friendship faster.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'The caddí comes to you, grieving and angry. “This death follows your people,” he says. “Is it true?”',
        choices: [
          { label: 'Tell the truth as best you know it: the sickness does follow the strangers’ roads, and you do not know why. Share his grief, and keep helping.',
            verdict: 'right', effects: { trust: 10 },
            feedback: 'The truth is hard, and in 1691 nobody fully understands it. But honesty and shared grief keep a thread of friendship alive when nothing else can. He does not smile — but he does not send you away.' },
          { label: 'Say only that God’s ways are a mystery, and change the subject.',
            verdict: 'partial', effects: { trust: -5 },
            feedback: 'Half an answer. The caddí asked an honest question and heard a dodge. Between friends, a dodge is its own kind of answer — and not a good one.' },
          { label: 'Warn him that worse will come unless his people join the mission.',
            verdict: 'wrong', effects: { trust: -15, mission: -5 },
            feedback: 'Using grief as a threat is exactly how a mission dies. Fear is not faith, and the Caddo know the difference. Some of the friars’ worst moments looked like this — the game will not reward it, and history did not either.' },
        ],
      },
    ],
  },

  // ---- Chapter 4 — The Hunger Winter (1692) ----
  {
    title: 'The Hunger Winter', date: '1692 · the supply road is long', image: 'title_hero.jpg',
    eventEffects: { supplies: -15 },
    event: 'The next year turns dry, and the corn comes in short — for the mission and the villages alike. Now winter is here. The nearest Spanish supplies are in Mexico, months away by ox cart down one long, muddy road. Whatever anyone eats this winter is already in the Piney Woods. Cold mornings, thin soup, and a hard question knocking at the storehouse door.',
    steps: [
      {
        kind: 'decision',
        prompt: 'Hungry Caddo neighbors come to the mission. Your own stores are low. What do you do?',
        choices: [
          { label: 'Open the storehouse and share what there is — thin soup for everyone is still soup.',
            verdict: 'right', effects: { trust: 15, supplies: -5 },
            feedback: 'Service builds what sermons cannot. A mission that shares its corn in a hard winter is remembered for a generation. It costs real food — and buys real friendship.' },
          { label: 'Send riders down the long road to beg supplies from Mexico.',
            verdict: 'partial', effects: { supplies: 5 },
            feedback: 'The carts do come — months later, half-eaten by the road itself. Mexico was simply too far. Missions that leaned on the supply line alone stayed hungry. The woods had to feed the woods.' },
          { label: 'Bar the storehouse and feed the mission only. Charity can wait for spring.',
            verdict: 'wrong', effects: { trust: -15, supplies: 5 },
            feedback: 'The storehouse stays fuller — and the friendship goes empty. Word travels fast in the Piney Woods, and so does the memory of a barred door in a hungry winter.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'Spring comes. How do you make sure hunger never corners you again?',
        choices: [
          { label: 'Dig an acequia — a hand-dug water ditch from the creek — and grow the cattle herd.',
            verdict: 'right', effects: { mission: 10, supplies: 10 },
            feedback: 'Water you control beats rain you hope for. An acequia waters the fields even in dry months, and cattle are a walking storehouse. Every mission that lasted learned this lesson — remember it when you hear about the San Antonio River.' },
          { label: 'Plant more corn on the same dry field, and hope for better rain.',
            verdict: 'partial', effects: { supplies: 5 },
            feedback: 'More seed in dry dirt is still a gamble. Hope is not a harvest plan. The missions that thrived changed the water, not just the planting.' },
          { label: 'Ask Spain for soldiers to guard the storehouse.',
            verdict: 'wrong', effects: { trust: -10, mission: 5 },
            feedback: 'Hungry neighbors now meet armed guards. Presidio soldiers — fort soldiers — sometimes protected missions, and sometimes soured friendships. Guarding corn from your friends is a fine way to lose both.' },
        ],
      },
    ],
  },

  // ---- Chapter 5 — The Chicken War (1719) ----
  {
    title: 'The Chicken War', date: '1719 · France and Spain at war', image: 'event_evacuation.jpg',
    eventEffects: { mission: -10 },
    event: 'The years roll by. The mission has seen hard seasons — once it nearly emptied altogether. A stubborn friar named Francisco Hidalgo wrote letter after letter to keep East Texas alive — one even went to the FRENCH governor, and it worried Spain so much that new missions and friars, led by Father Antonio Margil de Jesús, came north in 1716. Now it is 1719, and France and Spain are at war across the sea. French soldiers from Louisiana raid a Spanish mission’s henhouse — squawking chickens, one startled friar, and panic down every forest road. They call it the Chicken War, and it sounds silly. But your mission sits on the border, and the nearest Spanish soldiers are far away.',
    steps: [
      {
        kind: 'decision',
        prompt: 'Word comes: the French are riding your way. What do you do?',
        choices: [
          { label: 'Pack the mission records, the church goods, and the herd — and walk everyone west, calm and together.',
            verdict: 'right', effects: { supplies: 15 },
            feedback: 'This is exactly what the East Texas missions did in 1719 — gathered what mattered and withdrew without a fight, all the way to San Antonio. A mission is people, records, and cattle, not walls. Walls can be rebuilt.' },
          { label: 'Bury the valuables and scatter into the woods until the French move on.',
            verdict: 'partial', effects: { mission: -5, supplies: 5 },
            feedback: 'You save some things and lose track of others — and of some of the herd. Hiding beats fighting, but a calm, organized withdrawal would have kept the mission family together.' },
          { label: 'Bar the gates and stand siege. This mission does not run.',
            verdict: 'wrong', effects: { mission: -15, trust: -5 },
            feedback: 'With what army? The presidio is small and far, and a log mission is not a fort. A siege risks every life inside — including neighbors who never asked for Spain’s war. Brave words, terrible plan.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'Two years pass in safety near San Antonio. In 1721 Spain marches you back east. What do you carry?',
        choices: [
          { label: 'Seeds, tools, cattle — and gifts and greetings for the Caddo friends you missed.',
            verdict: 'right', effects: { mission: 10, trust: 10 },
            feedback: 'The return of 1721 worked because the friendship had been kept warm. The Caddo welcome back neighbors, not strangers. Rebuilding goes twice as fast when your friends are glad to see you.' },
          { label: 'Just yourselves and your faith — travel light and rebuild from nothing.',
            verdict: 'partial', effects: { mission: 5 },
            feedback: 'Brave, but bare. Faith rebuilds hearts; tools and cattle rebuild missions. Traveling empty-handed means more hungry seasons before the fields catch up.' },
          { label: 'A bigger garrison of soldiers, so no one pushes you around again.',
            verdict: 'wrong', effects: { trust: -10 },
            feedback: 'The Caddo did not ask for more soldiers in their country. Marching back with a garrison tells your friends you trust them less — and soldier trouble had soured mission friendships before.' },
        ],
      },
    ],
  },

  // ---- Chapter 6 — The Decision (1731) ----
  {
    title: 'The Decision', date: '1731 · the San Antonio River', image: 'ending.jpg',
    event: 'You are old now, and the bell you hung in 1690 is going gray with weather, same as you. The East Texas missions still stand — and still struggle. The supply road is as long as ever. The soldiers are few. The French never quite go away. And the Caddo, kind neighbors all these years, remain sure of their own faith — they trade, they visit, they help, and they mostly do not convert. Now word comes from the south: Spain will let three East Texas missions move to the San Antonio River, where the water runs steady all year, a stone presidio stands guard, and the supply road is half as long. The choice of a lifetime is yours to counsel.',
    steps: [
      {
        kind: 'decision',
        prompt: 'What do you counsel: stay in the Piney Woods, or move to the river?',
        choices: [
          { label: 'Counsel the move. Bless the woods, thank the Tejas, and carry the bell to the river.',
            verdict: 'right', effects: { mission: 15, supplies: 10 },
            feedback: 'In 1731, three East Texas missions did exactly this — moved to the San Antonio River, where water, protection, and supply roads were better. It was not defeat. It was forty years of hard lessons, finally put to work.' },
          { label: 'Stay, and petition Spain for more of everything — corn, soldiers, friars.',
            verdict: 'partial', effects: { mission: 5, supplies: -5 },
            feedback: 'Loyal to the woods — but Spain has little more to send, and the road eats half of whatever it sends. The missions that stayed east stayed poor. Sometimes love of a place is not a plan for it.' },
          { label: 'Refuse to move — and demand the Caddo finally join the mission to save it.',
            verdict: 'wrong', effects: { trust: -15 },
            feedback: 'After forty years, the Tejas have given their answer, kindly and clearly: friends, yes; converts, mostly no. That was always their right. Demanding it now would burn the one true thing the mission built — the friendship.' },
        ],
      },
      {
        kind: 'decision',
        prompt: 'At the river, a young friar asks: “Father, East Texas never filled its chapel. Was it all a failure?” What do you tell him?',
        choices: [
          { label: '“No. We came as guests and learned. The Caddo chose friendship and trade on their own terms, and kept their faith — that was their right. And we learned what a mission needs: water, roads, neighbors, respect. That lesson built this place.”',
            verdict: 'right', effects: { trust: 10, mission: 5 },
            feedback: 'That is what the history says, too. The East Texas missions converted few Caddo — but the lessons of water, roads, and respect built the great missions of San Antonio, which stand to this day. Understanding that IS the win.' },
          { label: '“Yes. We failed, and I am sorry for the wasted years.”',
            verdict: 'partial', effects: { mission: -5 },
            feedback: 'Too harsh, Father. The friendship was real, the service was real, and San Antonio rose on everything the Piney Woods taught. Nothing honestly learned is wasted.' },
          { label: '“We failed because the Caddo were too stubborn to listen.”',
            verdict: 'wrong', effects: { trust: -15 },
            feedback: 'No. The Caddo were a strong, settled nation who welcomed trade and made their own choice about faith — as free people always could. Blaming friends for choosing their own path is how the whole lesson gets lost.' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Assemble the single class-wide role into a one-variant game. One side, no
// rival — so the Command Center reports ONE class accuracy group (spec §1).
// ---------------------------------------------------------------------------

export const VARIANTS = {
  mission: {
    name: 'San Francisco de los Tejas',
    sub: 'A Franciscan mission in the Piney Woods · 1690–1731',
    phases: PHASES,
    waypoints: [], // no map: the build-status panel tells the story instead
  },
};

export { PHASES };

export default createStepGame({
  id: 'found-a-mission',
  title: 'Found a Mission',
  meters: METERS,
  markers: MARKERS,
  startMeters: () => ({ ...START_METERS }),
  scoreMeters: missionScore,
  endingFor,
  debrief: DEBRIEF,
  variants: VARIANTS,
  failCheck,
  failEnding: FAIL_ENDING,
});

// content.test.js — sanity + historical-balance checks on the Found a Mission
// content bank (spec §1–§6). One class-wide friar, six chapters, choice-based,
// with the Trust strength check (trust 0 after a choice = early fail).
import test from 'node:test';
import assert from 'node:assert/strict';
import game, { PHASES, missionScore, endingFor, FAIL_ENDING, failCheck } from '../src/games/foundAMission.js';

const SIDE = 'mission';

const allText = () =>
  PHASES.flatMap((p) => [p.event, ...p.steps.flatMap((s) => [s.prompt, ...s.choices.map((c) => `${c.label} ${c.feedback}`)])]).join(' ');

test('one class-wide role is the single side, with no rival', () => {
  assert.deepEqual(game.sides, [SIDE]);
  assert.equal(game.hasOpponent, false, 'one friar, no rival — a single class-wide accuracy group');
  assert.equal(game.totalActions, 12);
  assert.equal(game.chapterCount, 6);
  assert.ok(game.meta.variants[SIDE], 'the mission ships as the one variant');
  assert.deepEqual(game.meta.variants[SIDE].waypoints, [], 'no map: the build-status panel replaces it');
});

test('six chapters, each with an event and two graded decisions (right/partial/wrong)', () => {
  assert.equal(PHASES.length, 6, 'chapter count');
  for (const [i, ph] of PHASES.entries()) {
    assert.ok(ph.title && ph.date && ph.event && ph.image, `chapter ${i} metadata`);
    assert.equal(ph.steps.length, 2, `chapter ${i} has 2 steps`);
    for (const [j, step] of ph.steps.entries()) {
      assert.equal(step.kind, 'decision', `chapter ${i} step ${j} is a decision (no map)`);
      assert.ok(step.prompt?.length > 5, `chapter ${i} step ${j} prompt`);
      const verdicts = step.choices.map((c) => c.verdict).sort();
      assert.deepEqual(verdicts, ['partial', 'right', 'wrong'], `chapter ${i} step ${j} verdicts`);
      for (const c of step.choices) {
        assert.ok(c.label?.length > 5 && c.feedback?.length > 10, `chapter ${i} step ${j} choice text`);
      }
    }
  }
  const steps = PHASES.flatMap((p) => p.steps);
  assert.equal(steps.length, 12, '12 graded actions');
});

test('meters start at 50/50/50 — mission, trust, supplies', () => {
  const state = game.initMatch({ soloSide: SIDE });
  assert.deepEqual(state.sides[SIDE].meters, { mission: 50, trust: 50, supplies: 50 });
});

test('the content teaches the spec’s content bank (TEKS 7.2C, 7.2B)', () => {
  const text = allText();
  assert.match(text, /Massanet/i, 'Massanet founds the mission');
  assert.match(text, /San Francisco de los Tejas/i, 'the first East Texas mission is named');
  assert.match(text, /Tejas/i, 'Tejas = friends is taught');
  assert.match(text, /La Salle/i, 'the French scare that sped Spain up');
  assert.match(text, /Hidalgo/i, 'Hidalgo’s letter and the 1716 return');
  assert.match(text, /Margil/i, 'Antonio Margil de Jesús');
  assert.match(text, /Chicken War/i, 'the 1719 Chicken War');
  assert.match(text, /acequia/i, 'the acequia (defined in plain words)');
  assert.match(text, /presidio/i, 'presidios and their friction');
  assert.match(text, /San Antonio/i, 'the bridge to the San Antonio River');
  assert.match(text, /two jobs/i, 'missions had two jobs — the outline’s framing');
  const debrief = game.report(game.initMatch({ soloSide: SIDE })).perSide[SIDE].debrief;
  assert.match(debrief, /1731/, 'debrief teaches the 1731 move');
  assert.match(debrief, /Queen of the Missions/i, 'debrief honors San José');
  assert.match(debrief, /their own faith/i, 'debrief says plainly the Caddo kept their faith');
});

test('sensitivity: honest epidemic, shared grief, no blame on the Caddo (spec §6)', () => {
  const sick = PHASES[2];
  assert.match(sick.event, /came with the strangers/i, 'headline-level honesty about the disease');
  const blame = sick.steps[0].choices.find((c) => /blame/i.test(c.label));
  assert.equal(blame.verdict, 'wrong', 'blaming the Caddo healers is always wrong');
  const text = allText();
  assert.doesNotMatch(text, /savage|primitive|heathen|corpse|gore/i, 'no slurs, no despair-porn');
});

test('force options always grade wrong (spec §6: trust is never won by force)', () => {
  const forceLabels = [/order families/i, /proclamation/i, /demand the Caddo/i, /worse will come/i, /too stubborn/i];
  const choices = PHASES.flatMap((p) => p.steps.flatMap((s) => s.choices));
  for (const pattern of forceLabels) {
    const match = choices.find((c) => pattern.test(c.label));
    assert.ok(match, `a force/blame option matching ${pattern} exists`);
    assert.equal(match.verdict, 'wrong', `${pattern} is graded wrong`);
    assert.ok((match.effects.trust ?? 0) < 0, `${pattern} costs trust`);
  }
});

// --- Playthrough helpers (drive the adapter directly, no GameManager) --------

function playRun(pick, { stopOnFail = true } = {}) {
  const state = game.initMatch({ soloSide: SIDE });
  for (let step = 0; step < game.totalActions; step++) {
    game.chapterEvent(state, SIDE);            // idempotent per chapter; safe each step
    const res = game.resolve(state, SIDE, pick(state));
    assert.ok(!res.error, `step ${step} failed: ${res.error}`);
    if (res.failed && stopOnFail) break;
  }
  return game.report(state);
}

const rightMove = (state) => game.aiMove(state, SIDE);

const moveWithVerdict = (verdict) => (state) => {
  const ss = state.sides[SIDE];
  const steps = PHASES.flatMap((p) => p.steps);
  const step = steps[ss.cursor];
  const realIdx = step.choices.findIndex((c) => c.verdict === verdict);
  return { kind: step.kind, choiceIndex: ss.shuffles[ss.cursor].indexOf(realIdx) };
};

const wrongMove = moveWithVerdict('wrong');
const partialMove = moveWithVerdict('partial');

test('all-right run: 100% accuracy and "A Mission That Took Root"', () => {
  const report = playRun(rightMove);
  const you = report.perSide[SIDE];
  assert.equal(you.accuracy, 100);
  assert.equal(you.failed, false, 'a respectful run never trips the trust check');
  assert.ok(you.score >= 210, `mission score ${you.score} should be top-tier`);
  assert.equal(you.ending.key, 'top');
  assert.ok(you.meters.trust >= 90, `trust ends high (${you.meters.trust}) — the game’s heart`);
});

test('all-wrong run: trust collapses and the mission fails early (the real failure mode)', () => {
  const report = playRun(wrongMove);
  const you = report.perSide[SIDE];
  assert.equal(you.failed, true, 'trust hit 0 → early fail');
  assert.equal(you.ending.key, FAIL_ENDING.key);
  assert.equal(you.ending.title, 'The Gates Stand Empty');
  assert.equal(you.accuracy, 0, 'forfeited steps score 0 toward the same 12-action denominator');
  assert.equal(you.meters.trust, 0);
});

test('all-partial run survives — lukewarm respect keeps a thread alive', () => {
  const report = playRun(partialMove);
  const you = report.perSide[SIDE];
  assert.equal(you.failed, false, 'partials never zero out trust');
  assert.equal(you.accuracy, 50, '12 halves = 50%');
  assert.ok(you.ending.key !== FAIL_ENDING.key);
});

test('the brink is survivable: an event may drop trust to 0, the next right choice saves it', () => {
  const state = game.initMatch({ soloSide: SIDE });
  // Chapter 1: two wrong choices (trust 50 → 20). Chapter 2: wrong on both
  // (step 1 wrong costs no trust; step 2 wrong −15 → trust 5).
  const script = [wrongMove, wrongMove, wrongMove, wrongMove];
  for (const pick of script) {
    game.chapterEvent(state, SIDE);
    const res = game.resolve(state, SIDE, pick(state));
    assert.ok(!res.error && !res.failed, 'still alive before the sickness');
  }
  // Chapter 3 event: the sickness strains trust (−10) → clamped at 0.
  const ev = game.chapterEvent(state, SIDE);
  assert.equal(ev.meters.trust, 0, 'the event knocks trust TO zero, not out');
  // The player chooses to nurse the sick (+15): the mission survives the brink.
  const res = game.resolve(state, SIDE, rightMove(state));
  assert.ok(!res.failed, 'the right choice lifts trust off zero before the check');
  assert.equal(res.meters.trust, 15);
  // But choosing wrong at the brink would have ended it — fresh state, same path.
  const state2 = game.initMatch({ soloSide: SIDE });
  for (const pick of script) {
    game.chapterEvent(state2, SIDE);
    game.resolve(state2, SIDE, pick(state2));
  }
  game.chapterEvent(state2, SIDE);
  const res2 = game.resolve(state2, SIDE, wrongMove(state2));
  assert.equal(res2.failed, true, 'a wrong choice at the brink seals the failure');
  assert.equal(res2.sideDone, true);
});

test('currentPrompt never leaks the answer key', () => {
  const state = game.initMatch({ soloSide: SIDE });
  game.chapterEvent(state, SIDE);
  const prompt = game.currentPrompt(state, SIDE);
  assert.equal(prompt.choices.length, 3);
  for (const c of prompt.choices) {
    if (typeof c === 'object') {
      assert.ok(!('verdict' in c) && !('feedback' in c) && !('effects' in c), 'no answer key on a choice');
    }
  }
});

test('mission-score tiers: root ≥ 210, bell 150–209, woods < 150; failCheck at 0 only', () => {
  assert.equal(endingFor(300).key, 'top');
  assert.equal(endingFor(210).key, 'top');
  assert.equal(endingFor(180).key, 'mid');
  assert.equal(endingFor(150).key, 'mid');
  assert.equal(endingFor(100).key, 'low');
  assert.equal(missionScore({ mission: 50, trust: 50, supplies: 50 }), 150);
  assert.equal(failCheck({ trust: 0 }), true);
  assert.equal(failCheck({ trust: 1 }), false);
});

// ResultScreen.jsx — the end of the forty years. Two stories, in order: (1) how
// the mission fared (Mission Score + ending tier, or the early trust failure),
// (2) the score that matters to your teacher — accuracy — then the debrief: the
// honest timeline, the Caddo's choice, and the 1731 bridge to San Antonio.

import { Art } from '../../services/assets.jsx';

const TIER_CLASS = { top: 'win', mid: 'mid', low: 'low', failed: 'fail' };

export default function ResultScreen({ state, onPlayAgain }) {
  const end = state.matchEnd;
  const meta = end.meta || state.match?.begin?.meta;
  const you = end.you;
  const ending = you.ending;
  const failed = !!you.failed;
  const score = you.score ?? 0;

  return (
    <div className="card result-screen">
      <div className="event-kicker">The Piney Woods · 1690–1731</div>
      <h1 className={`result-headline ${TIER_CLASS[ending.key] || 'mid'}`}>{ending.title}</h1>

      {failed ? (
        <Art name="title_hero.jpg" alt="The small log mission stands quiet and empty in the misty pine clearing" className="result-art" />
      ) : (
        <Art name="ending.jpg" alt="A stone mission rising by a green river at San Antonio, the old wooden bell hanging in the new tower" className="result-art" />
      )}

      <p className="fall-note">
        {failed ? (
          <>This game measured how well you kept the mission’s one true foundation
          — <b>trust</b> — through service and respect. It ran out. The history is
          honest about this: without the Caddo’s friendship, no East Texas mission
          could last.</>
        ) : (
          <>This game measured how you kept a mission alive where everything was
          far away — and how you treated the <b>Caddo</b>, whose friendship was the
          mission’s one true foundation. Even “losing” the woods in 1731 was the
          wise call: the lessons moved to the river and took root.</>
        )}
      </p>

      <div className="ending-block mission">
        <p>{ending.text}</p>
      </div>

      <div className="score-block" aria-label="Mission Score">
        <div className="score-head">
          <span className="score-title">⛪ Mission Score</span>
          <span className="score-num">{score}<span className="muted"> / 300</span></span>
        </div>
        <span className="score-bar-track">
          <span className={`score-bar ${TIER_CLASS[ending.key] || 'mid'}`} style={{ width: `${Math.min(100, (score / 300) * 100)}%` }} />
        </span>
        <div className="meter-final-row">
          {Object.entries(you.meters || {}).map(([k, v]) => (
            <span key={k} className="meter-final">{meta?.meters?.[k]?.name || k}: <b>{v}</b></span>
          ))}
        </div>
      </div>

      <div className="accuracy-block">
        <div className="accuracy-number">{you.accuracy}%</div>
        <div>
          <b>Your accuracy — the score your teacher sees.</b>
          <p>
            How well your calls matched what wise friars really did — service,
            respect, and honesty, never force.
            {failed && ' A mission that fails early leaves its remaining calls unanswered, and unanswered counts as zero — that is why rebuilding trust matters so much.'}
          </p>
        </div>
      </div>

      <div className="debrief">
        <h3>What really happened</h3>
        <p>{you.debrief}</p>
      </div>

      <div className="btn-col">
        <button className="btn big" onClick={onPlayAgain}>
          {failed ? 'Try again — come as a guest' : 'Found it again'}
        </button>
        <p className="replay-nudge muted">Try new choices — can you build a mission that takes root?</p>
      </div>
    </div>
  );
}

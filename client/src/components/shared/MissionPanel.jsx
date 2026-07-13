// MissionPanel.jsx — the light build-status panel that replaces a map (spec §1).
// Two halves, both display-only (the server owns all gameplay truth):
//
//   1. THE MISSION GROUNDS — a small SVG scene of the clearing. The bell frame
//      is always there; the chapel, fields, acequia, and herd appear as the
//      Mission meter grows (chapel → fields → acequia → herd). Unbuilt pieces
//      show as faint dashed "plans." Below the scene, labeled chips repeat the
//      same status in text — color/shape is never the only signal.
//
//   2. THE FORTY YEARS — the six chapters, 1690–1731, as a simple list with
//      the current chapter highlighted.

const STAGES = [
  { key: 'chapel',  name: 'Chapel',  icon: '⛪', at: 55 },
  { key: 'fields',  name: 'Fields',  icon: '🌽', at: 65 },
  { key: 'acequia', name: 'Acequia', icon: '💧', at: 75 },
  { key: 'herd',    name: 'Herd',    icon: '🐄', at: 85 },
];

// Fixed chapter design (client display only; titles mirror the adapter).
const CHAPTERS = [
  { n: 1, title: 'Choosing Ground', date: '1690' },
  { n: 2, title: 'The Building Year', date: '1690–91' },
  { n: 3, title: 'The Sickness', date: '1691' },
  { n: 4, title: 'The Hunger Winter', date: '1692' },
  { n: 5, title: 'The Chicken War', date: '1719' },
  { n: 6, title: 'The Decision', date: '1731' },
];

export default function MissionPanel({ meters, chapterIndex = 0 }) {
  const mission = meters?.mission ?? 50;
  const built = (at) => mission >= at;
  const cur = Math.max(0, Math.min(CHAPTERS.length - 1, chapterIndex));

  return (
    <div className="mission-panel">
      <div className="mission-scene-wrap">
        <div className="panel-title">The mission grounds</div>
        <svg
          className="mission-scene"
          viewBox="0 0 300 170"
          role="img"
          aria-label={`The mission grounds. Built so far: bell frame${built(55) ? ', chapel' : ''}${built(65) ? ', fields' : ''}${built(75) ? ', acequia' : ''}${built(85) ? ', cattle herd' : ''}.`}
        >
          {/* misty sky + ground */}
          <rect x="0" y="0" width="300" height="110" className="sc-sky" rx="10" />
          <rect x="0" y="105" width="300" height="65" className="sc-ground" rx="10" />

          {/* giant pines, left and right */}
          <g className="sc-pines" aria-hidden="true">
            <path d="M22 110 L34 58 L46 110 Z" /><path d="M25 88 L34 48 L43 88 Z" />
            <rect x="31" y="108" width="6" height="10" className="sc-trunk" />
            <path d="M255 110 L270 48 L285 110 Z" /><path d="M259 84 L270 38 L281 84 Z" />
            <rect x="267" y="108" width="6" height="12" className="sc-trunk" />
            <path d="M60 110 L69 74 L78 110 Z" />
            <path d="M228 110 L238 70 L248 110 Z" />
          </g>

          {/* the creek — always there; the acequia branches from it when dug */}
          <path d="M300 128 C 262 132, 246 142, 232 170" className="sc-creek" aria-hidden="true" />

          {/* bell frame — carried from Mexico in 1690; always standing */}
          <g className="sc-bell" aria-hidden="true">
            <line x1="96" y1="102" x2="96" y2="126" /><line x1="120" y1="102" x2="120" y2="126" />
            <line x1="92" y1="102" x2="124" y2="102" />
            <path d="M104 106 q4 -5 8 0 l2 8 q-6 3 -12 0 Z" className="sc-bell-body" />
          </g>

          {/* chapel — appears at Mission ≥ 55 */}
          <g className={`sc-piece ${built(55) ? 'built' : 'planned'}`} aria-hidden="true">
            <rect x="136" y="88" width="52" height="38" className="sc-chapel-wall" />
            <path d="M132 88 L162 70 L192 88 Z" className="sc-chapel-roof" />
            <line x1="162" y1="70" x2="162" y2="60" /><line x1="156" y1="64" x2="168" y2="64" />
            <rect x="156" y="106" width="12" height="20" className="sc-chapel-door" />
          </g>

          {/* corn fields — Mission ≥ 65 */}
          <g className={`sc-piece ${built(65) ? 'built' : 'planned'}`} aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M${58 + i * 13} 152 v-12 M${54 + i * 13} 146 l4 -6 l4 6`} className="sc-corn" />
            ))}
          </g>

          {/* acequia — hand-dug ditch from the creek to the fields — Mission ≥ 75 */}
          <g className={`sc-piece ${built(75) ? 'built' : 'planned'}`} aria-hidden="true">
            <path d="M238 148 C 200 156, 160 158, 132 150" className="sc-acequia" />
          </g>

          {/* the herd — Mission ≥ 85 */}
          <g className={`sc-piece ${built(85) ? 'built' : 'planned'}`} aria-hidden="true">
            {[[206, 118], [226, 112]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <ellipse cx="0" cy="0" rx="10" ry="6" className="sc-cow" />
                <circle cx="9" cy="-3" r="3.6" className="sc-cow" />
                <line x1="-6" y1="5" x2="-6" y2="10" /><line x1="5" y1="5" x2="5" y2="10" />
              </g>
            ))}
          </g>
        </svg>

        <div className="build-chips" role="list" aria-label="Building progress">
          {STAGES.map((s) => {
            const done = built(s.at);
            return (
              <div key={s.key} role="listitem" className={`build-chip ${done ? 'done' : ''}`}>
                <span aria-hidden="true">{s.icon}</span> {s.name}
                <b className="build-state">{done ? '✓ built' : 'not yet'}</b>
              </div>
            );
          })}
        </div>
        <p className="build-hint">The grounds grow as your <b>Mission</b> meter grows.</p>
      </div>

      <div className="chapter-listing">
        <div className="panel-title">The forty years</div>
        <ol className="chapter-list">
          {CHAPTERS.map((c, i) => {
            const state = i < cur ? 'past' : i === cur ? 'current' : 'future';
            return (
              <li key={c.n} className={`chapter-item ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="chapter-dot" aria-hidden="true">{i < cur ? '✓' : c.n}</span>
                <span className="chapter-name">{c.title}</span>
                <span className="chapter-date">{c.date}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

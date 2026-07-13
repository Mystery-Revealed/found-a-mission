// Datapad.jsx — the student game. A small state machine over socket pushes:
// title → how to play → join → (approval) → briefing → match (6 chapters) → result.
// Everyone plays the SAME Franciscan friar — there is no "pick" and no rival, so
// the class is one accuracy group. The server owns all truth; this component only
// renders what it's told.

import { useEffect, useReducer, useRef, useState } from 'react';
import { getSocket, emitAck, errorText } from '../../services/socket.js';
import { Art } from '../../services/assets.jsx';
import MatchView from './MatchView.jsx';
import ResultScreen from './ResultScreen.jsx';

// The one class-wide side. It matches the server's single variant key.
const SIDE = 'mission';

const initialState = {
  screen: 'title', // title | how | join | waiting_approval | briefing | match | result | ended
  joinCode: '',
  name: '',
  studentId: null,
  error: '',
  endedMessage: '',
  match: null,
  matchEnd: null,
};

function freshMatch(begin) {
  return {
    begin,
    map: begin.map,
    meters: begin.meters,
    eventCard: null,
    turn: null,
    feedback: null,
  };
}

// Merge live payloads (chapter:event, turn:begin, turn:resolution) into the match.
function mergeLive(match, payload) {
  const next = { ...match };
  if (payload.map) next.map = payload.map;
  if (payload.meters) next.meters = payload.meters;
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ui':
      return { ...state, ...action.patch };
    case 'joined':
      return {
        ...state,
        studentId: action.studentId,
        error: '',
        matchEnd: null,
        match: null,
        screen: action.approved ? 'briefing' : 'waiting_approval',
      };
    case 'approved':
      return { ...state, screen: state.screen === 'waiting_approval' ? 'briefing' : state.screen };
    case 'match:begin':
      return { ...state, screen: 'match', matchEnd: null, match: freshMatch(action.payload) };
    case 'chapter:event': {
      if (!state.match) return state;
      const match = mergeLive(state.match, action.payload);
      return { ...state, match: { ...match, eventCard: action.payload } };
    }
    case 'turn:begin': {
      if (!state.match) return state;
      const match = mergeLive(state.match, action.payload);
      return { ...state, match: { ...match, turn: action.payload } };
    }
    case 'turn:resolution': {
      if (!state.match) return state;
      const match = mergeLive(state.match, action.payload);
      return { ...state, match: { ...match, feedback: action.payload } };
    }
    case 'match:end': {
      // Hold the result until pending feedback is dismissed (chronological order).
      const showNow = !state.match?.feedback;
      return { ...state, matchEnd: action.payload, screen: showNow ? 'result' : state.screen };
    }
    case 'dismiss-feedback': {
      if (!state.match) return state;
      if (state.matchEnd) return { ...state, screen: 'result', match: { ...state.match, feedback: null } };
      return { ...state, match: { ...state.match, feedback: null } };
    }
    case 'dismiss-event':
      return state.match ? { ...state, match: { ...state.match, eventCard: null } } : state;
    case 'sync': {
      const s = action.sync;
      if (s.screen === 'waiting_approval') return { ...state, screen: 'waiting_approval' };
      if (s.screen === 'lobby') return { ...state, screen: 'briefing' };
      if (s.screen === 'result') return { ...state, screen: 'result', matchEnd: s.matchEnd };
      if (s.screen === 'match') {
        const match = freshMatch(s.matchBegin);
        return {
          ...state,
          screen: 'match',
          matchEnd: null,
          match: { ...match, eventCard: s.chapterEvent, turn: s.turn },
        };
      }
      return state;
    }
    case 'removed':
      return { ...initialState, screen: 'join', joinCode: state.joinCode, name: '', error: 'Your teacher removed you from the session. You can join again.' };
    case 'ended':
      return { ...initialState, screen: 'ended', endedMessage: 'Your teacher ended this session. Go in peace — the bell will ring again.' };
    case 'replay':
      // Re-join for another run (a fresh match); the server issues a new record.
      return { ...state, matchEnd: null, match: null, error: '', screen: 'briefing' };
    default:
      return state;
  }
}

export default function Datapad() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();
    const on = (event, type) => {
      const fn = (payload) => dispatch({ type, payload });
      socket.on(event, fn);
      return [event, fn];
    };
    const subs = [
      on('match:begin', 'match:begin'),
      on('chapter:event', 'chapter:event'),
      on('turn:begin', 'turn:begin'),
      on('turn:resolution', 'turn:resolution'),
      on('match:end', 'match:end'),
    ];
    const approved = () => dispatch({ type: 'approved' });
    const removed = () => dispatch({ type: 'removed' });
    const ended = () => dispatch({ type: 'ended' });
    socket.on('join:approved', approved);
    socket.on('student:removed', removed);
    socket.on('session:ended', ended);

    // School wifi blip: the socket reconnects → re-attach and re-sync the screen.
    const onReconnect = async () => {
      const s = stateRef.current;
      if (!s.studentId || !s.joinCode) return;
      const res = await emitAck('student:rejoin', { joinCode: s.joinCode, studentId: s.studentId });
      if (res.ok) dispatch({ type: 'sync', sync: res.sync });
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      for (const [event, fn] of subs) socket.off(event, fn);
      socket.off('join:approved', approved);
      socket.off('student:removed', removed);
      socket.off('session:ended', ended);
      socket.io.off('reconnect', onReconnect);
    };
  }, []);

  // The one join call — mode solo, the single class-wide side. Join and replay.
  async function doJoin(joinCode, name) {
    const res = await emitAck('student:join', {
      joinCode: (joinCode || '').trim(), nickname: (name || '').trim(), mode: 'solo', nation: SIDE,
    });
    if (!res.ok) {
      dispatch({ type: 'ui', patch: { error: errorText(res.error), screen: 'join' } });
      return false;
    }
    dispatch({ type: 'joined', studentId: res.studentId, approved: res.approved });
    return true;
  }

  function playAgain() {
    const s = stateRef.current;
    dispatch({ type: 'replay' });
    doJoin(s.joinCode, s.name);
  }

  const { screen } = state;
  return (
    <div className="app student-app">
      {screen === 'title' && <TitleScreen onStart={() => dispatch({ type: 'ui', patch: { screen: 'join' } })} onHow={() => dispatch({ type: 'ui', patch: { screen: 'how' } })} />}
      {screen === 'how' && <HowToPlay onBack={() => dispatch({ type: 'ui', patch: { screen: 'title' } })} />}
      {screen === 'join' && <JoinForm state={state} dispatch={dispatch} onJoin={doJoin} />}
      {screen === 'waiting_approval' && (
        <WaitCard title="Hold tight!" text="Your teacher is checking names. Your forty years begin in a moment." />
      )}
      {screen === 'briefing' && (
        <WaitCard title="The wagon is loaded." text="A bell, some tools, seed corn, and a blessing. The Piney Woods are close now — your first choices are being drawn up. Stand ready." />
      )}
      {screen === 'match' && state.match && <MatchView state={state} dispatch={dispatch} />}
      {screen === 'result' && state.matchEnd && <ResultScreen state={state} onPlayAgain={playAgain} />}
      {screen === 'ended' && (
        <WaitCard title="Session ended" text={state.endedMessage}>
          <button className="btn" onClick={() => dispatch({ type: 'ui', patch: { ...initialState, screen: 'title' } })}>
            Back to the title screen
          </button>
        </WaitCard>
      )}
      <footer className="app-footer">Made for 7th Grade Texas History · TEKS 7.2C, 7.2B, 7.9A</footer>
    </div>
  );
}

/* ---------------- small screens ---------------- */

function TitleScreen({ onStart, onHow }) {
  return (
    <div className="card title-screen">
      <Art name="title_hero.jpg" alt="A small log mission with a wooden bell frame in a clearing among giant pines, morning mist" className="hero-art" />
      <h1 className="game-title">Found a Mission</h1>
      <p className="tagline">Build a mission in the Piney Woods — and keep it alive.</p>
      <p className="title-blurb">
        The year is 1690. You are a <b>Franciscan friar</b>, sent with a wagon, a
        bell, and a blessing to build <b>San Francisco de los Tejas</b> — the first
        Spanish mission in East Texas. Your neighbors are the <b>Caddo</b>, a strong
        farming nation the Spanish call the <b>Tejas</b>: “friends.” A mission has
        two jobs — share the faith and hold the land for Spain — but neither job
        works without <b>trust</b>. Serve well. If trust ever runs out, so does
        the mission.
      </p>
      <div className="btn-col">
        <button className="btn big" onClick={onStart}>Join your class</button>
        <button className="btn secondary" onClick={onHow}>How to play</button>
      </div>
    </div>
  );
}

function HowToPlay({ onBack }) {
  return (
    <div className="card how-screen">
      <h2>How to play</h2>
      <ol className="how-list">
        <li><b>Join with your class code</b> and take up the bell.</li>
        <li><b>Live 6 chapters</b>, from 1690 to 1731. Each chapter you make <b>two calls</b> — pick 1 of 3 answers to a hard question.</li>
      </ol>
      <div className="how-grid">
        <div className="how-card"><span className="how-icon">🤝</span><b>Trust is the heart</b><p>Friendship with the Caddo is won by service and respect — never by force. If Trust hits zero, the mission fails.</p></div>
        <div className="how-card"><span className="how-icon">⛪</span><b>Watch it grow</b><p>Good choices raise your mission from a bell in a clearing to a chapel, fields, an acequia, and a herd.</p></div>
      </div>
      <h3>Your three meters</h3>
      <ul className="how-list">
        <li>⛪ <b>Mission</b> — your buildings, fields, and herd.</li>
        <li>🤝 <b>Trust</b> — friendship with the Caddo. <b>If it reaches zero, the mission fails.</b></li>
        <li>📦 <b>Supplies</b> — corn, tools, and cattle. Mexico is months away, so you live on what you grow.</li>
      </ul>
      <div className="note">
        <b>Live the story, and learn the history.</b> Your <b>Mission Score</b> is
        your three meters added up. But the score your teacher sees is your
        <b> accuracy</b> — how well your calls match what wise friars really did.
        Spoiler from history: even a well-run East Texas mission moved to the San
        Antonio River in the end. Making that call wisely counts <i>for</i> you,
        not against you.
      </div>
      <h3>Words to know</h3>
      <ul className="how-list">
        <li><b>Mission</b> — a settlement built to share the Spanish faith and hold the land.</li>
        <li><b>Friar</b> — a churchman (like Father Massanet) who serves at a mission. That’s you.</li>
        <li><b>Caddo</b> — the settled farming nation of East Texas. Their word <b>Tejas</b>, “friends,” named Texas.</li>
        <li><b>Presidio</b> — a Spanish fort with soldiers, built to protect missions.</li>
        <li><b>Acequia</b> — a hand-dug ditch that carries creek water to the fields.</li>
        <li><b>Caddí</b> — a Caddo village leader.</li>
      </ul>
      <button className="btn" onClick={onBack}>Back</button>
    </div>
  );
}

function JoinForm({ state, dispatch, onJoin }) {
  const [busy, setBusy] = useState(false);
  const set = (patch) => dispatch({ type: 'ui', patch });
  const ready = state.joinCode.length === 6 && state.name.trim().length >= 2;

  async function join() {
    if (!ready || busy) return;
    setBusy(true);
    const ok = await onJoin(state.joinCode, state.name);
    if (!ok) setBusy(false);
  }

  return (
    <div className="card join-screen">
      <h2>Join your class</h2>
      <label htmlFor="join-code">Class code</label>
      <input
        id="join-code" inputMode="numeric" autoComplete="off" maxLength={6}
        placeholder="6-digit code" value={state.joinCode}
        onChange={(e) => set({ joinCode: e.target.value.replace(/\D/g, '') })}
      />
      <label htmlFor="join-name">Your first name</label>
      <input
        id="join-name" maxLength={20} placeholder="e.g. Ana R." value={state.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <p className="muted">Everyone plays the same friar. Build wisely.</p>

      <p className="err" role="alert">{state.error}</p>
      <div className="btn-col">
        <button className="btn big" disabled={!ready || busy} onClick={join}>
          {busy ? 'Taking up the bell…' : 'Take up the bell →'}
        </button>
        <button className="btn ghost" onClick={() => set({ screen: 'title', error: '' })}>Back</button>
      </div>
    </div>
  );
}

function WaitCard({ title, text, children }) {
  return (
    <div className="card wait-card">
      <div className="pulse-dot" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}

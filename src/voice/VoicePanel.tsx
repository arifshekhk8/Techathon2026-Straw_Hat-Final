/**
 * Phase 3 — Voice control (required, deterministic).
 *
 * Maps spoken/typed keyword commands onto the same motion pipeline every other
 * input uses. Deliberately self-contained: no LLM, no API key, no network. The
 * rulebook is explicit that "the optional agentic extension (Phase 3B) does not
 * replace the required deterministic voice control (Phase 3) — baselines must
 * still work independently and will be judged as such", so this panel never
 * defers to the agent. Phase 3B lives beside it in AgentPanel.
 */
import { useEffect, useRef, useState } from 'react';
import { parse, isError, JOINT_LABELS } from './grammar';
import { dispatch, type MotionCommand } from './pipeline';
import { speak, cancelSpeech } from './tts';
import { useSpeechRecognition } from './useSpeechRecognition';

/** Short spoken/visible confirmation for a command the deterministic grammar ran. */
function confirm(cmd: MotionCommand): string {
  switch (cmd.type) {
    case 'stop': return 'Stopping.';
    case 'home': return 'Going home.';
    case 'rotateJoint': {
      const label = JOINT_LABELS[cmd.joint] ?? `joint ${cmd.joint}`;
      const deg = Math.round(((cmd.toRad ?? cmd.deltaRad ?? 0) * 180) / Math.PI);
      return cmd.toRad !== undefined
        ? `Rotating ${label} to ${deg} degrees.`
        : `Rotating ${label} by ${deg} degrees.`;
    }
    case 'jog': {
      const [x, y, z] = cmd.delta;
      const parts: string[] = [];
      if (z) parts.push(z > 0 ? 'up' : 'down');
      if (y) parts.push(y > 0 ? 'left' : 'right');
      if (x) parts.push(x > 0 ? 'forward' : 'back');
      const cm = Math.round(Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) * 100);
      return `Moving ${parts.join(' and ') || 'tip'} ${cm} centimeters.`;
    }
    case 'moveTo': return `Moving to ${cmd.xyz.map((v) => v.toFixed(2)).join(', ')}.`;
    case 'touchKey': return `Touching key ${cmd.key}.`;
    case 'typePin': return `Entering the PIN.`;
    default: return 'Done.';
  }
}

type Feedback = { kind: 'ok' | 'reject' | 'error'; text: string } | null;

const EXAMPLES = ['home', 'rotate base 30 degrees', 'move up 2 cm', 'touch key 5', 'stop'];

export default function VoicePanel() {
  const [typed, setTyped] = useState('');
  const [heard, setHeard] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const holding = useRef(false);

  useEffect(() => () => cancelSpeech(), []);

  /** The one path both the mic and the typed box run through. Grammar only. */
  const run = (utterance: string) => {
    setHeard(utterance);
    const result = parse(utterance);

    if (isError(result)) {
      setFeedback({ kind: 'error', text: result.error });
      speak(result.error);
      return;
    }
    const outcome = dispatch(result);
    if (outcome.ok) {
      const msg = confirm(result);
      setFeedback({ kind: 'ok', text: msg });
      speak(msg);
    } else {
      const msg = `Can't do that: ${outcome.reason}.`;
      setFeedback({ kind: 'reject', text: msg });
      speak(msg);
    }
  };

  const rec = useSpeechRecognition(run);

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed.trim()) return;
    run(typed);
    setTyped('');
  };

  // Hold-to-talk (pointer works for mouse + touch).
  const pttDown = () => {
    holding.current = true;
    cancelSpeech();
    rec.start();
  };
  const pttUp = () => {
    if (!holding.current) return;
    holding.current = false;
    rec.stop();
  };

  const fbColor =
    feedback?.kind === 'ok'
      ? 'text-emerald-300'
      : feedback?.kind === 'reject'
        ? 'text-amber-300'
        : 'text-rose-300';

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Voice control
        </h2>
        <span
          title="Deterministic keyword grammar — runs offline, no API key"
          className="rounded border border-emerald-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-400"
        >
          Phase 3 · offline
        </span>
      </div>

      {rec.supported ? (
        <button
          type="button"
          onPointerDown={pttDown}
          onPointerUp={pttUp}
          onPointerLeave={pttUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`mb-2 w-full select-none rounded-md px-3 py-2 text-sm font-medium transition ${
            rec.listening ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
          }`}
        >
          {rec.listening ? '● Listening — release to send' : '🎤 Hold to talk'}
        </button>
      ) : (
        <p className="mb-2 text-[11px] text-slate-500">
          Speech recognition unavailable in this browser — use the box below.
        </p>
      )}

      <form onSubmit={submitTyped} className="mb-2 flex gap-2">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder='e.g. "rotate base 30 degrees"'
          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-600"
        >
          Send
        </button>
      </form>

      {rec.interim && <p className="mb-1 text-xs italic text-slate-400">{rec.interim}…</p>}
      {rec.error && <p className="mb-1 text-xs text-rose-400">{rec.error}</p>}

      {heard && (
        <p className="mb-1 text-xs text-slate-500">
          heard: <span className="text-slate-300">"{heard}"</span>
        </p>
      )}

      {feedback ? (
        <p className={`text-xs ${fbColor}`}>
          <span className="mr-1 rounded bg-slate-800 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
            grammar
          </span>
          {feedback.text}
          {feedback.kind === 'error' && (
            <span className="mt-1 block text-slate-500">
              Multi-step or free-form phrasing? Use the agentic panel below.
            </span>
          )}
        </p>
      ) : (
        <p className="text-[11px] text-slate-600">
          Try: {EXAMPLES.map((e) => `"${e}"`).join(' · ')}
        </p>
      )}
    </section>
  );
}

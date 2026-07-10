import { useCallback, useEffect, useRef, useState } from 'react';
import { parse, isError, JOINT_LABELS } from './grammar';
import { dispatch, type MotionCommand } from './pipeline';
import { speak, cancelSpeech } from './tts';
import { useSpeechRecognition } from './useSpeechRecognition';
import { runAgent, type CommandStatus } from '../agent/agentLoop';
import { hasApiKey, setApiKey, clearApiKey, PRIMARY_MODEL } from '../agent/groqClient';

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

/**
 * Natural-language phrases the fast grammar can't fully capture — multi-step
 * ("… then …", "twice") or free-form — get routed to the LLM agent instead of
 * the grammar's greedy first-command match.
 */
function looksAgenty(text: string): boolean {
  return /\b(then|and then|after that|afterwards|followed by|next|twice|thrice|three times|four times)\b/i.test(text)
    || (text.match(/,/g)?.length ?? 0) >= 1;
}

type FbKind = 'ok' | 'reject' | 'error' | 'clarify' | 'agent';
type Feedback = { kind: FbKind; text: string; via?: 'grammar' | 'AI' } | null;

const BADGE: Record<CommandStatus['state'], string> = {
  pending: 'border-slate-700 text-slate-500',
  running: 'border-sky-500 text-sky-300 animate-pulse',
  ok: 'border-emerald-600 text-emerald-300',
  rejected: 'border-rose-600 text-rose-300',
};

/**
 * Unified voice control: one mic + one box. Simple commands run instantly on the
 * deterministic grammar (offline, no key); natural / multi-step phrases fall back
 * to the LLM agent. Both paths funnel through the same validate() gate.
 */
export default function VoicePanel() {
  const [typed, setTyped] = useState('');
  const [heard, setHeard] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [statuses, setStatuses] = useState<CommandStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const holding = useRef(false);

  // Groq key management (only needed for the AI fallback).
  const [keyed, setKeyed] = useState(hasApiKey());
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => () => cancelSpeech(), []);

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setApiKey(keyInput);
    setKeyInput('');
    setKeyed(true);
    setShowKey(false);
  };
  const forgetKey = () => {
    clearApiKey();
    setKeyed(false);
  };

  /** Run the natural-language phrase through the LLM agent. */
  const runViaAgent = useCallback(async (utterance: string) => {
    setBusy(true);
    setStatuses([]);
    try {
      const res = await runAgent(utterance, {
        onPlan: (p) =>
          setFeedback({ kind: p.needs_clarification ? 'clarify' : 'agent', text: p.speech, via: 'AI' }),
        onStatus: setStatuses,
      });
      const kind: FbKind = res.ok ? 'ok' : res.clarify ? 'clarify' : 'reject';
      setFeedback({ kind, text: res.speech, via: 'AI' });
      speak(res.speech);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Agent failed.';
      setFeedback({ kind: 'error', text: msg, via: 'AI' });
    } finally {
      setBusy(false);
    }
  }, []);

  // The single path both mic and typed box run through.
  const run = useCallback(
    (utterance: string) => {
      setHeard(utterance);
      setStatuses([]);

      // Prefer the AI for multi-step / free-form phrasing when a key is available.
      if (!(keyed && looksAgenty(utterance))) {
        const result = parse(utterance);
        if (!isError(result)) {
          const outcome = dispatch(result);
          if (outcome.ok) {
            const msg = confirm(result);
            setFeedback({ kind: 'ok', text: msg, via: 'grammar' });
            speak(msg);
          } else {
            const msg = `Can't do that: ${outcome.reason}.`;
            setFeedback({ kind: 'reject', text: msg, via: 'grammar' });
            speak(msg);
          }
          return;
        }
        // Grammar couldn't parse it — hand off to the AI if we have a key.
        if (!keyed) {
          setFeedback({ kind: 'error', text: result.error, via: 'grammar' });
          speak(result.error);
          return;
        }
      }
      void runViaAgent(utterance);
    },
    [keyed, runViaAgent],
  );

  const rec = useSpeechRecognition(run);

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed.trim() || busy) return;
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
        : feedback?.kind === 'clarify'
          ? 'text-sky-300'
          : feedback?.kind === 'agent'
            ? 'text-indigo-300'
            : 'text-rose-300';

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Voice control
        </h2>
        <button
          type="button"
          onClick={() => setShowKey((v) => !v)}
          title="Groq API key — enables the AI fallback"
          className="rounded px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          ⚙ {keyed ? 'AI on' : 'AI off'}
        </button>
      </div>

      {showKey && (
        <div className="mb-2 rounded-md border border-slate-800 bg-slate-950 p-2">
          <p className="mb-1 text-[11px] text-slate-500">
            Groq API key — enables natural-language & multi-step commands. Stored only in this
            browser; simple commands work without it.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="gsk_…"
              className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={saveKey}
              className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-600"
            >
              Save
            </button>
            {keyed && (
              <button
                type="button"
                onClick={forgetKey}
                className="rounded-md bg-rose-700/70 px-2 py-1.5 text-sm text-white hover:bg-rose-600"
              >
                Forget
              </button>
            )}
          </div>
          <p className="mt-1 text-[10px] text-slate-600">Model: {PRIMARY_MODEL}</p>
        </div>
      )}

      {rec.supported ? (
        <button
          type="button"
          onPointerDown={pttDown}
          onPointerUp={pttUp}
          onPointerLeave={pttUp}
          onContextMenu={(e) => e.preventDefault()}
          disabled={busy}
          className={`mb-2 w-full select-none rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
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
          disabled={busy}
          placeholder={keyed ? 'e.g. "tap key 5 twice then lift 2 cm"' : 'e.g. "rotate base 30 degrees"'}
          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-600 disabled:opacity-50"
        >
          {busy ? '…' : 'Send'}
        </button>
      </form>

      {rec.interim && <p className="mb-1 text-xs italic text-slate-400">{rec.interim}…</p>}
      {rec.error && <p className="mb-1 text-xs text-rose-400">{rec.error}</p>}

      {heard && (
        <p className="mb-1 text-xs text-slate-500">
          heard: <span className="text-slate-300">"{heard}"</span>
        </p>
      )}

      {feedback && (
        <p className={`text-xs ${fbColor}`}>
          {feedback.via && (
            <span className="mr-1 rounded bg-slate-800 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {feedback.via}
            </span>
          )}
          {feedback.text}
        </p>
      )}

      {statuses.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1">
          {statuses.map((s, i) => (
            <li
              key={i}
              className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${BADGE[s.state]}`}
            >
              <span>{s.label}</span>
              <span className="ml-2 shrink-0 font-mono">
                {s.state === 'ok'
                  ? '✓'
                  : s.state === 'rejected'
                    ? `✗ ${s.reason ?? ''}`
                    : s.state === 'running'
                      ? '…'
                      : '·'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

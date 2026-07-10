/**
 * Phase 3B — Agentic voice control (optional extension, separately scored).
 *
 * Routes free-form / multi-step natural language through an LLM reasoning layer
 * that emits the SAME structured MotionCommands the deterministic grammar does.
 * Every command it produces is dry-run through the identical `validate()` gate
 * before anything moves (see agentLoop.ts) — an out-of-bounds plan is refused or
 * re-prompted, never executed blindly.
 *
 * Kept deliberately separate from Phase 3: the required deterministic baseline
 * must work on its own, with no key and no network. This panel is additive.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { speak, cancelSpeech } from './tts';
import { useSpeechRecognition } from './useSpeechRecognition';
import { runAgent, type CommandStatus } from '../agent/agentLoop';
import { hasApiKey, setApiKey, clearApiKey, PRIMARY_MODEL } from '../agent/groqClient';

type FbKind = 'ok' | 'reject' | 'error' | 'clarify' | 'agent';
type Feedback = { kind: FbKind; text: string } | null;

const BADGE: Record<CommandStatus['state'], string> = {
  pending: 'border-slate-700 text-slate-500',
  running: 'border-sky-500 text-sky-300 animate-pulse',
  ok: 'border-emerald-600 text-emerald-300',
  rejected: 'border-rose-600 text-rose-300',
};

export default function AgentPanel() {
  const [typed, setTyped] = useState('');
  const [heard, setHeard] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [statuses, setStatuses] = useState<CommandStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const holding = useRef(false);

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

  /** Plan → gate → execute. The agent never touches the arm directly. */
  const run = useCallback(async (utterance: string) => {
    setHeard(utterance);
    setStatuses([]);
    setBusy(true);
    try {
      const res = await runAgent(utterance, {
        onPlan: (p) =>
          setFeedback({ kind: p.needs_clarification ? 'clarify' : 'agent', text: p.speech }),
        onStatus: setStatuses,
      });
      const kind: FbKind = res.ok ? 'ok' : res.clarify ? 'clarify' : 'reject';
      setFeedback({ kind, text: res.speech });
      speak(res.speech);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Agent failed.';
      setFeedback({ kind: 'error', text: msg });
    } finally {
      setBusy(false);
    }
  }, []);

  const rec = useSpeechRecognition((t) => void run(t));

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed.trim() || busy || !keyed) return;
    void run(typed);
    setTyped('');
  };

  const pttDown = () => {
    if (!keyed) return;
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
    <section className="rounded-lg border border-indigo-900/60 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Agentic voice control
        </h2>
        <div className="flex items-center gap-1">
          <span
            title="Optional extension — an LLM reasoning layer behind the same safety gate"
            className="rounded border border-indigo-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-indigo-400"
          >
            Phase 3B
          </span>
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            title="Groq API key — required for this panel only"
            className="rounded px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            ⚙ {keyed ? 'AI on' : 'AI off'}
          </button>
        </div>
      </div>

      {showKey && (
        <div className="mb-2 rounded-md border border-slate-800 bg-slate-950 p-2">
          <p className="mb-1 text-[11px] text-slate-500">
            Groq API key — powers this panel only. Stored in this browser. Phase 3 voice control
            keeps working without it.
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

      {!keyed && (
        <p className="mb-2 rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-500">
          Add a Groq key (⚙) to enable free-form, multi-step commands.
        </p>
      )}

      {rec.supported ? (
        <button
          type="button"
          onPointerDown={pttDown}
          onPointerUp={pttUp}
          onPointerLeave={pttUp}
          onContextMenu={(e) => e.preventDefault()}
          disabled={busy || !keyed}
          className={`mb-2 w-full select-none rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-40 ${
            rec.listening ? 'bg-rose-600 text-white' : 'bg-indigo-800 text-slate-100 hover:bg-indigo-700'
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
          disabled={busy || !keyed}
          placeholder='e.g. "tap key 5 twice then lift 2 cm"'
          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={busy || !keyed}
          className="rounded-md bg-indigo-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-indigo-700 disabled:opacity-40"
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
          <span className="mr-1 rounded bg-slate-800 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
            AI
          </span>
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

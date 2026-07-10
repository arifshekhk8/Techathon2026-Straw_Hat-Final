import { useState } from 'react';
import { useArmStore } from '../state/store';
import { pinRunner } from '../state/pinRunner';
import { isValidPin, parsePin } from '../core/pin';

const PHASE_LABEL: Record<string, string> = {
  transit: 'moving to key',
  settle: 'aligning',
  descend: 'descending',
  dwell: 'touching',
  retract: 'lifting',
  done: 'complete',
  idle: 'idle',
};

/** Autonomous PIN entry pad: build a PIN with the keypad (or type it), run it,
 *  watch the arm tap each key with a live per-key ±5 mm badge. */
export default function PinPad() {
  const [pin, setPin] = useState(''); // always normalised to 1–6 digits only
  const pp = useArmStore((s) => s.pinProgress);
  const running = pp.running;

  const typed = parsePin(pin);
  const matchesRun = pp.pin.length === typed.length && pp.pin.every((d, i) => d === typed[i]);
  const committed = running || (pp.results.length > 0 && matchesRun);
  const shown = committed ? pp.pin : typed;

  const append = (d: number) => setPin((p) => (p.length >= 10 ? p : p + d));
  const normalize = (s: string) => setPin(parsePin(s).slice(0, 10).join(''));

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Autonomous PIN
        </h2>
        <span className="font-mono text-[10px] text-slate-500">
          {running ? `${PHASE_LABEL[pp.phase] ?? pp.phase} · key ${pp.pin[pp.index]}` : 'tip ≤ 5 mm = pass'}
        </span>
      </div>

      <input
        aria-label="PIN"
        inputMode="numeric"
        className="mb-2 w-full rounded bg-slate-950 px-2 py-1.5 text-center font-mono text-lg tracking-[0.4em] text-sky-200 outline-none placeholder:text-sm placeholder:tracking-normal focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
        value={pin}
        disabled={running}
        onChange={(e) => normalize(e.target.value)}
        placeholder="tap keys or type a PIN (1–6)"
      />

      <div className="mb-2 grid grid-cols-6 gap-1">
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            disabled={running}
            className="rounded bg-slate-800 py-2 font-mono text-base text-slate-100 hover:bg-sky-700 active:bg-sky-600 disabled:opacity-40"
            onClick={() => append(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mb-2 flex gap-2">
        {running ? (
          <button
            className="flex-1 rounded bg-rose-600 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
            onClick={() => pinRunner.abort()}
          >
            Abort (Esc)
          </button>
        ) : (
          <button
            className="flex-1 rounded bg-emerald-600 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!isValidPin(pin)}
            onClick={() => pinRunner.start(pin)}
          >
            {isValidPin(pin) ? `Run PIN · ${typed.length} keys` : 'Run PIN'}
          </button>
        )}
        <button
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          disabled={running || pin.length === 0}
          onClick={() => setPin((p) => p.slice(0, -1))}
          title="Backspace"
        >
          ⌫
        </button>
        <button
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          disabled={running || pin.length === 0}
          onClick={() => setPin('')}
        >
          Clear
        </button>
      </div>

      {shown.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {shown.map((d, i) => {
            const res = committed && i < pp.results.length ? pp.results[i] : undefined;
            const active = running && committed && i === pp.index;
            const cls = res
              ? res.ok
                ? 'bg-emerald-600/25 border-emerald-500 text-emerald-200'
                : 'bg-rose-700/30 border-rose-500 text-rose-200'
              : active
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-slate-800 border-slate-700 text-slate-400';
            return (
              <div key={i} className={`flex min-w-[2.6rem] flex-col items-center rounded border px-1.5 py-1 ${cls}`}>
                <span className="font-mono text-sm leading-none">{d}</span>
                <span className="mt-0.5 font-mono text-[9px] leading-none">
                  {res ? `${res.mm === Infinity ? '∞' : res.mm.toFixed(1)}mm` : active ? '…' : '·'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-slate-500">Build a PIN with the keypad, then Run — the arm taps each key and grades itself within ±5 mm.</p>
      )}
    </section>
  );
}

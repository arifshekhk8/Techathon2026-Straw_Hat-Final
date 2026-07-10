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

/** Autonomous PIN entry pad: type/tap a PIN, run it, watch per-key ±5 mm badges. */
export default function PinPad() {
  const [pin, setPin] = useState('1 5 3 2 4 6');
  const pp = useArmStore((s) => s.pinProgress);
  const running = pp.running;

  const typed = parsePin(pin);
  const matchesRun = pp.pin.length === typed.length && pp.pin.every((d, i) => d === typed[i]);
  const committed = running || (pp.results.length > 0 && matchesRun);
  const shown = committed ? pp.pin : typed;

  const append = (d: number) => setPin((p) => (parsePin(p).length >= 10 ? p : p + d));

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Autonomous PIN <span className="text-amber-400">· 20%</span>
        </h2>
        <span className="font-mono text-[10px] text-slate-500">
          {running ? `${PHASE_LABEL[pp.phase] ?? pp.phase} · key ${pp.pin[pp.index]}` : 'tip ≤ 5 mm = pass'}
        </span>
      </div>

      <input
        aria-label="PIN"
        className="mb-2 w-full rounded bg-slate-950 px-2 py-1.5 text-center font-mono text-lg tracking-[0.3em] text-sky-200 outline-none focus:ring-1 focus:ring-sky-500"
        value={pin}
        disabled={running}
        onChange={(e) => setPin(e.target.value)}
        placeholder="enter 1–6"
      />

      <div className="mb-2 grid grid-cols-6 gap-1">
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            disabled={running}
            className="rounded bg-slate-800 py-1 font-mono text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-40"
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
            Abort
          </button>
        ) : (
          <button
            className="flex-1 rounded bg-emerald-600 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            disabled={!isValidPin(pin)}
            onClick={() => pinRunner.start(pin)}
          >
            Run PIN
          </button>
        )}
        <button
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          disabled={running}
          onClick={() => setPin('')}
        >
          Clear
        </button>
      </div>

      {shown.length > 0 && (
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
      )}
    </section>
  );
}

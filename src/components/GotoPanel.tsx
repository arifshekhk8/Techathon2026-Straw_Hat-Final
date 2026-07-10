import { useMemo, useState } from 'react';
import { motion } from '../state/controller';
import type { DispatchResult } from '../state/controller';
import { precomputeKeyPoses } from '../core/ik';
import type { Digit } from '../core/commands';

/** IK dashboard: type a base-frame target (mm), solve + move there; plus a
 *  live per-key reachability strip driven by the precomputed IK poses. */
export default function GotoPanel() {
  const [x, setX] = useState('550');
  const [y, setY] = useState('0');
  const [z, setZ] = useState('150');
  const [tipDown, setTipDown] = useState(true);
  const [status, setStatus] = useState<DispatchResult | null>(null);

  const reach = useMemo(() => precomputeKeyPoses(), []);

  const go = () => {
    const xyz: [number, number, number] = [Number(x) / 1000, Number(y) / 1000, Number(z) / 1000];
    if (xyz.some((v) => Number.isNaN(v))) {
      setStatus({ ok: false, reason: 'enter numbers for X, Y, Z' });
      return;
    }
    setStatus(motion.dispatch({ type: 'moveTo', xyz, tipDown, source: 'dashboard' }));
  };

  const field = (label: string, val: string, set: (s: string) => void) => (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase text-slate-500">{label} mm</span>
      <input
        type="number"
        className="w-full rounded bg-slate-950 px-1.5 py-1 font-mono text-xs text-slate-100 outline-none focus:ring-1 focus:ring-sky-500"
        value={val}
        onChange={(e) => set(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && go()}
      />
    </label>
  );

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        IK · go to point
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {field('X', x, setX)}
        {field('Y', y, setY)}
        {field('Z', z, setZ)}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" className="accent-sky-400" checked={tipDown} onChange={(e) => setTipDown(e.target.checked)} />
          Stylus down
        </label>
        <button
          className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500"
          onClick={go}
        >
          Go
        </button>
      </div>

      {status && (
        <div
          className={`mt-2 rounded px-2 py-1 font-mono text-[11px] ${
            status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-rose-700/25 text-rose-200'
          }`}
        >
          {status.ok ? '✓ ' : '✗ rejected — '}
          {status.reason}
        </div>
      )}

      <div className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Key reachability (IK)
      </div>
      <div className="flex gap-1.5">
        {([1, 2, 3, 4, 5, 6] as Digit[]).map((d) => (
          <div
            key={d}
            title={`key ${d}: ${reach[d].reachable ? `reach ${(reach[d].touchErr * 1000).toFixed(2)} mm` : 'unreachable'}`}
            className={`flex h-6 flex-1 items-center justify-center rounded font-mono text-xs ${
              reach[d].reachable ? 'bg-emerald-600/30 text-emerald-300' : 'bg-rose-700/40 text-rose-200'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </section>
  );
}

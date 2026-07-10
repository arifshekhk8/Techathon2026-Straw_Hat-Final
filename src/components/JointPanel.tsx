import { useArmStore } from '../state/store';

const rad2deg = (r: number) => (r * 180) / Math.PI;

/** Live joint dashboard: 7 rows of angle readout + limit bar + slider.
 *  The sliders are the "dashboard" motion trigger — they write joint targets
 *  into the store, which the render loop applies to the robot. */
export default function JointPanel() {
  const jointMeta = useArmStore((s) => s.jointMeta);
  const q = useArmStore((s) => s.q);
  const setJoint = useArmStore((s) => s.setJoint);
  const setQ = useArmStore((s) => s.setQ);
  const log = useArmStore((s) => s.log);

  if (jointMeta.length === 0) {
    return <div className="text-sm text-slate-400">Loading URDF…</div>;
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Joint states
        </h2>
        <button
          className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-200 hover:bg-slate-600"
          onClick={() => {
            setQ([0, 0, 0, 0, 0, 0, 0]);
            log('dashboard', 'All joints → 0 (FK anchor pose: TCP must read 0, 0, 1497 mm)');
          }}
        >
          Zero all
        </button>
      </div>
      <div className="space-y-2">
        {jointMeta.map((j, i) => {
          const frac = (q[i] - j.lower) / (j.upper - j.lower);
          return (
            <div key={j.name}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-300">{j.label}</span>
                <span className="font-mono tabular-nums text-sky-300">
                  {rad2deg(q[i]).toFixed(1)}°
                </span>
              </div>
              <div className="relative mt-1 h-1 rounded bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-sky-500/70"
                  style={{ width: `${Math.min(100, Math.max(0, frac * 100))}%` }}
                />
              </div>
              <input
                type="range"
                aria-label={j.label}
                className="mt-0.5 w-full accent-sky-400"
                min={j.lower}
                max={j.upper}
                step={0.002}
                value={q[i]}
                onChange={(e) => setJoint(i, Number(e.target.value))}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

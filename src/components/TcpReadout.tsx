import { useArmStore } from '../state/store';

/** Stylus-tip (TCP) position in the arm base frame, live at 10 Hz. */
export default function TcpReadout() {
  const tcp = useArmStore((s) => s.tcp);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Stylus tip — base frame
      </h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <div key={axis} className="rounded bg-slate-950 px-1 py-2">
            <div className="text-[10px] uppercase text-slate-500">{axis}</div>
            <div className="font-mono text-sm tabular-nums text-emerald-300">
              {(tcp[i] * 1000).toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-600">mm</div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useArmStore } from '../state/store';

const levelColor = {
  info: 'text-slate-300',
  warn: 'text-amber-300',
  error: 'text-rose-400',
} as const;

/** Pipeline event feed — every command, validation verdict and touch result lands here. */
export default function EventLog() {
  const events = useArmStore((s) => s.events);

  return (
    <section className="flex flex-col rounded-lg border border-slate-800 bg-slate-900 p-3">
      <h2 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span>Event log</span>
        {events.length > 0 && <span className="font-mono text-[10px] text-slate-600">{events.length}</span>}
      </h2>
      <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
        {events.length === 0 && <div className="text-xs text-slate-500">No events yet.</div>}
        {events.map((e) => (
          <div key={e.id} className="text-xs leading-snug">
            <span className="font-mono text-slate-500">{e.time}</span>{' '}
            <span className="rounded bg-slate-800 px-1 font-mono text-[10px] text-slate-400">
              {e.source}
            </span>{' '}
            <span className={levelColor[e.level]}>{e.msg}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useEffect } from 'react';
import { installKeyboard } from '../input/keyboard';
import { motion } from '../state/controller';

const ROWS: [string, string][] = [
  ['A / D', 'Base yaw'],
  ['W / S', 'Shoulder'],
  ['Q / E', 'Elbow'],
  ['Z / X', 'Forearm roll'],
  ['R / F', 'Wrist pitch'],
  ['T / G', 'Tool roll'],
  ['Y / H', 'Stylus pitch'],
  ['0', 'Home'],
  ['Esc', 'Stop'],
];

/** Keyboard manual-control legend. Mounting this installs the key listeners. */
export default function ManualPanel() {
  useEffect(() => installKeyboard(), []);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Manual · keyboard
        </h2>
        <button
          className="rounded bg-rose-600/80 px-2 py-0.5 text-xs font-medium text-white hover:bg-rose-500"
          onClick={() => motion.dispatch({ type: 'stop', source: 'keyboard' })}
        >
          Stop
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        {ROWS.map(([keys, label]) => (
          <div key={keys} className="flex items-center justify-between">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
              {keys}
            </kbd>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[10px] text-slate-500">
        Hold a key to jog that joint. Cartesian tip jog arrives with IK.
      </p>
    </section>
  );
}

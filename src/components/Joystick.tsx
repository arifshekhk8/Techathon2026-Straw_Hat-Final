import { useEffect, useRef, useState } from 'react';
import { motion } from '../state/controller';
import { useArmStore } from '../state/store';
import { fk } from '../core/fk';
import { SHOULDER, MAX_REACH, FLOOR_Z } from '../core/chain';
import { dist } from '../core/math';
import type { Vec3 } from '../core/math';

const R = 52; // pad radius (px)
const STALL_MM = 0.03; // per-frame tip travel below which a held jog counts as stalled (singular)

/** GUI joystick — the same manual lane as the keyboard, aimed at a mouse/touch.
 *  The XY pad jogs the tip in the base plane (proportional to deflection), the
 *  Z buttons raise/lower it. Everything rides the shared Cartesian jog lane, so
 *  the controller's velocity smoothing gives it soft starts and sub-100 ms stops.
 *  Jogging is blocked while an autonomous PIN runs — only Stop stays live. */
export default function Joystick() {
  const running = useArmStore((s) => s.pinProgress.running);
  const q = useArmStore((s) => s.q);
  const padRef = useRef<HTMLDivElement>(null);
  const active = useRef<Set<string>>(new Set()); // ids currently jogging via this pad
  const prevTip = useRef<Vec3>([0, 0, 0]);
  const [knob, setKnob] = useState<[number, number]>([0, 0]); // px offset, for the visual
  const [stalled, setStalled] = useState(false); // jog commanded but tip can't move (singularity)

  const releaseAllJogs = () => {
    for (const id of active.current) motion.endCartJog(id);
    active.current.clear();
    setKnob([0, 0]);
    setStalled(false);
  };

  // A PIN run must never leave a jog latched — drop everything the moment it starts.
  useEffect(() => {
    if (running) releaseAllJogs();
  }, [running]);

  // Safety net: a pointer released off the element (or focus loss) must not latch a jog.
  useEffect(() => {
    const off = () => releaseAllJogs();
    window.addEventListener('pointerup', off);
    window.addEventListener('blur', off);
    return () => {
      window.removeEventListener('pointerup', off);
      window.removeEventListener('blur', off);
    };
  }, []);

  // Workspace telemetry from the live pose. Re-runs each frame the pose changes.
  const tip = fk(q);
  const reach = dist(tip, SHOULDER) / MAX_REACH;
  const nearReach = reach > 0.92;
  const nearFloor = tip[2] < FLOOR_Z + 0.03;
  const limit = nearReach || nearFloor;

  // Singularity/limit stall: a jog is held but the tip isn't actually moving.
  // Keyed to `q` — setQ hands out a fresh array each frame, so this samples one
  // true per-frame delta and never self-triggers off its own setStalled render.
  useEffect(() => {
    const moved = dist(tip, prevTip.current) * 1000;
    prevTip.current = tip;
    setStalled(active.current.size > 0 && moved < STALL_MM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const drive = (px: number, py: number) => {
    let ux = px / R;
    let uy = py / R;
    const n = Math.hypot(ux, uy);
    if (n > 1) { ux /= n; uy /= n; } // clamp to the unit disc
    // Screen up → tip +X (forward); screen right → tip −Y — matches the arrow keys.
    motion.beginCartJog('pad', [-uy, -ux, 0], 'joystick');
    active.current.add('pad');
    setKnob([ux * R, uy * R]);
  };

  const capture = (e: React.PointerEvent) => {
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { /* synthetic / unsupported */ }
  };

  const onPadDown = (e: React.PointerEvent) => {
    if (running) return;
    capture(e);
    const r = padRef.current!.getBoundingClientRect();
    drive(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  };
  const onPadMove = (e: React.PointerEvent) => {
    if (running || e.buttons === 0) return;
    const r = padRef.current!.getBoundingClientRect();
    drive(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  };
  const releasePad = () => {
    motion.endCartJog('pad'); // controller eases the tip to rest
    active.current.delete('pad');
    setKnob([0, 0]);
    setStalled(false);
  };

  const zHold = (id: string, dz: number) => (e: React.PointerEvent) => {
    if (running) return;
    capture(e);
    motion.beginCartJog(id, [0, 0, dz], 'joystick');
    active.current.add(id);
  };
  const zRelease = (id: string) => () => {
    motion.endCartJog(id);
    active.current.delete(id);
    setStalled(false);
  };

  const zBtn = 'flex-1 rounded bg-slate-800 py-2 text-sm font-mono text-emerald-300 select-none hover:bg-slate-700 active:bg-emerald-700/60 disabled:opacity-40';

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Manual · joystick
        </h2>
        <button
          className="rounded bg-rose-600/80 px-2 py-0.5 text-xs font-medium text-white hover:bg-rose-500"
          onClick={() => motion.dispatch({ type: 'stop', source: 'joystick' })}
        >
          Stop
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* XY pad — base-plane tip jog */}
        <div
          ref={padRef}
          onPointerDown={onPadDown}
          onPointerMove={onPadMove}
          onPointerUp={releasePad}
          onPointerCancel={releasePad}
          className={`relative shrink-0 touch-none rounded-full border ${
            running ? 'cursor-not-allowed border-slate-800 bg-slate-950/60' : 'cursor-grab border-slate-700 bg-slate-950'
          }`}
          style={{ width: R * 2, height: R * 2 }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-full border border-slate-800" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-slate-800" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-px -translate-x-1/2 -translate-y-1/2 bg-slate-800" />
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 rounded-full shadow ${
              running ? 'bg-slate-700' : 'bg-sky-500'
            }`}
            style={{ transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }}
          />
          <span className="pointer-events-none absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-600">+X</span>
          <span className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-600">−X</span>
          <span className="pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-600">+Y</span>
          <span className="pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-600">−Y</span>
        </div>

        {/* Z column + workspace-limit badge */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button
            className={zBtn}
            disabled={running}
            onPointerDown={zHold('z+', 1)}
            onPointerUp={zRelease('z+')}
            onPointerCancel={zRelease('z+')}
            onPointerLeave={zRelease('z+')}
          >
            ▲ Z up
          </button>
          <button
            className={zBtn}
            disabled={running}
            onPointerDown={zHold('z-', -1)}
            onPointerUp={zRelease('z-')}
            onPointerCancel={zRelease('z-')}
            onPointerLeave={zRelease('z-')}
          >
            ▼ Z down
          </button>
          <div
            className={`rounded px-2 py-1 text-center font-mono text-[10px] ${
              running
                ? 'bg-slate-800 text-slate-400'
                : stalled || limit
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-600/20 text-emerald-300'
            }`}
            title={`reach ${(reach * 100).toFixed(0)} % · tip z ${(tip[2] * 1000).toFixed(0)} mm`}
          >
            {running
              ? 'PIN running'
              : stalled
                ? 'blocked · nudge X/Y'
                : limit
                  ? nearReach ? 'near reach limit' : 'near floor'
                  : `in range · ${(reach * 100).toFixed(0)} %`}
          </div>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        Drag the pad to jog the tip; hold Z to raise/lower. Proportional speed, smooth stop.
      </p>
    </section>
  );
}

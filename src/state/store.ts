import { create } from 'zustand';

export type EventLevel = 'info' | 'warn' | 'error';

export interface ArmEvent {
  id: number;
  time: string;
  source: string;
  msg: string;
  level: EventLevel;
}

export interface JointMeta {
  name: string;
  label: string;
  lower: number;
  upper: number;
}

export interface PinResult {
  key: number;
  mm: number;
  ok: boolean;
}

export interface PinProgress {
  running: boolean;
  pin: number[];
  index: number;
  phase: string;
  results: PinResult[];
}

const IDLE_PIN: PinProgress = { running: false, pin: [], index: 0, phase: 'idle', results: [] };

interface ArmStore {
  jointMeta: JointMeta[];
  /** Joint angles, radians, joints 1..7 — the single source of truth the renderer follows. */
  q: number[];
  /** Stylus tip position in the arm base frame, meters. */
  tcp: [number, number, number];
  events: ArmEvent[];
  pinProgress: PinProgress;
  setJointMeta: (meta: JointMeta[]) => void;
  setJoint: (index: number, value: number) => void;
  setQ: (q: number[]) => void;
  setTcp: (tcp: [number, number, number]) => void;
  setPinProgress: (p: PinProgress) => void;
  log: (source: string, msg: string, level?: EventLevel) => void;
}

let eventId = 0;

export const useArmStore = create<ArmStore>((set) => ({
  jointMeta: [],
  q: [0, 0, 0, 0, 0, 0, 0],
  tcp: [0, 0, 0],
  events: [],
  pinProgress: IDLE_PIN,
  setJointMeta: (jointMeta) => set({ jointMeta }),
  setJoint: (index, value) =>
    set((s) => {
      const q = s.q.slice();
      q[index] = value;
      return { q };
    }),
  setQ: (q) => set({ q: q.slice() }),
  setTcp: (tcp) => set({ tcp }),
  setPinProgress: (pinProgress) => set({ pinProgress }),
  log: (source, msg, level = 'info') =>
    set((s) => ({
      events: [
        { id: ++eventId, time: new Date().toLocaleTimeString(), source, msg, level },
        ...s.events,
      ].slice(0, 200),
    })),
}));

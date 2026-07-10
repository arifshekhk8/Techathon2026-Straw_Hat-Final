import { motion } from '../state/controller';

// Letter keys jog individual joints (hold to jog). Arrow / Cartesian jog arrives
// with the IK layer, so it stays off the letter keys to avoid any remap later.
// key → [joint index, sign]
const JOG_KEYS: Record<string, [number, number]> = {
  a: [0, +1], d: [0, -1], // J1 base yaw
  w: [1, +1], s: [1, -1], // J2 shoulder
  q: [2, +1], e: [2, -1], // J3 elbow
  z: [3, +1], x: [3, -1], // J4 forearm roll
  r: [4, +1], f: [4, -1], // J5 wrist pitch
  t: [5, +1], g: [5, -1], // J6 tool roll
  y: [6, +1], h: [6, -1], // J7 stylus pitch
};

function isTyping(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable === true;
}

/** Attach keyboard jog controls to the window. Returns a teardown fn. */
export function installKeyboard(): () => void {
  const down = (e: KeyboardEvent) => {
    if (isTyping(e.target)) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      motion.dispatch({ type: 'stop', source: 'keyboard' });
      return;
    }
    if (k === '0') {
      motion.dispatch({ type: 'home', source: 'keyboard' });
      e.preventDefault();
      return;
    }
    const map = JOG_KEYS[k];
    if (map) {
      if (!e.repeat) motion.beginJog(map[0], map[1], 'keyboard');
      e.preventDefault();
    }
  };
  const up = (e: KeyboardEvent) => {
    const map = JOG_KEYS[e.key.toLowerCase()];
    if (map) motion.endJog(map[0]);
  };
  // Releasing focus (alt-tab, click-away) must not leave a joint jogging forever.
  const stopAll = () => {
    for (let i = 0; i < 7; i++) motion.endJog(i);
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', stopAll);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', stopAll);
  };
}

import { useArmStore } from './store';
import type { MotionCommand, Source } from '../core/commands';
import { validate } from '../core/validate';
import { stepToward } from '../core/executor';
import { CHAIN, NJ, HOME } from '../core/chain';
import { clamp } from '../core/math';

const JOG_RATE = 0.9;   // rad/s — continuous (held-key) jog
const MOVE_VMAX = 1.2;  // rad/s — eased discrete moves

/**
 * The single motion pipeline. Continuous jog (keyboard/joystick) integrates a
 * per-joint velocity each frame; discrete commands pass validate() then ease
 * toward a target pose. Every path writes store.q — the one source of truth the
 * renderer follows — and logs to the event feed with its source.
 */
class MotionController {
  private held = new Map<number, number>(); // joint index → sign (+1 / −1)
  private target: number[] | null = null;

  /** Start a continuous joint jog (keyboard/joystick hold). */
  beginJog(joint: number, sign: number, source: Source) {
    if (joint < 0 || joint >= NJ) return;
    const fresh = !this.held.has(joint);
    this.held.set(joint, Math.sign(sign));
    this.target = null;
    if (fresh)
      useArmStore.getState().log(source, `jog ${CHAIN[joint].label} ${sign > 0 ? '+' : '−'}`);
  }

  endJog(joint: number) {
    this.held.delete(joint);
  }

  /** Run a discrete, validated command through the shared gate. */
  dispatch(cmd: MotionCommand): boolean {
    const st = useArmStore.getState();
    const res = validate(cmd, st.q);
    if (!res.ok) {
      st.log(cmd.source, `rejected ${cmd.type}: ${res.reason}`, 'warn');
      return false;
    }
    switch (cmd.type) {
      case 'stop':
        this.held.clear();
        this.target = null;
        st.log(cmd.source, 'stop');
        return true;
      case 'home':
        this.target = HOME.slice();
        st.log(cmd.source, 'home → all joints 0');
        return true;
      case 'rotateJoint': {
        const t = st.q.slice();
        t[cmd.joint] = cmd.toRad ?? st.q[cmd.joint] + (cmd.deltaRad ?? 0);
        this.target = t;
        st.log(cmd.source, `${CHAIN[cmd.joint].label} → ${((t[cmd.joint] * 180) / Math.PI).toFixed(0)}°`);
        return true;
      }
      case 'jogJoint': {
        const t = st.q.slice();
        t[cmd.joint] = clamp(st.q[cmd.joint] + cmd.deltaRad, CHAIN[cmd.joint].lower, CHAIN[cmd.joint].upper);
        this.target = t;
        return true;
      }
      default:
        // jog / moveTo / touchKey / typePin need IK — wired in Steps 4–5.
        st.log(cmd.source, `${cmd.type} needs IK (not wired yet)`, 'warn');
        return false;
    }
  }

  /** Advance motion by dt seconds. Called from the render frame loop. */
  tick(dt: number) {
    const st = useArmStore.getState();
    if (this.held.size > 0) {
      const q = st.q.slice();
      for (const [j, sign] of this.held)
        q[j] = clamp(q[j] + sign * JOG_RATE * dt, CHAIN[j].lower, CHAIN[j].upper);
      this.target = null;
      st.setQ(q);
      return;
    }
    if (this.target) {
      const { q, done } = stepToward(st.q, this.target, MOVE_VMAX * dt);
      st.setQ(q);
      if (done) this.target = null;
    }
  }

  get busy(): boolean {
    return this.held.size > 0 || this.target !== null;
  }
}

export const motion = new MotionController();

import { useArmStore } from './store';
import type { MotionCommand, Source } from '../core/commands';
import type { Vec3 } from '../core/math';
import { validate } from '../core/validate';
import { stepToward } from '../core/executor';
import { solveIK, cartesianStep } from '../core/ik';
import { fk } from '../core/fk';
import { CHAIN, NJ, HOME } from '../core/chain';
import { clamp, add, norm, scale } from '../core/math';

const JOG_RATE = 0.9;       // rad/s — continuous joint jog
const MOVE_VMAX = 1.2;      // rad/s — eased discrete moves
const CART_RATE = 0.12;     // m/s — continuous Cartesian jog
const DQ_CAP_FRAME = 0.05;  // rad — per-frame cap for resolved-rate jog

/**
 * The single motion pipeline. Three lanes, all writing store.q (the one source
 * of truth the renderer follows) and all limit-clamped:
 *   • joint jog  — per-joint velocity, integrated each frame
 *   • Cartesian jog — resolved-rate DLS from current q each frame
 *   • discrete commands — validate() then IK/ease toward a target pose
 * No source gets a privileged path; the agent will use this same surface.
 */
class MotionController {
  private held = new Map<number, number>();      // joint index → sign (+1 / −1)
  private cartHeld = new Map<string, Vec3>();    // jog id → base-frame direction
  private target: number[] | null = null;

  /** Continuous joint jog (keyboard/joystick hold). */
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

  /** Continuous Cartesian (tip) jog — resolved-rate. */
  beginCartJog(id: string, dir: Vec3, source: Source) {
    const fresh = !this.cartHeld.has(id);
    this.cartHeld.set(id, dir);
    this.target = null;
    if (fresh) useArmStore.getState().log(source, `jog tip ${id}`);
  }
  endCartJog(id: string) {
    this.cartHeld.delete(id);
  }

  /** Release every held jog (focus loss / e-stop of the manual lanes). */
  releaseAll() {
    this.held.clear();
    this.cartHeld.clear();
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
        this.releaseAll();
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
      case 'jog': {
        // Discrete Cartesian nudge (voice "move up 2 cm"): ease toward the
        // current tip + delta via IK, same eased-target lane as moveTo.
        const target = add(fk(st.q), cmd.delta);
        const sol = solveIK(target, { seed: st.q });
        if (!sol.ok) {
          st.log(cmd.source, `jog did not converge (${(sol.posErr * 1000).toFixed(0)} mm off)`, 'warn');
          return false;
        }
        this.target = sol.q;
        const cm = Math.round(Math.max(...cmd.delta.map(Math.abs)) * 100);
        st.log(cmd.source, `jog ${cm} cm — IK ${(sol.posErr * 1000).toFixed(1)} mm`);
        return true;
      }
      case 'moveTo': {
        const sol = solveIK(cmd.xyz, { tipDown: cmd.tipDown ?? false, seed: st.q });
        if (!sol.ok) {
          st.log(cmd.source, `moveTo did not converge (${(sol.posErr * 1000).toFixed(0)} mm off)`, 'warn');
          return false;
        }
        this.target = sol.q;
        const mm = cmd.xyz.map((v) => (v * 1000).toFixed(0)).join(', ');
        st.log(cmd.source, `moveTo (${mm}) mm — IK ${(sol.posErr * 1000).toFixed(1)} mm`);
        return true;
      }
      default:
        // touchKey / typePin — the PIN state machine (Step 5).
        st.log(cmd.source, `${cmd.type} arrives with the PIN sequence`, 'warn');
        return false;
    }
  }

  /** Advance motion by dt seconds. Called from the render frame loop. */
  tick(dt: number) {
    const st = useArmStore.getState();

    if (this.cartHeld.size > 0) {
      let dir: Vec3 = [0, 0, 0];
      for (const v of this.cartHeld.values()) dir = add(dir, v);
      const n = norm(dir);
      if (n > 0) {
        const dxyz = scale(dir, (CART_RATE * dt) / n);
        const dq = cartesianStep(st.q, dxyz);
        let maxAbs = 0;
        for (const v of dq) maxAbs = Math.max(maxAbs, Math.abs(v));
        const sc = maxAbs > DQ_CAP_FRAME ? DQ_CAP_FRAME / maxAbs : 1;
        const q = st.q.slice();
        for (let i = 0; i < NJ; i++)
          q[i] = clamp(q[i] + dq[i] * sc, CHAIN[i].lower, CHAIN[i].upper);
        st.setQ(q);
      }
      this.target = null;
      return;
    }

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
    return this.held.size > 0 || this.cartHeld.size > 0 || this.target !== null;
  }
}

export const motion = new MotionController();

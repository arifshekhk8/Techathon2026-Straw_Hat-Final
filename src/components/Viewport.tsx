import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../three/SceneManager';
import { loadArm } from '../three/loadRobot';
import { KeyPanel } from '../three/Panel';
import { useArmStore } from '../state/store';
import { motion } from '../state/controller';

/** Mounts the three.js scene and bridges it to the zustand store:
 *  store.q  →  robot joints (every frame)
 *  tip world position → store.tcp (10 Hz, in base-frame coordinates)  */
export default function Viewport() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const sm = new SceneManager(el);
    const store = useArmStore.getState();

    let offFrame: (() => void) | undefined;
    try {
      const arm = loadArm();
      sm.zUpRoot.add(arm.robot);
      const panel = new KeyPanel();
      sm.zUpRoot.add(panel.group);
      store.setJointMeta(arm.jointMeta);
      store.log('system', `URDF loaded — ${arm.jointMeta.length} joints, TCP frame "stylus_tip"`);
      store.log('system', 'Key panel placed from key.config.json (6 keys, top face z = 50 mm)');

      const tipWorld = new THREE.Vector3();
      const baseInv = new THREE.Matrix4().copy(sm.zUpRoot.matrixWorld).invert();
      let acc = 0.1; // publish immediately on first frame

      offFrame = sm.onFrame((dt) => {
        motion.tick(dt);
        arm.applyQ(useArmStore.getState().q);
        acc += dt;
        if (acc >= 0.1) {
          acc = 0;
          arm.robot.updateMatrixWorld(true);
          tipWorld.setFromMatrixPosition(arm.tip.matrixWorld).applyMatrix4(baseInv);
          useArmStore.getState().setTcp([tipWorld.x, tipWorld.y, tipWorld.z]);
        }
      });
    } catch (e) {
      store.log('system', `Failed to load URDF: ${String(e)}`, 'error');
    }

    return () => {
      offFrame?.();
      sm.dispose();
    };
  }, []);

  return <div ref={ref} className="h-full w-full" />;
}

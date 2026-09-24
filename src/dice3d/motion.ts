// How a thrown die moves: a tumble that spins down onto the rolled face, a
// throw arc with two bounces, and a squash on each impact. Pure worklets, so
// they run on the UI thread and can be tested directly.
import { axisAngle, easeOutCubic, faceToViewer, quatMul, rotate, type Quat, type Vec3 } from './math';
import type { Polyhedron } from './polyhedra';

export type Throw = {
  /** Where the die ends: the rolled face toward the viewer. */
  final: Quat;
  /** Axis and total angle of the tumble that unwinds as the die settles. */
  spinAxis: Vec3;
  spinAngle: number;
  /** Horizontal drift during the throw, in die radii (lands at 0). */
  drift: number;
};

/** Bounce impacts, as fractions of the throw. Haptics fire at these moments. */
export const IMPACTS = [0.42, 0.68, 0.84];

/** Plans a throw that lands on `value`. `rand` is injectable for tests. */
export function planThrow(poly: Polyhedron, value: number, rand: () => number = Math.random): Throw {
  const face = poly.faces.find((f) => f.value === value);
  if (!face) throw new Error(`d${poly.sides} has no face ${value}`);
  // A small random twist so the landed die isn't perfectly square to the screen.
  const twist = axisAngle([0, 0, 1], (rand() - 0.5) * 0.5);
  const final = quatMul(twist, faceToViewer(face.normal, face.up));
  const spinAxis: Vec3 = [rand() - 0.5, rand() - 0.5, rand() * 0.4 - 0.2];
  // 2.5 to 4 full turns: enough to read as a real tumble.
  const spinAngle = Math.PI * 2 * (2.5 + rand() * 1.5);
  return { final, spinAxis, spinAngle, drift: (rand() - 0.5) * 3 };
}

/** Orientation at throw progress t (0..1). At t = 1 it is exactly `final`. */
export function orientationAt(plan: Throw, t: number): Quat {
  'worklet';
  const remaining = 1 - easeOutCubic(t);
  if (remaining <= 0) return plan.final;
  return quatMul(plan.final, axisAngle(plan.spinAxis, plan.spinAngle * remaining));
}

/**
 * Height above the floor (in die radii) at progress t: a throw arc in from
 * below, then two shrinking bounces, then rest.
 */
export function heightAt(t: number): number {
  'worklet';
  const [a, b, c] = IMPACTS;
  if (t < a) {
    // Rising in from off-screen, peaking, and falling onto the table.
    const u = t / a;
    return 3.2 * Math.sin(Math.PI * (0.35 + 0.65 * u)) - 0.05 * (1 - u);
  }
  if (t < b) return 1.1 * Math.sin((Math.PI * (t - a)) / (b - a));
  if (t < c) return 0.35 * Math.sin((Math.PI * (t - b)) / (c - b));
  return 0;
}

/** Vertical offset while entering from the bottom of the screen (screen heights). */
export function entryAt(t: number): number {
  'worklet';
  const u = Math.min(1, t / IMPACTS[0]);
  return (1 - easeOutCubic(u)) * 0.6;
}

/** Horizontal drift that decays to zero as the die settles. */
export function driftAt(plan: Throw, t: number): number {
  'worklet';
  return plan.drift * (1 - easeOutCubic(t));
}

/** Squash-and-stretch: flattened briefly on each impact. Returns [scaleX, scaleY]. */
export function squashAt(t: number): [number, number] {
  'worklet';
  let s = 0;
  IMPACTS.forEach((impact, i) => {
    const d = Math.abs(t - impact);
    const width = 0.035;
    if (d < width) s = Math.max(s, (1 - d / width) * [0.22, 0.12, 0.05][i]);
  });
  return [1 + s * 0.6, 1 - s];
}

/** The face value pointing most toward the viewer for an orientation. */
export function valueFacingViewer(poly: Polyhedron, q: Quat): number {
  let best = -Infinity;
  let value = 0;
  for (const f of poly.faces) {
    const z = rotate(q, f.normal)[2];
    if (z > best) {
      best = z;
      value = f.value;
    }
  }
  return value;
}


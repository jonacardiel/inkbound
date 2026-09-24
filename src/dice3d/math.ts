// Tiny 3D math for the dice renderer. Plain arrays, no dependencies, and every
// function is a worklet so it can run on the UI thread each frame.
// Convention: the viewer looks down -Z, so +Z points out of the screen at them.

export type Vec3 = [number, number, number];
/** Quaternion [x, y, z, w]. */
export type Quat = [number, number, number, number];

export function add(a: Vec3, b: Vec3): Vec3 {
  'worklet';
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  'worklet';
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(a: Vec3, s: number): Vec3 {
  'worklet';
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function dot(a: Vec3, b: Vec3): number {
  'worklet';
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  'worklet';
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function length(a: Vec3): number {
  'worklet';
  return Math.sqrt(dot(a, a));
}

export function normalize(a: Vec3): Vec3 {
  'worklet';
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export const IDENTITY: Quat = [0, 0, 0, 1];

export function quatMul(a: Quat, b: Quat): Quat {
  'worklet';
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

export function axisAngle(axis: Vec3, angle: number): Quat {
  'worklet';
  const n = normalize(axis);
  const s = Math.sin(angle / 2);
  return [n[0] * s, n[1] * s, n[2] * s, Math.cos(angle / 2)];
}

/** Rotates a vector by a unit quaternion. */
export function rotate(q: Quat, v: Vec3): Vec3 {
  'worklet';
  const u: Vec3 = [q[0], q[1], q[2]];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q[3])), cross(u, t));
}

/** Quaternion from a rotation matrix given as three rows. */
export function fromRows(r0: Vec3, r1: Vec3, r2: Vec3): Quat {
  'worklet';
  const trace = r0[0] + r1[1] + r2[2];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return [(r2[1] - r1[2]) / s, (r0[2] - r2[0]) / s, (r1[0] - r0[1]) / s, 0.25 * s];
  }
  if (r0[0] > r1[1] && r0[0] > r2[2]) {
    const s = Math.sqrt(1 + r0[0] - r1[1] - r2[2]) * 2;
    return [0.25 * s, (r0[1] + r1[0]) / s, (r0[2] + r2[0]) / s, (r2[1] - r1[2]) / s];
  }
  if (r1[1] > r2[2]) {
    const s = Math.sqrt(1 + r1[1] - r0[0] - r2[2]) * 2;
    return [(r0[1] + r1[0]) / s, 0.25 * s, (r1[2] + r2[1]) / s, (r0[2] - r2[0]) / s];
  }
  const s = Math.sqrt(1 + r2[2] - r0[0] - r1[1]) * 2;
  return [(r0[2] + r2[0]) / s, (r1[2] + r2[1]) / s, 0.25 * s, (r1[0] - r0[1]) / s];
}

/**
 * The rotation that turns a face toward the viewer: its normal becomes +Z and
 * its "up" direction (where the top of the number points) becomes +Y.
 */
export function faceToViewer(normal: Vec3, up: Vec3): Quat {
  'worklet';
  const z = normalize(normal);
  const y = normalize(sub(up, scale(z, dot(up, z))));
  const x = cross(y, z);
  // Rows of the matrix mapping the face frame (x, y, z) onto the world axes.
  return fromRows(x, y, z);
}

/** Smoothstep-like ease that decelerates hard at the end, like a die settling. */
export function easeOutCubic(t: number): number {
  'worklet';
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) ** 3;
}

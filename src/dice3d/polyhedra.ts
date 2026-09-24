// The six dice as 3D shapes. Each die is defined by its corner points and the
// directions its faces point; the faces themselves are derived (the corners
// that sit furthest along each face direction), so no face lists are typed by hand.
import { cross, dot, normalize, scale, sub, type Vec3 } from './math';

export type Sides = 4 | 6 | 8 | 10 | 12 | 20;

export type Face = {
  /** Corner indices in counter-clockwise order when viewed from outside. */
  corners: number[];
  normal: Vec3;
  centroid: Vec3;
  /** Direction the top of the printed number points (in the face plane). */
  up: Vec3;
  value: number;
};

export type Polyhedron = { sides: Sides; vertices: Vec3[]; faces: Face[]; edges: [number, number][] };

const PHI = (1 + Math.sqrt(5)) / 2;

/** Every sign combination of a point, deduplicated (for points with zeros). */
function signs(p: Vec3): Vec3[] {
  const out: Vec3[] = [];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) out.push([p[0] * sx, p[1] * sy, p[2] * sz]);
  return out.filter((v, i) => out.findIndex((w) => w.every((c, j) => Math.abs(c - v[j]) < 1e-9)) === i);
}

/** The three cyclic permutations of a point. */
const cyclic = (p: Vec3): Vec3[] => [p, [p[2], p[0], p[1]], [p[1], p[2], p[0]]];

const icosahedron = (): Vec3[] => cyclic([0, 1, PHI]).flatMap(signs);
/** Face directions of the icosahedron above (its dual dodecahedron, same handedness). */
const icosahedronFaces = (): Vec3[] => [...signs([1, 1, 1]), ...cyclic([0, PHI, 1 / PHI]).flatMap(signs)];
const dodecahedron = (): Vec3[] => [...signs([1, 1, 1]), ...cyclic([0, 1 / PHI, PHI]).flatMap(signs)];
/** Face directions of the dodecahedron above (its dual icosahedron, same handedness). */
const dodecahedronFaces = (): Vec3[] => cyclic([0, PHI, 1]).flatMap(signs);

/** Pentagonal trapezohedron (d10) with planar kite faces. */
function d10Vertices(): Vec3[] {
  const h = 1;
  const cos36 = Math.cos(Math.PI / 5);
  // Ring height that makes each kite flat: c = h(1 - cos36) / (1 + cos36).
  const c = (h * (1 - cos36)) / (1 + cos36);
  const r = 0.95;
  const top: Vec3 = [0, 0, h];
  const bottom: Vec3 = [0, 0, -h];
  const upper = [0, 1, 2, 3, 4].map((k): Vec3 => [r * Math.cos((2 * Math.PI * k) / 5), r * Math.sin((2 * Math.PI * k) / 5), c]);
  const lower = [0, 1, 2, 3, 4].map((k): Vec3 => [r * Math.cos((2 * Math.PI * k) / 5 + Math.PI / 5), r * Math.sin((2 * Math.PI * k) / 5 + Math.PI / 5), -c]);
  return [top, bottom, ...upper, ...lower];
}

function d10Normals(v: Vec3[]): Vec3[] {
  const top = v[0];
  const bottom = v[1];
  const upper = v.slice(2, 7);
  const lower = v.slice(7, 12);
  const normals: Vec3[] = [];
  for (let k = 0; k < 5; k++) {
    // Upper kite: top, upper k, lower k, upper k+1. Lower kite: bottom, lower k, upper k+1, lower k+1.
    normals.push(normalize(cross(sub(upper[k], top), sub(upper[(k + 1) % 5], top))));
    normals.push(normalize(cross(sub(lower[(k + 1) % 5], bottom), sub(lower[k], bottom))));
  }
  return normals;
}

/** Builds faces from corner points and face directions. */
function build(sides: Sides, vertices: Vec3[], faceNormals: Vec3[]): Polyhedron {
  const faces: Face[] = faceNormals.map((raw) => {
    const normal = normalize(raw);
    const best = Math.max(...vertices.map((v) => dot(v, normal)));
    const idx = vertices.map((_, i) => i).filter((i) => Math.abs(dot(vertices[i], normal) - best) < 1e-6);
    const centroid = scale(
      idx.reduce<Vec3>((s, i) => [s[0] + vertices[i][0], s[1] + vertices[i][1], s[2] + vertices[i][2]], [0, 0, 0]),
      1 / idx.length,
    );
    // Sort corners counter-clockwise around the outward normal.
    const ref = normalize(sub(vertices[idx[0]], centroid));
    const ref2 = cross(normal, ref);
    const corners = [...idx].sort((a, b) => {
      const da = sub(vertices[a], centroid);
      const db = sub(vertices[b], centroid);
      return Math.atan2(dot(da, ref2), dot(da, ref)) - Math.atan2(dot(db, ref2), dot(db, ref));
    });
    // Numbers point toward the face's "top": the d10's pole, a d4's apex, otherwise the first corner.
    const upTarget = sides === 10 ? vertices[dot(normal, [0, 0, 1]) > 0 ? 0 : 1] : vertices[corners[0]];
    const upRaw = sub(upTarget, centroid);
    const up = normalize(sub(upRaw, scale(normal, dot(upRaw, normal))));
    return { corners, normal, centroid, up, value: 0 };
  });

  assignValues(sides, faces);

  const edges: [number, number][] = [];
  for (const f of faces) {
    f.corners.forEach((a, i) => {
      const b = f.corners[(i + 1) % f.corners.length];
      if (!edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) edges.push([a, b]);
    });
  }
  return { sides, vertices, faces, edges };
}

/**
 * Numbers faces 1..n. Like real dice, opposite faces add up to n + 1 (the d4
 * has no opposite faces, so it's numbered in order). The d10 reads 1..10 here
 * rather than 0..9 so every die shows its face value directly.
 */
function assignValues(sides: Sides, faces: Face[]) {
  if (sides === 4) {
    faces.forEach((f, i) => (f.value = i + 1));
    return;
  }
  const unassigned = new Set(faces.map((_, i) => i));
  let next = 1;
  while (unassigned.size) {
    const i = [...unassigned][0];
    const j = [...unassigned].find((k) => k !== i && dot(faces[k].normal, faces[i].normal) < -0.999)!;
    faces[i].value = next;
    faces[j].value = sides + 1 - next;
    unassigned.delete(i);
    unassigned.delete(j);
    next++;
  }
}

function make(sides: Sides): Polyhedron {
  switch (sides) {
    case 4: {
      const v: Vec3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
      return build(4, v, v.map((p) => scale(p, -1)));
    }
    case 6:
      return build(6, signs([1, 1, 1]), [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
    case 8:
      return build(8, [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], signs([1, 1, 1]));
    case 10: {
      const v = d10Vertices();
      return build(10, v, d10Normals(v));
    }
    case 12:
      return build(12, dodecahedron(), dodecahedronFaces());
    case 20:
      return build(20, icosahedron(), icosahedronFaces());
  }
}

/** Scales every die to the same visual size (farthest corner at radius 1). */
function unitSize(p: Polyhedron): Polyhedron {
  const r = Math.max(...p.vertices.map((v) => Math.sqrt(dot(v, v))));
  const s = (v: Vec3) => scale(v, 1 / r);
  return { ...p, vertices: p.vertices.map(s), faces: p.faces.map((f) => ({ ...f, centroid: s(f.centroid) })) };
}

const cache = new Map<Sides, Polyhedron>();
export function polyhedron(sides: Sides): Polyhedron {
  if (!cache.has(sides)) cache.set(sides, unitSize(make(sides)));
  return cache.get(sides)!;
}

export const DICE: Sides[] = [4, 6, 8, 10, 12, 20];
export const isSides = (n: number): n is Sides => (DICE as number[]).includes(n);

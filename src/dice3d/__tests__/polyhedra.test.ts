import { cross, dot, faceToViewer, rotate, sub, type Vec3 } from '../math';
import { DICE, polyhedron } from '../polyhedra';

const FACE_COUNTS = { 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 20: 20 };
const CORNERS = { 4: 3, 6: 4, 8: 3, 10: 4, 12: 5, 20: 3 };
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe.each(DICE)('d%i', (sides) => {
  const p = polyhedron(sides);

  test('has the right faces, each with the right corner count', () => {
    expect(p.faces).toHaveLength(FACE_COUNTS[sides]);
    p.faces.forEach((f) => expect(f.corners).toHaveLength(CORNERS[sides]));
  });

  test('is closed: every edge is shared by exactly two faces (Euler V - E + F = 2)', () => {
    expect(p.vertices.length - p.edges.length + p.faces.length).toBe(2);
  });

  test('faces are flat, point outward and wind counter-clockwise', () => {
    for (const f of p.faces) {
      expect(dot(f.normal, f.centroid)).toBeGreaterThan(0);
      for (const i of f.corners) expect(near(dot(sub(p.vertices[i], f.centroid), f.normal), 0, 1e-5)).toBe(true);
      const [a, b, c] = f.corners.map((i) => p.vertices[i]);
      expect(dot(cross(sub(b, a), sub(c, a)), f.normal)).toBeGreaterThan(0);
    }
  });

  test('numbers 1..n appear once each', () => {
    expect(p.faces.map((f) => f.value).sort((a, b) => a - b)).toEqual(Array.from({ length: sides }, (_, i) => i + 1));
  });

  if (sides !== 4) {
    test('opposite faces add up to n + 1', () => {
      for (const f of p.faces) {
        const opposite = p.faces.find((g) => dot(g.normal, f.normal) < -0.999)!;
        expect(f.value + opposite.value).toBe(sides + 1);
      }
    });
  }

  test('landing on any face shows it head-on with its number upright', () => {
    for (const f of p.faces) {
      const q = faceToViewer(f.normal, f.up);
      const n = rotate(q, f.normal);
      const up = rotate(q, f.up);
      expect([near(n[0], 0), near(n[1], 0), near(n[2], 1)]).toEqual([true, true, true]);
      expect([near(up[0], 0), near(up[1], 1), near(up[2], 0)]).toEqual([true, true, true]);
      // The rotation is proper (no mirroring): x stays right-handed.
      const x: Vec3 = rotate(q, cross(f.up, f.normal));
      expect(near(x[0], 1, 1e-6)).toBe(true);
    }
  });
});

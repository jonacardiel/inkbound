// Draws a die onto a Skia canvas in the app's ink-and-paper style. Runs every
// frame on the UI thread, so everything here is a worklet.
import { BlurStyle, ClipOp, PaintStyle, Skia, StrokeJoin, type SkCanvas, type SkFont } from '@shopify/react-native-skia';

import { dot, normalize, rotate, type Quat, type Vec3 } from './math';
import type { Polyhedron } from './polyhedra';

/** Light from the upper left, slightly toward the viewer. */
const LIGHT: Vec3 = normalize([-0.45, 0.6, 0.75]);
const PAPER_DARK: [number, number, number] = [132, 114, 86];
const PAPER_LIGHT: [number, number, number] = [243, 233, 212];
const INK = '#1E1812';

/** Font size multipliers per die: small faces (d20) need smaller numbers. */
const NUMBER_SIZE: Record<number, number> = { 4: 0.42, 6: 0.62, 8: 0.46, 10: 0.36, 12: 0.4, 20: 0.34 };
export const FONT_BASE = 64;

export type DieStyle = {
  /** 0..1: fades the die (the unused die with advantage). */
  opacity: number;
  /** Color for the landed face's number, or undefined for ink. */
  highlight?: string;
  /** Face value to highlight. */
  highlightValue?: number;
};

function mix(t: number): string {
  'worklet';
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(PAPER_DARK[0] + (PAPER_LIGHT[0] - PAPER_DARK[0]) * c);
  const g = Math.round(PAPER_DARK[1] + (PAPER_LIGHT[1] - PAPER_DARK[1]) * c);
  const b = Math.round(PAPER_DARK[2] + (PAPER_LIGHT[2] - PAPER_DARK[2]) * c);
  return `rgb(${r},${g},${b})`;
}

/**
 * Draws one die centered at (cx, cy) with circumradius `radius`, rotated by
 * `q`, squashed by (sx, sy). A touch of perspective makes near corners larger.
 */
export function drawDie(
  canvas: SkCanvas,
  poly: Polyhedron,
  q: Quat,
  cx: number,
  cy: number,
  radius: number,
  sx: number,
  sy: number,
  font: SkFont | null,
  style: DieStyle,
) {
  'worklet';
  const project = (v: Vec3): [number, number] => {
    const r = rotate(q, v);
    const f = 1 / (1 - r[2] * 0.16);
    return [cx + r[0] * radius * f * sx, cy - r[1] * radius * f * sy];
  };
  const rotated = poly.vertices.map((v) => rotate(q, v));

  // Visible faces, far to near.
  const visible = poly.faces
    .map((f) => ({ f, n: rotate(q, f.normal), z: rotate(q, f.centroid)[2] }))
    .filter((x) => x.n[2] > 0.02)
    .sort((a, b) => a.z - b.z);

  const fill = Skia.Paint();
  fill.setAntiAlias(true);
  const stroke = Skia.Paint();
  stroke.setAntiAlias(true);
  stroke.setStyle(PaintStyle.Stroke);
  stroke.setStrokeJoin(StrokeJoin.Round);
  stroke.setStrokeWidth(Math.max(1.2, radius * 0.018));
  stroke.setColor(Skia.Color(INK));
  stroke.setAlphaf(style.opacity);
  const hatch = Skia.Paint();
  hatch.setAntiAlias(true);
  hatch.setStyle(PaintStyle.Stroke);
  hatch.setStrokeWidth(Math.max(0.8, radius * 0.008));
  hatch.setColor(Skia.Color(INK));

  for (const { f, n } of visible) {
    const path = Skia.Path.Make();
    f.corners.forEach((i, k) => {
      const r = rotated[i];
      const pf = 1 / (1 - r[2] * 0.16);
      const x = cx + r[0] * radius * pf * sx;
      const y = cy - r[1] * radius * pf * sy;
      if (k === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.close();

    const light = Math.max(0, dot(n, LIGHT));
    fill.setColor(Skia.Color(mix(0.3 + 0.7 * light)));
    fill.setAlphaf(style.opacity);
    canvas.drawPath(path, fill);

    // Engraving: cross-hatch faces turned away from the light.
    if (light < 0.6) {
      const bounds = path.getBounds();
      const gap = Math.max(3, radius * 0.05);
      hatch.setAlphaf(style.opacity * 0.45 * (1 - light / 0.6));
      canvas.save();
      canvas.clipPath(path, ClipOp.Intersect, true);
      const span = bounds.width + bounds.height;
      for (let d = -span; d < span; d += gap) {
        canvas.drawLine(bounds.x + d, bounds.y, bounds.x + d + bounds.height, bounds.y + bounds.height, hatch);
      }
      if (light < 0.3) {
        for (let d = -span; d < span; d += gap * 1.4) {
          canvas.drawLine(bounds.x + d + bounds.height, bounds.y, bounds.x + d, bounds.y + bounds.height, hatch);
        }
      }
      canvas.restore();
    }
    canvas.drawPath(path, stroke);

    // The number, turned with its face and foreshortened as the face tilts away.
    if (font && n[2] > 0.3) {
      const [tx, ty] = project(f.centroid);
      const [ux, uy] = project([f.centroid[0] + f.up[0] * 0.3, f.centroid[1] + f.up[1] * 0.3, f.centroid[2] + f.up[2] * 0.3]);
      const angle = (Math.atan2(ux - tx, -(uy - ty)) * 180) / Math.PI;
      const size = radius * NUMBER_SIZE[poly.sides] * Math.pow(n[2], 0.6);
      // Real dice underline 6 and 9 so they can't be confused.
      const text = (f.value === 6 || f.value === 9) && poly.sides > 8 ? `${f.value}.` : `${f.value}`;
      const textPaint = Skia.Paint();
      textPaint.setAntiAlias(true);
      const lit = style.highlightValue === f.value && style.highlight;
      textPaint.setColor(Skia.Color(lit ? style.highlight! : INK));
      textPaint.setAlphaf(style.opacity);
      const width = font.getTextWidth(text, textPaint);
      canvas.save();
      canvas.translate(tx, ty);
      canvas.rotate(angle, 0, 0);
      canvas.scale(size / FONT_BASE, size / FONT_BASE);
      canvas.drawText(text, -width / 2, FONT_BASE * 0.34, textPaint, font);
      canvas.restore();
    }
  }
}

/** Soft oval shadow under a die; smaller and lighter the higher it is. */
export function drawShadow(canvas: SkCanvas, cx: number, floorY: number, radius: number, height: number, opacity: number) {
  'worklet';
  const k = 1 / (1 + height * 0.35);
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color('#000000'));
  paint.setAlphaf(0.4 * k * opacity);
  paint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, radius * 0.12, true));
  canvas.drawOval(Skia.XYWHRect(cx - radius * 0.85 * k, floorY - radius * 0.18 * k, radius * 1.7 * k, radius * 0.36 * k), paint);
}

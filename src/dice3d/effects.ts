// Critical-hit effects, drawn on the same Skia canvas as the dice.
import { PaintStyle, Skia, StrokeCap, type SkCanvas } from '@shopify/react-native-skia';

const SPARKS = 28;

/** Natural 20: sparks burst outward from the die in the class color, then fade. `t` runs 0..1. */
export function drawBurst(canvas: SkCanvas, cx: number, cy: number, radius: number, t: number, color: string) {
  'worklet';
  if (t <= 0 || t >= 1) return;
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setColor(Skia.Color(color));
  // A soft glow ring expanding behind the sparks.
  const ring = Skia.Paint();
  ring.setAntiAlias(true);
  ring.setStyle(PaintStyle.Stroke);
  ring.setStrokeWidth(radius * 0.08 * (1 - t));
  ring.setColor(Skia.Color(color));
  ring.setAlphaf(0.6 * (1 - t));
  canvas.drawCircle(cx, cy, radius * (1 + t * 1.6), ring);
  for (let i = 0; i < SPARKS; i++) {
    // Fixed pseudo-random spread per spark so the burst is stable frame to frame.
    const angle = (i / SPARKS) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.3;
    const speed = 1.4 + ((Math.sin(i * 78.233) + 1) / 2) * 1.6;
    const d = radius * (0.8 + speed * t);
    paint.setAlphaf(1 - t);
    canvas.drawCircle(cx + Math.cos(angle) * d, cy + Math.sin(angle) * d, radius * 0.045 * (1 - t * 0.6), paint);
  }
}

/** Natural 1: a jagged crack spreads across the die. `t` runs 0..1 as it grows. */
export function drawCrack(canvas: SkCanvas, cx: number, cy: number, radius: number, t: number) {
  'worklet';
  if (t <= 0) return;
  const points: [number, number][] = [
    [-0.55, -0.62],
    [-0.28, -0.3],
    [-0.36, -0.05],
    [-0.05, 0.12],
    [-0.14, 0.38],
    [0.18, 0.55],
    [0.12, 0.8],
  ];
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeWidth(Math.max(2, radius * 0.035));
  paint.setColor(Skia.Color('#5A1010'));
  const path = Skia.Path.Make();
  const shown = Math.max(2, Math.ceil(points.length * Math.min(1, t)));
  points.slice(0, shown).forEach(([x, y], i) => {
    if (i === 0) path.moveTo(cx + x * radius, cy + y * radius);
    else path.lineTo(cx + x * radius, cy + y * radius);
  });
  // A small branch off the main crack.
  if (t > 0.6) {
    path.moveTo(cx - 0.05 * radius, cy + 0.12 * radius);
    path.lineTo(cx + 0.3 * radius, cy + 0.05 * radius);
  }
  canvas.drawPath(path, paint);
}

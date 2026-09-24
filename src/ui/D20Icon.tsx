import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';

/**
 * The classic front view of a d20: a hexagon outline, the center face, and the
 * facet lines between them, drawn as ink lines like the engraved art.
 */
export function D20Icon({ size = 36, ink = '#16120F' }: { size?: number; ink?: string }) {
  const hex = '50,5 90,28 90,74 50,97 10,74 10,28';
  // Center face (pointing up) and where its corners meet the outline.
  const a = [50, 33];
  const bl = [28, 68];
  const br = [72, 68];
  const facets: [number[], number[]][] = [
    [a, [50, 5]],
    [a, [10, 28]],
    [a, [90, 28]],
    [bl, [10, 28]],
    [bl, [10, 74]],
    [bl, [50, 97]],
    [br, [90, 28]],
    [br, [90, 74]],
    [br, [50, 97]],
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 102" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Polygon points={hex} fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
      <Polygon points={`${a} ${bl} ${br}`} fill="none" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
      {facets.map(([from, to], i) => (
        <Line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      ))}
      <SvgText x={50} y={62} fontSize={22} fontWeight="bold" fill={ink} textAnchor="middle">
        20
      </SvgText>
    </Svg>
  );
}

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

type Props = {
  front: ReactNode;
  back: ReactNode;
  width: number;
  height: number;
  accessibilityLabel: string;
};

/** Tap to flip between front and back. Cross-fades instead when Reduce Motion is on. */
export function FlipCard({ front, back, width, height, accessibilityLabel }: Props) {
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: reduceMotion ? 0 : 450 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value < 90 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value - 180}deg` }],
    opacity: rotation.value >= 90 ? 1 : 0,
  }));

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={flipped ? 'Shows the card front' : 'Shows details on the back of the card'}
      style={{ width, height }}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.face, frontStyle]} pointerEvents={flipped ? 'none' : 'auto'}>
        {front}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.face, backStyle]} pointerEvents={flipped ? 'auto' : 'none'}>
        <View style={{ flex: 1 }}>{back}</View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: { backfaceVisibility: 'hidden' },
});

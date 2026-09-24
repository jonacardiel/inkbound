import type { ReactElement } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T, width: number) => ReactElement;
  /** Called when a different card becomes centered. */
  onFocus?: (item: T, index: number) => void;
  /** Card width as a share of the screen width. */
  widthRatio?: number;
  /** Card to start centered on. */
  initialIndex?: number;
};

const GAP = 14;

/**
 * Horizontal, snapping card carousel. The centered card is full size; its
 * neighbours shrink and dim slightly, which gives the swipe some depth.
 */
export function CardCarousel<T>({ items, keyOf, renderCard, onFocus, widthRatio = 0.78, initialIndex = 0 }: Props<T>) {
  const { width: screen } = useWindowDimensions();
  const cardWidth = Math.min(420, Math.round(screen * widthRatio));
  const stride = cardWidth + GAP;
  const sidePadding = (screen - cardWidth) / 2;
  const scrollX = useSharedValue(initialIndex * stride);
  const centered = useSharedValue(initialIndex);
  const reportFocus = (index: number) => {
    if (items[index]) onFocus?.(items[index], index);
  };

  // Track the centered card from the scroll position (web has no momentum-end events).
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      const index = Math.round(e.contentOffset.x / stride);
      if (index !== centered.value) {
        centered.value = index;
        scheduleOnRN(reportFocus, index);
      }
    },
  });

  return (
    <Animated.FlatList
      horizontal
      data={items}
      keyExtractor={keyOf}
      showsHorizontalScrollIndicator={false}
      snapToInterval={stride}
      initialScrollIndex={initialIndex}
      getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: sidePadding, paddingVertical: 12 }}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      onScroll={onScroll}
      scrollEventThrottle={16}
      renderItem={({ item, index }) => (
        <CarouselItem index={index} stride={stride} scrollX={scrollX}>
          {renderCard(item, cardWidth)}
        </CarouselItem>
      )}
    />
  );
}

function CarouselItem({
  index,
  stride,
  scrollX,
  children,
}: {
  index: number;
  stride: number;
  scrollX: SharedValue<number>;
  children: ReactElement;
}) {
  const reduceMotion = useReducedMotion();
  const style = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    const distance = scrollX.value / stride - index;
    return {
      transform: [{ scale: interpolate(Math.abs(distance), [0, 1], [1, 0.9], Extrapolation.CLAMP) }],
      opacity: interpolate(Math.abs(distance), [0, 1], [1, 0.6], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.item, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  item: { alignItems: 'center' },
});

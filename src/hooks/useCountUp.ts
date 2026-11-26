import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * One-shot count-up from 0 to `target`, restarted only when `target` changes.
 *
 * Built-in Animated with the JS driver on purpose: the animated value is read
 * back into state to render text, which the native driver cannot do. There is no
 * reanimated/worklets here — they are banned in this project (Expo Go crash).
 */
export function useCountUp(target: number, duration = 900): number {
  const [displayValue, setDisplayValue] = useState(0);
  // The Animated.Value itself is render-stable state; every update lands in its
  // owning animation, never through a setState during render.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    progress.setValue(0);
    const listener = progress.addListener(({ value }) => setDisplayValue(Math.round(target * value)));
    animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) setDisplayValue(target);
    });
    return () => {
      progress.removeListener(listener);
      animation?.stop();
    };
  }, [duration, progress, target]);

  return displayValue;
}

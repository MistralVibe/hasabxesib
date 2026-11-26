import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Tick width as a fraction of the arc a tick covers — just over 1 so the ring reads as a stroke. */
const TICK_ARC_FILL = 1.02;

/** Mix two #rrggbb colors; `t` runs 0..1. */
function mixHex(from: string, to: string, t: number): string {
  const parse = (hex: string) => {
    const clean = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const channel = (a: number, b: number) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

/**
 * Compact budget ring, drawn as a ring of tangential ticks — the same
 * hand-built technique as the Reports donut (ADR-0005: no svg/skia).
 * The gradient stroke is approximated by mixing `from` into `to` around the arc.
 */
export function BudgetRing({
  ratio,
  size,
  thickness,
  ticks = 72,
  from,
  to,
  trackColor,
  label,
  caption,
  labelColor,
  captionColor,
}: {
  ratio: number;
  size: number;
  thickness: number;
  ticks?: number;
  from: string;
  to: string;
  trackColor: string;
  label: string;
  caption: string;
  labelColor: string;
  captionColor: string;
}) {
  const filled = Math.round(Math.min(Math.max(ratio, 0), 1) * ticks);
  const tickWidth = Math.max(2, ((Math.PI * (size - thickness)) / ticks) * TICK_ARC_FILL);

  const positions = useMemo(() => {
    const radius = size / 2 - thickness / 2;
    const center = size / 2;
    const step = (Math.PI * 2) / ticks;
    return Array.from({ length: ticks }, (_, i) => {
      const angle = i * step - Math.PI / 2;
      return {
        left: center + radius * Math.cos(angle) - tickWidth / 2,
        top: center + radius * Math.sin(angle) - thickness / 2,
        rotate: `${(i * 360) / ticks}deg`,
      };
    });
  }, [size, thickness, ticks, tickWidth]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {positions.map((p, i) => (
        <View
          key={i}
          style={[
            styles.tick,
            {
              width: tickWidth,
              height: thickness,
              backgroundColor: i < filled ? mixHex(from, to, ticks > 1 ? i / (ticks - 1) : 0) : trackColor,
              left: p.left,
              top: p.top,
              transform: [{ rotate: p.rotate }],
            },
          ]}
        />
      ))}
      <View style={styles.center} pointerEvents="none">
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color: labelColor }]}>
          {label}
        </Text>
        <Text numberOfLines={1} style={[styles.caption, { color: captionColor }]}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', borderRadius: 9999, borderCurve: 'continuous' },
  center: { position: 'absolute', alignItems: 'center', paddingHorizontal: 12 },
  label: { fontSize: 20, fontWeight: '800' },
  caption: { fontSize: 10, fontWeight: '600', marginTop: 1 },
});

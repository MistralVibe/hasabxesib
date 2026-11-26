import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/** Pill segmented control, e.g. Expense | Income. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  getColor,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Active segment tint (e.g. income/expense color). */
  getColor?: (v: T) => string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.full, borderCurve: 'continuous' },
      ]}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        const tint = getColor?.(opt.value) ?? c.accent;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segment,
              {
                borderRadius: theme.radii.full,
                borderCurve: 'continuous',
                backgroundColor: active ? tint : 'transparent',
              },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={{
                color: active ? '#FFFFFF' : c.textSecondary,
                fontWeight: '700',
                fontSize: theme.type.body,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { addMonths, monthKeyOf, parseISODate, toISODate } from '@/domain/dates';

/**
 * Date field that opens a real calendar picker modal (no native deps — works
 * in Expo Go). Value is an ISO yyyy-mm-dd string.
 */
export function DateField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const { theme } = useTheme();
  const { t, language } = useI18n();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthKeyOf(value));

  const today = toISODate(new Date());
  const selected = value;

  const weeks = useMemo(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewMonth]);

  const weekdays = t('dates.weekdaysShort').split(' ');
  const monthLabel = useMemo(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
  }, [viewMonth, language]);

  const pick = (day: number) => {
    const [y, m] = viewMonth.split('-').map(Number);
    onChange(toISODate(new Date(y, m - 1, day)));
    setOpen(false);
  };

  const display = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseISODate(value));
    } catch {
      return value;
    }
  }, [value, language]);

  return (
    <View>
      {label ? <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{label}</Text> : null}
      <Pressable
        onPress={() => { setViewMonth(monthKeyOf(value)); setOpen(true); }}
        style={[
          styles.field,
          { backgroundColor: c.surface, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous' },
        ]}
        accessibilityRole="button"
      >
        <Ionicons name="calendar-outline" size={18} color={c.accent} />
        <Text style={{ color: c.text, fontSize: theme.type.body, marginLeft: 10, flex: 1 }}>{display}</Text>
        <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: c.surfaceElevated, borderRadius: theme.radii.xl, borderCurve: 'continuous', borderColor: c.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Pressable onPress={() => setViewMonth((k) => addMonths(`${k}-01`, -1).slice(0, 7))} hitSlop={12} accessibilityRole="button" accessibilityLabel="prev">
                <Ionicons name="chevron-back" size={22} color={c.text} />
              </Pressable>
              <Text style={{ color: c.text, fontSize: theme.type.heading, fontWeight: '700', textTransform: 'capitalize' }}>{monthLabel}</Text>
              <Pressable onPress={() => setViewMonth((k) => addMonths(`${k}-01`, 1).slice(0, 7))} hitSlop={12} accessibilityRole="button" accessibilityLabel="next">
                <Ionicons name="chevron-forward" size={22} color={c.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdays.map((w) => (
                <Text key={w} style={[styles.weekDay, { color: c.textSecondary, fontSize: theme.type.caption }]}>{w}</Text>
              ))}
            </View>
            {weeks.map((row, ri) => (
              <View key={ri} style={styles.weekRow}>
                {row.map((day, di) => {
                  if (day === null) return <View key={di} style={styles.dayCell} />;
                  const iso = toISODate(new Date(Number(viewMonth.slice(0, 4)), Number(viewMonth.slice(5, 7)) - 1, day));
                  const isSelected = iso === selected;
                  const isToday = iso === today;
                  return (
                    <Pressable
                      key={di}
                      onPress={() => pick(day)}
                      style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: c.accent, borderRadius: theme.radii.full, borderCurve: 'continuous' },
                        !isSelected && isToday && { borderWidth: 1, borderColor: c.accent, borderRadius: theme.radii.full, borderCurve: 'continuous' },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text
                        style={{
                          color: isSelected ? c.accentText : c.text,
                          fontSize: theme.type.body,
                          fontWeight: isSelected || isToday ? '700' : '400',
                        }}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.footer}>
              <Pressable
                onPress={() => { onChange(today); setOpen(false); }}
                style={[styles.todayBtn, { backgroundColor: c.accentSoft, borderRadius: theme.radii.full, borderCurve: 'continuous' }]}
                accessibilityRole="button"
              >
                <Text style={{ color: c.accent, fontWeight: '700', fontSize: theme.type.body }}>{t('dates.today')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, marginLeft: 4, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 380, padding: 20, borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  todayBtn: { paddingHorizontal: 20, paddingVertical: 10 },
});

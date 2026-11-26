/**
 * Token v2 contract (uiux-plan §c, ticket 21).
 * Locks the contrast-driven value changes + the new shadow/gradient tokens so a
 * future colour tweak cannot silently drop below WCAG contrast again.
 */
import { buildTheme } from '../tokens';

function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = buildTheme('light');
const dark = buildTheme('dark');

describe('token v2 contrast', () => {
  it('light income meets 4.5:1 on surface (emerald-700)', () => {
    expect(light.colors.income).toBe('#047857');
    expect(contrast(light.colors.income, light.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('dark income stays legible', () => {
    expect(contrast(dark.colors.income, dark.colors.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('light inactive tab label meets 3:1 non-text contrast (slate-500)', () => {
    expect(light.colors.tabBarInactive).toBe('#64748B');
    // the floating dock renders on c.surface, not on the legacy tabBarBackground
    expect(contrast(light.colors.tabBarInactive, light.colors.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe('token v2 additions', () => {
  it('exposes the new accent2 violet in both themes', () => {
    expect(light.colors.accent2).toBe('#C084FC');
    expect(dark.colors.accent2).toBe('#7C3AED');
  });

  it('exposes the Dusk sky gradient stops per scheme', () => {
    expect(light.colors.skyGradient).toEqual(['#DAE0FF', '#E9E8FF', '#F6ECFF']);
    expect(dark.colors.skyGradient).toEqual(['#181343', '#2B2770', '#4A2B8F']);
  });

  it('adds a subtle shadows.button next to the FAB glow', () => {
    for (const theme of [light, dark]) {
      expect(theme.shadows.button.shadowOffset).toEqual({ width: 0, height: 2 });
      expect(theme.shadows.button.shadowOpacity).toBe(0.12);
      expect(theme.shadows.button.shadowRadius).toBe(6);
      // the FAB glow must stay heavier than the inline-button shadow
      expect(theme.shadows.fab.shadowOpacity).toBeGreaterThan(theme.shadows.button.shadowOpacity);
      expect(theme.shadows.fab.shadowRadius).toBeGreaterThan(theme.shadows.button.shadowRadius);
    }
    expect(dark.shadows.button.shadowColor).toBe('#000000');
  });
});

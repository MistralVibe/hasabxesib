/**
 * Architecture tripwires (retro output, see .scratch/hasabxesib-v1/RETRO.md).
 * Mechanical rules that code-review kept catching by hand. These tests make
 * them deterministic: a violation fails `npx jest` instead of a review.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) out.push(full);
  }
  return out;
}

const sourceFiles = [...collectSourceFiles(path.join(ROOT, 'app')), ...collectSourceFiles(path.join(ROOT, 'src'))];

describe('architecture tripwires', () => {
  it('never imports chart libraries that require react-native-skia (ADR-0005)', () => {
    const forbidden = ['victory-native', 'react-native-svg', 'react-native-skia'];
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      const text = fs.readFileSync(file, 'utf8');
      for (const line of text.split('\n')) {
        if (/^\s*import\s/.test(line) && forbidden.some((dep) => line.includes(`'${dep}'`) || line.includes(`"${dep}"`))) {
          offenders.push(`${path.relative(ROOT, file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('money *100//100 conversion lives only in src/domain/money.ts (ADR-0003)', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      if (file.endsWith(path.join('src', 'domain', 'money.ts'))) continue;
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/([*/])\s*100\b/.test(line) && /minor|amount/i.test(line)) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('every borderRadius in UI code sets borderCurve alongside (iOS corner clipping)', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      if (!file.endsWith('.tsx')) continue;
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/borderRadius\s*:/.test(line)) {
          const window = lines.slice(i, i + 4).join('\n');
          if (!/borderCurve\s*:/.test(window)) {
            offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the FAB glow (shadows.fab) is reserved for floating elements, inline CTAs use shadows.button', () => {
    const button = fs.readFileSync(path.join(ROOT, 'src', 'components', 'ui', 'Button.tsx'), 'utf8');
    expect(button).toContain('theme.shadows.button');
    expect(button).not.toContain('theme.shadows.fab');

    const fabOwners = sourceFiles.filter((file) => fs.readFileSync(file, 'utf8').includes('theme.shadows.fab'));
    expect(fabOwners.map((file) => path.relative(ROOT, file))).toEqual([path.join('app', '(tabs)', 'home.tsx')]);
  });
});

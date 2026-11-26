import { decodeBase64 } from '../base64';

function encode(text: string): string {
  // Node's Buffer is fine for generating test fixtures.
  return Buffer.from(text, 'utf8').toString('base64');
}

describe('decodeBase64', () => {
  it('round-trips ASCII', () => {
    expect(decodeBase64(encode('{"version":1}'))).toBe('{"version":1}');
  });

  it('round-trips multi-byte UTF-8 (Russian, emoji, TMT manat sign)', () => {
    const text = 'Кошелёк ₼ 😀 مرحبا — 테스트';
    expect(decodeBase64(encode(text))).toBe(text);
  });

  it('strips a data-URL prefix as returned by expo-document-picker on web', () => {
    const json = '{"accounts":[]}';
    expect(decodeBase64(`data:application/json;base64,${encode(json)}`)).toBe(json);
  });

  it('ignores whitespace and missing padding', () => {
    const padded = encode('{"a":1}');
    const stripped = padded.replace(/=+$/, '').replace(/(.{4})/g, '$1\n');
    expect(decodeBase64(stripped)).toBe('{"a":1}');
  });

  it('accepts URL-safe alphabet', () => {
    // "???" encodes to "Pz8/" standard; URL-safe form is "Pz8_".
    expect(decodeBase64('Pz8_')).toBe('???');
  });

  it('rejects invalid characters', () => {
    expect(() => decodeBase64('a!bc')).toThrow(/unexpected character/);
  });

  it('rejects truncated input', () => {
    expect(() => decodeBase64('abcde')).toThrow(/truncated/);
  });
});

/**
 * Pure-TS base64 decoder. Hermes may lack `atob`, and expo-document-picker's
 * `base64: true` option (web) returns a `data:...;base64,` data-URL string,
 * so we decode by hand: no platform APIs, exact UTF-8 handling.
 */

const VALUES = new Map<string, number>(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/-_'.split('').map((c, i) => [
    c,
    i < 64 ? i : i - 64 + 62, // '-' and '-'/'_' are URL-safe aliases for 62/63
  ]),
);

export function decodeBase64(input: string): string {
  // expo-document-picker web hands back a data URL ("data:application/json;base64,…").
  let payload = input;
  if (payload.startsWith('data:') && payload.includes(',')) {
    payload = payload.slice(payload.indexOf(',') + 1);
  }
  payload = payload.replace(/\s+/g, '').replace(/=+$/, '');
  if (payload.length % 4 === 1) {
    throw new Error('Invalid base64: truncated input');
  }

  const bytes = new Uint8Array(Math.floor((payload.length * 3) / 4));
  let byteIndex = 0;
  for (let i = 0; i < payload.length; i += 4) {
    const groupLength = Math.min(4, payload.length - i);
    const chars: number[] = [];
    for (let k = 0; k < groupLength; k++) {
      const value = VALUES.get(payload[i + k]);
      if (value === undefined) throw new Error(`Invalid base64: unexpected character '${payload[i + k]}'`);
      chars.push(value);
    }
    bytes[byteIndex++] = (chars[0] << 2) | (chars[1] >> 4);
    if (groupLength >= 3) bytes[byteIndex++] = (chars[1] << 4) | (chars[2] >> 2);
    if (groupLength >= 4) bytes[byteIndex++] = (chars[2] << 6) | chars[3];
  }

  return utf8Decode(bytes.subarray(0, byteIndex));
}

function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 0x80) {
      out += String.fromCharCode(b);
      i += 1;
    } else if (b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (b < 0xf0) {
      out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else {
      const code = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      out += String.fromCharCode(0xd800 + ((code - 0x10000) >> 10), 0xdc00 + ((code - 0x10000) & 0x3ff));
      i += 4;
    }
  }
  return out;
}

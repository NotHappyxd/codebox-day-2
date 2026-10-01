/* A small synchronous SHA-256 implementation keeps proof-of-work off the UI thread. */
const constants = new Uint32Array(64);
for (let n = 2, i = 0; i < 64; n += 1) {
  let prime = true;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) { prime = false; break; }
  if (!prime) continue;
  constants[i] = (Math.cbrt(n) % 1 * 0x100000000) >>> 0;
  i += 1;
}
const initial = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
const encoder = new TextEncoder();

function sha256(text) {
  const input = encoder.encode(text); const length = input.length; const blocks = Math.ceil((length + 9) / 64); const bytes = new Uint8Array(blocks * 64);
  bytes.set(input); bytes[length] = 0x80;
  const bitLength = length * 8;
  bytes[bytes.length - 4] = bitLength >>> 24; bytes[bytes.length - 3] = bitLength >>> 16; bytes[bytes.length - 2] = bitLength >>> 8; bytes[bytes.length - 1] = bitLength;
  const state = new Uint32Array(initial); const words = new Uint32Array(64);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = (bytes[offset + i * 4] << 24) | (bytes[offset + i * 4 + 1] << 16) | (bytes[offset + i * 4 + 2] << 8) | bytes[offset + i * 4 + 3];
    for (let i = 16; i < 64; i += 1) { const x = words[i - 15], y = words[i - 2]; words[i] = (((x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ x >>> 3) + words[i - 16] + ((y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ y >>> 10) + words[i - 7]) >>> 0; }
    let [a, b, c, d, e, f, g, h] = state;
    for (let i = 0; i < 64; i += 1) { const s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7); const choose = (e & f) ^ (~e & g); const t1 = (h + s1 + choose + constants[i] + words[i]) >>> 0; const s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10); const majority = (a & b) ^ (a & c) ^ (b & c); h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + s0 + majority) >>> 0; }
    state[0] = (state[0] + a) >>> 0; state[1] = (state[1] + b) >>> 0; state[2] = (state[2] + c) >>> 0; state[3] = (state[3] + d) >>> 0; state[4] = (state[4] + e) >>> 0; state[5] = (state[5] + f) >>> 0; state[6] = (state[6] + g) >>> 0; state[7] = (state[7] + h) >>> 0;
  }
  return state;
}
function matches(hash, difficulty) { const bytes = Math.floor(difficulty / 32); for (let i = 0; i < bytes; i += 1) if (hash[i] !== 0) return false; const remaining = difficulty % 32; return !remaining || (hash[bytes] >>> (32 - remaining)) === 0; }
self.onmessage = ({ data: { challenge, difficulty } }) => { for (let nonce = 0; nonce <= Number.MAX_SAFE_INTEGER; nonce += 1) { if (matches(sha256(`${challenge}:${nonce}`), difficulty)) { self.postMessage({ nonce }); return; } } };

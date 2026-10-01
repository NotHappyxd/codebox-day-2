import crypto from 'node:crypto';

// A 23-bit SHA-256 target is about 8.4 million hashes on average.  That is
// roughly 15 seconds on a typical current desktop, but varies by device.
const difficulty = Number.parseInt(process.env.REGISTRATION_POW_DIFFICULTY || '23', 10);
const ttlMs = Number.parseInt(process.env.REGISTRATION_POW_TTL_MS || '300000', 10);
const secret = process.env.REGISTRATION_POW_SECRET || process.env.JWT_SECRET;
const usedChallenges = new Map();

if (!Number.isInteger(difficulty) || difficulty < 16 || difficulty > 28) {
  throw new Error('REGISTRATION_POW_DIFFICULTY must be an integer between 16 and 28.');
}
if (!Number.isInteger(ttlMs) || ttlMs < 30000) {
  throw new Error('REGISTRATION_POW_TTL_MS must be an integer of at least 30000.');
}

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const sign = (value) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
const clientIp = (req) => req.ip || req.socket.remoteAddress || '';

function hasLeadingZeroBits(hash, bits) {
  const completeBytes = Math.floor(bits / 8);
  for (let index = 0; index < completeBytes; index += 1) if (hash[index] !== 0) return false;
  const remainingBits = bits % 8;
  return remainingBits === 0 || (hash[completeBytes] >> (8 - remainingBits)) === 0;
}

function purgeExpired(now = Date.now()) {
  for (const [challenge, expiresAt] of usedChallenges) if (expiresAt <= now) usedChallenges.delete(challenge);
}

export function issueProofOfWork(req) {
  const expiresAt = Date.now() + ttlMs;
  const payload = encode({ nonce: crypto.randomBytes(24).toString('base64url'), expiresAt, difficulty, ip: clientIp(req) });
  return { challenge: `${payload}.${sign(payload)}`, difficulty, expiresAt };
}

export function verifyAndConsumeProofOfWork(req, proof) {
  purgeExpired();
  if (!proof || typeof proof.challenge !== 'string' || !Number.isSafeInteger(proof.nonce) || proof.nonce < 0) {
    return { ok: false, error: 'A valid registration proof is required.' };
  }
  const [payload, signature, ...extra] = proof.challenge.split('.');
  if (!payload || !signature || extra.length || !/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(signature)) {
    return { ok: false, error: 'The registration proof is invalid.' };
  }
  const expected = sign(payload);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) return { ok: false, error: 'The registration proof is invalid.' };

  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return { ok: false, error: 'The registration proof is invalid.' }; }
  if (!data || data.difficulty !== difficulty || !Number.isSafeInteger(data.expiresAt) || data.expiresAt <= Date.now() || data.ip !== clientIp(req)) {
    return { ok: false, error: 'The registration proof has expired. Please try again.' };
  }
  if (usedChallenges.has(proof.challenge)) return { ok: false, error: 'This registration proof has already been used.' };
  const digest = crypto.createHash('sha256').update(`${proof.challenge}:${proof.nonce}`).digest();
  if (!hasLeadingZeroBits(digest, difficulty)) return { ok: false, error: 'The registration proof is invalid.' };

  usedChallenges.set(proof.challenge, data.expiresAt);
  return { ok: true };
}

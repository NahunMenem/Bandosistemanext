import bcrypt from 'bcryptjs';
import { pbkdf2Sync, scryptSync, timingSafeEqual } from 'crypto';

function safeCompareHex(expectedHex: string, actualBuffer: Buffer) {
  const expectedBuffer = Buffer.from(expectedHex, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function verifyWerkzeugPassword(password: string, storedHash: string) {
  const [method, salt, digest] = storedHash.split('$');

  if (!method || !salt || !digest) {
    return false;
  }

  if (method.startsWith('pbkdf2:')) {
    const [, algorithm = 'sha256', iterationsRaw = '1000000'] = method.split(':');
    const iterations = Number.parseInt(iterationsRaw, 10);

    if (!Number.isFinite(iterations)) {
      return false;
    }

    const derived = pbkdf2Sync(password, salt, iterations, digest.length / 2, algorithm);
    return safeCompareHex(digest, derived);
  }

  if (method.startsWith('scrypt:')) {
    const [, nRaw = '32768', rRaw = '8', pRaw = '1'] = method.split(':');
    const n = Number.parseInt(nRaw, 10);
    const r = Number.parseInt(rRaw, 10);
    const p = Number.parseInt(pRaw, 10);

    if (![n, r, p].every(Number.isFinite)) {
      return false;
    }

    const derived = scryptSync(password, salt, digest.length / 2, { N: n, r, p });
    return safeCompareHex(digest, derived);
  }

  return false;
}

export async function verifyPassword(password: string, storedHash: string) {
  if (!storedHash) {
    return false;
  }

  if (!storedHash.includes('$')) {
    return password === storedHash;
  }

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(password, storedHash);
  }

  return verifyWerkzeugPassword(password, storedHash);
}

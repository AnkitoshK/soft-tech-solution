import crypto from 'node:crypto';

export function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signToken(payload) {
  const secret = getEnv('ADMIN_SESSION_SECRET', 'soft-tech-solution-super-secure-admin-secret-key-32chars');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const secret = getEnv('ADMIN_SESSION_SECRET', 'soft-tech-solution-super-secure-admin-secret-key-32chars');
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  
  if (s.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyAdminRequest(request) {
  let cookieVal = null;
  if (request.cookies && typeof request.cookies.get === 'function') {
    cookieVal = request.cookies.get('sts_admin')?.value;
  }
  if (!cookieVal) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)sts_admin=([^;]+)/);
    if (match) {
      cookieVal = decodeURIComponent(match[1]);
    }
  }

  if (cookieVal) {
    const payload = verifyToken(cookieVal);
    if (payload) return payload;
  }

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7));
  }

  return null;
}

export function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const strPass = String(password);
  const strHash = String(storedHash);

  // If plain text fallback (e.g. legacy or env fallback)
  if (!strHash.includes(':')) {
    return strPass === strHash;
  }

  const [salt, key] = strHash.split(':');
  if (!salt || !key) return false;

  try {
    const hash = crypto.pbkdf2Sync(strPass, salt, 10000, 64, 'sha512').toString('hex');
    const keyBuf = Buffer.from(key, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    if (keyBuf.length !== hashBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, hashBuf);
  } catch {
    return false;
  }
}

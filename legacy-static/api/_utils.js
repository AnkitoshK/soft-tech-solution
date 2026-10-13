const crypto = require('crypto');

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function signToken(payload) {
  const header = base64url(JSON.stringify({alg:'HS256',typ:'JWT'}));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', env('ADMIN_SESSION_SECRET')).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h,p,s] = parts;
  const expected = crypto.createHmac('sha256', env('ADMIN_SESSION_SECRET')).update(`${h}.${p}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(p,'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now()/1000)) return null;
  return payload;
}

function setCookie(res, token) {
  res.setHeader('Set-Cookie', `sts_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', 'sts_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}
function auth(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)sts_admin=([^;]+)/);
  return verifyToken(match && decodeURIComponent(match[1]));
}
function supabaseHeaders() {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return {'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json'};
}
function supabaseUrl(path='') { return `${env('SUPABASE_URL')}/rest/v1/${path}`; }
module.exports = {env,signToken,verifyToken,setCookie,clearCookie,auth,supabaseHeaders,supabaseUrl};

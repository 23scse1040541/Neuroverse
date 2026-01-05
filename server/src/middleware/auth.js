import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const secret = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

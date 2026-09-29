import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required. Add it to your .env file before starting the server.');
}

export default function requireAuth(req, res, next) {
  const token = req.cookies.access_token || req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });

  try {
    req.auth = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

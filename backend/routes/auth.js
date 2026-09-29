import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required. Add it to your .env file before starting the server.');
}

const router = Router();

const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 604800000 };
const toUser = (user) => ({ id: user.id, name: user.name, email: user.email });
function session(res, user) {
  res.cookie('access_token', jwt.sign({ sub: user.id, name: user.name, email: user.email }, jwtSecret, { algorithm: 'HS256', expiresIn: '7d' }), cookieOptions);
}
function credentials(body) {
  return { name: typeof body?.name === 'string' ? body.name.trim() : '', email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '', password: typeof body?.password === 'string' ? body.password : '' };
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = credentials(req.body);
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'Use a name, valid email, and password of at least 8 characters.' });
    if (await User.exists({ email })) return res.status(409).json({ error: 'An account with that email already exists.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    session(res, user); return res.status(201).json({ user: toUser(user) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'An account with that email already exists.' });
    return next(error);
  }
});
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentials(req.body); const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    session(res, user); return res.json({ user: toUser(user) });
  } catch (error) { return next(error); }
});
router.post('/logout', (_req, res) => { res.clearCookie('access_token', cookieOptions); res.status(204).end(); });

export default router;

import { Router } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required. Add it to your .env file before starting the server.');
}

const router = Router();

router.post('/token', (req, res) => {
  const { email } = req.body ?? {};

  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  // Demo only: issuing a token from an email alone is not credential verification.
  const token = jwt.sign({ sub: '1', email }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });

  return res.json({ token });
});

export default router;

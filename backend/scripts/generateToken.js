import 'dotenv/config';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required. Add it to your .env file before generating a token.');
}

// Teaching shortcut only: this does not check credentials or authenticate a user.
const token = jwt.sign({ sub: '1' }, jwtSecret, {
  algorithm: 'HS256',
  expiresIn: '15m',
});

console.log(token);

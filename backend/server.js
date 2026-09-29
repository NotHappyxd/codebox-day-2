import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.js';
import todoRoutes from './routes/todos.js';
import requireAuth from './middleware/auth.js';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './services/database.js';

const app = express();
const port = process.env.PORT || 3000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  if (['GET', 'POST', 'PATCH'].includes(req.method)) res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api/v1/auth', authRoutes);
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1/todos', requireAuth, todoRoutes);
app.get('/api/v1/me', requireAuth, (req, res) => res.json({ user: { id: req.auth.sub, name: req.auth.name, email: req.auth.email } }));
app.use('/api', (error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid request identifier.' });
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});
app.use(express.static(path.join(root, 'dist')));
app.use((_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));

connectDatabase().then(() => app.listen(port, () => console.log(`Taskstack is running at http://localhost:${port}`))).catch((error) => {
  console.error('Unable to connect to MongoDB:', error.message); process.exit(1);
});

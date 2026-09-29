import 'dotenv/config';
import express from 'express';
import requireAuth from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import healthRoute from "./routes/health.js";
import { getUsers } from './services/userService.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello from CodeBox!');
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use('/api/v1/health', healthRoute);

app.get('/api/v1/test/users', (req, res) => {
  const search = typeof req.query.search === 'string'
    ? req.query.search.trim().toLowerCase()
    : '';
  const users = getUsers().filter((user) =>
    !search || user.name.toLowerCase().includes(search),
  );

  res.json({ count: users.length, users });
});

app.get('/api/me', requireAuth, (_req, res) => {
  res.json({
    id: 1,
    name: 'Alex',
    email: 'alex@example.com',
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

import { Router } from 'express';
import { findUserById, getUsers } from '../services/userService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getUsers());
});

router.get('/:id', (req, res) => {
  const user = findUserById(Number(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

export default router;

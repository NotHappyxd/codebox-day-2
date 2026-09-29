import { Router } from 'express';
import Todo from '../models/Todo.js';
const router = Router(); const statuses = new Set(['backlog', 'in-progress', 'done']);
const output = (todo) => ({ id: todo.id, title: todo.title, description: todo.description, status: todo.status, order: todo.order, createdAt: todo.createdAt });
router.get('/', async (req, res, next) => { try { res.json({ todos: (await Todo.find({ ownerId: req.auth.sub }).sort({ status: 1, order: 1, createdAt: -1 })).map(output) }); } catch (error) { next(error); } });
router.post('/', async (req, res, next) => { try {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''; const description = typeof req.body?.description === 'string' ? req.body.description.trim() : ''; const status = statuses.has(req.body?.status) ? req.body.status : 'backlog';
  if (!title) return res.status(400).json({ error: 'A task title is required.' });
  const todo = await Todo.create({ ownerId: req.auth.sub, title, description, status, order: await Todo.countDocuments({ ownerId: req.auth.sub, status }) }); return res.status(201).json({ todo: output(todo) });
} catch (error) { next(error); } });
router.patch('/:id', async (req, res, next) => { try {
  const update = {}; if (typeof req.body?.title === 'string' && req.body.title.trim()) update.title = req.body.title.trim(); if (typeof req.body?.description === 'string') update.description = req.body.description.trim(); if (statuses.has(req.body?.status)) update.status = req.body.status; if (Number.isFinite(req.body?.order)) update.order = req.body.order;
  const todo = await Todo.findOneAndUpdate({ _id: req.params.id, ownerId: req.auth.sub }, update, { returnDocument: 'after', runValidators: true }); if (!todo) return res.status(404).json({ error: 'Task not found.' }); return res.json({ todo: output(todo) });
} catch (error) { next(error); } });
export default router;

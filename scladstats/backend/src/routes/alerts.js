import { Router } from 'express';

export const alertsRouter = Router();

alertsRouter.get('/', (_, res) => {
  res.json({ items: [], total: 0 });
});

alertsRouter.post('/rules', (req, res) => {
  res.status(201).json({ ok: true, rule: req.body });
});

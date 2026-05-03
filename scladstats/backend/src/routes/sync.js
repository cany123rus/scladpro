import { Router } from 'express';

export const syncRouter = Router();

syncRouter.post('/run', async (req, res) => {
  const source = req.body?.source || 'orders_sales';
  // На следующем шаге: очередь задач/вызов worker webhook
  return res.status(202).json({ accepted: true, source, note: 'sync job accepted (stub)' });
});

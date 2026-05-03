import { Router } from 'express';

export const stocksRouter = Router();

stocksRouter.get('/risk', (req, res) => {
  res.json({ threshold: Number(req.query.threshold || 20), items: [] });
});

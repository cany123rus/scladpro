import { Router } from 'express';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', (req, res) => {
  res.json({
    revenue: 0,
    orders: 0,
    avgCheck: 0,
    deltaRevenuePct: 0,
    deltaOrdersPct: 0,
    from: req.query.from || null,
    to: req.query.to || null
  });
});

dashboardRouter.get('/timeseries', (req, res) => {
  res.json({ metric: req.query.metric || 'revenue', data: [] });
});

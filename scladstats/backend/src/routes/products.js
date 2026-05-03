import { Router } from 'express';

export const productsRouter = Router();

productsRouter.get('/', (req, res) => {
  res.json({ items: [], total: 0, query: req.query });
});

productsRouter.get('/:sku', (req, res) => {
  res.json({
    sku: req.params.sku,
    series: { revenue: [], orders: [], stock: [] },
    totals: { revenue: 0, orders: 0, avgCheck: 0 }
  });
});

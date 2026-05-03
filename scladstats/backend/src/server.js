import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dashboardRouter } from './routes/dashboard.js';
import { productsRouter } from './routes/products.js';
import { alertsRouter } from './routes/alerts.js';
import { stocksRouter } from './routes/stocks.js';
import { syncRouter } from './routes/sync.js';
import { marketRouter } from './routes/market.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());

const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.get('/', (_, res) => res.sendFile(path.join(frontendDir, 'index.html')));
app.get('/health', (_, res) => res.json({ ok: true, service: 'scladstats-backend' }));
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/stocks', stocksRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/market', marketRouter);

const port = process.env.PORT || 4010;
app.listen(port, () => console.log(`ScladSTATS backend listening on :${port}`));

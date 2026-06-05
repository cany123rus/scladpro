import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

// Return 403 for blocked CORS origins (cors() sets res.statusCode but doesn't end the request on false)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }
  next();
});

const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const heavyLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to this endpoint.' },
});

app.use(globalLimiter);
app.use(express.json());

const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.get('/', (_, res) => res.sendFile(path.join(frontendDir, 'index.html')));
app.get('/health', (_, res) => res.json({ ok: true, service: 'scladstats-backend' }));
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/stocks', stocksRouter);
app.use('/api/v1/alerts', alertsRouter);
app.use('/api/v1/sync', heavyLimiter, syncRouter);
app.use('/api/v1/market', heavyLimiter, marketRouter);

const port = process.env.PORT || 4010;
app.listen(port, () => console.log(`ScladSTATS backend listening on :${port}`));

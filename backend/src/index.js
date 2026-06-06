import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimit.js';
import generateRouter from './routes/generate.js';
import historyRouter from './routes/history.js';
import userRouter from './routes/user.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.onrender\.com$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));
app.use(generalLimiter);

// ─── Health check (Render uses this) ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PixelPost AI API' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/generate', generateRouter);
app.use('/api/history', historyRouter);
app.use('/api/user', userRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ PixelPost AI backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}`);
});

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { apiRouter } from './routes/api.router.js';

dotenv.config();

export const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Latency tracker header
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = performance.now();
  const originalSend = res.send;
  res.send = function (body?: any) {
    if (!res.headersSent) {
      const elapsed = Math.round(performance.now() - start);
      res.setHeader('X-Response-Time-Ms', elapsed);
    }
    return originalSend.call(this, body);
  };
  next();
});

// Root Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.use('/api/v1', apiRouter);

// Serve frontend static assets if built
const candidates = [
  path.resolve(process.cwd(), 'apps', 'web', 'dist'),
  path.resolve(process.cwd(), '..', 'web', 'dist'),
  path.resolve(process.cwd(), 'public')
];

let staticDir: string | undefined;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    staticDir = c;
    break;
  }
}

if (staticDir) {
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir!, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chatbot API Server listening on http://localhost:${PORT}`);
  });
}

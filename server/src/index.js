import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import insightsRoutes from './routes/insights.js';
import chatbotRoutes from './routes/chatbot.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 100 });
app.use(limiter);

const MONGODB_URI = process.env.MONGODB_URI || '';
const PORT = process.env.PORT || 8000;

async function connectDB() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected:', MONGODB_URI);
      return;
    } catch (err) {
      console.error('MongoDB connection error:', err?.message || err);
    }
  }
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    const uri = mem.getUri('neuroverse');
    await mongoose.connect(uri);
    console.log('MongoDB (in-memory) connected');
  } catch (e) {
    console.error('Failed to start in-memory MongoDB:', e);
    process.exit(1);
  }
}

await connectDB();

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/user', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

import express from 'express';
import auth from '../middleware/auth.js';
import Journal from '../models/Journal.js';

const router = express.Router();
router.use(auth);

router.get('/weekly', async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7*24*60*60*1000);
    const entries = await Journal.find({ userId: req.user.id, createdAt: { $gte: since } }).sort({ createdAt: 1 });
    const trend = entries.map(e => ({ date: e.createdAt, stress: e.stress, mood: e.moodScore, emotion: e.emotion }));
    const avgStress = entries.length ? Math.round(entries.reduce((a,b)=>a+b.stress,0)/entries.length) : 0;
    const moodScore = entries.length ? Math.round(entries.reduce((a,b)=>a+b.moodScore,0)/entries.length) : 0;
    const emotionCounts = entries.reduce((acc, e) => { acc[e.emotion]=(acc[e.emotion]||0)+1; return acc; }, {});
    const topEmotion = Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Neutral';
    const summary = `This week your average stress is ${avgStress} and mood score is ${moodScore}. Predominant emotion: ${topEmotion}.`;
    res.json({ trend, avgStress, moodScore, topEmotion, summary });
  } catch (e) { next(e); }
});

export default router;

import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Journal from '../models/Journal.js';

const router = express.Router();
router.use(auth);

router.get('/me', async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).lean();
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json({ id: u._id, email: u.email, name: u.name, xp: u.xp || 0, streakCount: u.streakCount || 0, lastJournalAt: u.lastJournalAt || null });
  } catch (e) { next(e); }
});

router.delete('/me', async (req, res, next) => {
  try {
    await Journal.deleteMany({ userId: req.user.id });
    await User.deleteOne({ _id: req.user.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/consent', async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { consentAcceptedAt: new Date() } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/xp', async (req, res, next) => {
  try {
    const { delta, reason } = req.body || {}
    const d = Number(delta)
    if (!Number.isFinite(d) || d <= 0 || d > 100) return res.status(400).json({ error: 'Invalid delta' })
    const u = await User.findById(req.user.id)
    if (!u) return res.status(404).json({ error: 'Not found' })
    u.xp = (u.xp || 0) + Math.floor(d)
    await u.save()
    res.json({ ok: true, xp: u.xp })
  } catch (e) { next(e) }
})

export default router;

import express from 'express';
import fetch from 'node-fetch';
import Journal from '../models/Journal.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const items = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    const mapped = items.map(j => ({
      id: j._id,
      content: (()=>{ try { return decrypt({ contentEnc: j.contentEnc, iv: j.iv, tag: j.tag }); } catch { return ''; } })(),
      emotion: j.emotion,
      stress: j.stress,
      moodScore: j.moodScore,
      tags: j.tags || [],
      editedAt: j.editedAt,
      attachments: (j.attachments||[]).slice(0,3),
      createdAt: j.createdAt
    }));
    res.json(mapped);
  } catch (e) { next(e); }
});

// Search by tag/emotion (encrypted content cannot be searched server-side)
router.get('/search', async (req, res, next) => {
  try {
    const { tag, emotion } = req.query;
    const q = { userId: req.user.id };
    if (tag) q.tags = tag;
    if (emotion) q.emotion = emotion;
    const items = await Journal.find(q).sort({ createdAt: -1 }).limit(100);
    const mapped = items.map(j => ({
      id: j._id,
      content: (()=>{ try { return decrypt({ contentEnc: j.contentEnc, iv: j.iv, tag: j.tag }); } catch { return ''; } })(),
      emotion: j.emotion,
      stress: j.stress,
      moodScore: j.moodScore,
      tags: j.tags || [],
      editedAt: j.editedAt,
      createdAt: j.createdAt
    }));
    res.json(mapped);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { text, tags, attachments } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    let emotion = 'Neutral';
    let stress = 50;
    try {
      const aiUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8001') + '/analyze';
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 3500);
      const r = await fetch(aiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: ctrl.signal });
      clearTimeout(to);
      if (r.ok) {
        const data = await r.json();
        if (data?.emotion) emotion = data.emotion;
        if (typeof data?.stress === 'number') stress = data.stress;
      }
    } catch (_) { /* fallback to defaults */ }
    const { contentEnc, iv, tag } = encrypt(text);
    const cleanTags = Array.isArray(tags) ? tags.slice(0,10).map(t=>String(t).slice(0,24)) : [];
    const cleanAtt = Array.isArray(attachments) ? attachments.slice(0,3).map(a=>({ type: String(a.type||'').slice(0,50), data: String(a.data||'').slice(0, 500000) })) : [];
    const doc = await Journal.create({ userId: req.user.id, contentEnc, iv, tag, emotion, stress, moodScore: 100 - stress, tags: cleanTags, attachments: cleanAtt });
    // XP + Streak update (basic): +10 XP per journal, streak increments if last was yesterday or today
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        const now = new Date();
        const last = user.lastJournalAt ? new Date(user.lastJournalAt) : null;
        let streak = user.streakCount || 0;
        if (last) {
          const diffDays = Math.floor((now - new Date(last.setHours(0,0,0,0))) / 86400000);
          if (diffDays === 1) streak += 1; else if (diffDays > 1) streak = 1;
        } else streak = 1;
        user.xp = (user.xp || 0) + 10;
        user.streakCount = streak;
        user.lastJournalAt = now;
        await user.save();
      }
    } catch {}
    res.status(201).json({ id: doc._id, emotion: doc.emotion, stress: doc.stress, moodScore: doc.moodScore });
  } catch (e) { next(e); }
});

// Edit journal content/tags
router.put('/:id', async (req, res, next) => {
  try {
    const { text, tags, attachments } = req.body || {};
    const set = {};
    if (typeof text === 'string') {
      const { contentEnc, iv, tag } = encrypt(text);
      set.contentEnc = contentEnc; set.iv = iv; set.tag = tag; set.editedAt = new Date();
    }
    if (Array.isArray(tags)) set.tags = tags.slice(0,10).map(t=>String(t).slice(0,24));
    if (Array.isArray(attachments)) set.attachments = attachments.slice(0,3).map(a=>({ type: String(a.type||'').slice(0,50), data: String(a.data||'').slice(0, 500000) }));
    const r = await Journal.updateOne({ _id: req.params.id, userId: req.user.id }, { $set: set });
    if (r.matchedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Journal.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;

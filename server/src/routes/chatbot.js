import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.post('/', async (req, res) => {
  const { message } = req.body || {};
  const canned = [
    "I'm here for you. Want to tell me more about how you're feeling?",
    "That sounds tough. Let's take a deep breath together.",
    "It's okay to feel this way. What helped you last time?",
    "I appreciate you sharing this with me. One small step at a time."
  ];
  const reply = (message || '').toLowerCase().includes('anxious')
    ? "When anxiety rises, try a 4-7-8 breathing cycle. Would you like me to guide you?"
    : canned[Math.floor(Math.random()*canned.length)];
  res.json({ reply });
});

export default router;

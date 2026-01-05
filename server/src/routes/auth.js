import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, consent } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const user = new User({ email, name, consentAcceptedAt: consent ? new Date() : undefined });
    await user.setPassword(password);
    await user.save();
    const secret = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await user.validatePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const secret = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) { next(e); }
});

export default router;

// Google Login
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const oauthClient = new OAuth2Client({ clientId: googleClientId });

router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken || !googleClientId) return res.status(400).json({ error: 'Google login not configured' });
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const name = payload?.name || '';
    if (!email) return res.status(400).json({ error: 'Google token invalid' });
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, consentAcceptedAt: new Date() });
      await user.setPassword(Math.random().toString(36).slice(2));
      await user.save();
    }
    const secret = process.env.JWT_SECRET || 'dev_insecure_secret_change_me';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (e) { next(e); }
});

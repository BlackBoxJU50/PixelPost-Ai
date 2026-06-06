import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getUser, updateUserPrefs, deleteUser, getQuotaUsage, saveApiKey, getApiKeys } from '../services/db.js';
import admin from '../services/firebase.js';
import crypto from 'crypto';

const router = express.Router();

// GET /api/user/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await getUser(req.user.uid);
    const quotaUsed = await getQuotaUsage(req.user.uid);
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      displayName: req.user.displayName,
      photoURL: req.user.photoURL,
      plan: user?.plan || 'free',
      preferences: user?.preferences || {},
      quota: { used: quotaUsed, limit: 20 },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// PATCH /api/user/preferences
router.patch('/preferences', authenticate, async (req, res) => {
  try {
    const allowed = ['defaultPlatforms', 'defaultModel', 'tone', 'language', 'emailNotifications'];
    const prefs = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) prefs[k] = req.body[k];
    });
    const updated = await updateUserPrefs(req.user.uid, prefs);
    res.json({ success: true, preferences: updated.preferences });
  } catch (err) {
    console.error('Prefs update error:', err);
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

// POST /api/user/api-key — save a custom API key (stored as hash)
router.post('/api-key', authenticate, async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'provider and apiKey are required.' });
    }
    const validProviders = ['openai', 'anthropic'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider.' });
    }
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyMasked = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
    const saved = await saveApiKey(req.user.uid, { provider, keyHash, keyMasked });
    res.json({ success: true, key: saved });
  } catch (err) {
    console.error('Save API key error:', err);
    res.status(500).json({ error: 'Failed to save API key.' });
  }
});

// GET /api/user/api-keys
router.get('/api-keys', authenticate, async (req, res) => {
  try {
    const keys = await getApiKeys(req.user.uid);
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch API keys.' });
  }
});

// DELETE /api/user/account — GDPR right to erasure
router.delete('/account', authenticate, async (req, res) => {
  try {
    await deleteUser(req.user.uid);
    await admin.auth().deleteUser(req.user.uid);
    res.json({ success: true, message: 'Account deleted. All data will be purged.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

export default router;

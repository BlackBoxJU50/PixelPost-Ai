import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getGenerations, deleteGeneration } from '../services/db.js';

const router = express.Router();

// GET /api/history?page=1&limit=20&platform=instagram&search=beach
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, platform, search } = req.query;
    const result = await getGenerations(req.user.uid, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50),
      platform,
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await deleteGeneration(req.params.id, req.user.uid);
    res.json({ success: true });
  } catch (err) {
    console.error('History delete error:', err);
    res.status(500).json({ error: 'Failed to delete history entry.' });
  }
});

export default router;

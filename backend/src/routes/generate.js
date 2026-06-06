import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { generateLimiter } from '../middleware/rateLimit.js';
import { uploadImage, toBase64 } from '../services/storage.js';
import { generatePosts } from '../services/ai.js';
import { saveGeneration, getQuotaUsage, getUser } from '../services/db.js';

const router = express.Router();

// Multer: store in memory (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type. Use JPEG, PNG, WebP, GIF, or HEIC.'));
  },
});

// ─── FREE TIER QUOTA ─────────────────────────────────────────────────────────
const FREE_QUOTA = 20;

/**
 * POST /api/generate
 * Body: multipart/form-data { image, platforms (JSON array), model, tone, language, customApiKey? }
 */
router.post('/', authenticate, generateLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { platforms: platformsRaw, model = 'standard', tone = 'casual', language = 'English', customApiKey } = req.body;

    let platforms;
    try {
      platforms = typeof platformsRaw === 'string' ? JSON.parse(platformsRaw) : platformsRaw;
    } catch {
      return res.status(400).json({ error: 'Invalid platforms format. Send a JSON array.' });
    }

    const validPlatforms = ['facebook', 'instagram', 'twitter'];
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'Select at least one platform.' });
    }
    const filteredPlatforms = platforms.filter((p) => validPlatforms.includes(p));
    if (filteredPlatforms.length === 0) {
      return res.status(400).json({ error: 'Invalid platform(s). Choose from: facebook, instagram, twitter.' });
    }

    // ─── Quota check for free-tier users ──────────────────────────────────────
    const user = await getUser(req.user.uid);
    const plan = user?.plan || 'free';
    if (plan === 'free') {
      const used = await getQuotaUsage(req.user.uid);
      if (used >= FREE_QUOTA) {
        return res.status(429).json({
          error: 'Monthly quota exceeded.',
          quota: { used, limit: FREE_QUOTA, plan },
        });
      }
    }

    // ─── Process image ────────────────────────────────────────────────────────
    const [imageBase64, uploadResult] = await Promise.all([
      toBase64(req.file.buffer),
      uploadImage(req.file.buffer, req.file.mimetype),
    ]);

    // ─── Generate with AI ─────────────────────────────────────────────────────
    const result = await generatePosts(imageBase64, filteredPlatforms, {
      model,
      tone,
      language,
      customApiKey,
    });

    // ─── Save to history ──────────────────────────────────────────────────────
    const saved = await saveGeneration({
      userId: req.user.uid,
      imageUrl: uploadResult.url,
      platforms: filteredPlatforms,
      modelUsed: result.model,
      outputs: result.posts,
    });

    res.json({
      success: true,
      generationId: saved.id,
      imageUrl: uploadResult.url,
      posts: result.posts,
      provider: result.provider,
      model: result.model,
      quota: plan === 'free' ? { used: (await getQuotaUsage(req.user.uid)), limit: FREE_QUOTA } : null,
    });
  } catch (err) {
    console.error('Generate error:', err);
    if (err.message?.includes('Unsupported file type')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.status === 429 || err.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'AI provider quota exceeded. Please try again later.' });
    }
    res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
});

export default router;

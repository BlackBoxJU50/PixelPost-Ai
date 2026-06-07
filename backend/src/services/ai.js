import OpenAI from 'openai';
import Groq from 'groq-sdk';

// ─── Platform constraints ──────────────────────────────────────────────────────
const PLATFORM_CONFIGS = {
  facebook: {
    maxChars: 500,
    hashtagStyle: 'minimal (1-3 hashtags)',
    tone: 'conversational, storytelling, community-oriented',
    emojiUsage: 'moderate',
  },
  instagram: {
    maxChars: 2200,
    hashtagStyle: 'heavy (20-30 hashtags)',
    tone: 'visual, lifestyle-focused, aspirational',
    emojiUsage: 'high',
  },
  twitter: {
    maxChars: 280,
    hashtagStyle: 'targeted (1-2 hashtags)',
    tone: 'punchy, concise, witty, conversational',
    emojiUsage: 'selective',
  },
};

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildSystemPrompt(platforms, tonePreference = 'casual', language = 'English') {
  const platformInstructions = platforms
    .map((p) => {
      const cfg = PLATFORM_CONFIGS[p];
      return `
**${p.toUpperCase()}**:
- Max characters: ${cfg.maxChars}
- Hashtag style: ${cfg.hashtagStyle}
- Tone: ${cfg.tone}
- Emoji usage: ${cfg.emojiUsage}`;
    })
    .join('\n');

  return `You are an expert social media copywriter who specializes in creating platform-native content.
Analyze the provided image carefully and generate engaging social media posts.

User's preferred tone: ${tonePreference}
Language: ${language}

Platform requirements:
${platformInstructions}

CRITICAL: Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "posts": [
    {
      "platform": "facebook|instagram|twitter",
      "caption": "the full caption text",
      "hashtags": ["hashtag1", "hashtag2"],
      "emoji_suggestion": "relevant emojis",
      "character_count": 123,
      "tip": "one brief platform-specific tip"
    }
  ]
}

Generate one post object per platform requested. Be creative, authentic, and platform-appropriate.`;
}

// ─── OpenAI Provider ─────────────────────────────────────────────────────────
async function generateWithOpenAI(imageBase64, platforms, options, apiKey) {
  const client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  const model = options.model === 'ultra' ? 'gpt-4o' : 'gpt-4o-mini';

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(platforms, options.tone, options.language),
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: `Generate optimized posts for these platforms: ${platforms.join(', ')}`,
          },
        ],
      },
    ],
    max_tokens: 1500,
    temperature: 0.8,
  });

  const raw = response.choices[0].message.content.trim();
  return JSON.parse(raw);
}

// ─── Groq Provider (FREE tier) ────────────────────────────────────────────────
// Groq uses llava model for vision (free, fast)
async function generateWithGroq(imageBase64, platforms, options) {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(platforms, options.tone, options.language),
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: `Generate optimized posts for these platforms: ${platforms.join(', ')}. Return valid JSON only.`,
          },
        ],
      },
    ],
    max_tokens: 1500,
    temperature: 0.8,
  });

  let raw = response.choices[0].message.content.trim();
  // Strip markdown code fences if present
  raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(raw);
}

// ─── Main factory ─────────────────────────────────────────────────────────────
/**
 * @param {string} imageBase64 - base64 JPEG image
 * @param {string[]} platforms - ['facebook','instagram','twitter']
 * @param {{ model: 'standard'|'enhanced'|'ultra'|'custom', tone: string, language: string, customApiKey?: string }} options
 * @returns {{ posts: Post[], provider: string, model: string }}
 */
export async function generatePosts(imageBase64, platforms, options = {}) {
  const { model = 'standard', customApiKey } = options;

  let result;
  let usedProvider;
  let usedModel;

  if (customApiKey) {
    // User's own OpenAI key
    result = await generateWithOpenAI(imageBase64, platforms, options, customApiKey);
    usedProvider = 'openai-custom';
    usedModel = 'gpt-4o';
  } else if (model === 'standard') {
    // Free tier → Groq
    result = await generateWithGroq(imageBase64, platforms, options);
    usedProvider = 'groq';
    usedModel = 'llama-4-scout';
  } else {
    // Pro/Ultra → OpenAI
    result = await generateWithOpenAI(imageBase64, platforms, options, null);
    usedProvider = 'openai';
    usedModel = model === 'ultra' ? 'gpt-4o' : 'gpt-4o-mini';
  }

  // Validate & enrich character counts and AI Optimization scores
  if (result?.posts) {
    result.posts = await Promise.all(result.posts.map(async (post) => {
      let aiAnalysis = null;
      
      // Call Python Microservice for Virality & Sentiment Scoring if URL is configured
      if (process.env.PYTHON_SERVICE_URL && post.caption) {
        try {
          const res = await fetch(`${process.env.PYTHON_SERVICE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: post.caption })
          });
          if (res.ok) {
            aiAnalysis = await res.json();
          }
        } catch (err) {
          console.warn('Python AI Optimization service unavailable:', err.message);
        }
      }

      return {
        ...post,
        character_count: (post.caption || '').length + (post.hashtags || []).join(' ').length,
        platform_limit: PLATFORM_CONFIGS[post.platform]?.maxChars || 0,
        ai_optimization: aiAnalysis
      };
    }));
  }

  return { ...result, provider: usedProvider, model: usedModel };
}

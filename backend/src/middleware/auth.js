import admin from '../services/firebase.js';
import { upsertUser } from '../services/db.js';

/**
 * Verifies Firebase ID token from Authorization header
 * Attaches req.user = { uid, email, displayName, photoURL, provider }
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Upsert user into Supabase on every request (keeps data fresh)
    const provider = decoded.firebase?.sign_in_provider || 'email';
    await upsertUser({
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name || decoded.email?.split('@')[0],
      photoURL: decoded.picture || null,
      provider,
    });

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name,
      photoURL: decoded.picture,
      provider,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Helper function to fetch the signing key from Microsoft
function getSigningKey(kid) {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        const signingKey = key.getPublicKey() || key.rsaPublicKey;
        resolve(signingKey);
      }
    });
  });
}

// Helper function to decode and verify Microsoft JWT tokens
async function verifyMicrosoftToken(token) {
  const isDiag = process.env.AUTH_DIAGNOSTICS === 'true';
  
  const decodedToken = jwt.decode(token, { complete: true });
  if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
    if (isDiag) console.error('[DIAGNOSTIC ERROR] jwt.decode returned null or header is invalid');
    throw new Error('Invalid token structure');
  }

  if (isDiag) {
    console.log('[DIAGNOSTIC] Decoded Token metadata:', {
      kid: decodedToken.header?.kid,
      alg: decodedToken.header?.alg,
      iss: decodedToken.payload?.iss,
      aud: decodedToken.payload?.aud,
      exp: decodedToken.payload?.exp,
      nbf: decodedToken.payload?.nbf,
      iat: decodedToken.payload?.iat,
      ver: decodedToken.payload?.ver,
      tid: decodedToken.payload?.tid
    });
  }

  const signingKey = await getSigningKey(decodedToken.header.kid);
  
  return new Promise((resolve, reject) => {
    jwt.verify(token, signingKey, {
      // Allow verification without strict audience checking here to ease custom client registrations,
      // but in strict mode we would check: audience: process.env.AZURE_CLIENT_ID
    }, (err, decoded) => {
      if (err) {
        if (isDiag) {
          console.error('[DIAGNOSTIC ERROR] jwt.verify validation failed:', {
            name: err.name,
            message: err.message
          });
        }
        reject(err);
      } else {
        if (isDiag) console.log('[DIAGNOSTIC] jwt.verify signature verification succeeded');
        resolve(decoded);
      }
    });
  });
}


// POST /api/auth/microsoft
router.post('/microsoft', async (req, res) => {
  const { idToken, email: bypassEmail, profileImage: incomingProfileImage } = req.body;
  const isBypass = process.env.BYPASS_MICROSOFT_AUTH === 'true';

  let email = '';
  let name = '';
  let profileImage = '';

  try {
    if (isBypass && bypassEmail) {
      // Bypass Mode: trust email directly for local development and testing
      email = bypassEmail.toLowerCase().trim();
      name = email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      console.log(`[AUTH] Bypass mode login for: ${email}`);
    } else {
      // Production Mode: Verify the Microsoft token
      if (!idToken) {
        return res.status(400).json({ message: 'Microsoft ID Token is required.' });
      }

      const decoded = await verifyMicrosoftToken(idToken);
      
      // Extract user info from claims
      email = (decoded.email || decoded.preferred_username || decoded.upn || '').toLowerCase().trim();
      name = decoded.name || email.split('@')[0];
      
      console.log(`[AUTH] Microsoft token verified for: ${email}`);
    }

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve user email from authentication provider.' });
    }

    // Lookup user in the database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // If user is not in database, reject access
    if (!user) {
      console.warn(`[AUTH] Access Denied: ${email} is not pre-approved in the database.`);
      return res.status(403).json({ 
        message: 'Access Denied: Your email address is not authorized to access this system. Please contact your administrator.',
        email
      });
    }

    // If user is inactive, reject access
    if (!user.isActive) {
      console.warn(`[AUTH] Access Denied: Approved user ${email} is currently inactive.`);
      return res.status(403).json({ 
        message: 'Access Denied: Your account is currently inactive. Please contact your administrator.',
        email
      });
    }

    // Update profile image if one was fetched from MS Graph
    if (incomingProfileImage && user.profileImage !== incomingProfileImage) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileImage: incomingProfileImage }
      });
      user.profileImage = incomingProfileImage;
      console.log(`[AUTH] Updated profile image for user: ${email}`);
    }

    // Generate local JWT token
    const jwtSecret = process.env.JWT_SECRET || 'tks_jwt_secret_key_change_me_in_prod';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '8h' } // 8 hours session duration
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive
      }
    });

  } catch (error) {
    if (process.env.AUTH_DIAGNOSTICS === 'true') {
      console.error('[DIAGNOSTIC ERROR] POST /microsoft caught exception:', {
        name: error.name,
        message: error.message
      });
    }
    return res.status(500).json({ 
      message: 'Authentication failed. Please verify your Microsoft credentials and try again.'
    });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Fetching current user failed:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;

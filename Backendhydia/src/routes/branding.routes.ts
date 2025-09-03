import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /branding/logo?org=org_slug
// Serves organization-specific logo if exists under /logo/<org>.png else /logo/default.png
router.get('/logo', (req, res) => {
  const org = String(req.query.org || '').toLowerCase().replace(/[^a-z0-9-_]/g, '');

  const logosDir = path.resolve(process.cwd(), 'logo');
  const defaultLogo = path.join(logosDir, 'default.svg');
  const orgPng = org ? path.join(logosDir, `${org}.png`) : '';
  const orgSvg = org ? path.join(logosDir, `${org}.svg`) : '';

  const candidate = [orgSvg, orgPng, defaultLogo].find(p => p && fs.existsSync(p));

  const chosen = candidate || defaultLogo;
  const ext = path.extname(chosen).toLowerCase();
  const type = ext === '.svg' ? 'image/svg+xml' : 'image/png';

  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:;");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.type(type);
  res.sendFile(chosen);
});

export default router;

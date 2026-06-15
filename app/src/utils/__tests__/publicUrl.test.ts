/**
 * Tests for the public-URL resolver used by push notifications and
 * the AD4M-connect popup. See utils/publicUrl.ts.
 */

import { isPublicOrigin, resolvePublicAppUrl } from '../publicUrl';

describe('isPublicOrigin', () => {
  it('accepts public https origins', () => {
    expect(isPublicOrigin('https://fluxsocial.netlify.app')).toBe(true);
    expect(isPublicOrigin('https://fluxsocial-dev.netlify.app')).toBe(true);
  });

  it('accepts public http origins (covers older non-TLS deployments)', () => {
    expect(isPublicOrigin('http://flux.example.com')).toBe(true);
  });

  it('rejects the Capacitor in-app scheme', () => {
    expect(isPublicOrigin('capacitor://localhost')).toBe(false);
  });

  it('rejects iOS WKWebView in-app scheme', () => {
    expect(isPublicOrigin('ionic://localhost')).toBe(false);
  });

  it('rejects localhost across schemes and ports', () => {
    expect(isPublicOrigin('http://localhost')).toBe(false);
    expect(isPublicOrigin('http://localhost:3030')).toBe(false);
    expect(isPublicOrigin('https://localhost')).toBe(false);
    expect(isPublicOrigin('http://127.0.0.1:3030')).toBe(false);
    expect(isPublicOrigin('http://[::1]:3030')).toBe(false);
  });

  it('rejects .local mDNS hosts', () => {
    expect(isPublicOrigin('http://my-mac.local:3030')).toBe(false);
  });

  it('rejects empty / malformed input', () => {
    expect(isPublicOrigin('')).toBe(false);
    expect(isPublicOrigin(null)).toBe(false);
    expect(isPublicOrigin(undefined)).toBe(false);
    expect(isPublicOrigin('not a url')).toBe(false);
  });
});

describe('resolvePublicAppUrl', () => {
  describe('VITE_PUBLIC_URL takes precedence', () => {
    it('uses the env var even when window.location.origin is public', () => {
      const url = resolvePublicAppUrl({
        envPublicUrl: 'https://fluxsocial-dev.netlify.app',
        windowOrigin: 'https://some-preview.netlify.app',
        isProduction: false,
      });
      expect(url).toBe('https://fluxsocial-dev.netlify.app');
    });

    it('uses the env var even when window.location.origin is capacitor', () => {
      const url = resolvePublicAppUrl({
        envPublicUrl: 'https://fluxsocial.netlify.app',
        windowOrigin: 'capacitor://localhost',
        isProduction: true,
      });
      expect(url).toBe('https://fluxsocial.netlify.app');
    });

    it('strips a trailing slash from the env var', () => {
      const url = resolvePublicAppUrl({
        envPublicUrl: 'https://fluxsocial.netlify.app/',
        windowOrigin: 'capacitor://localhost',
        isProduction: true,
      });
      expect(url).toBe('https://fluxsocial.netlify.app');
    });

    it('ignores blank env values and falls through', () => {
      const url = resolvePublicAppUrl({
        envPublicUrl: '   ',
        windowOrigin: 'https://fluxsocial-dev.netlify.app',
        isProduction: false,
      });
      expect(url).toBe('https://fluxsocial-dev.netlify.app');
    });
  });

  describe('window.location.origin when public', () => {
    it('uses it for a netlify preview deploy', () => {
      const url = resolvePublicAppUrl({
        windowOrigin: 'https://deploy-preview-580--fluxsocial-dev.netlify.app',
        isProduction: false,
      });
      expect(url).toBe('https://deploy-preview-580--fluxsocial-dev.netlify.app');
    });

    it('uses it for the production domain', () => {
      const url = resolvePublicAppUrl({
        windowOrigin: 'https://fluxsocial.netlify.app',
        isProduction: true,
      });
      expect(url).toBe('https://fluxsocial.netlify.app');
    });
  });

  describe('fallback when neither env nor window are usable', () => {
    it('reports the bug exactly: capacitor://localhost in a dev build falls back to fluxsocial-dev', () => {
      const url = resolvePublicAppUrl({
        windowOrigin: 'capacitor://localhost',
        isProduction: false,
      });
      expect(url).toBe('https://fluxsocial-dev.netlify.app');
      // The whole point of the fix: this URL must NOT carry the
      // Capacitor scheme in the path or hostname.
      expect(url.startsWith('capacitor:')).toBe(false);
      expect(url.includes('capacitor')).toBe(false);
    });

    it('capacitor://localhost in a production build falls back to fluxsocial', () => {
      const url = resolvePublicAppUrl({
        windowOrigin: 'capacitor://localhost',
        isProduction: true,
      });
      expect(url).toBe('https://fluxsocial.netlify.app');
    });

    it('localhost in a dev build falls back rather than producing localhost links', () => {
      const url = resolvePublicAppUrl({
        windowOrigin: 'http://localhost:3030',
        isProduction: false,
      });
      expect(url).toBe('https://fluxsocial-dev.netlify.app');
    });

    it('null / undefined origin falls back', () => {
      const url = resolvePublicAppUrl({ windowOrigin: null, isProduction: false });
      expect(url).toBe('https://fluxsocial-dev.netlify.app');
    });
  });

  describe('regression — the original bug report', () => {
    it('mobile dev build sharing /communities/.../conversation yields fluxsocial-dev.netlify.app', () => {
      const base = resolvePublicAppUrl({
        windowOrigin: 'capacitor://localhost',
        isProduction: false,
      });
      const deepLink =
        base + '/#/communities/QmzSYwdfbx2Z2txdwyXCCuowT5q1jM7SrRecNVeTbB32oz14m28/iluulaknboyqppochknhpcbg/conversation';
      // Should look exactly like the documented "correct" form.
      expect(deepLink).toMatch(
        /^https:\/\/fluxsocial-dev\.netlify\.app\/#\/communities\/[A-Za-z0-9]+\/[a-z]+\/conversation$/,
      );
    });
  });
});

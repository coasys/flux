/**
 * Resolve the public-facing URL of this Flux deployment.
 *
 * On web, `window.location.origin` is correct (e.g.
 * `https://fluxsocial-dev.netlify.app`). On Capacitor (iOS / Android),
 * `window.location.origin` is `capacitor://localhost` — a scheme that
 * only resolves inside the running app. Any URL constructed from it
 * (deep links from push notifications, share URLs, app icon URLs sent
 * to remote services) is broken for everyone except the originating
 * device, and broken even there once the app reinstalls.
 *
 * Resolution order:
 *   1. `VITE_PUBLIC_URL` (build-time env var) — explicit override.
 *      Always preferred when set; this is what mobile / native builds
 *      should ship with.
 *   2. `window.location.origin`, when it points at a real public host
 *      (not `capacitor:`, not bare `localhost`).
 *   3. Hardcoded fallback to `https://fluxsocial.netlify.app` for prod
 *      and `https://fluxsocial-dev.netlify.app` for non-prod builds.
 *      These are the canonical Coasys-managed Flux deployments.
 *
 * The fallback is only reached when (a) no env var is set AND
 * (b) `window.location.origin` is unusable. It exists so the bug
 * surfaces as "links go to the wrong-but-public site" rather than
 * "links 404 silently on every device that didn't originate them."
 * The right long-term fix is to always ship a `VITE_PUBLIC_URL`.
 *
 * Pure module — no Capacitor imports. The presence of `capacitor:`
 * is the signal we need; we don't have to ask the SDK.
 */

const PROD_FALLBACK = 'https://fluxsocial.netlify.app';
const DEV_FALLBACK = 'https://fluxsocial-dev.netlify.app';

/**
 * Return true when `origin` is a real public-facing URL we can include
 * in deep links, vs. an in-app or localhost-only scheme.
 */
export function isPublicOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
    if (host.endsWith('.local')) return false;
    return true;
  } catch {
    return false;
  }
}

export interface ResolveOptions {
  /** From `import.meta.env.VITE_PUBLIC_URL`. */
  envPublicUrl?: string;
  /** Usually `window.location.origin`. */
  windowOrigin?: string | null;
  /**
   * Whether this is a production build. Used only to choose between
   * `PROD_FALLBACK` and `DEV_FALLBACK` when both env + window are
   * unusable. Defaults to false.
   */
  isProduction?: boolean;
}

/**
 * Pure resolver — kept separate from {@link publicAppUrl} so tests
 * can exercise every branch without monkey-patching globals.
 */
export function resolvePublicAppUrl(opts: ResolveOptions): string {
  const env = opts.envPublicUrl?.trim();
  if (env) {
    return stripTrailingSlash(env);
  }
  if (isPublicOrigin(opts.windowOrigin)) {
    return stripTrailingSlash(opts.windowOrigin as string);
  }
  return opts.isProduction ? PROD_FALLBACK : DEV_FALLBACK;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

/**
 * The URL Flux should advertise to anything outside the device:
 * push-notification deep links, share buttons, app-icon URLs sent to
 * remote services, etc.
 *
 * Wraps {@link resolvePublicAppUrl} with the runtime-side reads
 * (`import.meta.env`, `window.location`). Tests should call
 * `resolvePublicAppUrl` directly.
 */
export function publicAppUrl(): string {
  const envPublicUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_PUBLIC_URL as string | undefined)
      : undefined;
  const isProduction =
    typeof import.meta !== 'undefined' && import.meta.env
      ? Boolean(import.meta.env.PROD)
      : false;
  const windowOrigin =
    typeof window !== 'undefined' && window.location ? window.location.origin : null;
  return resolvePublicAppUrl({ envPublicUrl, windowOrigin, isProduction });
}

/** Convenience for the icon URL we share with push services etc. */
export function publicIconUrl(): string {
  return publicAppUrl() + '/icon.png';
}

/**
 * Flux debug logger — opt-in tracing to diagnose empty-message / empty-plugin-list
 * regressions against the AD4M typed-RDF-literals branch (coasys/ad4m#874).
 *
 * Enable in browser DevTools console:
 *
 *   localStorage.setItem('flux_debug', '1');   // enable, then reload
 *   localStorage.removeItem('flux_debug');     // disable, then reload
 *
 * Or via env at build time:  VITE_FLUX_DEBUG=1
 *
 * All log lines are prefixed `[flux-debug]` so they're grep-friendly in a
 * captured console dump.  Objects are shallow-cloned + JSON-stringified so a
 * live-updating Ad4mModel reference does not lie about its earlier state in
 * the browser's collapsible object viewer.
 */

let cachedEnabled: boolean | null = null;

function computeEnabled(): boolean {
  // Build-time env (Vite) — takes precedence, allows shipping a debug build
  try {
    // Vite injects import.meta.env; older bundlers won't have it.
    // Wrapped in try because static access to import.meta throws in CommonJS.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any)?.env;
    if (env && (env.VITE_FLUX_DEBUG === '1' || env.VITE_FLUX_DEBUG === 'true')) return true;
  } catch {
    /* not in a Vite context */
  }
  // Runtime toggle — localStorage in the browser
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('flux_debug') === '1') return true;
  } catch {
    /* SSR or restricted context */
  }
  // Node/Deno process env — for CI test runs
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (globalThis as any).process;
    if (p?.env?.FLUX_DEBUG === '1' || p?.env?.FLUX_DEBUG === 'true') return true;
  } catch {
    /* no process */
  }
  return false;
}

/** Whether flux-debug logging is currently active. Cached after first call for perf. */
export function isFluxDebugEnabled(): boolean {
  if (cachedEnabled === null) cachedEnabled = computeEnabled();
  return cachedEnabled;
}

/**
 * Force-refresh the cached debug flag (useful after `localStorage.setItem`
 * without a full page reload). Call from the console:
 *   window.__fluxDebugRefresh?.()
 */
function refreshFluxDebug(): boolean {
  cachedEnabled = computeEnabled();
  return cachedEnabled;
}
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__fluxDebugRefresh = refreshFluxDebug;
} catch {
  /* SSR */
}

/**
 * Structured debug log. First argument is a short "scope" (component / module),
 * second is a short event name, third is a payload object.  All are JSON-safe.
 *
 * @example
 *   fluxDebug('MessageList', 'query.result', { channelId, count, totalCount });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fluxDebug(scope: string, event: string, payload?: Record<string, any>): void {
  if (!isFluxDebugEnabled()) return;
  const safe = payload ? safeClone(payload) : undefined;
  // eslint-disable-next-line no-console
  console.log(`[flux-debug] ${scope}: ${event}`, safe ?? '');
}

/**
 * Debug warn variant — for suspicious-but-not-error cases (e.g. empty result
 * where we expected data). Always shown when debug is on.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fluxDebugWarn(scope: string, event: string, payload?: Record<string, any>): void {
  if (!isFluxDebugEnabled()) return;
  const safe = payload ? safeClone(payload) : undefined;
  // eslint-disable-next-line no-console
  console.warn(`[flux-debug] ${scope}: ${event}`, safe ?? '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeClone(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      out[k] = v;
    } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = { __array: true, length: v.length, sample: v.slice(0, 3).map(shallowSample) };
    } else if (typeof v === 'object') {
      out[k] = shallowSample(v);
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shallowSample(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v !== 'object') return v;
  const out: Record<string, unknown> = {};
  const keys = Object.keys(v).slice(0, 8);
  for (const k of keys) {
    const val = (v as Record<string, unknown>)[k];
    if (val === null || val === undefined) out[k] = val;
    else if (typeof val === 'object') out[k] = Array.isArray(val) ? `[Array(${val.length})]` : '[Object]';
    else out[k] = val;
  }
  return out;
}

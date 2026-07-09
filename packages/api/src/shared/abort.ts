/**
 * Structural options bag for cancellable API calls.
 *
 * Public methods on the Flux API wrappers accept this so callers can pass
 * an `AbortController.signal` and have it forwarded all the way down to
 * the executor's `request.cancel` WebSocket message.  The shape matches
 * ad4m's `CallOptions` structurally — we don't import from `@coasys/ad4m`
 * to keep the SDK loosely coupled to any specific ad4m version.
 *
 * Example:
 * ```typescript
 * const controller = new AbortController();
 * try {
 *   const items = await channel.allItems({ signal: controller.signal });
 * } catch (e) {
 *   if (e instanceof DOMException && e.name === 'AbortError') {
 *     // teardown
 *   }
 * }
 * // ... later, abort the in-flight query:
 * controller.abort();
 * ```
 */
export interface AbortOptions {
  signal?: AbortSignal;
}

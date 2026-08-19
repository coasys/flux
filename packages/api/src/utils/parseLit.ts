/**
 * Local `parseLit` for Flux — extracts `.data` from signed-envelope literals.
 *
 * Context
 * -------
 * The `literal` language in ad4m wraps every value in a signed-expression
 * envelope on write:
 *   `{ author, timestamp, data: <actual value>, proof }`
 * and encodes the whole envelope into the `literal:json:*` URL.
 *
 * `Message.body` is the last remaining Flux property that opts into this
 * storage (via `resolveLanguage: 'literal'`) — everything else moved to
 * deterministic typed XSD literals in coasys/ad4m#874 and does not need
 * any decode step at all.
 *
 * The upstream `parseLit` in `@coasys/ad4m` was tightened as part of that
 * refactor to stop guessing at `.data` unwrapping for the generic case —
 * it now JSON-stringifies any object it decodes. That is correct for the
 * generic helper, but it means `Message.body` renders as the raw envelope
 * JSON (`{"author":..., "timestamp":..., "data":"<p>yo</p>", "proof":...}`)
 * in the chat UI instead of the message HTML.
 *
 * This local shim restores the pre-refactor behaviour just for Flux:
 *   - decode the `literal:*` URL
 *   - if the decoded value is a signed-envelope object with a `.data`
 *     field (string), return that string
 *   - otherwise fall back to the upstream stringify behaviour
 *
 * Non-envelope literals (`literal:string:*`, `literal:number:*`, primitives
 * already unwrapped) pass through unchanged, so this is safe to use on any
 * SPARQL binding.
 */

import { Literal } from '@coasys/ad4m';

export function parseLit(val: string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  try {
    const result = Literal.fromUrl(val).get();
    if (result !== null && typeof result === 'object') {
      // Signed-envelope literal (Message.body): unwrap `.data` when it's a
      // string. This is the shape produced by the `literal` language:
      // { author, timestamp, data: <value>, proof }.
      const data = (result as { data?: unknown }).data;
      if (typeof data === 'string') return data;
      // Object without a string `.data` — fall back to JSON for display.
      return JSON.stringify(result);
    }
    return String(result);
  } catch {
    return val;
  }
}

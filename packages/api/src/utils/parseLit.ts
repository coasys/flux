/**
 * Local `parseLit` for Flux — extracts `.data` from signed-envelope literals.
 *
 * Temporary bridge
 * ----------------
 * The proper fix lives upstream in @coasys/ad4m (commit c48c9117c on the
 * `refactor/typed-rdf-literals-and-fn-cleanup-nico-refactor` branch —
 * "fix(sdk): restore .data unwrap in parseLit for signed-envelope literals").
 * This shim exists only to bridge the ad4m version currently pinned in
 * packages/api/package.json (`0.11.1`) and the root workspace
 * (`0.13.0-test-9`) until a new ad4m dev-test build carrying that fix is
 * published and the pins are bumped.
 *
 * Once Flux consumes an @coasys/ad4m build with the upstream fix, this
 * file should be reverted to the one-line re-export:
 *   `export { parseLit } from '@coasys/ad4m';`
 * and the imports in channel/index.ts + conversation-subgroup/index.ts
 * should switch back to importing directly from '@coasys/ad4m'.
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
 * The upstream `parseLit` in the currently-pinned @coasys/ad4m release was
 * tightened as part of that refactor to stop guessing at `.data` unwrapping
 * for the generic case — it now JSON-stringifies any object it decodes.
 * That is correct for the generic helper against deterministic typed
 * literals, but it broke `Message.body`: the chat UI rendered the raw
 * envelope JSON
 * (`{"author":..., "timestamp":..., "data":"<p>yo</p>", "proof":...}`)
 * instead of the message HTML.
 *
 * This shim restores the envelope-unwrap behaviour:
 *   - decode the `literal:*` URL
 *   - if the decoded value is a signed-envelope object with a string
 *     `.data` field, return that string
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

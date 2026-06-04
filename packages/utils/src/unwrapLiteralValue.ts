import { Literal } from '@coasys/ad4m';

/**
 * Decode a `literal:` link target into its underlying value.
 *
 * Newer executor builds store property literals as plain `literal:string:`,
 * `:number:`, `:boolean:`, or `:json:` targets, where `Literal.fromUrl().get()`
 * returns the underlying value directly. Older builds — and any value created
 * via `expression.create(value, "literal")` — wrap the value in a signed
 * envelope `{ author, timestamp, data, proof }`; for those, the actual value
 * is on `.data`. This helper covers both shapes.
 *
 * Returns `undefined` when the target is not a literal URL or cannot be
 * decoded; callers can substitute the raw target string if they prefer.
 */
export function unwrapLiteralValue(target: string | undefined | null): any {
  if (target === undefined || target === null || target === '') return undefined;
  let parsed: any;
  try {
    parsed = Literal.fromUrl(target).get();
  } catch {
    return undefined;
  }
  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    'author' in parsed &&
    'proof' in parsed
  ) {
    return parsed.data;
  }
  return parsed;
}

import { Literal } from '@coasys/ad4m';

/** Parse a Literal-encoded value back to a plain string. */
export function parseLit(val: string | undefined): string {
  if (!val) return '';
  try {
    const result = Literal.fromUrl(val).get();
    if (result && typeof result === 'object') return result.data ?? JSON.stringify(result);
    return result;
  } catch { return val; }
}

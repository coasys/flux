/**
 * @deprecated Import `parseLit` from `@coasys/ad4m` directly (see SparqlBindings).
 *
 * This re-export remains for backward compatibility with code that imports
 * from `'../utils/parseLit'`. New call sites should import directly from
 * `@coasys/ad4m`, which also exposes `parseLitNumber`, `parseLitBoolean`,
 * `parseSparqlCount`, and the `LinkBinding`/`CountBinding` types.
 */
export { parseLit } from '@coasys/ad4m';

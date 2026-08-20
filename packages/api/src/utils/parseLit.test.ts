import { parseLit } from './parseLit';

describe('parseLit', () => {
  it('returns empty string for undefined', () => {
    expect(parseLit(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(parseLit('')).toBe('');
  });

  it('returns plain string as-is (Literal.fromUrl throws)', () => {
    expect(parseLit('just a string')).toBe('just a string');
  });

  it('decodes literal:string: values', () => {
    // Literal.from('hello').toUrl() produces a literal URL
    // We test with the known format
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from('hello').toUrl();
    expect(parseLit(url)).toBe('hello');
  });

  it('decodes URL-encoded literal strings', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from('hello world').toUrl();
    expect(parseLit(url)).toBe('hello world');
  });

  // Signed-envelope literals are what the `literal` language produces on
  // write for any property declared with `resolveLanguage: 'literal'` —
  // Message.body is the last property in @coasys/flux-api that opts into
  // that storage (per-message provenance / edit-history / moderation).
  // Upstream @coasys/ad4m's parseLit unwraps `.data` when it's a string;
  // this test locks in that contract from the Flux side so a future ad4m
  // regression fails here loudly instead of at the chat UI.
  //
  // See @coasys/ad4m/core/src/perspectives/SparqlBindings.ts and its
  // companion SparqlBindings.test.ts — the .data unwrap was reinstated in
  // ad4m commit c48c9117c after being dropped by 3a96f73a on a false
  // premise ("signed envelopes no longer exist for new property writes").
  it('extracts .data from signed-envelope literals (matches @coasys/ad4m)', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from({ data: 'extracted' }).toUrl();
    expect(parseLit(url)).toBe('extracted');
  });

  it('extracts .data from full signed-expression envelopes', () => {
    const { Literal } = require('@coasys/ad4m');
    const envelope = {
      author: 'did:key:z6MkTest',
      timestamp: '2026-08-19T14:00:00.000Z',
      data: '<p>hello</p>',
      proof: { key: 'did:key:z6MkTest#z6MkTest', signature: 'deadbeef' },
    };
    const url = Literal.from(envelope).toUrl();
    expect(parseLit(url)).toBe('<p>hello</p>');
  });

  it('JSON-stringifies objects without a string .data field', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from({ foo: 'bar' }).toUrl();
    expect(parseLit(url)).toBe(JSON.stringify({ foo: 'bar' }));
  });
});

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

  // Note: prior to the typed-RDF-literals refactor, Flux stored message
  // bodies as `Literal.from({ data: text }).toUrl()` envelopes and this
  // helper extracted `.data` for legacy read compatibility.  With scalar
  // properties now stored as deterministic typed literals, envelope-wrapped
  // objects arriving through SPARQL are treated uniformly — the whole
  // object is JSON-stringified (matches @coasys/ad4m's `parseLit`).
  it('JSON-stringifies JSON literal objects (including {data: ...} envelopes)', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from({ data: 'extracted' }).toUrl();
    expect(parseLit(url)).toBe(JSON.stringify({ data: 'extracted' }));
  });

  it('JSON-stringifies objects without .data field', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from({ foo: 'bar' }).toUrl();
    expect(parseLit(url)).toBe(JSON.stringify({ foo: 'bar' }));
  });
});

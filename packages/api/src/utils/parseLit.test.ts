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
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from('hello').toUrl();
    expect(parseLit(url)).toBe('hello');
  });

  it('decodes URL-encoded literal strings', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from('hello world').toUrl();
    expect(parseLit(url)).toBe('hello world');
  });

  // Signed-envelope literals are what the `literal` language produces on write:
  // `{ author, timestamp, data: <value>, proof }` encoded into a
  // `literal:json:` URL. Message.body is the only Flux property that still
  // uses this storage (`resolveLanguage: 'literal'`), so its SPARQL binding
  // must be unwrapped via `.data` for the chat UI to render the message text
  // instead of the raw envelope JSON.
  it('extracts .data from signed-envelope literal objects', () => {
    const { Literal } = require('@coasys/ad4m');
    const envelope = {
      author: 'did:key:z6Mktest',
      timestamp: '2026-08-19T14:00:00.000Z',
      data: '<p>hello</p>',
      proof: { key: 'did:key:z6Mktest#z6Mktest', signature: 'deadbeef' },
    };
    const url = Literal.from(envelope).toUrl();
    expect(parseLit(url)).toBe('<p>hello</p>');
  });

  it('extracts .data when it is a plain string', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from({ data: 'extracted' }).toUrl();
    expect(parseLit(url)).toBe('extracted');
  });

  it('falls back to JSON.stringify for objects without a string .data field', () => {
    const { Literal } = require('@coasys/ad4m');
    const url = Literal.from({ foo: 'bar' }).toUrl();
    expect(parseLit(url)).toBe(JSON.stringify({ foo: 'bar' }));
  });

  it('falls back to JSON.stringify when .data is a non-string value', () => {
    const { Literal } = require('@coasys/ad4m');
    const payload = { data: { nested: 'object' } };
    const url = Literal.from(payload).toUrl();
    expect(parseLit(url)).toBe(JSON.stringify(payload));
  });
});

import { Literal } from '@coasys/ad4m';
import { unwrapLiteralValue } from '@coasys/flux-utils';

describe('unwrapLiteralValue', () => {
  it('returns undefined for nullish or empty input', () => {
    expect(unwrapLiteralValue(undefined)).toBeUndefined();
    expect(unwrapLiteralValue(null)).toBeUndefined();
    expect(unwrapLiteralValue('')).toBeUndefined();
  });

  it('returns undefined for non-literal URIs', () => {
    expect(unwrapLiteralValue('flux://has_channel')).toBeUndefined();
    expect(unwrapLiteralValue('did:key:z6MkExample')).toBeUndefined();
  });

  it('decodes plain literal:string: values', () => {
    const url = Literal.from('hello').toUrl();
    expect(unwrapLiteralValue(url)).toBe('hello');
  });

  it('decodes plain literal:number: values', () => {
    const url = Literal.from(42).toUrl();
    expect(unwrapLiteralValue(url)).toBe(42);
  });

  it('returns plain JSON objects as-is', () => {
    const url = Literal.from({ foo: 'bar' }).toUrl();
    expect(unwrapLiteralValue(url)).toEqual({ foo: 'bar' });
  });

  it('unwraps signed-envelope literal:json: targets to their inner data', () => {
    const envelope = {
      author: 'did:key:z6MkExample',
      timestamp: '2024-01-01T00:00:00Z',
      data: 'wrapped value',
      proof: { key: '#z6MkExample', signature: 'sig', valid: true },
    };
    const url = Literal.from(envelope).toUrl();
    expect(unwrapLiteralValue(url)).toBe('wrapped value');
  });

  it('leaves non-envelope JSON containing a data field alone', () => {
    // A user payload that happens to have `data` but no envelope siblings.
    const url = Literal.from({ data: 'payload', kind: 'other' }).toUrl();
    expect(unwrapLiteralValue(url)).toEqual({ data: 'payload', kind: 'other' });
  });
});

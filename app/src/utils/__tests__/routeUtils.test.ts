import {
  stripNeighbourhoodPrefix,
  restoreNeighbourhoodPrefix,
  stripChannelPrefix,
  restoreChannelPrefix,
} from '../routeUtils';

describe('stripNeighbourhoodPrefix', () => {
  it('strips neighbourhood:// prefix', () => {
    expect(stripNeighbourhoodPrefix('neighbourhood://abc123')).toBe('abc123');
  });

  it('strips private:// prefix', () => {
    expect(stripNeighbourhoodPrefix('private://abc123')).toBe('abc123');
  });

  it('returns bare strings unchanged', () => {
    expect(stripNeighbourhoodPrefix('abc123')).toBe('abc123');
  });

  it('returns empty string for undefined/empty input', () => {
    expect(stripNeighbourhoodPrefix(undefined as unknown as string)).toBe('');
    expect(stripNeighbourhoodPrefix('')).toBe('');
  });
});

describe('restoreNeighbourhoodPrefix', () => {
  it('prepends neighbourhood:// to bare IDs', () => {
    expect(restoreNeighbourhoodPrefix('abc123')).toBe('neighbourhood://abc123');
  });

  it('passes through neighbourhood:// IDs unchanged', () => {
    expect(restoreNeighbourhoodPrefix('neighbourhood://abc123')).toBe('neighbourhood://abc123');
  });

  it('passes through private:// IDs unchanged', () => {
    expect(restoreNeighbourhoodPrefix('private://abc123')).toBe('private://abc123');
  });

  it('returns empty string for undefined/empty input', () => {
    expect(restoreNeighbourhoodPrefix(undefined as unknown as string)).toBe('');
    expect(restoreNeighbourhoodPrefix('')).toBe('');
  });
});

describe('stripChannelPrefix', () => {
  it('strips literal:string: prefix', () => {
    expect(stripChannelPrefix('literal:string:abc123')).toBe('abc123');
  });

  it('passes through ad4m://obj/ IDs unchanged', () => {
    expect(stripChannelPrefix('ad4m://obj/abc123')).toBe('ad4m://obj/abc123');
  });

  it('passes through bare strings unchanged', () => {
    expect(stripChannelPrefix('abc123')).toBe('abc123');
  });

  it('returns empty string for undefined/empty input', () => {
    expect(stripChannelPrefix(undefined as unknown as string)).toBe('');
    expect(stripChannelPrefix('')).toBe('');
  });
});

describe('restoreChannelPrefix', () => {
  it('prepends literal:string: to bare IDs', () => {
    expect(restoreChannelPrefix('abc123')).toBe('literal:string:abc123');
  });

  it('passes through ad4m://obj/ IDs unchanged', () => {
    expect(restoreChannelPrefix('ad4m://obj/abc123')).toBe('ad4m://obj/abc123');
  });

  it('passes through any :// scheme unchanged', () => {
    expect(restoreChannelPrefix('neighbourhood://abc123')).toBe('neighbourhood://abc123');
  });

  it('returns empty string for undefined/empty input', () => {
    expect(restoreChannelPrefix(undefined as unknown as string)).toBe('');
    expect(restoreChannelPrefix('')).toBe('');
  });
});

describe('round-trip: stripChannelPrefix → restoreChannelPrefix', () => {
  it('round-trips legacy literal:string: IDs', () => {
    const original = 'literal:string:abc123';
    expect(restoreChannelPrefix(stripChannelPrefix(original))).toBe(original);
  });

  it('round-trips ad4m://obj/ IDs', () => {
    const original = 'ad4m://obj/abc123';
    expect(restoreChannelPrefix(stripChannelPrefix(original))).toBe(original);
  });
});

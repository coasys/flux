import { buildChannelParentLink } from '../createChannelLinks';

describe('buildChannelParentLink', () => {
  it('uses flux://has_channel for a nested channel', () => {
    const link = buildChannelParentLink('literal:string:parent-channel', 'literal:string:new-channel');

    expect(link).toMatchObject({
      source: 'literal:string:parent-channel',
      predicate: 'flux://has_channel',
      target: 'literal:string:new-channel',
    });
  });

  it('uses ad4m://self as the top-level source with flux://has_channel', () => {
    const link = buildChannelParentLink(undefined, 'literal:string:new-channel');

    expect(link).toMatchObject({
      source: 'ad4m://self',
      predicate: 'flux://has_channel',
      target: 'literal:string:new-channel',
    });
  });
});

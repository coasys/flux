import { buildChannelParentLink } from '../createChannelLinks';

describe('buildChannelParentLink', () => {
  it('uses flux://has_channel for a nested channel', () => {
    const link = buildChannelParentLink('ad4m://obj/parent-channel', 'ad4m://obj/new-channel');

    expect(link).toMatchObject({
      source: 'ad4m://obj/parent-channel',
      predicate: 'flux://has_channel',
      target: 'ad4m://obj/new-channel',
    });
  });

  it('uses ad4m://self as the top-level source with flux://has_channel', () => {
    const link = buildChannelParentLink(undefined, 'ad4m://obj/new-channel');

    expect(link).toMatchObject({
      source: 'ad4m://self',
      predicate: 'flux://has_channel',
      target: 'ad4m://obj/new-channel',
    });
  });

  it('handles legacy literal:string: IDs', () => {
    const link = buildChannelParentLink('literal:string:parent-channel', 'literal:string:new-channel');

    expect(link).toMatchObject({
      source: 'literal:string:parent-channel',
      predicate: 'flux://has_channel',
      target: 'literal:string:new-channel',
    });
  });
});

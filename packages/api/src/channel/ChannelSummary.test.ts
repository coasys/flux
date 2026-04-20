import { describe, it, expect } from 'vitest';
import { ChannelSummary } from './ChannelSummary';

describe('ChannelSummary', () => {
  it('has model metadata with no relations', () => {
    const metadata = ChannelSummary.getModelMetadata();
    expect(metadata.className).toBe('Channel');
    expect(Object.keys(metadata.relations)).toHaveLength(0);
  });

  it('has expected scalar properties', () => {
    const metadata = ChannelSummary.getModelMetadata();
    const propNames = Object.keys(metadata.properties);
    expect(propNames).toContain('name');
    expect(propNames).toContain('description');
    expect(propNames).toContain('isConversation');
    expect(propNames).toContain('isPinned');
  });

  it('has a type flag property', () => {
    const metadata = ChannelSummary.getModelMetadata();
    const typeProp = metadata.properties['type'];
    expect(typeProp).toBeDefined();
    expect(typeProp.flag).toBe(true);
  });

  it('does not have any getter properties', () => {
    const metadata = ChannelSummary.getModelMetadata();
    const getterProps = Object.entries(metadata.properties)
      .filter(([, meta]) => meta.getter);
    expect(getterProps).toHaveLength(0);
  });
});

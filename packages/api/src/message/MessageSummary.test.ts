import { describe, it, expect } from 'vitest';
import { MessageSummary } from './MessageSummary';

describe('MessageSummary', () => {
  it('has model metadata with Message class name', () => {
    const metadata = MessageSummary.getModelMetadata();
    expect(metadata.className).toBe('Message');
  });

  it('has no getter properties (no SPARQL-backed getters)', () => {
    const metadata = MessageSummary.getModelMetadata();
    const getterProps = Object.entries(metadata.properties)
      .filter(([, meta]) => meta.getter);
    expect(getterProps).toHaveLength(0);
  });

  it('has expected scalar properties', () => {
    const metadata = MessageSummary.getModelMetadata();
    const propNames = Object.keys(metadata.properties);
    expect(propNames).toContain('body');
  });

  it('has reaction, thread, and replies relations', () => {
    const metadata = MessageSummary.getModelMetadata();
    const relNames = Object.keys(metadata.relations);
    expect(relNames).toContain('reactions');
    expect(relNames).toContain('thread');
    expect(relNames).toContain('replies');
  });

  it('has a type flag property', () => {
    const metadata = MessageSummary.getModelMetadata();
    const typeProp = metadata.properties['type'];
    expect(typeProp).toBeDefined();
    expect(typeProp.flag).toBe(true);
  });
});

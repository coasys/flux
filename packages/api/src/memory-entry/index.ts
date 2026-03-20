import { Model, Property, Optional, Flag, Ad4mModel } from '@coasys/ad4m';

// Memory predicates — matching the SHACL schema used by AI agents
const MEMORY_CONTENT = 'memory://content';
const MEMORY_TIMESTAMP = 'memory://timestamp';
const MEMORY_TYPE = 'memory://memoryType';
const MEMORY_IMPORTANCE = 'memory://importance';
const MEMORY_TAGS = 'memory://tags';
const MEMORY_SOURCE_FILE = 'memory://sourceFile';
const MEMORY_AUTHOR = 'memory://author';
const MEMORY_SHAREABLE = 'memory://shareable';
const MEMORY_ENTRY_TYPE = 'rdf://type';
const MEMORY_ENTRY_TYPE_VALUE = 'memory://MemoryEntry';

@Model({ name: 'MemoryEntry' })
export class MemoryEntry extends Ad4mModel {
  @Flag({ through: MEMORY_ENTRY_TYPE, value: MEMORY_ENTRY_TYPE_VALUE })
  type: string;

  @Property({ through: MEMORY_CONTENT, resolveLanguage: 'literal' })
  content: string = '';

  @Property({ through: MEMORY_TIMESTAMP, resolveLanguage: 'literal' })
  timestamp: string = '';

  @Property({ through: MEMORY_TYPE, resolveLanguage: 'literal' })
  memoryType: string = '';

  @Optional({ through: MEMORY_IMPORTANCE, resolveLanguage: 'literal' })
  importance: number = 0;

  @Optional({ through: MEMORY_TAGS, resolveLanguage: 'literal' })
  tags: string = '';

  @Optional({ through: MEMORY_SOURCE_FILE, resolveLanguage: 'literal' })
  sourceFile: string = '';

  @Property({ through: MEMORY_AUTHOR, resolveLanguage: 'literal' })
  author: string = '';

  @Optional({ through: MEMORY_SHAREABLE, resolveLanguage: 'literal' })
  shareable: boolean = true;
}

export default MemoryEntry;

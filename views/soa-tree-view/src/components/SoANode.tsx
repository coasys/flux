import { useState } from 'preact/hooks';
import type { SoANodeData } from './SoATreeView';
import styles from './SoANode.module.css';

const MODALITY_ICONS: Record<string, string> = {
  observation: '\uD83D\uDD2D',
  belief: '\uD83D\uDCAD',
  intention: '\uD83C\uDFAF',
  vision: '\uD83C\uDF1F',
  plan: '\uD83D\uDCCB',
  skill: '\uD83D\uDEE0\uFE0F',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  completed: '#3b82f6',
  abandoned: '#6b7280',
  blocked: '#ef4444',
  held: '#f59e0b',
  revised: '#8b5cf6',
  retracted: '#6b7280',
  current: '#22c55e',
  outdated: '#9ca3af',
};

const REL_LABELS: Record<string, string> = {
  supports: 'Supports',
  contradicts: 'Contradicts',
  similar: 'Similar',
  same: 'Same as',
  requires: 'Requires',
  enables: 'Enables',
  refines: 'Refines',
  blocks: 'Blocks',
};

type Props = {
  node: SoANodeData;
  depth: number;
};

export default function SoANode({ node, depth }: Props) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const tags = node.tags?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [];
  const hasDetails =
    !!node.description ||
    node.confidence != null ||
    tags.length > 0 ||
    !!node.source ||
    node.relationships.length > 0;
  const isExpandable = hasChildren || hasDetails;

  const icon = MODALITY_ICONS[node.modality] || '\uD83D\uDD35';

  return (
    <div className={styles.nodeWrapper} style={{ paddingLeft: `${depth * 20}px` }}>
      <button
        type="button"
        className={`${styles.nodeHeader} ${expanded ? styles.expanded : ''}`}
        onClick={() => isExpandable && setExpanded((value) => !value)}
        aria-expanded={isExpandable ? expanded : undefined}
      >
        <span className={styles.toggle}>
          {isExpandable ? (expanded ? '\u25BE' : '\u25B8') : '\u00A0\u00A0'}
        </span>
        <span className={styles.icon} title={node.modality}>{icon}</span>
        <span className={styles.title}>{node.title || '(untitled)'}</span>
        {node.status && (
          <span
            className={styles.statusBadge}
            style={{ backgroundColor: STATUS_COLORS[node.status] || '#6b7280' }}
          >
            {node.status}
          </span>
        )}
        {node.priority != null && (
          <span className={styles.priorityBadge} title={`Priority ${node.priority}`}>
            P{node.priority}
          </span>
        )}
        {node.relationships.length > 0 && (
          <span className={styles.relCount} title="Has relationships">
            {node.relationships.length} rel
          </span>
        )}
      </button>

      {expanded && hasDetails && (
        <div className={styles.details} style={{ paddingLeft: `${depth * 20 + 28}px` }}>
          {node.description && (
            <div className={styles.property}>
              <j-text variant="body" color="ui-600">{node.description}</j-text>
            </div>
          )}
          {node.confidence != null && (
            <div className={styles.property}>
              <span className={styles.propLabel}>Confidence</span>
              <div className={styles.confidenceBar}>
                <div
                  className={styles.confidenceFill}
                  style={{ width: `${Math.round(node.confidence * 100)}%` }}
                />
              </div>
              <span className={styles.confidenceValue}>{Math.round(node.confidence * 100)}%</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className={styles.property}>
              <span className={styles.propLabel}>Tags</span>
              <div className={styles.tagList}>
                {tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          {node.source && (
            <div className={styles.property}>
              <span className={styles.propLabel}>Source</span>
              <j-text variant="body" color="ui-500">{node.source}</j-text>
            </div>
          )}
          {node.relationships.length > 0 && (
            <div className={styles.relationships}>
              <span className={styles.propLabel}>Relationships</span>
              {node.relationships.map((rel, i) => (
                <span key={i} className={styles.relBadge}>
                  {REL_LABELS[rel.predicate] || rel.predicate}
                  {rel.targetTitle ? `: ${rel.targetTitle}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {expanded && hasChildren && (
        <div className={styles.children}>
          {node.children.map((child) => (
            <SoANode key={child.base} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'preact/hooks';
import { PerspectiveProxy, LinkExpression } from '@coasys/ad4m';
import SoANode from './SoANode';
import styles from './SoATreeView.module.css';

type SoANodeData = {
  base: string;
  title: string;
  modality: string;
  description?: string;
  confidence?: number;
  status?: string;
  tags?: string;
  priority?: number;
  source?: string;
  children: SoANodeData[];
  relationships: { predicate: string; target: string; targetTitle?: string }[];
};

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

const RELATIONSHIP_PREDICATES = [
  'soa://rel_supports',
  'soa://rel_contradicts',
  'soa://rel_similar',
  'soa://rel_same',
  'soa://rel_requires',
  'soa://rel_enables',
  'soa://rel_refines',
  'soa://rel_blocks',
];

function parseLiteralString(literal: string): string {
  const match = literal.match(/^literal:\/\/string:(.*)$/);
  return match ? decodeURIComponent(match[1]) : literal;
}

function buildTree(soaLinks: LinkExpression[]): SoANodeData[] {
  const nodeMap = new Map<string, SoANodeData>();
  const parentChildLinks: { parent: string; child: string }[] = [];
  const referencedTargets = new Set<string>();

  // First pass: find all nodes (anything with a soa://title link)
  for (const link of soaLinks) {
    const pred = link.data.predicate;
    const base = link.data.source;

    if (pred === 'soa://title') {
      if (!nodeMap.has(base)) {
        nodeMap.set(base, {
          base,
          title: '',
          modality: 'observation',
          children: [],
          relationships: [],
        });
      }
      nodeMap.get(base)!.title = parseLiteralString(link.data.target);
    }
  }

  // Second pass: collect properties, relationships, and track referenced targets
  for (const link of soaLinks) {
    const pred = link.data.predicate;
    const base = link.data.source;
    const target = link.data.target;
    const node = nodeMap.get(base);

    if (!node) continue;

    if (pred === 'soa://modality') {
      node.modality = parseLiteralString(target);
    } else if (pred === 'soa://description') {
      node.description = parseLiteralString(target);
    } else if (pred === 'soa://confidence') {
      const conf = parseFloat(parseLiteralString(target));
      node.confidence = Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : undefined;
    } else if (pred === 'soa://status') {
      node.status = parseLiteralString(target);
    } else if (pred === 'soa://tags') {
      node.tags = parseLiteralString(target);
    } else if (pred === 'soa://priority') {
      const prio = parseInt(parseLiteralString(target), 10);
      node.priority = Number.isFinite(prio) ? prio : undefined;
    } else if (pred === 'soa://source') {
      node.source = parseLiteralString(target);
    } else if (pred === 'soa://rel_parent') {
      // source is parent of target
      parentChildLinks.push({ parent: base, child: target });
      referencedTargets.add(target);
    } else if (RELATIONSHIP_PREDICATES.includes(pred)) {
      referencedTargets.add(target);
      const targetNode = nodeMap.get(target);
      node.relationships.push({
        predicate: pred.replace('soa://rel_', ''),
        target,
        targetTitle: targetNode?.title,
      });
    }
  }

  // Register placeholder nodes for items referenced only by relationships
  for (const target of referencedTargets) {
    if (!nodeMap.has(target)) {
      nodeMap.set(target, {
        base: target,
        title: '(unknown)',
        modality: 'observation',
        children: [],
        relationships: [],
      });
    }
  }

  // Build tree from parent-child links with cycle detection
  const childSet = new Set<string>();
  for (const { parent, child } of parentChildLinks) {
    // Detect back-edges: if child is an ancestor of parent, skip to prevent cycles
    const parentNode = nodeMap.get(parent);
    const childNode = nodeMap.get(child);
    if (!parentNode || !childNode) continue;

    // Check for back-edge: if parent is already a descendant of child, skip
    const isDescendant = (ancestor: string, descendant: string): boolean => {
      const ancNode = nodeMap.get(ancestor);
      if (!ancNode) return false;
      for (const c of ancNode.children) {
        if (c.base === descendant || isDescendant(c.base, descendant)) {
          return true;
        }
      }
      return false;
    };

    // Skip if adding this link would create a cycle (child is already an ancestor of parent)
    if (isDescendant(child, parent)) {
      continue;
    }

    parentNode.children.push(childNode);
    childSet.add(child);
  }

  // Root nodes are those that are never a child
  const roots: SoANodeData[] = [];
  for (const [base, node] of nodeMap) {
    if (!childSet.has(base)) {
      roots.push(node);
    }
  }

  return roots;
}

export default function SoATreeView({ perspective, source }: Props) {
  const [roots, setRoots] = useState<SoANodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      try {
        setLoading(true);
        // Use server-side filtering with LinkQuery to fetch only soa:// links
        const soaLinks = await perspective.queryLinks({
          predicate: 'soa://',
        });

        if (!cancelled) {
          const tree = buildTree(soaLinks);
          setRoots(tree);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load SoA data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTree();

    return () => {
      cancelled = true;
    };
  }, [perspective?.uuid, source]);

  if (loading) {
    return (
      <div className={styles.container}>
        <j-text variant="body">Loading SoA tree...</j-text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <j-text variant="body" color="danger">{error}</j-text>
      </div>
    );
  }

  if (roots.length === 0) {
    return (
      <div className={styles.container}>
        <j-text variant="body" color="ui-500">No SoA nodes found in this perspective.</j-text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <j-text variant="heading-sm">State of Affairs</j-text>
        <j-text variant="body" color="ui-500">{roots.length} root node{roots.length !== 1 ? 's' : ''}</j-text>
      </div>
      <div className={styles.tree}>
        {roots.map((node) => (
          <SoANode key={node.base} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

export type { SoANodeData };

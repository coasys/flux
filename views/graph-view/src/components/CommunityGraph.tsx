import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';
import { LinkQuery, Literal, PerspectiveProxy } from '@coasys/ad4m';
import { useEffect, useRef, useState } from 'preact/hooks';
import SpriteText from 'three-spritetext';
import styles from '../App.module.css';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

function findNodes(source, allLinks, visitedNodes = new Set()) {
  // find links originating from the source node
  const linksFromSource = allLinks.filter((link) => link.data.source === source);
  // filter out links that have already been visited
  const newLinks = linksFromSource.filter((link) => !visitedNodes.has(link.proof.signature));
  // mark new links as visited
  newLinks.forEach((link) => visitedNodes.add(link.proof.signature));
  // recursively find links from the target nodes
  const descendantLinks = [];
  for (const link of newLinks) {
    const furtherLinks = findNodes(link.data.target, allLinks, visitedNodes);
    descendantLinks.push(...furtherLinks);
  }
  // return the combination of new links and all their descendants
  return [...newLinks, ...descendantLinks];
}

function uniqueNodes(array) {
  return array.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
}

function extractProtocol(string: string) {
  var match = string.match(/^[^:]+:\/\//);
  if (match) {
    return match[0];
  } else if (string.startsWith('did:')) {
    return 'did';
  } else {
    return 'unknown';
  }
}

export default function CommunityOverview({ perspective, source }: { perspective: PerspectiveProxy; source: string }) {
  const containerRef = useRef<HTMLDivElement>();
  const graph = useRef<ForceGraph3DInstance>(undefined);
  const graphEl = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState([0, 0]);
  const [graphInitialised, setGraphInitialised] = useState(false);
  const [nodes, setNodes] = useState<{ id: string; group: string }[]>([]);
  const [links, setLinks] = useState<{ source: string; target: string; predicate: string }[]>([]);

  const entry = useIntersectionObserver(graphEl, {});
  const isGraphVisible = !!entry?.isIntersecting;

  // Pause animations when graph hidden
  useEffect(() => {
    if (graphInitialised) {
      if (!isGraphVisible) {
        graph.current.pauseAnimation();
      } else {
        graph.current.resumeAnimation();
      }
    }
  }, [graphInitialised, isGraphVisible]);

  // Listen to resize events
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setContainerSize([containerRef.current.clientWidth, containerRef.current.clientHeight]);
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Resize graph on resize
  useEffect(() => {
    if (graph.current) {
      graph.current.width(containerSize[0]);
      graph.current.height(containerSize[1]);
    }
  }, [containerSize[0], containerSize[1]]);

  // Fetch initial snapshot and subscribe to changes
  useEffect(() => {
    fetchSnapShot(perspective, source).then(({ links, nodes }) => {
      console.log(links, nodes);
      setNodes(nodes);
      setLinks(links);
    });

    const refresh = () => {
      fetchSnapShot(perspective, source).then(({ links, nodes }) => {
        setNodes(nodes);
        setLinks(links);
      });
    };

    const sourceQuery = new LinkQuery({ source });
    const sourceSparql = `SELECT ?source ?predicate ?target WHERE { <${source}> ?predicate ?target . }`;
    const targetQuery = new LinkQuery({ target: source });
    const targetSparql = `SELECT ?source ?predicate ?target WHERE { ?source ?predicate <${source}> . }`;

    let sourceSub: { cancel: () => void } | null = null;
    let targetSub: { cancel: () => void } | null = null;

    perspective?.subscribeQuery(sourceQuery, sourceSparql, (added) => {
      if (added && added.length > 0) refresh();
      return null;
    }).then(sub => { sourceSub = sub; });

    perspective?.subscribeQuery(targetQuery, targetSparql, (added) => {
      if (added && added.length > 0) refresh();
      return null;
    }).then(sub => { targetSub = sub; });

    return () => {
      sourceSub?.cancel();
      targetSub?.cancel();
    };
  }, [perspective.uuid, source]);

  // Setup graph
  useEffect(() => {
    const setupGraph = async () => {
      graph.current = ForceGraph3D()(graphEl.current)
        .graphData({ nodes, links })
        .nodeLabel((node: any) => {
          return node.id.startsWith('literal://') ? Literal.fromUrl(node.id).get().data : node.id;
        })
        .backgroundColor('rgba(0,0,0,0)')
        .nodeAutoColorBy('group')
        .linkDirectionalArrowRelPos(0.9)
        .linkDirectionalArrowLength(3.5)
        .linkThreeObjectExtend(true)
        .onNodeClick((node) => {
          // Aim at node from outside it
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

          const newPos =
            node.x || node.y || node.z
              ? {
                  x: node.x * distRatio,
                  y: node.y * distRatio,
                  z: node.z * distRatio,
                }
              : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

          graph.current.cameraPosition(
            newPos, // new position
            node, // lookAt ({ x, y, z })
            3000, // ms transition duration
          );
        })
        .linkThreeObject((link: any) => {
          // extend link with text sprite
          const sprite = new SpriteText(`${link.predicate}`);
          sprite.color = 'lightgrey';
          sprite.textHeight = 1.5;
          return sprite;
        })
        .linkPositionUpdate((sprite: any, { start, end }: any) => {
          const middlePos = Object.assign(
            ...['x', 'y', 'z'].map((c) => ({
              [c]: start[c] + (end[c] - start[c]) / 2, // calc middle point
            })),
          );
          // Position sprite
          Object.assign(sprite.position, middlePos);
        })
        .width(containerSize[0] || window.innerWidth)
        .height(containerSize[1] || window.innerHeight);

      setGraphInitialised(true);
    };

    if (!graphInitialised) {
      setupGraph();
    }
  }, [graphInitialised, nodes, links, perspective.uuid, source]);

  // Add data on change
  useEffect(() => {
    if (graphInitialised && graph.current) {
      graph.current.graphData({ nodes, links });
    }
  }, [graphInitialised, nodes, links, perspective.uuid, source]);

  return (
    <div ref={containerRef}>
      <div className={styles.graph} ref={graphEl} id="graph" />
    </div>
  );
}

async function fetchSnapShot(perspective: PerspectiveProxy, source: string) {
  const snapshot = await perspective.snapshot();

  const subLinks = findNodes(source, snapshot?.links || []);

  const initialNodes = uniqueNodes(
    subLinks
      .map((link) => [
        { id: link.data.source, group: extractProtocol(link.data.source) },
        { id: link.data.target, group: extractProtocol(link.data.target) },
      ])
      .flat(),
  );

  const initialLinks = subLinks.map((l) => ({
    source: l.data.target,
    target: l.data.source,
    predicate: l.data.predicate,
  }));

  return { nodes: initialNodes, links: initialLinks };
}

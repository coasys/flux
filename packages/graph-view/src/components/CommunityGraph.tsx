import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import { useEffect, useState, useRef } from "preact/hooks";
import {
  getAd4mClient,
  LinkExpression,
} from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient, Literal } from "@perspect3vism/ad4m";

function findNodes(links, source) {
  return links.reduce((acc, link) => {
    const hasSource = link.data.source === source;
    const alreadyIn = acc.some((l) => l === link.data.source);

    if (alreadyIn) return acc;
    if (hasSource) {
      const newLinks = findNodes(links, link.data.target);
      return [...acc, ...newLinks, link];
    }
    return acc;
  }, []);
}

export default function CommunityOverview({ uuid, source }) {
  const containerRef = useRef<HTMLDivElement>();
  const graph = useRef<ForceGraph3DInstance>(undefined);
  const graphEl = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState([0, 0]);
  const [ad4mInitialised, setAd4mInitialised] = useState(false);
  const [graphInitialised, setGraphInitialised] = useState(false);
  const [nodes, setNodes] = useState<{ id: string; group: string }[]>([]);
  const [links, setLinks] = useState<{ source: string; target: string }[]>([]);

  // Listen to resize events
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setContainerSize([
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        ]);
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  // Resize graph on resize
  useEffect(() => {
    if (graph.current) {
      graph.current.width(containerSize[0]);
      graph.current.height(containerSize[1]);
    }
  }, [containerSize[0], containerSize[1]]);

  // Fetch initial snapshot
  useEffect(() => {
    const fetchsnapshot = async () => {
      const client: Ad4mClient = await getAd4mClient();
      const snapshot = await client.perspective.snapshotByUUID(uuid);

      const subLinks = findNodes(snapshot.links, source);

      const initialNodes = subLinks
        .map((l) => {
          return [
            { id: l.data.source, group: l.data.predicate },
            { id: l.data.target, group: l.data.predicate },
          ];
        })
        .flat();

      setNodes(initialNodes);

      const initialLinks = subLinks.map((l) => ({
        source: l.data.target,
        target: l.data.source,
      }));

      setLinks(initialLinks);

      setAd4mInitialised(true);

      client.perspective.addPerspectiveLinkAddedListener(uuid, [
        (link) => {
          newLinkAdded(link);
          return null;
        },
      ]);
    };

    if (!ad4mInitialised && uuid && source) {
      fetchsnapshot();
    }
  }, [ad4mInitialised, uuid, source]);

  // Setup graph
  useEffect(() => {
    const setupGraph = async () => {
      graph.current = ForceGraph3D()
        .nodeLabel((node) =>
          node.id.startsWith("literal://")
            ? Literal.fromUrl(node.id).get().data
            : node.id
        )
        .nodeAutoColorBy("group")
        .width(containerSize[0] || window.innerWidth)
        .height(containerSize[1] || window.innerHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .onNodeClick((node: { x; y; z }) => {
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
            3000 // ms transition duration
          );
        });

      graph.current(graphEl.current).graphData({ nodes, links });

      setGraphInitialised(true);
    };

    if (!graphInitialised && nodes.length > 0 && links.length > 0) {
      setupGraph();
    }
  }, [graphInitialised, nodes, links]);

  // listen for changes
  const newLinkAdded = (l: LinkExpression) => {
    if (graph.current) {
      const { nodes, links } = graph.current.graphData();

      graph.current.graphData({
        nodes: [
          ...nodes,
          {
            id: l.data.target,
            group: l.data.predicate,
          },
        ],
        links: [
          ...links,
          {
            source: l.data.target,
            target: l.data.source,
          },
        ],
      });
    }
  };

  return (
    <div ref={containerRef}>
      <div ref={graphEl} id="graph" />
    </div>
  );
}

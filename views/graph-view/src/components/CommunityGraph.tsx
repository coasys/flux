import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import { useEffect, useState, useRef } from "preact/hooks";
import SpriteText from "three-spritetext";
import {
  getAd4mClient,
  LinkExpression,
} from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient, Literal, PerspectiveProxy } from "@perspect3vism/ad4m";

function findNodes(links, source) {
  return links.reduce((acc, link) => {
    const isSource = link.data.target === source;
    const hasSource = link.data.source === source;
    const alreadyIn = acc.some(
      (l) => l.proof.signature === link.proof.signature
    );

    if (alreadyIn) return acc;

    if (hasSource) {
      const newLinks = findNodes(links, link.data.target);
      return [...acc, ...newLinks, link];
    }
    return acc;
  }, []);
}

function uniqueNodes(array) {
  return array.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );
}

function extractProtocol(string: string) {
  var match = string.match(/^[^:]+:\/\//);
  if (match) {
    return match[0];
  } else if (string.startsWith("did:")) {
    return "did";
  } else {
    return "unknown";
  }
}

export default function CommunityOverview({ uuid, source }) {
  const containerRef = useRef<HTMLDivElement>();
  const graph = useRef<ForceGraph3DInstance>(undefined);
  const graphEl = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState([0, 0]);
  const [ad4mInitialised, setAd4mInitialised] = useState(false);
  const [graphInitialised, setGraphInitialised] = useState(false);
  const [nodes, setNodes] = useState<{ id: string; group: string }[]>([]);
  const [links, setLinks] = useState<
    { source: string; target: string; predicate: string }[]
  >([]);

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
      const perspective = await client.perspective.byUUID(uuid);

      const snapshot = await client.perspective.snapshotByUUID(uuid);

      const subLinks = findNodes(snapshot?.links || [], source);

      const initialNodes = uniqueNodes(
        subLinks
          .map((link) => [
            { id: link.data.source, group: extractProtocol(link.data.source) },
            { id: link.data.target, group: extractProtocol(link.data.target) },
          ])
          .flat()
      );

      setNodes(initialNodes);

      const initialLinks = subLinks.map((l) => ({
        source: l.data.target,
        target: l.data.source,
        predicate: l.data.predicate,
      }));

      setLinks(initialLinks);

      setAd4mInitialised(true);

      perspective?.addListener("link-added", (link) => {
        newLinkAdded(link);
        return null;
      });
    };

    if (!ad4mInitialised && uuid && source) {
      fetchsnapshot();
    }
  }, [ad4mInitialised, uuid, source]);

  // Setup graph
  useEffect(() => {
    const setupGraph = async () => {
      graph.current = ForceGraph3D()
        .nodeLabel((node: any) => {
          return node.id.startsWith("literal://")
            ? Literal.fromUrl(node.id).get().data
            : node.id;
        })
        .backgroundColor("rgba(0,0,0,0)")
        .nodeAutoColorBy("group")
        .linkDirectionalArrowRelPos(0.9)
        .linkDirectionalArrowLength(3.5)
        .linkThreeObjectExtend(true)
        .linkThreeObject((link: any) => {
          // extend link with text sprite
          const sprite = new SpriteText(`${link.predicate}`);
          sprite.color = "lightgrey";
          sprite.textHeight = 1.5;
          return sprite;
        })
        .linkPositionUpdate((sprite: any, { start, end }: any) => {
          const middlePos = Object.assign(
            ...["x", "y", "z"].map((c) => ({
              [c]: start[c] + (end[c] - start[c]) / 2, // calc middle point
            }))
          );

          // Position sprite
          Object.assign(sprite.position, middlePos);
        })
        .width(containerSize[0] || window.innerWidth)
        .height(containerSize[1] || window.innerHeight);

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
            group: extractProtocol(l.data.target),
          },
          {
            id: l.data.source,
            group: extractProtocol(l.data.source),
          },
        ],
        links: [
          ...links,
          {
            source: l.data.target,
            target: l.data.source,
            predicate: l.data.predicate,
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

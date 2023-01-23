import { useEffect, useRef, useState } from "preact/hooks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";

import Canvas from "../Canvas/Canvas";

import styles from "./DrawArea.module.css";

export default function DrawArea() {
  const drawAreaRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [state, setState] = useState({
    lines: [],
    overlaps: [],
    isReplaying: false,
    menuVisible: false,
  });
  const { neighbourhoods } = useNeighbourhoods();

  useEffect(() => {
    document.addEventListener("mouseup", handleLineEnd, { passive: false });
    document.addEventListener("touchEnd", handleLineEnd, { passive: false });

    return () => {
      document.removeEventListener("mouseup", handleLineEnd);
      document.removeEventListener("touchEnd", handleLineEnd);
    };
  }, []);

  const relativeCoordinatesForEvent = (e) => {
    const { clientWidth, clientHeight, offsetLeft, offsetTop } =
      drawAreaRef?.current;
    return {
      x: ((e.clientX - offsetLeft) * 1920) / clientWidth,
      y: ((e.clientY - offsetTop) * 1080) / clientHeight,
    };
  };

  const handleStartLine = (e) => {
    // Abort if target is menu or undobutton
    if (e.target.dataset.stopBubbling) {
      return;
    }

    const isMouseMove = e.button === 0;
    const isTouchMove = e.touches && e.touches.length === 1;

    // Return if event doesn't match above checks
    if (!isMouseMove && !isTouchMove) {
      return;
    }

    setIsDrawing(true);

    const input = isMouseMove ? e : e.touches[0];
    const point = relativeCoordinatesForEvent(input);

    setState({
      ...state,
      lines: [...state.lines, [point]],
    });
  };

  const handleLineMove = (e) => {
    if (!isDrawing) {
      return;
    }
    // Abort if target is menu or undobutton
    if (e.target.dataset.stopBubbling) {
      return;
    }
    const isMouseMove = e.button === 0;
    const input = isMouseMove ? e : e.touches[0];
    const point = relativeCoordinatesForEvent(input);

    const lines = [...state.lines];
    lines[lines.length - 1].push(point);

    setState({
      ...state,
      lines: lines,
    });
  };

  const handleLineEnd = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    const lines = [...state.lines];
    lines.splice(lines.length - 1, 1);

    setState({
      ...state,
      lines: lines,
    });
  };

  return (
    <>
      <section
        className={styles.wrapper}
        ref={drawAreaRef}
        onMouseDown={handleStartLine}
        onMouseMove={handleLineMove}
        onTouchStart={handleStartLine}
        onTouchMove={handleLineMove}
      >
        <Canvas lines={state.lines} />
      </section>
    </>
  );
}

function useNeighbourhoods() {
  const [neighbourhoods, setNeighbourhoods] = useState<PerspectiveProxy[]>([]);

  async function fetchneighbourhoods() {
    const ad4m: Ad4mClient = await getAd4mClient();
    const perspectives = await ad4m.perspective.all();
    const neighbourhoods = perspectives.filter((p) => p.sharedUrl);
    setNeighbourhoods(neighbourhoods);
  }

  useEffect(() => {
    fetchneighbourhoods();
  }, []);

  return { neighbourhoods };
}

import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Peer } from "utils/react-web";

interface CanvasProps {
  peers: Peer[];
  width: number;
  height: number;
}

type Coordinate = {
  x: number;
  y: number;
};

const Canvas = ({ peers, width, height }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [peerPositions, setPeerPositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});
  const [mousePosition, setMousePosition] = useState<Coordinate | undefined>(
    undefined
  );

  const startPaint = useCallback((event: MouseEvent) => {
    const coordinates = getCoordinates(event);
    if (coordinates) {
      setMousePosition(coordinates);
      setIsPainting(true);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousedown", startPaint);
    return () => {
      canvas.removeEventListener("mousedown", startPaint);
    };
  }, [startPaint]);

  // This is the dirtiest code I've written!
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    // Loop through and paint if any peers are currently painting
    for (let i = 0; i < peers.length; i++) {
      const peer = peers[i];
      if (peer.state?.isDrawing) {
        // Check if we have old position in array
        if (peerPositions[peer.did]) {
          // Draw and update
          drawLine(
            {
              x: (peer.state?.x / 100) * width - 34,
              y: (peer.state?.y / 100) * height + 180,
            },
            peerPositions[peer.did]
          );
        }
        // Update position
        setPeerPositions({
          ...peerPositions,
          [peer.did]: {
            x: (peer.state?.x / 100) * width - 34,
            y: (peer.state?.y / 100) * height + 180,
          },
        });
      } else if (peerPositions[peer.did]) {
        // Wipe old position if no longer drawing
        const newPeerPositions = { ...peerPositions };
        delete newPeerPositions[peer.did];
        setPeerPositions(newPeerPositions);
      }
    }
  }, [peers]);

  const paint = useCallback(
    (event: MouseEvent) => {
      if (isPainting) {
        const newMousePosition = getCoordinates(event);
        if (mousePosition && newMousePosition) {
          drawLine(mousePosition, newMousePosition);
          setMousePosition(newMousePosition);
        }
      }
    },
    [isPainting, mousePosition]
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousemove", paint);
    return () => {
      canvas.removeEventListener("mousemove", paint);
    };
  }, [paint]);

  const exitPaint = useCallback(() => {
    setIsPainting(false);
    setMousePosition(undefined);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mouseup", exitPaint);
    canvas.addEventListener("mouseleave", exitPaint);
    return () => {
      canvas.removeEventListener("mouseup", exitPaint);
      canvas.removeEventListener("mouseleave", exitPaint);
    };
  }, [exitPaint]);

  const getCoordinates = (event: MouseEvent): Coordinate | undefined => {
    if (!canvasRef.current) {
      return;
    }

    const canvas: HTMLCanvasElement = canvasRef.current;
    return {
      x: event.offsetX - canvas.offsetLeft - 34,
      y: event.offsetY - canvas.offsetTop + 180,
    };
  };

  const drawLine = (
    originalMousePosition: Coordinate,
    newMousePosition: Coordinate
  ) => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.strokeStyle = "black";
      context.lineJoin = "round";
      context.lineWidth = 5;

      context.beginPath();
      context.moveTo(originalMousePosition.x, originalMousePosition.y);
      context.lineTo(newMousePosition.x, newMousePosition.y);
      context.closePath();

      context.stroke();
    }
  };

  return <canvas ref={canvasRef} height={height} width={width} />;
};

Canvas.defaultProps = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export default Canvas;

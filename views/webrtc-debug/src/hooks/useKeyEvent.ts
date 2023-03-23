import { useRef, useEffect } from "preact/hooks";

// Hook
const useKeyEvent = (key: string, cb: (event: KeyboardEvent) => void) => {
  const callbackKey = useRef(cb);

  useEffect(() => {
    callbackKey.current = cb;
  });

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.code == key) {
        callbackKey.current(event);
      }
    };

    document.addEventListener("keypress", handle);
    return () => document.removeEventListener("keypress", handle);
  }, [key]);
};

export default useKeyEvent;

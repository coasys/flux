import { useEffect, useState } from "react";

const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleClick = () => setIsOpen(false);

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return {
    isOpen,
    setIsOpen,
    position,
    setPosition,
  };
};
export default useContextMenu;

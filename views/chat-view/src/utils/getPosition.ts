type Position = {
  left: string;
  right: string;
  top: string;
  bottom: string;
};

function getPosition(x: number, y: number, el: HTMLElement): Position {
  if (x === undefined || y === undefined || el === undefined) {
    return { right: "", top: "", left: "", bottom: "" };
  }

  const isHidden = el.style.display === "none";

  if (isHidden) {
    el.style.display = "block";
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const elementWidth = el.offsetWidth;
  const elementHeight = el.offsetHeight;

  const right = viewportWidth - x;
  const top = y;

  let rightVal = "";
  let leftVal = "";
  let topVal = "";
  let bottomVal = "";

  if (right < elementWidth) {
    rightVal = `${right}px`;
    leftVal = "";
  } else {
    rightVal = "";
    leftVal = `${x}px`;
  }

  if (top + elementHeight > viewportHeight) {
    bottomVal = `${viewportHeight - y}px`;
    topVal = "";
  } else {
    bottomVal = "";
    topVal = `${y}px`;
  }

  if (isHidden) {
    el.style.display = "none";
  }

  return {
    right: rightVal,
    left: leftVal,
    top: topVal,
    bottom: bottomVal,
  };
}

export { getPosition };

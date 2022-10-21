export default function outlineWatcher() {
  let previousAction = null;

  document.addEventListener("mousedown", () => {
    if (previousAction === "mousedown") {
      return;
    }
    document.body.classList.remove("tabbed");
    previousAction = "mousedown";
  });

  document.addEventListener("keydown", () => {
    if (previousAction === "keydown") {
      return;
    }
    document.body.classList.add("tabbed");
    previousAction = "keydown";
  });
}

function shouldPlaceAbove(element, offset = 10) {
  const elementRect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const spaceBelow = viewportHeight - elementRect.bottom - offset;

  return spaceBelow < 0;
}

export { shouldPlaceAbove };

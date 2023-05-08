export function scrollToBottom(node: HTMLElement | null) {
  if (node) {
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }
}

export function isAtBottom(
  scrollContainer: HTMLElement | null,
  offset = 0
): boolean {
  // TODO: Virtual scroller returns undefined scrollHeight when it's not full-height
  // We assume that we see the bottom of the container because it's not filling the screen up
  // Should maybe do this in a better way
  if (!scrollContainer) return true;
  if (!scrollContainer.scrollHeight) return true;
  return (
    scrollContainer.scrollTop >=
    scrollContainer.scrollHeight - offset - scrollContainer.offsetHeight
  );
}

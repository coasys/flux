export function isAtBottom(scrollContainer: HTMLElement): boolean {
  return (
    scrollContainer.scrollHeight - window.innerHeight ===
    scrollContainer.scrollTop
  );
}

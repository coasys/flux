export function isAtBottom(scrollContainer: HTMLElement): boolean {
  return (
    scrollContainer.scrollHeight - window.innerHeight ===
    scrollContainer.scrollTop
  );
}

export interface ScrollHandlerOptions {
  onScroll: any;
  onScrollStop: any;
  removeListenerAfterStop?: boolean;
}

export function scrollHandler(
  scrollContainer: HTMLElement,
  options: ScrollHandlerOptions
): void {
  let _timer = null as null | ReturnType<typeof setTimeout>;

  function handleScroll(e: Event) {
    options.onScroll(e);
    if (_timer) {
      clearTimeout(_timer);
    }
    _timer = setTimeout(() => {
      options.onScrollStop(e);
      if (options.removeListenerAfterStop) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    }, 150);
  }

  scrollContainer.addEventListener("scroll", handleScroll);
}

export function isAtBottom(scrollContainer: HTMLElement): boolean {
  // TODO: Virtual scroller returns undefined scrollHeight when it's not full-height
  // We assume that we see the bottom of the container because it's not filling the screen up
  // Should maybe do this in a better way
  console.log(scrollContainer.scrollHeight);
  if (!scrollContainer.scrollHeight) return true;
  return (
    scrollContainer.scrollTop >=
    scrollContainer.scrollHeight - scrollContainer.offsetHeight
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

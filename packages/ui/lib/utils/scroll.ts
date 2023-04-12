export interface ScrollHandlerOptions {
  onScroll?: Function;
  onScrollStop?: Function;
  removeListenerAfterStop?: boolean;
}

export function scrollHandler(
  scrollContainer,
  {
    onScroll = (e: any) => null,
    onScrollStop = (e: any) => null,
    removeListenerAfterStop = false,
  }: ScrollHandlerOptions
) {
  let _timer = null;

  function handleScroll(e) {
    onScroll(e);
    if (_timer) {
      clearTimeout(_timer);
    }
    _timer = setTimeout(() => {
      onScrollStop(e);
      if (removeListenerAfterStop) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    }, 150);
  }

  scrollContainer.addEventListener("scroll", handleScroll);
}

export function scrollTo(scrollContainer, index, callback) {
  scrollHandler(scrollContainer, {
    onScrollStop: callback,
    removeListenerAfterStop: true,
  });

  scrollContainer.scrollTo({
    left: scrollContainer.clientWidth * index,
    behavior: "smooth",
  });
}

// Debounced function that executes the function immediately, then queues subsequent actions
export function debounce<F extends Function>(
  eventHandler: F,
  milliseconds = 500
): F {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: unknown[]) {
    const isFirstExecution = timer === undefined;

    // Clear queue!
    if (timer !== undefined) {
      clearTimeout(timer);
    }

    // Set the new timeout
    timer = setTimeout(() => {
      // Inside the timeout function, clear the timeout variable
      // which will let the next execution run when isFirstExecution
      timer = undefined;

      if (!isFirstExecution) {
        eventHandler.bind(this, ...args)();
      }
    }, milliseconds);

    if (isFirstExecution) {
      eventHandler.bind(this, ...args)();
    }
  } as unknown as F;
}

export default debounce;

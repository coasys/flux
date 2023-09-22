/* eslint-disable @typescript-eslint/no-explicit-any */
interface ThrottledFunction extends Function {
  (nextValue: any): any;
}

export function throttle<F extends ThrottledFunction>(
  eventHandler: F,
  milliseconds = 500
): F {
  let inThrottle: boolean;
  return function (this: unknown, ...args: unknown[]) {
    if (!inThrottle) {
      inThrottle = true;
      eventHandler.bind(this, ...args)();
      setTimeout(() => (inThrottle = false), milliseconds);
    }
  } as unknown as F;
}

export default throttle;

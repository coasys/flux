import sleep from "@/utils/sleep";
import { TimeoutCache } from "@/utils/timeoutCache";
import { mocked } from "ts-jest/utils";

jest.mock('@/utils/timeoutCache', () => {
  return {
    TimeoutCache: jest.fn().mockImplementation(() => {
      return {
        set: jest.fn(),
        get: (key: string) => {
          if (key === 'test') {
            return undefined
          } else {
            return 'test';
          }
        },
        remove: jest.fn(),
      };
    })
  };
});

describe("Timeoutcache", () => {
  mocked(TimeoutCache, true);
  
  beforeEach(async () => {
    const cache = new TimeoutCache<any>(10);

    await cache.remove("test");
  });

  test("timeout cache is empty", async () => {
    const cache = new TimeoutCache<string>(10);

    expect(await cache.get("test")).toBe(undefined);
  });

  test("timeout cache is not empty", async () => {
    const cache = new TimeoutCache<string>(10);

    expect(await cache.get("test")).toBe(undefined);

    await cache.set("test1", "test");

    expect(await cache.get("test1")).toBe("test");
  });

  test("timeout cache is empty after 10 ms", async () => {
    const cache = new TimeoutCache<string>(10);

    expect(await cache.get("test")).toBe(undefined);

    await cache.set("test", "test");

    await sleep(20);

    expect(await cache.get("test")).toBe(undefined);
  });
});

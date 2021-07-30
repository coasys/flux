import sleep from "@/utils/sleep";
import { TimeoutCache } from "@/utils/timeoutCache";

describe("Timeoutcache", () => {
  beforeEach(() => {
    const cache = new TimeoutCache<any>(10);

    cache.remove("test");
  });

  test("timeout cache is empty", async () => {
    const cache = new TimeoutCache<string>(10);

    expect(cache.get("test")).toBe(undefined);
  });

  test("timeout cache is not empty", async () => {
    const cache = new TimeoutCache<string>(10);

    expect(cache.get("test")).toBe(undefined);

    cache.set("test", "test");

    expect(cache.get("test")).toBe("test");
  });

  test("timeout cache is empty after 10 ms", async () => {
    const cache = new TimeoutCache<string>(10);

    expect(cache.get("test")).toBe(undefined);

    cache.set("test", "test");

    await sleep(20);

    expect(cache.get("test")).toBe(undefined);
  });
});

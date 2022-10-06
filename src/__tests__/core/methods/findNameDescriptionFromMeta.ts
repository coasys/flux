import { getMetaFromNeighbourhood } from "@/core/methods/getMetaFromNeighbourhood";
import createChannelMeta from "../../fixtures/createChannelMeta.json";

describe("Find Name Description From Meta", () => {
  test("Find Name Description From Meta - Success", () => {
    const { name, description } = getMetaFromNeighbourhood(createChannelMeta.map(c => ({...c, hash: () => 123456})));

    expect(name).toBe("aaaaa");
    expect(description).toBe("-");
  });
});

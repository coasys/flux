import { findNameDescriptionFromMeta } from "@/core/methods/findNameDescriptionFromMeta";
import createChannelMeta from "../../fixtures/createChannelMeta.json";

describe("Find Name Description From Meta", () => {
  test("Find Name Description From Meta - Success", () => {
    const { name, description } =
      findNameDescriptionFromMeta(createChannelMeta);

    expect(name).toBe("aaaaa");
    expect(description).toBe("-");
  });
});

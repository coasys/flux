import joinNeighbourhoodFixture from "../../fixtures/joinNeighbourhood.json";
import joinComunityExpressionTypes from "../../fixtures/joinComunityExpressionTypes.json";
import * as joinNeighbourhood from "@/core/mutations/joinNeighbourhood";
import * as getTypedExpressionLanguages from "@/core/methods/getTypedExpressionLangs";
import { joinChannelFromSharedLink } from "@/core/methods/joinChannelFromSharedLink";

describe("Join Channel From Shared Link", () => {
  test("Find Name Description From Meta - Success", async () => {
    // @ts-ignore
    jest
      .spyOn(joinNeighbourhood, "joinNeighbourhood")
      // @ts-ignore
      .mockResolvedValue(joinNeighbourhoodFixture);

    // @ts-ignore
    jest
      .spyOn(getTypedExpressionLanguages, "getTypedExpressionLanguages")
      // @ts-ignore
      .mockImplementation(async () => {
        return joinComunityExpressionTypes;
      });

    const { neighbourhood, state } = await joinChannelFromSharedLink(
      "neighbourhood://842124eeeaeb37f2ef108525280f390e52dec874329c7ac2b9b65636f5d9df27e9f8d7f4ee8d56",
      "bebd2ac2-1e80-44d2-b807-0163c2bcef40"
    );

    expect(state.perspectiveUuid).toBe("9cac577c-0b0a-44f4-9d4f-66edcc236021");
    expect(neighbourhood.name).toBe("safsafsaf");
    expect(neighbourhood.description).toBe("-");
    expect(neighbourhood.neighbourhoodUrl).toBe(
      "neighbourhood://842124eeeaeb37f2ef108525280f390e52dec874329c7ac2b9b65636f5d9df27e9f8d7f4ee8d56"
    );
  });
});

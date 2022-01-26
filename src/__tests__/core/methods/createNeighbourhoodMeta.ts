import createCommunityPerspective from "../../fixtures/createCommunityPerspective.json";
import getPerspectiveSnapshotFixture from "../../fixtures/getPerspectiveSnapshot.json";
import createNeighbourhoodMetaFixture from "../../fixtures/createNeighbourhoodMeta.json";
import addChannelCreateLink from "../../fixtures/addChannelCreateLink.json";
import { createNeighbourhoodMeta } from "@/core/methods/createNeighbourhoodMeta";
import { ad4mClient } from "@/app";

const removeEmpty = (obj: any) => {
  const newObj: { [x: string]: any } = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeEmpty(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

describe("Create Neighbourhood Meta", () => {
  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "add")
      // @ts-ignore
      .mockResolvedValue(createCommunityPerspective);

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "snapshotByUUID")
      // @ts-ignore
      .mockResolvedValue(getPerspectiveSnapshotFixture);

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "addLink")
      .mockImplementation(async (perspective, link) => {
        return addChannelCreateLink;
      });
  });

  test("Create Neighbourhood Meta - Success", async () => {
    const links = await createNeighbourhoodMeta(
      "test",
      "desc",
      "did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW",
      [
        {
          languageAddress: "QmNk28bBYP1SjF6tJAZX6t1pbUhw16GyYAn3oQtMCW5DPq",
          expressionType: 0,
        },
        {
          languageAddress: "QmNaEewCPzVfyhzYtLoge6mG35yUe8TfhmzfFEVvY4QqRi",
          expressionType: 1,
        },
        {
          languageAddress: "QmZsg9jEfRwV6QBRritJTaNQk86AEuJbVJCpMcNrzEffpP",
          expressionType: 2,
        },
      ]
    );

    expect(Object.values(removeEmpty(links))).toStrictEqual(
      createNeighbourhoodMetaFixture
    );
  });

  test("Create Neighbourhood Meta with empty description - Success", async () => {
    const links = await createNeighbourhoodMeta(
      "test",
      "",
      "did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW",
      [
        {
          languageAddress: "QmNk28bBYP1SjF6tJAZX6t1pbUhw16GyYAn3oQtMCW5DPq",
          expressionType: 0,
        },
        {
          languageAddress: "QmNaEewCPzVfyhzYtLoge6mG35yUe8TfhmzfFEVvY4QqRi",
          expressionType: 1,
        },
        {
          languageAddress: "QmZsg9jEfRwV6QBRritJTaNQk86AEuJbVJCpMcNrzEffpP",
          expressionType: 2,
        },
      ]
    );

    expect(Object.values(removeEmpty(links))).toStrictEqual(
      createNeighbourhoodMetaFixture
    );
  });

  test("Create Neighbourhood Meta - Failure", async () => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "add")
      // @ts-ignore
      .mockRejectedValue(Error("Error while adding new perspective"));

    try {
      await createNeighbourhoodMeta(
        "test",
        "",
        "did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW",
        [
          {
            languageAddress: "QmNk28bBYP1SjF6tJAZX6t1pbUhw16GyYAn3oQtMCW5DPq",
            expressionType: 0,
          },
          {
            languageAddress: "QmNaEewCPzVfyhzYtLoge6mG35yUe8TfhmzfFEVvY4QqRi",
            expressionType: 1,
          },
          {
            languageAddress: "QmZsg9jEfRwV6QBRritJTaNQk86AEuJbVJCpMcNrzEffpP",
            expressionType: 2,
          },
        ]
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error while adding new perspective"
      );
    }
  });
});

import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import * as getLanguage from "@/core/queries/getLanguage";
import getTypedExpressionLangLanguages from "../../fixtures/getTypedExpressionLangLanguages.json";
import getTypedExpressionLangLinks from "../../fixtures/getTypedExpressionLangLinks.json";

describe("Get Typed Expression", () => {
  test("Get Typed Expression - Success", async () => {
    // @ts-ignore
    jest
      .spyOn(getLanguage, "getLanguage")
      // @ts-ignore
      .mockImplementation(async (address) => {
        return getTypedExpressionLangLanguages.find(
          (e) => e.address === address
        );
      });

    // @ts-ignore
    const exp = await getTypedExpressionLanguages(getTypedExpressionLangLinks);

    expect(exp.length).toBe(4);
    expect(exp.map((e) => e.languageAddress)).toStrictEqual(
      getTypedExpressionLangLinks
        .filter((e) => e.data.predicate === "language")
        .map((e) => e.data.target)
    );
  });

  test("Get Typed Expression - Failure", async () => {
    // @ts-ignore
    jest
      .spyOn(getLanguage, "getLanguage")
      // @ts-ignore
      .mockImplementation(async (address) => {
        return undefined;
      });

    try {
      // @ts-ignore
      await getTypedExpressionLanguages(getTypedExpressionLangLinks, true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Could not find language with address: QmevBs9ztZwyZjseMD4X18zSHFuDp9eEaLJyirHazQWmxS"
      );
    }
  });
});

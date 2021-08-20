import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { createPinia, Pinia, setActivePinia } from "pinia";
import * as getLanguages from "../../../../core/queries/getLanguages";
import languages from "../../../fixtures/languages.json";

describe("Load Expression Languages", () => {
  let store: Pinia;

  beforeEach(() => {
    store = createPinia();
    setActivePinia(store);
  });

  test("Load Expression Languages - Success", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    jest
      .spyOn(getLanguages, "getLanguages")
      // @ts-ignore
      .mockResolvedValue(languages);

    expect(Object.values(appStore.expressionUI).length).toBe(0);

    await dataStore.loadExpressionLanguages();

    expect(Object.keys(appStore.expressionUI).length).toBe(3);
    expect(Object.keys(appStore.expressionUI)).toStrictEqual(
      languages.map((e) => e.address)
    );
  });

  test("Load Expression Languages - Failure", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    jest
      .spyOn(getLanguages, "getLanguages")
      // @ts-ignore
      .mockRejectedValue("No languages found");

    expect(Object.values(appStore.expressionUI).length).toBe(0);

    try {
      await dataStore.loadExpressionLanguages();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "No languages found");
    }

    expect(Object.keys(appStore.expressionUI).length).toBe(0);
    expect(Object.keys(appStore.expressionUI)).not.toStrictEqual(
      languages.map((e) => e.address)
    );
  });
});

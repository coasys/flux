import community from "../../../fixtures/community.json";
import * as setTheme from "@/utils/themeHelper";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";

describe("Update Global Theme", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest.spyOn(setTheme, "setTheme").mockReturnValue(undefined);

    store = createPinia();

    setActivePinia(store);
  });

  test("Update global theme", () => {
    const dataStore = useDataStore();
    const appStore = useAppStore();

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(appStore.currentTheme).toBe("global");
    expect(appStore.globalTheme).toStrictEqual({
      name: "dark",
      fontFamily: "Poppins",
      hue: 270,
      saturation: 60,
      fontSize: "md",
    });

    // @ts-ignore
    appStore.updateGlobalTheme({
      name: "test",
      fontFamily: "Arial",
      hue: 90,
    });

    expect(appStore.currentTheme).toBe("global");
    expect(appStore.globalTheme).toStrictEqual({
      name: "test",
      fontFamily: "Arial",
      hue: 90,
      saturation: 60,
      fontSize: "md",
    });
  });
});

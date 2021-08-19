import community from "../../../fixtures/community.json";
import * as setTheme from "@/utils/themeHelper";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";
import { useAppStore } from "@/store/app";

describe("Change Current Theme", () => {
  let store: Pinia;

  beforeEach(() => {
    jest.spyOn(setTheme, "setTheme").mockReturnValue(undefined);

    store = createPinia();

    setActivePinia(store)
  });

  test("Change to global theme", () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(appStore.currentTheme).toBe("global");

    appStore.changeCurrentTheme("global");

    expect(appStore.currentTheme).toBe("global");
  });

  test("Change to local theme for community", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);

    expect(appStore.currentTheme).toBe("global");

    await appStore.changeCurrentTheme(community.state.perspectiveUuid);

    expect(appStore.currentTheme).toBe(community.state.perspectiveUuid);
  });
});

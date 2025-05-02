import { useThemeStore } from "@/store";
import { useDataStore } from "@/store/data";
import * as setTheme from "@/utils/themeHelper";
import { createPinia, Pinia, setActivePinia } from "pinia";
import community from "../../../fixtures/community.json";

describe("Change Current Theme", () => {
  let store: Pinia;

  beforeEach(() => {
    jest.spyOn(setTheme, "setTheme").mockReturnValue(undefined);

    store = createPinia();

    setActivePinia(store);
  });

  test("Change to global theme", () => {
    const theme = useThemeStore();
    const dataStore = useDataStore();

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(theme.currentTheme).toBe("global");

    theme.changeCurrentTheme("global");

    expect(theme.currentTheme).toBe("global");
  });

  test("Change to local theme for community", async () => {
    const theme = useThemeStore();
    const dataStore = useDataStore();

    // @ts-ignore
    await theme.addCommunity(community);

    expect(theme.currentTheme).toBe("global");

    await theme.changeCurrentTheme(community.state.perspectiveUuid);

    expect(theme.currentTheme).toBe(community.state.perspectiveUuid);
  });
});

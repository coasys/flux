import community from "../../../fixtures/community.json";
import * as setTheme from "@/utils/themeHelper";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";

describe("Update community theme", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest.spyOn(setTheme, "setTheme").mockReturnValue(undefined);

    store = createPinia();

    setActivePinia(store);
  });

  test("Update community theme", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);

    expect(appStore.currentTheme).toBe("global");
    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "light",
      fontFamily: "Poppins",
      hue: 270,
      saturation: 60,
      fontSize: "md",
    });

    await appStore.updateCommunityTheme({
      communityId: community.state.perspectiveUuid,
      // @ts-ignore
      theme: {
        name: "test",
        fontFamily: "Arial",
        hue: 90,
      },
    });

    expect(appStore.currentTheme).toBe("global");
    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "test",
      fontFamily: "Arial",
      hue: 90,
      saturation: 60,
      fontSize: "md",
    });
  });

  test("Update current community theme", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);

    expect(appStore.currentTheme).toBe("global");

    await appStore.changeCurrentTheme(community.state.perspectiveUuid);

    expect(appStore.currentTheme).toBe(community.state.perspectiveUuid);

    await appStore.updateCommunityTheme({
      communityId: community.state.perspectiveUuid,
      // @ts-ignore
      theme: {
        name: "test1",
        fontFamily: "Arial",
        hue: 80,
      },
    });

    expect(appStore.currentTheme).toBe(community.state.perspectiveUuid);
    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "test1",
      fontFamily: "Arial",
      hue: 80,
      saturation: 60,
      fontSize: "md",
    });
  });

  test("Update community theme for wrong communtiy id", async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);

    expect(appStore.currentTheme).toBe("global");

    await appStore.changeCurrentTheme(community.state.perspectiveUuid);

    expect(appStore.currentTheme).toBe(community.state.perspectiveUuid);

    try {
      await appStore.updateCommunityTheme({
        communityId: `${community.state.perspectiveUuid}1`,
        // @ts-ignore
        theme: {
          name: "test",
          fontFamily: "Arial",
          hue: 90,
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        `Cannot read property 'theme' of undefined`
      );
    }

    expect(appStore.currentTheme).toBe("bebd2ac2-1e80-44d2-b807-0163c2bcef40");
    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "test1",
      fontFamily: "Arial",
      hue: 80,
      saturation: 60,
      fontSize: "md",
    });
  });
});

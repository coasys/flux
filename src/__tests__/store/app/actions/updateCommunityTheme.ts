import community from "../../../fixtures/community.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import * as setTheme from "@/utils/themeHelper";

describe("Update community theme", () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    jest.spyOn(setTheme, "setTheme").mockReturnValue(undefined);

    // @ts-ignore
    const directStore = createDirectStore({
      modules: {
        user,
        data,
        app,
      },
    });
    store = directStore.store;
  });

  test("Update community theme", async () => {
    await store.commit.addCommunity(community);

    expect(store.state.app.currentTheme).toBe("global");
    expect(
      store.state.data.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "light",
      fontFamily: "default",
      hue: 270,
      saturation: 60,
      fontSize: "md",
    });

    await store.dispatch.updateCommunityTheme({
      communityId: community.state.perspectiveUuid,
      theme: {
        name: "test",
        fontFamily: "Arial",
        hue: 90,
      },
    });

    expect(store.state.app.currentTheme).toBe("global");
    expect(
      store.state.data.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "test",
      fontFamily: "Arial",
      hue: 90,
      saturation: 60,
      fontSize: "md",
    });
  });

  test("Update current community theme", async () => {
    await store.commit.addCommunity(community);

    expect(store.state.app.currentTheme).toBe("global");

    await store.dispatch.changeCurrentTheme(community.state.perspectiveUuid);

    expect(store.state.app.currentTheme).toBe(community.state.perspectiveUuid);

    await store.dispatch.updateCommunityTheme({
      communityId: community.state.perspectiveUuid,
      theme: {
        name: "test1",
        fontFamily: "Arial",
        hue: 80,
      },
    });

    expect(store.state.app.currentTheme).toBe(community.state.perspectiveUuid);
    expect(
      store.state.data.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "test1",
      fontFamily: "Arial",
      hue: 80,
      saturation: 60,
      fontSize: "md",
    });
  });

  test("Update community theme for wrong communtiy id", async () => {
    await store.commit.addCommunity(community);

    expect(store.state.app.currentTheme).toBe("global");

    await store.dispatch.changeCurrentTheme(community.state.perspectiveUuid);

    expect(store.state.app.currentTheme).toBe(community.state.perspectiveUuid);

    try {
      await store.dispatch.updateCommunityTheme({
        communityId: `${community.state.perspectiveUuid}1`,
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

    expect(store.state.app.currentTheme).toBe(
      "bebd2ac2-1e80-44d2-b807-0163c2bcef40"
    );
    expect(
      store.state.data.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      name: "test1",
      fontFamily: "Arial",
      hue: 80,
      saturation: 60,
      fontSize: "md",
    });
  });
});

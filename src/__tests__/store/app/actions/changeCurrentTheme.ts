import community from "../../../fixtures/community.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import * as setTheme from "@/utils/themeHelper";

describe("Change Current Theme", () => {
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

  test("Change to global theme", () => {
    store.commit.addCommunity(community);

    expect(store.state.app.currentTheme).toBe("global");

    store.dispatch.changeCurrentTheme("global");

    expect(store.state.app.currentTheme).toBe("global");
  });

  test("Change to local theme for community", async () => {
    await store.commit.addCommunity(community);

    expect(store.state.app.currentTheme).toBe("global");

    await store.dispatch.changeCurrentTheme(community.state.perspectiveUuid);

    expect(store.state.app.currentTheme).toBe(community.state.perspectiveUuid);
  });
});

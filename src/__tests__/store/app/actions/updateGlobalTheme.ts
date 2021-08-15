import community from "../../../fixtures/community.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import * as setTheme from "@/utils/themeHelper";

describe("Update Global Theme", () => {
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

  test("Update global theme", () => {
    store.commit.addCommunity(community);

    expect(store.state.app.currentTheme).toBe("global");
    expect(store.state.app.globalTheme).toStrictEqual({
      name: "light",
      fontFamily: "Poppins",
      hue: 270,
      saturation: 60,
      fontSize: "md",
    });

    store.dispatch.updateGlobalTheme({
      name: "test",
      fontFamily: "Arial",
      hue: 90,
    });

    expect(store.state.app.currentTheme).toBe("global");
    expect(store.state.app.globalTheme).toStrictEqual({
      name: "test",
      fontFamily: "Arial",
      hue: 90,
      saturation: 60,
      fontSize: "md",
    });
  });
});

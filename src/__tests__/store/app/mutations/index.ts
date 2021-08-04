import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import * as getLanguage from "@/core/queries/getLanguage";
import getTypedExpressionLangLanguages from "../../../fixtures/getTypedExpressionLangLanguages.json";
import getTypedExpressionLangLinks from "../../../fixtures/getTypedExpressionLangLinks.json";

describe("App Mutations", () => {
  let store: any;
  let date: Date;

  beforeEach(() => {
    date = new Date();
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

  test("addExpressionUI", async () => {
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
    const [exp, icons] = await getTypedExpressionLanguages(
      getTypedExpressionLangLinks,
      true
    );

    expect(Object.values(store.state.app.expressionUI).length).toBe(0);

    for (const icon of icons) {
      store.commit.addExpressionUI(icon);
    }

    expect(Object.values(store.state.app.expressionUI).length).toBe(4);
  });

  test("setLanguagesPath", () => {
    expect(store.state.app.localLanguagesPath).toBe("");

    store.commit.setLanguagesPath("user/some/path");

    expect(store.state.app.localLanguagesPath).toBe("user/some/path");
  });

  test("setDatabasePerspective", () => {
    expect(store.state.app.databasePerspective).toBe("");

    store.commit.setDatabasePerspective("bb8051d7-71aa-4ab1-83b2-71edbf967bc3");

    expect(store.state.app.databasePerspective).toBe(
      "bb8051d7-71aa-4ab1-83b2-71edbf967bc3"
    );
  });

  test("setApplicationStartTime", () => {
    const currentDate = new Date();

    store.commit.setApplicationStartTime(currentDate);

    expect(store.state.app.applicationStartTime).toStrictEqual(currentDate);
  });

  test("toggleSidebar", () => {
    expect(store.state.app.showSidebar).toBeTruthy();

    store.commit.toggleSidebar();

    expect(store.state.app.showSidebar).toBeFalsy();
  });

  test("setSidebar", () => {
    expect(store.state.app.showSidebar).toBeTruthy();

    store.commit.setSidebar(false);

    expect(store.state.app.showSidebar).toBeFalsy();
  });

  test("setCurrentTheme", () => {
    expect(store.state.app.currentTheme).toBe("global");

    store.commit.setCurrentTheme("bebd2ac2-1e80-44d2-b807-0163c2bcef40");

    expect(store.state.app.currentTheme).toBe(
      "bebd2ac2-1e80-44d2-b807-0163c2bcef40"
    );
  });

  test("setGlobalTheme", () => {
    expect(store.state.app.globalTheme).toStrictEqual({
      fontFamily: "default",
      fontSize: "md",
      hue: 270,
      name: "light",
      saturation: 60,
    });

    store.commit.setGlobalTheme({ fontFamily: "Arial", hue: 70 });

    expect(store.state.app.globalTheme).toStrictEqual({
      fontFamily: "Arial",
      fontSize: "md",
      hue: 70,
      name: "light",
      saturation: 60,
    });
  });

  test("setToast", () => {
    expect(store.state.app.toast).toStrictEqual({
      variant: "",
      open: false,
      message: "",
    });

    store.commit.setToast({ message: "error", open: true, variant: "error" });

    expect(store.state.app.toast).toStrictEqual({
      variant: "error",
      open: true,
      message: "error",
    });
  });

  test("showSuccessToast", () => {
    expect(store.state.app.toast).toStrictEqual({
      variant: "",
      open: false,
      message: "",
    });

    store.commit.showSuccessToast({ message: "success" });

    expect(store.state.app.toast).toStrictEqual({
      variant: "success",
      open: true,
      message: "success",
    });
  });

  test("showDangerToast", () => {
    expect(store.state.app.toast).toStrictEqual({
      variant: "",
      open: false,
      message: "",
    });

    store.commit.showDangerToast({ message: "error" });

    expect(store.state.app.toast).toStrictEqual({
      variant: "danger",
      open: true,
      message: "error",
    });
  });

  test("setWindowState", () => {
    expect(store.state.app.windowState).toBe("visible");

    store.commit.setWindowState("foreground");

    expect(store.state.app.windowState).toBe("foreground");
  });

  test("setUpdateState", () => {
    expect(store.state.app.updateState).toBe("not-available");

    store.commit.setUpdateState({ updateState: "available" });

    expect(store.state.app.updateState).toBe("available");
  });

  test("setGlobalLoading", () => {
    expect(store.state.app.showGlobalLoading).toBeFalsy();

    store.commit.setGlobalLoading(true);

    expect(store.state.app.showGlobalLoading).toBeTruthy();
  });

  test("setGlobalError", () => {
    expect(store.state.app.globalError.show).toBeFalsy();
    expect(store.state.app.globalError.message).toBe("");

    store.commit.setGlobalError({
      show: true,
      message: "error",
    });

    expect(store.state.app.globalError.show).toBeTruthy();
    expect(store.state.app.globalError.message).toBe("error");
  });

  test("setShowCreateCommunity", () => {
    expect(store.state.app.modals.showCreateCommunity).toBeFalsy();

    store.commit.setShowCreateCommunity(true);

    expect(store.state.app.modals.showCreateCommunity).toBeTruthy();
  });

  test("setShowEditCommunity", () => {
    expect(store.state.app.modals.showEditCommunity).toBeFalsy();

    store.commit.setShowEditCommunity(true);

    expect(store.state.app.modals.showEditCommunity).toBeTruthy();
  });

  test("setShowCommunityMembers", () => {
    expect(store.state.app.modals.showCommunityMembers).toBeFalsy();

    store.commit.setShowCommunityMembers(true);

    expect(store.state.app.modals.showCommunityMembers).toBeTruthy();
  });

  test("setShowCreateChannel", () => {
    expect(store.state.app.modals.showCreateChannel).toBeFalsy();

    store.commit.setShowCreateChannel(true);

    expect(store.state.app.modals.showCreateChannel).toBeTruthy();
  });

  test("setShowEditProfile", () => {
    expect(store.state.app.modals.showEditProfile).toBeFalsy();

    store.commit.setShowEditProfile(true);

    expect(store.state.app.modals.showEditProfile).toBeTruthy();
  });

  test("setShowDisclaimer", () => {
    expect(store.state.app.modals.showDisclaimer).toBeTruthy();

    store.commit.setShowDisclaimer(false);

    expect(store.state.app.modals.showDisclaimer).toBeFalsy();
  });

  test("setShowSettings", () => {
    expect(store.state.app.modals.showSettings).toBeFalsy();

    store.commit.setShowSettings(true);

    expect(store.state.app.modals.showSettings).toBeTruthy();
  });

  test("setShowCommunitySettings", () => {
    expect(store.state.app.modals.showCommunitySettings).toBeFalsy();

    store.commit.setShowCommunitySettings(true);

    expect(store.state.app.modals.showCommunitySettings).toBeTruthy();
  });

  test("setShowInviteCode", () => {
    expect(store.state.app.modals.showInviteCode).toBeFalsy();

    store.commit.setShowInviteCode(true);

    expect(store.state.app.modals.showInviteCode).toBeTruthy();
  });
});

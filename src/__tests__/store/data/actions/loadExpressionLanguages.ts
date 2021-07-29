import community from "../../../fixtures/community.json";
import * as getLanguages from "../../../../core/queries/getLanguages";
import { Expression } from "@perspect3vism/ad4m-types";
import languages from "../../../fixtures/languages.json";
import getProfileFixture from "../../../fixtures/getProfile.json";
import * as getExpressionNoCache from "@/core/queries/getExpression";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";

describe('Load Expression Languages', () => {
  let store: any;

  beforeEach(() => {
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

  test('Load Expression Languages - Success', async () => {
    // @ts-ignore
    jest
    .spyOn(getLanguages, "getLanguages")
    // @ts-ignore
    .mockResolvedValue(languages);

    expect(Object.values(store.state.app.expressionUI).length).toBe(0);

    await store.dispatch.loadExpressionLanguages();

    expect(Object.keys(store.state.app.expressionUI).length).toBe(3);
    expect(Object.keys(store.state.app.expressionUI)).toStrictEqual(languages.map(e => e.address));
  });

  test('Load Expression Languages - Failure', async () => {
    // @ts-ignore
    jest
    .spyOn(getLanguages, "getLanguages")
    // @ts-ignore
    .mockRejectedValue('No languages found');

    expect(Object.values(store.state.app.expressionUI).length).toBe(0);

    try {
      await store.dispatch.loadExpressionLanguages();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "No languages found");
    }

    expect(Object.keys(store.state.app.expressionUI).length).toBe(0);
    expect(Object.keys(store.state.app.expressionUI)).not.toStrictEqual(languages.map(e => e.address));
  });
});
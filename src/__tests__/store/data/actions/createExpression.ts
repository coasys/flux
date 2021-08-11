import community from "../../../fixtures/community.json";
import channel from "../../../fixtures/channel.json";
import addChatExpressionLink from "../../../fixtures/addChatExpressionLink.json";
import { createDirectStore } from "direct-vuex";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import * as createExpression from "@/core/mutations/createExpression";
import * as createLink from "@/core/mutations/createLink";
import { ExpressionTypes } from "@/store/types";

describe("Create Expression", () => {
  let store: any;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(createExpression, "createExpression")
      .mockImplementation(async () => {
        return "QmfMfVxRpEzzXxLmraTQumQjfU1mT1NggkT1j9fWSnnC1s://QmfMfVxRpEzzXxLmraTQumQjfU1mT1NggkT1j9fWSnnC1s";
      });

    // @ts-ignore
    jest
      .spyOn(createLink, "createLink")
      .mockImplementation(async (perspective, link) => {
        return addChatExpressionLink;
      });

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

  test("Create Expression - Failure", async () => {
    await store.commit.addCommunity(community);
    await store.commit.createChannel(channel);

    try {
      await store.dispatch.createExpression({
        languageAddress: channel.neighbourhood.typedExpressionLanguages.find(
          (t) => t.expressionType === ExpressionTypes.ShortForm
        )!.languageAddress,
        content: { body: "test", background: [""] },
        perspective: channel.neighbourhood.perspective.uuid as string,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Community does not exists"
      );
    }
  });

  test("Create Expression - Success", async () => {
    await store.commit.addCommunity(community);
    await store.commit.createChannel(channel);

    const link = await store.dispatch.createExpression({
      languageAddress: channel.neighbourhood.typedExpressionLanguages.find(
        (t) => t.expressionType === ExpressionTypes.ShortForm
      )!.languageAddress,
      content: { body: "test", background: [""] },
      perspective: channel.neighbourhood.perspective.uuid as string,
    });

    expect(link).toStrictEqual(addChatExpressionLink);
  });
});

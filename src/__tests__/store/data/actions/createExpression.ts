import community from "../../../fixtures/community.json";
import channel from "../../../fixtures/channel.json";
import addChatExpressionLink from "../../../fixtures/addChatExpressionLink.json";
import { ExpressionTypes } from "@/store/types";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useDataStore } from "@/store/data";
import { ad4mClient } from "@/app";

describe("Create Expression", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.expression, "create")
      .mockImplementation(async () => {
        return "QmfMfVxRpEzzXxLmraTQumQjfU1mT1NggkT1j9fWSnnC1s://QmfMfVxRpEzzXxLmraTQumQjfU1mT1NggkT1j9fWSnnC1s";
      });

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "addLink")
      // @ts-ignore
      .mockImplementation(async (perspective, link) => {
        return addChatExpressionLink;
      });

    store = createPinia();
    setActivePinia(store);
  });

  test("Create Expression - Failure", async () => {
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);
    // @ts-ignore
    await dataStore.createChannelMutation(channel);

    try {
      await dataStore.createExpression({
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
    const dataStore = useDataStore();

    // @ts-ignore
    await dataStore.addCommunity(community);
    // @ts-ignore
    await dataStore.createChannelMutation(channel);

    const link = await dataStore.createExpression({
      languageAddress: channel.neighbourhood.typedExpressionLanguages.find(
        (t) => t.expressionType === ExpressionTypes.ShortForm
      )!.languageAddress,
      content: { body: "test", background: [""] },
      perspective: channel.neighbourhood.perspective.uuid as string,
    });

    expect(link).toStrictEqual(addChatExpressionLink);
  });
});

import community from "../../../fixtures/community.json";
import channel from "../../../fixtures/channel.json";
import initAgentFixture from "../../../fixtures/initAgent.json";
import getProfileFixture from "../../../fixtures/getProfile.json";
import * as agentUnlock from "../../../../core/mutations/agentUnlock";
import lockAgentFixture from "../../../fixtures/lockAgent.json";
import { AgentStatus, Expression } from "@perspect3vism/ad4m";
import { TimeoutCache } from "@/utils/timeoutCache";
import { ExpressionTypes } from "@/store/types";
import * as getExpressionNoCache from "@/core/queries/getExpression";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";
import { useDataStore } from "@/store/data";

describe("Show Message Notification", () => {
  let store: Pinia;
  let profileLangAddress: string;
  let did: string;
  let profileLink: string;

  beforeAll(async () => {
    Object.defineProperty(global, "Notification", {
      value: jest.fn(),
    });

    const cache = new TimeoutCache<any>(10);

    profileLangAddress = community.neighbourhood.typedExpressionLanguages.find(
      (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
    )!.languageAddress!;

    did = initAgentFixture.did;

    profileLink = `${profileLangAddress}://${did}`;

    await cache.remove(profileLink);
  });

  beforeEach(() => {
    jest
      .spyOn(agentUnlock, "agentUnlock")
      .mockImplementation(async (password) => {
        if (password === "test123") {
          return lockAgentFixture as AgentStatus;
        }

        throw new Error("Password doesn't match");
      });

    store = createPinia();
    setActivePinia(store);
  });

  test("Show Message Notification for same user", async () => {
    const dataStore = useDataStore();
    const userStore = useUserStore();
    await userStore.logIn({
      password: "test123",
    });
    // @ts-ignore
    await dataStore.addCommunity(community);
    // @ts-ignore
    await dataStore.createChannelMutation(channel);

    const notification = await dataStore.showMessageNotification({
      // @ts-ignore
      router: {
        push: jest.fn(),
      },
      // @ts-ignore
      route: {
        params: {
          channelId: channel.state.perspectiveUuid,
          communityId: community.state.perspectiveUuid,
        },
      },
      perspectiveUuid: channel.state.perspectiveUuid,
      authorDid: lockAgentFixture.did,
      message: "hello",
    });

    expect(notification).toBeUndefined();
  });

  test("Show Message Notification for different user, with same community & channel", async () => {
    const dataStore = useDataStore();
    const userStore = useUserStore();

    await userStore.logIn({
      password: "test123",
    });
    // @ts-ignore
    await dataStore.addCommunity(community);
    // @ts-ignore
    await dataStore.createChannelMutation(channel);

    const notification = await dataStore.showMessageNotification({
      // @ts-ignore
      router: {
        push: jest.fn(),
      },
      // @ts-ignore
      route: {
        params: {
          channelId: channel.state.perspectiveUuid,
          communityId: community.state.perspectiveUuid,
        },
      },
      perspectiveUuid: channel.state.perspectiveUuid,
      authorDid: "did:key:zQ3shP8NxwzjZkesAN71piLiSPjyYCZAnH22Cs2nyG5LpCwaC",
      message: "hello",
    });

    expect(notification).toBeUndefined();
  });

  test("Show Message Notification for different user, with same community & different channel", async () => {
    const dataStore = useDataStore();
    const userStore = useUserStore();

    await userStore.logIn({
      password: "test123",
    });
    // @ts-ignore
    await dataStore.addCommunity(community);
    // @ts-ignore
    await dataStore.createChannelMutation(channel);

    const notification = await dataStore.showMessageNotification({
      // @ts-ignore
      router: {
        push: jest.fn(),
      },
      // @ts-ignore
      route: {
        params: {
          channelId: "c6deef81-f6c6-421a-8f5b-642e2287c026",
          communityId: community.state.perspectiveUuid,
        },
      },
      perspectiveUuid: channel.state.perspectiveUuid,
      authorDid: "did:key:zQ3shP8NxwzjZkesAN71piLiSPjyYCZAnH22Cs2nyG5LpCwaC",
      message: "hello",
    });

    expect(notification).not.toBeUndefined();
  });

  test("Show mention Message Notification for different user, with same community & different channel", async () => {
    const dataStore = useDataStore();
    const userStore = useUserStore();

    // @ts-ignore
    jest
      .spyOn(getExpressionNoCache, "getExpressionNoCache")
      .mockImplementation(async (url) => {
        const split = url.split("://");
        if (split[1] === did && split[0] === profileLangAddress) {
          return getProfileFixture as unknown as Expression;
        }

        return null;
      });
    await userStore.logIn({
      password: "test123",
    });
    // @ts-ignore
    await dataStore.addCommunity(community);
    // @ts-ignore
    await dataStore.createChannelMutation(channel);

    const notification = await dataStore.showMessageNotification({
      // @ts-ignore
      router: {
        push: jest.fn(),
      },
      // @ts-ignore
      route: {
        params: {
          channelId: "c6deef81-f6c6-421a-8f5b-642e2287c026",
          communityId: community.state.perspectiveUuid,
        },
      },
      perspectiveUuid: channel.state.perspectiveUuid,
      authorDid: "did:key:zQ3shP8NxwzjZkesAN71piLiSPjyYCZAnH22Cs2nyG5LpCwaC",
      message:
        '<p>hello <span data-id="did:key:zQ3shP8NxwzjZkesAN71piLiSPjyYCZAnH22Cs2nyG5LpCwaR">@jhon</span></p>',
    });

    expect(notification).not.toBeUndefined();
  });
});

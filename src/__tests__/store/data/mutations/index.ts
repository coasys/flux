import community from "../../../fixtures/community.json";
import channel from "../../../fixtures/channel.json";
import channel1 from "../../../fixtures/channel1.json";
import createChannel from "../../../fixtures/createChannel.json";
import messageLink from "../../../fixtures/messageLink.json";
import messageExpression from "../../../fixtures/messageExpression.json";
import app from "@/store/app";
import user from "@/store/user";
import data from "@/store/data";
import { createDirectStore } from "direct-vuex";

describe("Data Mutations", () => {
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

  test("Add Community", () => {
    expect(Object.values(store.state.data.communities).length).toBe(0);

    store.commit.addCommunity(community);

    expect(Object.values(store.state.data.communities).length).toBe(1);

    expect(
      (Object.values(store.state.data.neighbourhoods)[0] as any).perspective
        .uuid
    ).toBe(community.neighbourhood.perspective.uuid);
  });

  test("Check duplicate community if one exists already", async () => {
    expect(Object.values(store.state.data.communities).length).toBe(0);

    store.commit.addCommunity(community);

    expect(Object.keys(store.state.data.communities)).toStrictEqual([
      community.neighbourhood.perspective.uuid,
    ]);

    store.commit.addCommunity(community);

    expect(Object.keys(store.state.data.communities)).toStrictEqual([
      community.neighbourhood.perspective.uuid,
    ]);
  });

  // TODO: @fayeed
  test("Add message", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    const channelId = "884f1238-c3d1-41b4-8489-aa73c5f9fc08";

    expect(
      Object.values(
        store.state.data.neighbourhoods[channelId].currentExpressionLinks
      ).length
    ).toBe(0);
    expect(
      Object.values(
        store.state.data.neighbourhoods[channelId].currentExpressionMessages
      ).length
    ).toBe(0);

    store.commit.addMessage({
      channelId,
      link: messageLink,
      expression: messageExpression,
    });

    expect(
      Object.values(
        store.state.data.neighbourhoods[channelId].currentExpressionLinks
      ).length
    ).toBe(1);
    expect(
      Object.values(
        store.state.data.neighbourhoods[channelId].currentExpressionMessages
      ).length
    ).toBe(1);
  });

  // TODO: @fayeed
  test("Add messages", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(channel);

    expect(
      Object.values(
        store.state.data.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(0);
    expect(
      Object.values(
        store.state.data.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(0);

    store.commit.addMessages({
      channelId: channel.state.perspectiveUuid,
      links: [messageLink],
      expressions: [messageExpression],
    });

    expect(
      Object.values(
        store.state.data.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(1);
    expect(
      Object.values(
        store.state.data.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(1);
  });

  test("Set current channel Id", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(
      store.state.data.communities[community.state.perspectiveUuid]
        .currentChannelId
    ).toBeNull();

    store.commit.setCurrentChannelId({
      communityId: community.state.perspectiveUuid,
      channelId: createChannel.state.perspectiveUuid,
    });

    expect(
      store.state.data.communities[community.state.perspectiveUuid]
        .currentChannelId
    ).toBe(createChannel.state.perspectiveUuid);
  });

  test("Remove community", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(Object.values(store.state.data.communities).length).toBe(1);
    expect(Object.values(store.state.data.neighbourhoods).length).toBe(2);

    store.commit.removeCommunity(community.state.perspectiveUuid);

    expect(Object.values(store.state.data.communities).length).toBe(0);
    expect(Object.values(store.state.data.neighbourhoods).length).toBe(1);
  });

  test("Set Channel Notification State", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(
      store.state.data.channels[createChannel.state.perspectiveUuid]
        .notifications.mute
    ).toBeFalsy();

    store.commit.setChannelNotificationState({
      channelId: createChannel.state.perspectiveUuid,
    });

    expect(
      store.state.data.channels[createChannel.state.perspectiveUuid]
        .notifications.mute
    ).toBeTruthy();
  });

  // TODO: @fayeed
  // test("Set Community Members", () => {});

  test("Set community Theme", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(
      store.state.data.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      fontSize: "md",
      fontFamily: "Poppins",
      name: "light",
      hue: 270,
      saturation: 60,
    });

    store.commit.setCommunityTheme({
      communityId: community.state.perspectiveUuid,
      theme: {
        fontSize: "lg",
        saturation: 80,
      },
    });

    expect(
      store.state.data.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      fontSize: "lg",
      fontFamily: "Poppins",
      name: "light",
      hue: 270,
      saturation: 80,
    });
  });

  test("Update Community Metadata", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(
      store.state.data.neighbourhoods[community.state.perspectiveUuid].name
    ).toBe("test");
    expect(
      store.state.data.neighbourhoods[community.state.perspectiveUuid]
        .description
    ).toBe("");
    expect(
      store.state.data.neighbourhoods[community.state.perspectiveUuid]
        .groupExpressionRef
    ).toBe(
      "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9ee"
    );

    store.commit.updateCommunityMetadata({
      communityId: community.state.perspectiveUuid,
      name: "test1",
      description: "test",
      groupExpressionRef:
        "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9e1",
    });

    expect(
      store.state.data.neighbourhoods[community.state.perspectiveUuid].name
    ).toBe("test1");
    expect(
      store.state.data.neighbourhoods[community.state.perspectiveUuid]
        .description
    ).toBe("test");
    expect(
      store.state.data.neighbourhoods[community.state.perspectiveUuid]
        .groupExpressionRef
    ).toBe(
      "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9e1"
    );
  });

  test("Set channel scrollTop", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(
      store.state.data.channels[createChannel.state.perspectiveUuid].scrollTop
    ).toBeUndefined();

    store.commit.setChannelScrollTop({
      channelId: createChannel.state.perspectiveUuid,
      value: 100,
    });

    expect(
      store.state.data.channels[createChannel.state.perspectiveUuid].scrollTop
    ).toBe(100);
  });

  test("Add channel", () => {
    expect(Object.values(store.state.data.communities).length).toBe(0);

    store.commit.addCommunity(community);

    expect(Object.values(store.state.data.communities).length).toBe(1);

    expect(
      store.state.data.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives.length
    ).toBe(1);

    store.commit.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    expect(
      store.state.data.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives.length
    ).toBe(2);
  });

  test("Add channel without duplicate entries in community neighbourhood", () => {
    expect(Object.values(store.state.data.communities).length).toBe(0);

    store.commit.addCommunity(community);

    expect(
      (Object.values(store.state.data.neighbourhoods)[0] as any).perspective
        .uuid
    ).toBe(community.neighbourhood.perspective.uuid);

    store.commit.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    expect(
      store.state.data.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives
    ).toStrictEqual([
      "884f1238-c3d1-41b4-8489-aa73c5f9fc08",
      channel.neighbourhood.perspective.uuid,
    ]);

    store.commit.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    expect(
      store.state.data.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives
    ).toStrictEqual([
      "884f1238-c3d1-41b4-8489-aa73c5f9fc08",
      channel.neighbourhood.perspective.uuid,
    ]);
  });

  test("Add channel to without adding an entry in community neighbourhood", () => {
    expect(Object.values(store.state.data.neighbourhoods).length).toBe(0);

    store.commit.addCommunity(community);

    store.commit.createChannel(createChannel);

    expect(Object.values(store.state.data.channels).length).toBe(1);

    expect(Object.keys(store.state.data.channels)).toStrictEqual([
      createChannel.neighbourhood.perspective.uuid,
    ]);
  });

  test("Set has new messages", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(createChannel);

    expect(
      store.state.data.channels[createChannel.state.perspectiveUuid]
        .hasNewMessages
    ).toBeFalsy();

    store.commit.setHasNewMessages({
      channelId: createChannel.state.perspectiveUuid,
      value: true,
    });

    expect(
      store.state.data.channels[createChannel.state.perspectiveUuid]
        .hasNewMessages
    ).toBeTruthy();
  });

  test("Add Expression and Link", () => {
    store.commit.addCommunity(community);
    store.commit.createChannel(channel1);

    expect(
      Object.values(
        store.state.data.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(0);
    expect(
      Object.values(
        store.state.data.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(0);

    store.commit.addExpressionAndLink({
      channelId: channel1.state.perspectiveUuid,
      link: messageLink,
      message: messageExpression,
    });

    expect(
      Object.values(
        store.state.data.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(1);
    expect(
      Object.values(
        store.state.data.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(1);
  });
});

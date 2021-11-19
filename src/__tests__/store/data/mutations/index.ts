import community from "../../../fixtures/community.json";
import createCommunity from "../../../fixtures/createCommunity.json";
import channel from "../../../fixtures/channel.json";
import channel1 from "../../../fixtures/channel1.json";
import createChannel from "../../../fixtures/createChannel.json";
import messageLink from "../../../fixtures/messageLink.json";
import messageExpression from "../../../fixtures/messageExpression.json";
import { useDataStore } from "@/store/data";
import { Pinia, createPinia, setActivePinia } from "pinia";

describe("Data Mutations", () => {
  let store: Pinia;

  beforeEach(() => {
    store = createPinia();
    setActivePinia(store);
  });

  test("Add Community", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.values(dataStore.communities).length).toBe(1);

    expect(
      (Object.values(dataStore.neighbourhoods)[0] as any).perspective.uuid
    ).toBe(community.neighbourhood.perspective.uuid);
  });

  test("Check duplicate community if one exists already", async () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.keys(dataStore.communities)).toStrictEqual([
      community.neighbourhood.perspective.uuid,
    ]);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.keys(dataStore.communities)).toStrictEqual([
      community.neighbourhood.perspective.uuid,
    ]);
  });

  // TODO: @fayeed
  test("Add message", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    const channelId = "884f1238-c3d1-41b4-8489-aa73c5f9fc08";

    expect(
      Object.values(dataStore.neighbourhoods[channelId].currentExpressionLinks)
        .length
    ).toBe(0);
    expect(
      Object.values(
        dataStore.neighbourhoods[channelId].currentExpressionMessages
      ).length
    ).toBe(0);

    dataStore.addMessage({
      channelId,
      link: messageLink,
      expression: messageExpression,
    });

    expect(
      Object.values(dataStore.neighbourhoods[channelId].currentExpressionLinks)
        .length
    ).toBe(1);
    expect(
      Object.values(
        dataStore.neighbourhoods[channelId].currentExpressionMessages
      ).length
    ).toBe(1);
  });

  // TODO: @fayeed
  test("Add messages", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(channel);

    expect(
      Object.values(
        dataStore.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(0);
    expect(
      Object.values(
        dataStore.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(0);

    dataStore.addMessages({
      channelId: channel.state.perspectiveUuid,
      // @ts-ignore
      links: [messageLink],
      // @ts-ignore
      expressions: [messageExpression],
    });

    expect(
      Object.values(
        dataStore.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(1);
    expect(
      Object.values(
        dataStore.neighbourhoods[channel.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(1);
  });

  test("Set current channel Id", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.communities[community.state.perspectiveUuid].currentChannelId
    ).toBeNull();

    dataStore.setCurrentChannelId({
      communityId: community.state.perspectiveUuid,
      channelId: createChannel.state.perspectiveUuid,
    });

    expect(
      dataStore.communities[community.state.perspectiveUuid].currentChannelId
    ).toBe(createChannel.state.perspectiveUuid);
  });

  test("Remove community", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(Object.values(dataStore.communities).length).toBe(1);
    expect(Object.values(dataStore.neighbourhoods).length).toBe(2);

    dataStore.removeCommunity(community.state.perspectiveUuid);

    expect(Object.values(dataStore.communities).length).toBe(0);
    expect(Object.values(dataStore.neighbourhoods).length).toBe(1);
  });

  test("Set Channel Notification State", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.channels[createChannel.state.perspectiveUuid].notifications.mute
    ).toBeFalsy();

    dataStore.setChannelNotificationState({
      channelId: createChannel.state.perspectiveUuid,
    });

    expect(
      dataStore.channels[createChannel.state.perspectiveUuid].notifications.mute
    ).toBeTruthy();
  });

  test("Set community Theme", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      fontSize: "md",
      fontFamily: "Poppins",
      name: "light",
      hue: 270,
      saturation: 60,
    });

    dataStore.setCommunityTheme({
      communityId: community.state.perspectiveUuid,
      // @ts-ignore
      theme: {
        fontSize: "lg",
        saturation: 80,
      },
    });

    expect(
      dataStore.communities[community.state.perspectiveUuid].theme
    ).toStrictEqual({
      fontSize: "lg",
      fontFamily: "Poppins",
      name: "light",
      hue: 270,
      saturation: 80,
    });
  });

  test("Update Community Metadata", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("");
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid]
        .groupExpressionRef
    ).toBe(
      "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9ee"
    );

    // @ts-ignore
    dataStore.updateCommunityMetadata({
      communityId: community.state.perspectiveUuid,
      name: "test1",
      description: "test",
      groupExpressionRef:
        "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9e1",
    });

    expect(dataStore.neighbourhoods[community.state.perspectiveUuid].name).toBe(
      "test1"
    );
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid].description
    ).toBe("test");
    expect(
      dataStore.neighbourhoods[community.state.perspectiveUuid]
        .groupExpressionRef
    ).toBe(
      "QmUCLri8MRJVpXsBRvry8KaQEkX7RhKcqBwfAkMmTo6Swq://842924ebd45599a4c749d87247368bed49c9d0b2b3716573f054b472b6a5b2a52eb97ab243d9e1"
    );
  });

  test("Set channel scrollTop", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.channels[createChannel.state.perspectiveUuid].scrollTop
    ).toBeUndefined();

    dataStore.setChannelScrollTop({
      channelId: createChannel.state.perspectiveUuid,
      value: 100,
    });

    expect(
      dataStore.channels[createChannel.state.perspectiveUuid].scrollTop
    ).toBe(100);
  });

  test("Add channel", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(Object.values(dataStore.communities).length).toBe(1);

    expect(
      dataStore.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives.length
    ).toBe(1);

    dataStore.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      // @ts-ignore
      channel,
    });

    expect(
      dataStore.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives.length
    ).toBe(2);
  });

  test("Add channel without duplicate entries in community neighbourhood", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.communities).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);

    expect(
      (Object.values(dataStore.neighbourhoods)[0] as any).perspective.uuid
    ).toBe(community.neighbourhood.perspective.uuid);

    dataStore.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      // @ts-ignore
      channel,
    });

    expect(
      dataStore.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives
    ).toStrictEqual([
      "884f1238-c3d1-41b4-8489-aa73c5f9fc08",
      channel.neighbourhood.perspective.uuid,
    ]);

    dataStore.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      // @ts-ignore
      channel,
    });

    expect(
      dataStore.neighbourhoods[community.neighbourhood.perspective.uuid]
        .linkedPerspectives
    ).toStrictEqual([
      "884f1238-c3d1-41b4-8489-aa73c5f9fc08",
      channel.neighbourhood.perspective.uuid,
    ]);
  });

  test("Add channel to without adding an entry in community neighbourhood", () => {
    const dataStore = useDataStore();
    expect(Object.values(dataStore.neighbourhoods).length).toBe(0);

    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(Object.values(dataStore.channels).length).toBe(1);

    expect(Object.keys(dataStore.channels)).toStrictEqual([
      createChannel.neighbourhood.perspective.uuid,
    ]);
  });

  test("Set has new messages", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(createCommunity);
    // @ts-ignore
    dataStore.createChannelMutation(createChannel);

    expect(
      dataStore.channels[createChannel.state.perspectiveUuid].hasNewMessages
    ).toBeFalsy();

    dataStore.setHasNewMessages({
      channelId: createChannel.state.perspectiveUuid,
      value: true,
    });

    expect(
      dataStore.channels[createChannel.state.perspectiveUuid].hasNewMessages
    ).toBeTruthy();
  });

  test("Add Expression and Link", () => {
    const dataStore = useDataStore();
    // @ts-ignore
    dataStore.addCommunity(community);
    // @ts-ignore
    dataStore.createChannelMutation(channel1);

    expect(
      Object.values(
        dataStore.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(0);
    expect(
      Object.values(
        dataStore.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(0);

    dataStore.addExpressionAndLink({
      channelId: channel1.state.perspectiveUuid,
      link: messageLink,
      message: messageExpression,
    });

    expect(
      Object.values(
        dataStore.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionLinks
      ).length
    ).toBe(1);
    expect(
      Object.values(
        dataStore.neighbourhoods[channel1.state.perspectiveUuid]
          .currentExpressionMessages
      ).length
    ).toBe(1);
  });
});

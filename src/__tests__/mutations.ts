import "@testing-library/vue";
import app from "@/store/app";
// import { AppStore } from "@/store";
import community from "./fixtures/community.json";
import channel from "./fixtures/channel.json";
import user from "@/store/user";
import data from "@/store/data";
import { createDirectStore } from "direct-vuex";

describe("Store Mutations", () => {
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
    store = directStore.store; //createStore(tempStore);
  });

  test("Add Community", async () => {
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

  test("Add Channel", async () => {
    expect(Object.values(store.state.data.communities).length).toBe(0);

    store.commit.addCommunity(community);

    expect(Object.values(store.state.data.communities).length).toBe(1);

    // expect(
    //   (Object.values(store.state.data.neighbourhoods)[0] as any).perspectiveUuid
    // ).toBe(community.neighbourhood.perspective.uuid);

    expect(
      Object.values(
        store.state.data.communities[community.neighbourhood.perspective.uuid]
          .channels
      ).length
    ).toBe(1);

    store.commit("addChannel", {
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    expect(
      Object.values(
        store.state.data.communities[community.neighbourhood.perspective.uuid]
          .channels
      ).length
    ).toBe(2);
  });

  test("Check duplicate channel if one exists already", async () => {
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
      Object.keys(
        store.state.data.neighbourhoods[
          community.neighbourhood.perspective.uuid
        ].linkedPerspectives
      )
    ).toStrictEqual([
      "884f1238-c3d1-41b4-8489-aa73c5f9fc08",
      channel.neighbourhood.perspective.uuid,
    ]);

    store.commit.addChannel({
      communityId: community.neighbourhood.perspective.uuid,
      channel,
    });

    expect(
      Object.keys(
        store.state.data.communities[community.neighbourhood.perspective.uuid]
          .channels
      )
    ).toStrictEqual([
      "30e4a29e-1373-4c8a-a5af-a2353c919e7a",
      channel.neighbourhood.perspective.uuid,
    ]);
  });

  test("Create Profile", async () => {
    expect(store.state.user.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "jhon",
      profilePicture: "test",
      thumbnailPicture: "test",
    };

    await store.commit.setUserProfile(profile);

    expect(store.state.user.profile).not.toBeNull();
    expect(store.state.user.profile).toStrictEqual(profile);
  });
});

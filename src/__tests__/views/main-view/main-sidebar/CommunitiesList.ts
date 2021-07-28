import "regenerator-runtime/runtime";
import { fireEvent, render } from "@testing-library/vue";
import CommunitiesList from "@/views/main-view/main-sidebar/CommunitiesList.vue";
import user from "@/store/user";
import data from "@/store/data";
import app from "@/store/app";
import community from "../../../fixtures/community.json";
import { State } from "vue-demi";
import { createApp } from "vue";
import { Store, createStore } from "vuex";
import { createDirectStore } from "direct-vuex";
// import { AppStore } from "@/store";

function generateStore() {
  return createDirectStore({
    modules: {
      user,
      data,
      app,
    },
  });
}

describe("Communities List", () => {
  let store: any;
  let mockRouter: any;
  let mockRoute: any;

  beforeEach(() => {
    mockRoute = {
      params: {},
    };

    mockRouter = {
      push: jest.fn(),
    };
  });

  test("Check there is no community avatar", () => {
    const { container, findByTitle } = render(CommunitiesList, {
      global: {
        plugins: [generateStore().store.original],
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        },
      },
    });

    const communities = container.querySelectorAll(".left-nav__community-item");

    expect(communities.length).toBe(0);

    const addBtn = findByTitle("Add community");

    expect(addBtn).not.toBeNull();
  });

  test("Check there is only one community avatar", async () => {
    await store.commit.addCommunity(community);

    const { container, findByTitle } = render(CommunitiesList, {
      global: {
        plugins: [generateStore().store.original],
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        },
      },
    });

    const communities = container.querySelectorAll(".left-nav__community-item");

    expect(communities.length).toBe(1);

    const addBtn = findByTitle("Add community");

    expect(addBtn).not.toBeNull();
  });

  test("Check there if onclick community chnages the route changes", async () => {
    await store.commit.addCommunity(community);

    const { container } = render(CommunitiesList, {
      global: {
        plugins: [generateStore().store.original],
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        },
      },
    });

    const communities = container.querySelectorAll(".left-nav__community-item");

    expect(communities.length).toBe(1);

    await fireEvent.click(communities[0]);

    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith({
      name: "community",
      params: { communityId: community.neighbourhood.perspective.uuid },
    });
  });

  test("Check there if onclick community works for community that is selected", async () => {
    console.log(store.state);
    // @ts-ignore
    await store.commit.addCommunity(community);
    console.log(store.state);

    const { container } = render(CommunitiesList, {
      global: {
        plugins: [generateStore().store.original],
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        },
      },
    });

    expect(store.state.app.showSidebar).toBeTruthy();

    const communities = container.querySelectorAll(".left-nav__community-item");

    expect(communities.length).toBe(1);

    await fireEvent.click(communities[0]);

    expect(mockRouter.push).toHaveBeenCalledTimes(0);
    expect(mockRouter.push).not.toHaveBeenCalledWith({
      name: "community",
      params: { communityId: community.neighbourhood.perspective.uuid },
    });
    expect(store.state.app.showSidebar).toBeFalsy();
  });
});

import 'regenerator-runtime/runtime'
import { fireEvent, render } from '@testing-library/vue';
import CommunitiesList from '@/views/main-view/main-sidebar/CommunitiesList.vue';
import actions from '@/store/actions';
import getters from '@/store/getters';
import mutations from '@/store/mutations';
import community from "../../../fixtures/community.json";
import { State } from 'vue-demi';
import { Store, createStore } from 'vuex';

const tempStore = {
  state: {
    ui: {
      modals: {
        showCreateCommunity: false,
        showEditCommunity: false,
        showCommunityMembers: false,
        showCreateChannel: false,
        showEditProfile: false,
        showSettings: false,
        showInviteCode: false,
      },
      showSidebar: true,
      showGlobalLoading: false,
      theme: {
        fontFamily: "default",
        name: "",
        hue: 270,
        saturation: 50,
      },
      toast: {
        variant: "",
        message: "",
        open: false,
      },
      globalError: {
        show: false,
        message: "",
      },
    },
    communities: {},
    localLanguagesPath: "",
    databasePerspective: "",
    applicationStartTime: new Date(),
    expressionUI: {},
    agentUnlocked: false,
    agentInit: false,
    userProfile: null,
    updateState: "not-available",
    userDid: "",
    windowState: "visible",
  },
  mutations: mutations,
  actions: actions,
  getters: getters,
}

describe('Communities List', () => {
  let store: Store<State>;  
  let mockRouter: any;
  let mockRoute: any;
  
  beforeEach(() => {
    // @ts-ignore
    store = createStore(tempStore);

    mockRoute = {
      params: {}
    }

    mockRouter = {
      push: jest.fn(),
    }
  });

  test('Check there is no community avatar', () => {
    const { container, findByTitle } = render(CommunitiesList, { 
      global: {
        plugins: [store],
        mocks: {
          $router: mockRouter,
          $route: mockRoute
        }
      }
     });

     const communities = container.querySelectorAll('.left-nav__community-item');

     expect(communities.length).toBe(0);

     const addBtn = findByTitle('Add community');

     expect(addBtn).not.toBeNull();
  });

  test('Check there is only one community avatar', async () => {
    // @ts-ignore
    store = createStore({...tempStore, state: {...tempStore.state, communities: {[community.perspective]: community}}});

    const { container, findByTitle } = render(CommunitiesList, { 
      global: {
        plugins: [store],
        mocks: {
          $router: mockRouter,
          $route: mockRoute
        }
      }
     });

     const communities = container.querySelectorAll('.left-nav__community-item');

     expect(communities.length).toBe(1);

     const addBtn = findByTitle('Add community');

     expect(addBtn).not.toBeNull();
  });

  test('Check there if onclick community chnages the route changes', async () => {
    // @ts-ignore
    store = createStore({...tempStore, state: {...tempStore.state, communities: {[community.perspective]: community}}});

    const { container } = render(CommunitiesList, { 
      global: {
        plugins: [store],
        mocks: {
          $router: mockRouter,
          $route: mockRoute
        }
      }
     });

     const communities = container.querySelectorAll('.left-nav__community-item');

     expect(communities.length).toBe(1);

     await fireEvent.click(communities[0]);

     expect(mockRouter.push).toHaveBeenCalledTimes(1);
     expect(mockRouter.push).toHaveBeenCalledWith({name: "community", params: {communityId: community.perspective}})
  });

  test('Check there if onclick community works for community that is selected', async () => {
    // @ts-ignore
    store = createStore({...tempStore, state: {...tempStore.state, communities: {[community.perspective]: community}}});

    const { container } = render(CommunitiesList, { 
      global: {
        plugins: [store],
        mocks: {
          $router: mockRouter,
          $route: {
            params: {
              communityId: community.perspective
            }
          }
        }
      }
     });

     expect(store.state.ui.showSidebar).toBeTruthy();

     const communities = container.querySelectorAll('.left-nav__community-item');

     expect(communities.length).toBe(1);

     await fireEvent.click(communities[0]);

     expect(mockRouter.push).toHaveBeenCalledTimes(0);
     expect(mockRouter.push).not.toHaveBeenCalledWith({name: "community", params: {communityId: community.perspective}});
     expect(store.state.ui.showSidebar).toBeFalsy();
  });
})
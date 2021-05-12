import { Store } from "vuex";
import { CommunityState, CommunityView } from ".store/index";
import VueApollo from "@vue/apollo-option";

declare module "@vue/runtime-core" {
  // declare your own store states
  interface State {
    currentTheme: string;
    currentCommunity: CommunityState | null;
    currentCommunityView: CommunityView | null;
    communities: CommunityState[];
    localLanguagesPath: string;
  }

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<State>;
  }

  VueApollo;
}

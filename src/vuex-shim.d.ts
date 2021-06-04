import { Store } from "vuex";
import {
  CommunityState,
  Profile,
  UIState,
  ExpressionUIIcons,
} from ".store/index";
import VueApollo from "@vue/apollo-option";

declare module "@vue/runtime-core" {
  // declare your own store states
  interface State {
    ui: UIState;
    communities: CommunityState[];
    localLanguagesPath: string;
    databasePerspective: string;
    //This tells us when the application was started; this tells us that between startTime -> now all messages should have been received
    //via signals and thus we do not need to query for this time period
    applicationStartTime: Date;
    //TODO: this is a horrible type for this use; would be better to have a real map with values pointing to same strings where appropriate
    //fow now this is fine
    expressionUI: ExpressionUIIcons[];
    agentUnlocked: boolean;
    agentInit: boolean;
    userProfile: Profile | null;
  }

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<State>;
  }

  VueApollo;
}

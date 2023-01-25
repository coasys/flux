import { ApplicationState, WindowState } from "@/store/types";

export default {
  getWindowState(state: ApplicationState): WindowState {
    return state.windowState;
  },
};

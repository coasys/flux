export default {
  updateAgentLockState(state: State, payload: boolean): void {
    state.agentUnlocked = payload;
  },

  updateAgentInitState(state: State, payload: boolean): void {
    state.agentInit = payload;
  },

  createProfile(
    state: State,
    { profile, did }: { profile: Profile; did: string }
  ): void {
    state.userProfile = profile;
    state.userDid = did;
  },

  setUserProfile(state: State, payload: Profile): void {
    state.userProfile = { ...state.userProfile, ...payload };
  },
};

import { Commit } from "vuex";

export interface Context {
  commit: Commit;
}

export interface Payload {
  username: string;
}

export default async ({ commit }: Context, payload: Payload): Promise<any> => {
  // TODO:  GraphQL Mutation
  commit("setUserProfile", payload);
};

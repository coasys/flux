// import VuexPersistence from "vuex-persist";
// import { createDirectStore } from "direct-vuex";
// import user from "./user";
// import data from "./data";
// import app from "./app";

// const vuexLocal = new VuexPersistence({
//   storage: window.localStorage,
// });

// const {
//   store,
//   rootActionContext,
//   moduleActionContext,
//   rootGetterContext,
//   moduleGetterContext,
// } = createDirectStore({
//   modules: {
//     user,
//     data,
//     app,
//   },
//   plugins: [vuexLocal.plugin],
// });

// export default store;

// export {
//   rootActionContext,
//   moduleActionContext,
//   rootGetterContext,
//   moduleGetterContext,
// };

// // The following lines enable types in the injected store '$store'.
// export type AppStore = typeof store;

// declare module "vuex" {
//   interface Store<S> {
//     direct: AppStore;
//   }
// }

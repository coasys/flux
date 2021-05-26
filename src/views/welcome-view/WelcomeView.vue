<template>
  <div class="welcome-view">
    <div class="welcome-view__left">
      <div class="welcome-view__logo">
        <img
          width="100"
          src="../../assets/images/junto_web_logo--rainbow.png"
          alt=""
        />
      </div>
      <j-text variant="heading-lg">JUNTO</j-text>
      <j-text variant="ingress">
        Welcome to the next generation of social media.
      </j-text>
      <j-text variant="body">
        Submitting user information will register you in the public junto DNA
        but this is not required to use private groups.
      </j-text>
    </div>
    <div class="welcome-view__right">
      <div v-if="isInit">
        <j-text variant="heading">Welcome back</j-text>
        <j-flex direction="column" gap="400">
          <j-input
            size="lg"
            label="Password"
            type="password"
            :value="password"
            @input="(e) => e.target.value"
          ></j-input>
          <j-button
            full="false"
            size="lg"
            variant="primary"
            @click="unlockDidStoreMethod"
            >Login
          </j-button>
        </j-flex>
      </div>
      <j-flex direction="column" gap="400" v-if="!isInit">
        <j-text variant="heading">Sign up</j-text>
        <j-input
          label="First Name"
          :value="name"
          @input="(e) => (name = e.target.value)"
        ></j-input>
        <j-input
          label="Last Name"
          :value="familyName"
          @input="(e) => (familyName = e.target.value)"
        ></j-input>
        <j-input
          label="Username"
          :value="username"
          @input="(e) => (username = e.target.value)"
        ></j-input>
        <j-input
          type="email"
          label="Email"
          :value="email"
          @input="(e) => (email = e.target.value)"
        ></j-input>
        <j-input
          type="password"
          label="Password"
          :value="password"
          @input="(e) => (password = e.target.value)"
        ></j-input>
        <j-button
          size="lg"
          full="true"
          variant="primary"
          @click="submitUserInfo"
        >
          Create
        </j-button>
      </j-flex>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import {
  INITIALIZE_AGENT,
  AGENT_SERVICE_STATUS,
  UNLOCK_AGENT,
  LOCK_AGENT,
  ADD_PERSPECTIVE,
} from "../../core/graphql_queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import ad4m from "@perspect3vism/ad4m-executor";
import { databasePerspectiveName } from "../../core/juntoTypes";

export default defineComponent({
  name: "Welcome",
  setup() {
    const modalOpen = ref(false);
    const name = ref("");
    const familyName = ref("");
    const username = ref("");
    const email = ref("");
    const password = ref("");
    const isInit = ref(false);
    const perspectiveName = ref(databasePerspectiveName);
    const { mutate: initAgent, error: initAgentError } = useMutation<{
      initializeAgent: ad4m.AgentService;
    }>(INITIALIZE_AGENT, () => ({
      variables: {},
    }));
    const { mutate: unlockDidStore, error: unlockDidStoreError } = useMutation<{
      unlockAgent: ad4m.AgentService;
      passphrase: string;
    }>(UNLOCK_AGENT, () => ({
      variables: { passphrase: password.value },
    }));
    const { mutate: lockAgent, error: lockAgentError } = useMutation<{
      lockAgent: ad4m.AgentService;
      passphrase: string;
    }>(LOCK_AGENT, () => ({
      variables: { passphrase: password.value },
    }));
    const { mutate: addPerspective, error: addPerspectiveError } = useMutation<{
      addPerspective: ad4m.Perspective;
    }>(ADD_PERSPECTIVE, () => ({
      variables: {
        name: perspectiveName.value,
      },
    }));

    return {
      modalOpen,
      name,
      username,
      email,
      password,
      familyName,
      isInit,
      initAgent,
      initAgentError,
      unlockDidStore,
      unlockDidStoreError,
      lockAgent,
      lockAgentError,
      addPerspective,
      addPerspectiveError,
    };
  },
  beforeCreate() {
    const { onResult, onError } =
      useQuery<{
        agent: ad4m.AgentService;
      }>(AGENT_SERVICE_STATUS);
    onResult((val) => {
      this.isInit = val.data.agent.isInitialized!;
      this.$store.commit({ type: "updateAgentLockState", value: false });
      if (this.isInit == true) {
        //Get database perspective from store
        let databasePerspective = this.$store.getters.getDatabasePerspective;
        if (databasePerspective == "") {
          console.warn(
            "Does not have databasePerspective in store but has already been init'd! Add logic for getting databasePerspective as found with name",
            databasePerspectiveName
          );
          //TODO: add the retrieval/state saving logic here
        }
      }
    });
    onError((error) => {
      console.log("WelcomeViewRight: AGENT_SERVICE_STATUS, error:", error);
    });
  },
  methods: {
    submitUserInfo() {
      console.log("WelcomeViewRight: submitUserInfo() called");
      console.log("Got name", this.name);
      let res = this.initAgent();
      res.then((val) => {
        console.log(val);
        console.log(val.data?.initializeAgent.isInitialized);
        if (this.initAgentError == null) {
          this.lockAgent().then((lockAgentRes) => {
            console.log("Post lock result", lockAgentRes);
            if (this.lockAgentError == null) {
              //NOTE: this code is potentially not needed
              this.addPerspective().then((addPerspectiveResult) => {
                console.log(
                  "Created perspective for local database with result",
                  addPerspectiveResult
                );
                if (this.addPerspectiveError == null) {
                  this.$store.commit({
                    type: "addDatabasePerspective",
                    value: addPerspectiveResult.data?.addPerspective.uuid,
                  });

                  this.$store.commit({
                    type: "createProfile",
                    value: {
                      address:
                        addPerspectiveResult.data?.addPerspective.uuid || "",
                      username: this.username,
                      email: this.email,
                      givenName: this.name,
                      familyName: this.familyName,
                    },
                  });

                  this.$router.push("/home");
                } else {
                  console.log("Got error", this.addPerspectiveError);
                }
              });
              //TODO: then send the profile information to a public Junto DNA
              this.isInit = true;
              this.$store.commit({
                type: "updateAgentLockState",
                value: true,
              });
            } else {
              console.log("Got error", this.lockAgentError);
            }
          });
        } else {
          //TODO: this needs to go to an error handler function
          console.log("Got error", this.initAgentError);
        }
      });
    },
    unlockDidStoreMethod() {
      console.log("WelcomeViewRight: unlockDidStore() called");
      let res = this.unlockDidStore();
      res.then((val) => {
        console.log("Unlock result", val);
        if (
          this.unlockDidStoreError == null &&
          val.data?.unlockAgent.isInitialized &&
          val.data.unlockAgent.isUnlocked
        ) {
          this.isInit = true;
          this.$store.commit({
            type: "updateAgentLockState",
            value: true,
          });
          this.$router.push("/home");
        } else {
          //TODO: this needs to go to an error handler function
          console.log("Got error", this.unlockDidStoreError);
        }
      });
    },
  },
});
</script>

<style scoped>
.welcome-view {
  padding-left: var(--j-space-900);
  padding-right: var(--j-space-900);
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  gap: var(--j-space-500);
  display: grid;
  place-content: center;
  grid-template-columns: 1fr;
}

@media (min-width: 800px) {
  .welcome-view {
    gap: var(--j-space-1000);
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}

.welcome-view__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--j-space-400);
}

.welcome-view__logo {
  margin-bottom: var(--j-space-600);
}
</style>

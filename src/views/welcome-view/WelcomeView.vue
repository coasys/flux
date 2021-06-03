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
            <div class="welcome-view--center">
      <profile-avatar
        :diameter="10"
        :enableFileSelection="true"
        :onClick="selectFile"
        :profileImage="profileImage"
      >
      </profile-avatar>
    </div>
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

    <div class="cropper_parent" v-if="tempProfileImage !== null">
    <cropper
      ref="cropper"
      class="cropper"
      backgroundClass="cropper__background"
      :src="tempProfileImage"
      :stencil-props="{
        aspectRatio: 12 / 12,
      }"
    ></cropper>
    <div class="cropper_parent__btns">
      <button class="cropper_parent__btn" @click="clearImage">cancel</button>
      <button class="cropper_parent__btn" @click="selectImage">submit</button>
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
import ProfileAvatar from "@/components/ui/avatar/ProfileAvatar.vue";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { blobToDataURL, dataURItoBlob, resizeImage } from "@/core/methods/createProfile";

export default defineComponent({
  name: "Welcome",
  setup() {
    const modalOpen = ref(false);
    const name = ref("");
    const familyName = ref("");
    const username = ref("");
    const email = ref("");
    const password = ref("");
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
  computed: {
    isInit(): boolean {
      const isInit = this.$store.getters.getAgentInitStatus;
      return isInit.value;
    }
  },
  data(): {
    profileImage: string | ArrayBuffer | null | undefined;
    thumbnail: string | null;
    tempProfileImage: any;
  } {
    return {
      profileImage: null,
      thumbnail: null,
      tempProfileImage: null,
    };
  },
  beforeCreate() {
    const { onResult, onError } =
      useQuery<{
        agent: ad4m.AgentService;
      }>(AGENT_SERVICE_STATUS);
    onResult((val) => {
      const isInit = val.data.agent.isInitialized!;
      this.$store.commit({type: "updateAgentInitState", value: isInit});
      this.$store.commit({ type: "updateAgentLockState", value: false });
      if (isInit == true) {
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
              this.addPerspective().then(async (addPerspectiveResult) => {
                console.log(
                  "Created perspective for local database with result",
                  addPerspectiveResult
                );
                if (this.addPerspectiveError == null) {
                  this.$store.commit(
                    "addDatabasePerspective",
                    addPerspectiveResult.data?.addPerspective.uuid
                  );

                  const resizedImage = this.profileImage
                    ? await resizeImage(
                        dataURItoBlob(this.profileImage as string),
                        400
                      )
                    : null;

                  const thumbnail = this.profileImage
                    ? await blobToDataURL(resizedImage!)
                    : null;

                  this.$store.commit("createProfile", {
                    address:
                      addPerspectiveResult.data?.addPerspective.uuid || "",
                    username: this.username,
                    email: this.email,
                    givenName: this.name,
                    familyName: this.familyName,
                    profilePicture: this.profileImage as string,
                    thumbnailPicture: thumbnail,
                  });

                  this.$router.push("/");
                } else {
                  console.log("Got error", this.addPerspectiveError);
                }
              });
              //TODO: then send the profile information to a public Junto DNA
              this.$store.commit({type: "updateAgentInitState", value: true});
              this.$store.commit("updateAgentLockState", true);
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
          this.$store.commit({type: "updateAgentInitState", value: true});
          this.$store.commit("updateAgentLockState", true);
          this.$router.push("/");
        } else {
          //TODO: this needs to go to an error handler function
          console.log("Got error", this.unlockDidStoreError);
        }
      });
    },
    selectFile(e: any) {
      const files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;

      var reader = new FileReader();

      reader.onload = (e) => {
        this.tempProfileImage = e.target?.result;
      };

      reader.readAsDataURL(files[0]);
    },
    clearImage() {
      this.tempProfileImage = null;
    },
    selectImage() {
      const result = (this.$refs.cropper as any).getResult();
      this.profileImage = result.canvas.toDataURL();
      console.log(this.profileImage);
      this.tempProfileImage = null;
    },
  },
  components: {
    ProfileAvatar,
    Cropper,
  }
});
</script>

<style lang="scss" scoped>
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

  &--center {
    align-self: center;
  }
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

.cropper_parent {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
  background: black;
  display: flex;
  flex-direction: column;
  border-radius: 4px;

  &__btns {
    display: flex;
    width: 100%;
  }

  &__btn {
    height: 40px;
    width: 50%;
    font-size: 18px;
    background: white;

    &:hover {
      background: rgb(235, 235, 235);
      transition: all 0.2s;
    }
  }
}

.cropper {
  flex-grow: 1;
  &__background {
    background: transparent !important;
  }
}
</style>

<template>
  <div class="welcomeViewRight" v-if="isInit">
    <div class="welcomeViewRight__spec">
      <h1 class="welcomeViewRight__spec--title">Welcome Back!</h1>
      <h3 class="welcomeViewRight__spec--title">Password:</h3>
      <div class="welcomeViewRight__input" v-if="isInit">
        <input
          type="text"
          class="welcomeViewRight__input--field"
          v-model="password"
        />
      </div>
    </div>
    <button class="welcomeViewRight__button" @click="unlockDidStoreMethod">
      Unlock
    </button>
  </div>

  <div class="welcomeViewRight" v-if="!isInit">
    <div class="welcomeViewRight__spec welcomeViewRight__spec--center">
      <profile-avatar
        :diameter="10"
        :enableFileSelection="true"
        :onClick="selectFile"
        :profileImage="profileImage"
      >
      </profile-avatar>
    </div>
    <div class="welcomeViewRight__spec">
      <h3 class="welcomeViewRight__spec--title">First Name</h3>
      <div class="welcomeViewRight__input">
        <input
          type="text"
          class="welcomeViewRight__input--field"
          v-model="name"
        />
      </div>
    </div>

    <div class="welcomeViewRight__spec" v-if="!isInit">
      <h3 class="welcomeViewRight__spec--title">Last Name</h3>
      <div class="welcomeViewRight__input">
        <input
          type="text"
          class="welcomeViewRight__input--field"
          v-model="familyName"
        />
      </div>
    </div>

    <div class="welcomeViewRight__spec" v-if="!isInit">
      <h3 class="welcomeViewRight__spec--title">Username</h3>
      <div class="welcomeViewRight__input">
        <input
          type="text"
          class="welcomeViewRight__input--field"
          v-model="username"
        />
      </div>
    </div>
    <div class="welcomeViewRight__spec" v-if="!isInit">
      <h3 class="welcomeViewRight__spec--title">Email</h3>
      <div class="welcomeViewRight__input">
        <input
          type="text"
          class="welcomeViewRight__input--field"
          v-model="email"
        />
      </div>
    </div>
    <div class="welcomeViewRight__spec" v-if="!isInit">
      <h3 class="welcomeViewRight__spec--title">Password</h3>
      <div class="welcomeViewRight__input">
        <input
          type="text"
          class="welcomeViewRight__input--field"
          v-model="password"
        />
      </div>
    </div>

    <button
      class="welcomeViewRight__button"
      @click="submitUserInfo"
      v-if="!isInit"
    >
      Create
    </button>
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
} from "../../../core/graphql_queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import ad4m from "@perspect3vism/ad4m-executor";
import { databasePerspectiveName } from "../../../core/juntoTypes";
import ProfileAvatar from "@/components/ui/avatar/ProfileAvatar.vue";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
} from "@/core/methods/createProfile";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import sleep from "@/utils/sleep";

export default defineComponent({
  name: "WelcomeViewRight",
  setup() {
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
              await sleep(100);
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

                  this.$router.push("/home");
                } else {
                  console.log("Got error", this.addPerspectiveError);
                }
              });
              //TODO: then send the profile information to a public Junto DNA
              this.$store.commit({type: "updateAgentInitState", value: true});
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
          this.$store.commit({type: "updateAgentInitState", value: true});
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
  },
});
</script>

<style lang="scss" scoped>
.welcomeViewRight {
  display: flex;
  flex-direction: column;
  padding: 4rem 20rem 2rem 10rem;
  width: 100%;

  &__spec {
    display: flex;
    flex-direction: column;
    margin-bottom: 4rem;

    &--center {
      align-items: center;
    }

    &--title {
      font-size: 1.4rem;
      font-weight: 500;
      color: var(--junto-primary-light);
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
  }

  &__input {
    display: flex;
    flex-direction: column;
    border: 1.5px solid var(--junto-border-color);
    border-radius: 5px;

    &--field {
      outline: none;
      padding: 1rem;
      border: 1px;
      background-color: transparent;
      color: var(--junto-primary);
      font-size: 1.4rem;
    }
  }

  &__button {
    width: 100%;
    background-color: var(--junto-accent-color);
    border: none;
    outline: none;
    border-radius: 5px;
    padding: 2rem;
    color: white;
    font-weight: 700;
    font-size: 1.7rem;

    &:hover {
      cursor: pointer;
    }
  }
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

function blobToDataURL(resizedImage: Blob) { throw new Error("Function not
implemented."); }

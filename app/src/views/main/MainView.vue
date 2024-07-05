<template>
  <app-layout>
    <template v-slot:sidebar>
      <main-sidebar></main-sidebar>
    </template>
    <router-view></router-view>
    <j-modal
      size="sm"
      :open="modals.showCreateCommunity"
      @toggle="(e) => setShowCreateCommunity(e.target.open)"
    >
      <create-community
        v-if="modals.showCreateCommunity"
        @submit="() => setShowCreateCommunity(false)"
        @cancel="() => setShowCreateCommunity(false)"
      />
    </j-modal>

    <j-modal
      :open="modals.showCreateChannel"
      @toggle="(e) => setShowCreateChannel(e.target.open)"
    >
      <create-channel
        v-if="modals.showCreateChannel"
        @submit="() => setShowCreateChannel(false)"
        @cancel="() => setShowCreateChannel(false)"
      />
    </j-modal>

    <j-modal
      size="sm"
      :open="modals.showCommunityMembers"
      @toggle="(e) => setShowCommunityMembers(e.target.open)"
    >
      <community-members
        @close="() => setShowCommunityMembers(false)"
        v-if="modals.showCommunityMembers"
      />
    </j-modal>

    <j-modal
      size="sm"
      :open="modals.showEditCommunity"
      @toggle="(e) => setShowEditCommunity(e.target.open)"
    >
      <edit-community
        :communityId="communityId"
        v-if="modals.showEditCommunity"
        @submit="() => setShowEditCommunity(false)"
        @cancel="() => setShowEditCommunity(false)"
      />
    </j-modal>

    <j-modal
      size="sm"
      :open="modals.showInviteCode"
      @toggle="(e) => setShowInviteCode(e.target.open)"
    >
      <j-box p="800">
        <j-box pb="500">
          <j-text variant="heading">Invite people</j-text>
          <j-text variant="body">
            Copy and send this code to the people you want to join your
            community
          </j-text>
        </j-box>
        <j-input
          @click="(e) => e.target.select()"
          size="lg"
          readonly
          :value="data.perspective?.sharedUrl"
        >
          <j-button @click.stop="getInviteCode" variant="ghost" slot="end"
            ><j-icon :name="hasCopied ? 'clipboard-check' : 'clipboard'"
          /></j-button>
        </j-input>
      </j-box>
    </j-modal>

    <j-modal
      v-if="modals.showEditChannel && appStore.activeChannel"
      :open="modals.showEditChannel"
      @toggle="(e) => setShowEditChannel(e.target.open)"
    >
      <EditChannel
        v-if="modals.showEditChannel"
        @cancel="() => setShowEditChannel(false)"
        @submit="() => setShowEditChannel(false)"
        :channelId="appStore.activeChannel"
      ></EditChannel>
    </j-modal>

    <j-modal
      :open="modals.showCommunitySettings"
      @toggle="(e) => setShowCommunitySettings(e.target.open)"
    >
      <community-settings />
    </j-modal>

    <j-modal
      v-if="modals.showLeaveCommunity && activeCommunity"
      size="sm"
      :open="modals.showLeaveCommunity"
      @toggle="(e) => setShowLeaveCommunity(e.target.open)"
    >
      <j-box p="800">
        <j-box pb="900">
          <j-text variant="heading">
            Leave community '{{ activeCommunity.name || "Unknown" }}'
          </j-text>
          <j-text nomargin>
            Are you sure you want to leave this community?
          </j-text>
        </j-box>
        <j-flex j="end" gap="300">
          <j-button @click="() => setShowLeaveCommunity(false)" variant="link">
            Cancel
          </j-button>
          <j-button variant="primary" @click="leaveCommunity">
            Leave community
          </j-button>
        </j-flex>
      </j-box>
    </j-modal>

    <j-modal
      v-if="modals.showDisclaimer"
      :open="modals.showDisclaimer"
      @toggle="
        (e) => {
          setShowDisclaimer(e.target.open);
        }
      "
    >
      <j-box p="800">
        <div v-if="modals.showDisclaimer">
          <j-box pb="500">
            <j-flex gap="400" a="center">
              <j-icon name="exclamation-diamond" size="lg" />
              <j-text nomargin variant="heading">Disclaimer</j-text>
            </j-flex>
          </j-box>
          <j-text variant="ingress">
            This is an early version of Flux. Don't use this for essential
            communication.
          </j-text>
          <ul>
            <li>You might loose your communities and chat messages</li>
            <li>Messages might not always be delivered reliably</li>
          </ul>
        </div>
        <j-box pt="500" pb="500" v-if="!hasAlreadyJoinedTestingCommunity">
          <j-flex gap="400" a="center">
            <j-icon name="arrow-down-circle" size="lg" />
            <j-text nomargin variant="heading">Testing Community</j-text>
          </j-flex>
          <br />
          <j-text variant="ingress">
            Join the Flux Alpha testing community.
          </j-text>
          <j-button
            :loading="isJoining"
            variant="primary"
            @click="() => joinTestingCommunity()"
          >
            Join Official Testing Community
          </j-button>
        </j-box>
      </j-box>
    </j-modal>
  </app-layout>
</template>

<script lang="ts">
import AppLayout from "@/layout/AppLayout.vue";
import MainSidebar from "./main-sidebar/MainSidebar.vue";
import { defineComponent, ref, watch } from "vue";

import CreateCommunity from "@/containers/CreateCommunity.vue";
import CreateChannel from "@/containers/CreateChannel.vue";
import EditCommunity from "@/containers/EditCommunity.vue";
import CommunityMembers from "@/containers/CommunityMembers.vue";
import EditChannel from "@/containers/EditChannel.vue";
import CommunitySettings from "@/containers/CommunitySettings.vue";
import { ModalsState } from "@/store/types";
import { useAppStore } from "@/store/app";
import { mapActions } from "pinia";
import { DEFAULT_TESTING_NEIGHBOURHOOD } from "@/constants";
import { EntryType } from "@coasys/flux-types";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import semver from "semver";
import { dependencies } from "../../../package.json";
import { Ad4mClient, LinkExpression, Literal, PerspectiveProxy } from "@coasys/ad4m";
import { useSubject, usePerspective, usePerspectives } from "@coasys/ad4m-vue-hooks";
import { Community } from "@coasys/flux-api";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "MainAppView",
  async setup() {
    const route = useRoute();
    const client: Ad4mClient = await getAd4mClient();
    const appStore = useAppStore();

    const { perspectives, onLinkAdded } = usePerspectives(client);

    const { data } = usePerspective(client, () => route.params.communityId);

    const { entry: community } = useSubject({
      perspective: () => data.value.perspective,
      subject: Community,
    });

    setTimeout(async () => {
      if (data.value.perspective) {
        // @ts-ignore
        await client.runtime.addNotificationTriggeredCallback((notification: any) => {
          console.log("notification", notification);
        });
      }
    }, 1000)

    return {
      client,
      activeCommunity: community,
      onLinkAdded,
      perspectives,
      isJoining: ref(false),
      appStore,
      isInit: ref(false),
      hasCopied: ref(false),
      data
    };
  },
  components: {
    MainSidebar,
    AppLayout,
    CreateCommunity,
    CreateChannel,
    EditCommunity,
    EditChannel,
    CommunityMembers,
    CommunitySettings,
  },
  async mounted() {
    this.onLinkAdded((p: PerspectiveProxy, link: LinkExpression) => {
      if (link.data.predicate === EntryType.Message) {
        this.gotNewMessage(p, link);
      }
    });
    //Do version checking for ad4m / flux compatibility
    const { ad4mExecutorVersion } = await this.client.runtime.info();

    const isIncompatible = semver.gt(
      dependencies["@coasys/ad4m"],
      ad4mExecutorVersion
    );

    if (isIncompatible) {
      // this.$router.push({ name: "update-ad4m" });
    }
  },
  computed: {
    hasAlreadyJoinedTestingCommunity(): boolean {
      const community = Object.values(this.perspectives).find(
        (p) => p.sharedUrl === DEFAULT_TESTING_NEIGHBOURHOOD
      );
      return community ? true : false;
    },
    modals(): ModalsState {
      return this.appStore.modals;
    },
  },
  methods: {
    ...mapActions(useAppStore, [
      "setShowEditProfile",
      "setShowSettings",
      "setShowCreateCommunity",
      "setShowCreateChannel",
      "setShowDisclaimer",
      "setShowLeaveCommunity",
      "setShowCommunityMembers",
      "setShowEditCommunity",
      "setShowEditChannel",
      "setShowCommunitySettings",
      "setShowInviteCode",
    ]),
    async leaveCommunity() {
      const client = await getAd4mClient();
      const activeCommunity = this.appStore.activeCommunity;
      await this.$router.push({ name: "home" });
      await client.perspective.remove(activeCommunity);
      this.appStore.setShowLeaveCommunity(false);
    },
    async joinTestingCommunity() {
      try {
        this.isJoining = true;
        await this.appStore.joinTestingCommunity();
        this.setShowDisclaimer(false);
      } catch (e) {
        console.log(e);
      } finally {
        this.isJoining = false;
      }
    },
    gotNewMessage(p: PerspectiveProxy, link: LinkExpression) {
      const routeChannelId = this.$route.params.channelId;
      const channelId = link.data.source;
      const isCurrentChannel = routeChannelId === channelId;
      if (isCurrentChannel) return;

      // TODO: Update channel to say it has a new message

      const expression = Literal.fromUrl(link.data.target).get();

      const expressionDate = new Date(expression.timestamp);
      let minuteAgo = new Date();
      minuteAgo.setSeconds(minuteAgo.getSeconds() - 30);
      if (expressionDate > minuteAgo) {
        // TODO: Show message notification
      }
    },
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      const url = this.data.perspective?.sharedUrl;
      const el = document.createElement("textarea");
      el.value = `Hey! Here is an invite code to join my private community on Flux: ${url}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      this.hasCopied = true;

      this.appStore.showSuccessToast({
        message: "Your custom invite code is copied to your clipboard!",
      });
    },
  },
});
</script>

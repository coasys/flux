<template>
  <j-box p="800">
    <j-flex gap="500" direction="column">
      <j-text nomargin variant="heading-sm">
        Members ({{ members.length ?? 0 }})
      </j-text>
      <j-input
        size="lg"
        placeholder="Search members..."
        type="search"
        :value="searchValue"
        @input="(e: any) => (searchValue = e.target.value)"
      >
        <j-icon name="search" size="sm" slot="start"></j-icon>
      </j-input>
      <j-flex direction="column" gap="400" v-if="!loading">
        <j-flex
          gap="500"
          style="cursor: pointer"
          v-for="member in members"
          :key="member.did"
          inline
          direction="row"
          j="center"
          a="center"
        >
          <Avatar
            size="xl"
            :hash="member.did"
            :url="member.profileThumbnailPicture"
            @click="() => profileClick(member.did)"
          ></Avatar>
          <j-text color="black" nomargin variant="body">
            {{ member.username }}
          </j-text>
        </j-flex>
      </j-flex>
      <j-flex direction="column" gap="400" v-else>
        <j-flex
          inline
          direction="row"
          j="center"
          a="center"
          gap="500"
          v-for="i in 4"
          :key="i"
        >
          <j-skeleton :key="i" variant="circle" width="xl" height="xl" />
          <j-skeleton width="xl" height="text" />
        </j-flex>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Community, Member } from "@fluxapp/api";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import Avatar from "@/components/avatar/Avatar.vue";
import { usePerspective, useEntry, useEntries } from "@fluxapp/vue";
import { useRoute } from "vue-router";

export default defineComponent({
  emits: ["close", "submit"],
  components: { Avatar },
  async setup() {
    const route = useRoute();
    const client = await getAd4mClient();
    const { data } = usePerspective(client, () => route.params.communityId);

    const { entry: community } = useEntry({
      perspective: () => data.value.perspective,
      model: Community,
    });

    const { entries: members } = useEntries({
      perspective: () => data.value.perspective,
      model: Member,
    });

    return {
      members,
      community,
    };
  },
  data() {
    return {
      searchValue: "",
      loading: false,
    };
  },
  methods: {
    async profileClick(did: string) {
      const client = await getAd4mClient();
      const me = await client.agent.me();

      this.$emit("close");

      if (did === me.did) {
        this.$router.push({ name: "home", params: { did } });
      } else {
        this.$router.push({
          name: "profile",
          params: { did, communityId: this.$route.params.communityId },
        });
      }
    },
  },
});
</script>

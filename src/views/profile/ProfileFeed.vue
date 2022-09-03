<template>
  <div a="center" direction="column" class="outer_container">
    <div a="start" direction="column" class="inner_container">
      <j-text variant="heading">{{ link.has_name }}</j-text>
      <j-text variant="subheading">{{ link.has_description }}</j-text>
      <div class="grid">
        <expandable-image
          class="img"
          :style="{ backgroundImage: `url(${img})` }"
          v-for="(img, index) in link.has_images"
          :key="`img-${index}`"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ExpandableImage from "@/components/expandable-img/expandable-img.vue";
import { useUserStore } from "@/store/user";
import getAgentLinks from "@/utils/getAgentLinks";
import { useAppStore } from "@/store/app";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";

export default defineComponent({
  name: "ProfileFeed",
  components: {
    ExpandableImage,
  },
  setup() {
    const appStore = useAppStore();
    const link = ref<any>({});

    return {
      link,
      appStore
    };
  },
  mounted() {
    console.log('this.$route.params.',this.$route.params, this.$props)
    // this.link = this.$route.params.links;
    this.getAgentAreas(this.$route.params.fid! as string)
  },
  beforeCreate() {
    this.appStore.changeCurrentTheme("global");
  },
  methods: {
    async getAgentAreas(id: string) {
      const client = await getAd4mClient();
      const did = this.$route.params.did as string;
      const me = await client.agent.me();
      const userStore = useUserStore();
      const userPerspective = userStore.getAgentProfileProxyPerspectiveId;

      const links = (await getAgentLinks(
        did || me.did,
        did === me.did || did === undefined ? userPerspective! : undefined
      )).filter(e => !e.data.source.startsWith('flux://'));
      console.log('linking', links)

      const preArea: { [x: string]: any } = {};

      for (const e of links) {
        const predicate = e.data.predicate.split("://")[1];
        if (!preArea[e.data.source]) {
          preArea[e.data.source] = {
            id: e.data.source,
          };
        }

        if (predicate === "has_post") {
          preArea[e.data.source][predicate] = e.data.target.replace(
            "text://",
            ""
          );
        } else if (predicate === "has_images" || predicate === 'has_image') {
          try {
            const expUrl = e.data.target;
            console.log("expUrl", expUrl);
            const image = await client.expression.get(expUrl);
            console.log("image", image);
            if (image) {
              if (!preArea[e.data.source][predicate]) {
                preArea[e.data.source][predicate] = [];
                preArea[e.data.source]["has_image"] = image.data.slice(1, -1);
              }

              preArea[e.data.source][predicate].push(image.data.slice(1, -1));
            }
          } catch (e) {
            console.log("Error encountered while parsing images", e);
          }
        } else {
          preArea[e.data.source][predicate] = e.data.target.split("://")[1];
        }
      }

      this.link = preArea[id]

      console.log('preArea', preArea)
    }
  }
});
</script>

<style scoped>
.outer_container {
  width: 100%;
  height: 100%;
  padding: 40px 0;
  overflow-y: auto;
}

.inner_container {
  width: 800px;
  min-height: 100vh;
  height: 100%;
  margin: auto;
}

.img {
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 240px;
  height: 240px;
  margin-right: 20px;
}

.grid {
  display: flex;
  flex-wrap: wrap;
}
</style>

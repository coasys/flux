<template>
  <div a="center" direction="column" class="outer_container">
    <div a="start" direction="column" class="inner_container">
      <j-text variant="heading">{{ link.name }}</j-text>
      <j-text variant="subheading">{{ link.description }}</j-text>
      <div class="grid">
        <expandable-image
          class="img"
          :style="{ backgroundImage: `url(${img})` }"
          v-for="(img, index) in link.images"
          :key="`img-${index}`"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ExpandableImage from "@/components/expandable-img/expandable-img.vue";
import getAgentLinks from "utils/api/getAgentLinks";
import { useAppStore } from "@/store/app";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/web";
import { Literal } from "@perspect3vism/ad4m";
import { getImage } from "utils/api/getProfile";

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

      const links = await getAgentLinks(did || (await client.agent.me()).did);
      const areaLink = links.find((link) =>
        link.data.source.startsWith("area://") && link.data.source === id
      );

      if (areaLink) {
        const literal = Literal.fromUrl(areaLink.data.target).get();

        const link = {
          ...literal.data,
        }

        const fetchedImages = [];

        for (const image of literal.data.images) {
          const img = await getImage(image);

          fetchedImages.push(img);
        }

        link.images = fetchedImages;
        
        this.link = link
      }
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

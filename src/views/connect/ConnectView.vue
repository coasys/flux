<template>
  <h4>Ad4m Connect</h4>
  <div class="container" id="container">
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Ad4mConnectDialog from "@perspect3vism/ad4m-connect/public/Ad4mConnectDialog";
import { MainClient } from "@/app";
import { Ad4mClient } from "@perspect3vism/ad4m";

export default defineComponent({
  name: "ChannelView",
  components: {},
  async mounted() {
    const tempTarget = document.createElement("connect");
    const dialog = new Ad4mConnectDialog({ target: tempTarget });

    dialog.appName = "Flux";
    dialog.appIconPath = "/assets/images/logo.png";
    dialog.executorUrl = MainClient.url;
    dialog.capToken = MainClient.token;
    dialog.capabilities = MainClient.capabilities;
    //dialog.showQrScanner = true

    dialog.resolve = (executorUrl: string, capabilityToken: string, client: Ad4mClient) => {
      console.log("Resolved with", executorUrl, capabilityToken, client);
    };

    dialog.reject = () => {
      console.error("Got rejected");
    };

    document.getElementById("container")!.appendChild(tempTarget)  ;
    
    dialog.run();
  }
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}
</style>

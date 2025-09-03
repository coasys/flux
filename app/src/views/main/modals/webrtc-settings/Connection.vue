<template>
  <div>
    <h3>Connection settings</h3>
    <j-box pt="300">
      <j-text variant="body">ICE/STUN servers</j-text>
    </j-box>

    <template v-if="!showAddNew">
      <div v-for="server in iceServers" :key="server.urls" class="card">
        <div class="contents">
          <j-text variant="footnote" color="black" noMargin>
            {{ server.urls }}
          </j-text>

          <j-text v-if="server.username || server.credential" variant="footnote" noMargin>
            ({{ server.username }}/{{ server.credential }})
          </j-text>
        </div>

        <div v-if="!inCall" class="actions">
          <j-button
            size="sm"
            squared
            class="delete-button"
            variant="ghost"
            @click="webrtcStore.removeIceServer(server.urls)"
          >
            <j-icon name="x" />
          </j-button>
        </div>
      </div>
    </template>

    <j-box v-if="!showAddNew && !inCall" pt="500">
      <div class="footer">
        <j-button @click="showAddNew = !showAddNew"> Add new server </j-button>
        <j-button variant="ghost" @click="webrtcStore.resetIceServers"> Use default </j-button>
      </div>
    </j-box>

    <j-box v-if="inCall" pt="500">
      <j-text>Leave the current call to make changes.</j-text>
    </j-box>

    <template v-if="showAddNew">
      <div class="form">
        <j-input :value="url" placeholder="New STUN/TURN server" @change="url = $event.target.value"></j-input>

        <j-box pt="400">
          <j-flex a="center" gap="400" direction="row">
            <j-input :value="username" placeholder="username" full @change="username = $event.target.value"></j-input>
            <j-input
              :value="credential"
              placeholder="password"
              full
              @change="credential = $event.target.value"
            ></j-input>
          </j-flex>
        </j-box>
      </div>
      <j-box pt="500">
        <div class="footer">
          <j-button @click="addServer">Submit</j-button>
          <j-button variant="ghost" @click="showAddNew = false"> Cancel </j-button>
        </div>
      </j-box>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useWebrtcStore } from "@/stores";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const webrtcStore = useWebrtcStore();

const { iceServers, inCall } = storeToRefs(webrtcStore);

const showAddNew = ref(false);
const url = ref("");
const username = ref("");
const credential = ref("");

async function addServer() {
  const newServer = { urls: url.value, username: username.value, credential: credential.value };
  webrtcStore.addIceServer(newServer);

  // Reset input state
  url.value = "";
  username.value = "";
  credential.value = "";
  showAddNew.value = false;
}
</script>

<style scoped>
.card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--j-space-300);
  border-radius: var(--j-border-radius);
  text-decoration: none;
  background-color: var(--j-color-ui-50);
  overflow: hidden;
}

.card + .card {
  margin-top: var(--j-space-400);
}

.contents {
  display: flex;
  gap: var(--j-space-300);
  padding: var(--j-space-400) var(--j-space-400);
}

.credentials {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  margin-bottom: var(--j-space-300);
  font-size: var(--j-font-size-500);
  font-weight: 400;
  color: var(--j-color-ui-500);
}

.footer {
  display: flex;
  gap: var(--j-space-400);
}
</style>

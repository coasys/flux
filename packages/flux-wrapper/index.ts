import "@fluxapp/ui/dist/main.css";
import "@fluxapp/ui";
import "@fluxapp/ui/dist/themes/dark.css";

import { html, css, LitElement } from "lit";
import { map } from "lit/directives/map.js";
import { customElement } from "lit/decorators.js";

import Ad4mConnectUI, { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { createCommunity } from "utils/api";
import { Channel, Community } from "utils/api";
import { SubjectRepository } from "utils/factory";
import { Ad4mClient } from "@perspect3vism/ad4m";

const styles = css`
  .main {
    height: calc(100vh - var(--j-size-xl));
    display: block;
  }
  .sidebar-layout {
    display: grid;
    grid-template-columns: 1fr 5fr;
  }
  .sidebar {
    padding: var(--j-space-500);
    height: 100vh;
    margin-right: var(--j-space-500);
    background: var(--j-color-ui-50);
    border-radius: var(--j-border-radius);
  }
  select {
    width: 100%;
    height: var(--j-size-md);
    padding: var(--j-space-300);
    background: var(--j-color-white);
    color: var(--j-color-black);
    font-size: var(--j-font-size-500);
    border-radius: var(--j-border-radius);
    outline: 1px solid var(--j-color-ui-200);
    border: 0;
    border-right: 8px solid transparent;
    padding: var(--j-space-200);
  }
  select:hover {
    background: var(--j-color-ui-50);
  }
  select:focus {
    outline: 2px solid var(--j-color-primary-500);
  }
`;

export default class FluxWrapper extends LitElement {
  static styles = [styles];

  client: Ad4mClient | null = null;
  perspectiveUuid = "";
  source = "";
  community = {};
  channels: { id: any; name: string }[] = [];
  perspectives: { uuid: string; name: string }[] = [];

  title = "";
  isCreatingCommunity = false;
  theme = document.documentElement.className;

  constructor() {
    super();

    this.perspectiveUuid = localStorage.getItem("perspectiveUuid") || "";
    this.source = localStorage.getItem("source") || "flux://testing";
    this.community = {};
    this.channels = [];
    this.perspectives = [];
  }

  connectedCallback() {
    const ui = Ad4mConnectUI({
      appName: "Flux App",
      appDesc: "A flux app",
      appDomain: "app.flux.io",
      capabilities: [{ with: { domain: "*", pointers: ["*"] }, can: ["*"] }],
    });

    ui.connect();
    ui.addEventListener("authstatechange", async () => {
      if (ui.authState === "authenticated") {
        const client = await getAd4mClient();
        this.client = client;

        if (this.perspectiveUuid) {
          this.setPerspective(this.perspectiveUuid);
        }

        const perspectives = await client.perspective.all();

        this.perspectives = perspectives.map((p) => ({
          uuid: p.uuid,
          name: p.name,
        }));
      }
    });
  }

  // get appElement() {
  //   return this.querySelector("slot")?.assignedNodes[0];
  // }

  // shouldUpdate(changedProperties) {
  //   if (this.appElement) {
  //     this.appElement.perspective = changedProperties.perspective;
  //   }

  //   return changedProperties;
  // }

  async setPerspective(uuid) {
    const client = await getAd4mClient();
    const perspective = await client.perspective.byUUID(uuid);
    localStorage.setItem("perspectiveUuid", uuid);

    if (!perspective) {
      return;
    }

    this.perspectiveUuid = uuid;

    const community = await new SubjectRepository(Community, {
      perspectiveUuid: perspective.uuid,
    }).getData();

    if (!community) {
      return;
    }

    const channels = await new SubjectRepository(Channel, {
      perspectiveUuid: perspective.uuid,
      source: community.id,
    }).getAllData();

    this.channels = channels.map((c) => ({ id: c.id, name: c.name }));
    this.source = channels[0]?.id;
  }

  setChannel(source) {
    localStorage.setItem("source", source);
  }

  setTheme(e) {
    const theme = e.target.value;
    document.documentElement.className = theme;
  }

  async onCreateCommunity() {
    this.isCreatingCommunity = true;
    try {
      await createCommunity({ name: "Test" });
      this.title = "";
      console.log("created community");
    } finally {
      this.isCreatingCommunity = false;
    }
  }

  render() {
    return html`<div class="main">
      <div class="sidebar-layout">
        <aside class="sidebar">
          <j-flex direction="column" gap="500">
            <div>
              <j-text variant="label">Current theme:</j-text>
              <select @change="setTheme($event)">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <j-text variant="label">Select perspective:</j-text>
              <j-flex gap="200" wrap>
                <ul>
                  ${map(
                    this.perspectives,
                    (i) => html`<li>
                      <j-avatar
                        :selected="perspectiveUuid === i.uuid"
                        :hash="i.uuid"
                        @click="setPerspective(i.uuid)"
                        :value="uuid"
                      >
                        {{i.name}}
                      </j-avatar>
                    </li>`
                  )}
                </ul>
              </j-flex>
            </div>

            <!-- <div v-if="perspectiveUuid">
              <j-text variant="label">Current channel:</j-text>
              <select
                v-model="source"
                @change="setChannel($event.target.value)"
              >
                <option value="" selected disabled>Select a channel</option>
                <option v-for="{name, id} in channels" :value="id">
                  {{name}}
                </option>
              </select>
            </div> -->

            <j-input
              label="Give your perspective a name"
              placeholder="Perspective name"
              :value="title"
              @change="(e) => title = e.target.value"
            ></j-input>

            <j-button
              :loading="isCreatingCommunity"
              @click="onCreateCommunity"
              full
              size="sm"
              id="create-perspective"
            >
              Create new Flux community
            </j-button>
          </j-flex>
        </aside>
        <p>TEST</p>
        <slot></slot>
      </div>
    </div>`;
  }
}

customElements.define("flux-wrapper", FluxWrapper);

declare global {
  interface HTMLElementTagNameMap {
    "flux-wrapper": FluxWrapper;
  }
}

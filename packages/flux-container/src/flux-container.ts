import { LitElement, html, customElement, state, css } from "lit-element";
import { map } from "lit/directives/map.js";
import "@fluxapp/ui";
import "@fluxapp/ui/dist/main.css";
import "@fluxapp/ui/dist/themes/dark.css";

import Ad4mConnectUI, { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { createCommunity } from "utils/api";
import { Channel, Community } from "utils/api";
import { SubjectRepository } from "utils/factory";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";

@customElement("flux-container")
export class MyElement extends LitElement {
  static styles = css`
    :host {
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
      background: var(--j-color-ui-50);
      border-radius: var(--j-border-radius);
    }
    .content {
      margin-left: var(--j-space-500);
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

  @state()
  client: Ad4mClient | null = null;

  @state()
  perspectives: PerspectiveProxy[] = [];

  @state()
  perspectiveUuid = "";

  @state()
  isLoading = false;

  @state()
  perspectiveHasNoCommunity = false;

  @state()
  isCreatingCommunity = false;

  @state()
  source = "";

  @state()
  theme = "";

  @state()
  channels: { id: any; name: string }[] = [];

  @state()
  community = {};

  constructor() {
    super();

    this.perspectiveUuid = localStorage.getItem("perspectiveUuid") || "";
    this.source = localStorage.getItem("source") || "flux://testing";
    this.theme = localStorage.getItem("theme") || "dark";
    this.community = {};
    this.channels = [];
    this.perspectives = [];

    document.documentElement.className = this.theme;
  }

  get perspective() {
    return this.perspectives.find((p) => p.uuid === this.perspectiveUuid);
  }

  get appElement() {
    return this.children[0];
  }

  connectedCallback() {
    super.connectedCallback();

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

        const perspectives = await client.perspective.all();

        this.perspectives = perspectives;

        if (this.perspectiveUuid) {
          this.setPerspective(this.perspectiveUuid);
        }
      }
    });
  }

  async setPerspective(uuid: string) {
    this.isLoading = true;
    this.perspectiveHasNoCommunity = false;

    const perspective = this.perspectives.find((p) => p.uuid === uuid);
    localStorage.setItem("perspectiveUuid", uuid);

    if (!perspective) {
      return;
    }

    this.perspectiveUuid = uuid;

    const community = await new SubjectRepository(Community, {
      perspective: perspective,
    }).getData();

    if (!community) {
      this.isLoading = false;
      this.perspectiveHasNoCommunity = true;
      return;
    }

    const channels = await new SubjectRepository(Channel, {
      perspective: perspective,
    }).getAllData();

    this.channels = channels.map((c) => ({ id: c.id, name: c.name }));
    this.source = channels[0]?.id || "ad4m://self";

    // @ts-ignore
    this.appElement.perspective = perspective;

    // @ts-ignore
    this.appElement.setAttribute("source", channels[0]?.id || "ad4m://self");

    this.isLoading = false;
  }

  setChannel(e: Event) {
    const { value } = e.target as HTMLInputElement;
    localStorage.setItem("source", value);
    this.appElement.setAttribute("source", value);
  }

  setTheme(e: Event) {
    const target = e.target as HTMLInputElement;
    document.documentElement.className = target.value;
    localStorage.setItem("theme", target.value);
  }

  async onCreateCommunity() {
    this.isCreatingCommunity = true;
    try {
      await createCommunity({ name: this.title });
      this.title = "";
      console.log("created community");
    } finally {
      this.isCreatingCommunity = false;
    }
  }

  render() {
    return html`
      <div class="sidebar-layout">
        <aside class="sidebar">
          <j-flex direction="column" gap="500">
            <div>
              <j-text variant="label">Current theme:</j-text>
              <select
                @change=${(e: Event) => this.setTheme(e)}
                value=${this.theme}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <j-text variant="label">Select perspective:</j-text>
              <j-flex gap="200" wrap>
                ${map(
                  this.perspectives,
                  (p) => html`<j-tooltip title=${p.name}>
                    <j-avatar
                      ?selected=${this.perspectiveUuid === p.uuid}
                      hash=${p.uuid}
                      @click=${() => this.setPerspective(p.uuid)}
                      :value=${p.uuid}
                      ?disabled=${this.isLoading}
                    >
                      ${p.name}
                    </j-avatar>
                  </j-tooltip>`
                )}
              </j-flex>
            </div>

            <div>
              <j-text variant="label"
                >${this.perspectiveHasNoCommunity
                  ? "No community!"
                  : "Current channel:"}</j-text
              >
              <select
                value=${this.source}
                @change=${this.setChannel}
                ?disabled=${this.perspectiveHasNoCommunity}
              >
                <option value="ad4m://self" selected disabled>
                  Select a channel
                </option>
                ${map(
                  this.channels,
                  (i) => html`<option value=${i.id}>${i.name}</option>`
                )}
              </select>
            </div>

            <j-input
              label="Give your perspective a name"
              placeholder="Perspective name"
              :value="title"
              @change=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.title = target.value;
              }}
            ></j-input>
            <j-button
              ?loading=${this.isCreatingCommunity}
              ?disabled=${this.isLoading}
              @click=${() => this.onCreateCommunity()}
              full
              size="sm"
              id="create-perspective"
            >
              Create new Flux community
            </j-button>
          </j-flex>
        </aside>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "flux-container": MyElement;
  }
}

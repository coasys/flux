import { LitElement, html, customElement, state, css } from "lit-element";
import { map } from "lit/directives/map.js";

if (!customElements.get("j-button")) {
  import("@fluxapp/ui");
  import("@fluxapp/ui/dist/main.css");
  import("@fluxapp/ui/dist/themes/dark.css");
}

import Ad4mConnectUI from "@perspect3vism/ad4m-connect";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";
import { createCommunity } from "@fluxapp/api";
import { Channel, Community } from "@fluxapp/api";
import { SubjectRepository } from "@fluxapp/api";

@customElement("flux-container")
export class MyElement extends LitElement {
  static styles = css`
    :host {
      height: calc(100vh - var(--j-size-xl));
      display: block;
      box-sizing: border-box;
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
      border-right: 1px solid var(--j-color-ui-100);
      box-sizing: border-box;
    }
    .content {
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
  isCreatingCommunity = false;

  @state()
  source = "";

  @state()
  theme = "";

  @state()
  channels: Channel[] = [];

  @state()
  community: Community | null = null;

  constructor() {
    super();

    this.perspectiveUuid = localStorage.getItem("perspectiveUuid") || "";
    this.source = localStorage.getItem("source") || "ad4m://self";
    this.theme = localStorage.getItem("theme") || "dark";
    this.community = null;
    this.channels = [];
    this.perspectives = [];

    document.documentElement.className = this.theme;
  }

  get perspective() {
    return this.perspectives.find((p) => p.uuid === this.perspectiveUuid);
  }

  get neighbourhoods() {
    return this.perspectives.filter((p) => p.sharedUrl);
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
        const client: Ad4mClient = await getAd4mClient();
        this.client = client;

        const perspectives = await client.perspective.all();
        this.perspectives = perspectives;

        client.perspective.addPerspectiveAddedListener(async (handle) => {
          const perspective = await client.perspective.byUUID(handle.uuid);
          this.perspectives.push(perspective);
        });

        client.perspective.addPerspectiveUpdatedListener(async (handle) => {
          const perspective = await client.perspective.byUUID(handle.uuid);
          this.perspectives = this.perspectives.map((p) =>
            p.uuid === perspective.uuid ? perspective : p
          );
        });

        client.perspective.addPerspectiveRemovedListener((uuid: string) => {
          this.perspectives = this.perspectives.filter((p) => p.uuid !== uuid);
          return null;
        });

        if (this.perspectiveUuid) {
          this.setPerspective(this.perspectiveUuid);
        }
      }
    });
  }

  async setPerspective(uuid: string) {
    const perspective = this.perspectives.find((p) => p.uuid === uuid);

    if (!perspective) {
      return;
    }

    localStorage.setItem("perspectiveUuid", uuid);
    this.perspectiveUuid = uuid;

    try {
      this.isLoading = true;

      const channels = await new SubjectRepository(Channel, {
        perspective: perspective,
      }).getAllData();

      this.channels = channels;

      // @ts-ignore
      this.appElement.perspective = perspective;

      // @ts-ignore
      if (!this.appElement.agent) {
        // @ts-ignore
        this.appElement.agent = this.client.agent;
      }

      if (this.appElement.getAttribute("source") !== this.source) {
        this.appElement.setAttribute("source", this.source);
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.isLoading = false;
    }
  }

  setChannel(source: string) {
    this.source = source;
    console.log("set channel", source);
    localStorage.setItem("source", source);
    this.appElement.setAttribute("source", source);
    this.requestUpdate();
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
    } catch (e) {
      console.log(e);
    } finally {
      this.isCreatingCommunity = false;
    }
  }

  render() {
    return html`
      <div class="sidebar-layout" part="layout">
        <aside class="sidebar" part="sidebar">
          <j-flex direction="column" gap="500">
            <div>
              <j-text variant="label">Theme</j-text>
              <select
                @change=${(e: Event) => this.setTheme(e)}
                value=${this.theme}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            ${this.neighbourhoods.length
              ? html` <div>
                  <j-text variant="label">Community</j-text>
                  <j-flex gap="200" wrap>
                    ${map(
                      this.neighbourhoods,
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
                </div>`
              : ``}
            ${this.perspective?.uuid
              ? html`<div>
                  <j-text variant="label">Channel</j-text>
                  <select
                    @change=${(e: any) => this.setChannel(e.target.value)}
                  >
                    <option
                      ?selected=${this.source === "ad4m://self"}
                      value="ad4m://self"
                    >
                      Self (ad4m://self)
                    </option>
                    ${map(
                      this.channels,
                      (c) =>
                        html`<option
                          ?selected=${this.source === c.id}
                          value=${c.id}
                        >
                          ${c.name}
                        </option>`
                    )}
                  </select>
                </div>`
              : ``}

            <j-input
              label="New Community"
              placeholder="Name"
              .value=${this.title}
              @change=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.title = target.value;
              }}
            ></j-input>
            <j-button
              variant="primary"
              ?loading=${this.isCreatingCommunity}
              ?disabled=${this.isCreatingCommunity}
              @click=${() => this.onCreateCommunity()}
              full
              size="sm"
            >
              Create community
            </j-button>
          </j-flex>
        </aside>
        <div class="content" part="content">
          ${this.isLoading
            ? html`<j-box py="900">
                <j-flex a="center" j="center">
                  <j-spinner></j-spinner>
                </j-flex>
              </j-box>`
            : this.perspective?.uuid
            ? html`<slot></slot>`
            : html`<j-box py="900">
                <j-flex a="center" j="center">
                  <j-text>Please select a community</j-text>
                </j-flex>
              </j-box>`}
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

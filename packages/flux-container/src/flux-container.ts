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
import { createCommunity, joinCommunity } from "@fluxapp/api";
import { Channel, Community } from "@fluxapp/api";
import { SubjectRepository } from "@fluxapp/api";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

@customElement("flux-container")
export class MyElement extends LitElement {
  static styles = css`
    :host {
      height: 100%;
      display: block;
      box-sizing: border-box;
    }
    .sidebar-layout {
      height: 100%;
      display: grid;
      grid-template-columns: 1fr 5fr;
    }
    .sidebar {
      height: 100%;
      display: grid;
      grid-template-columns: auto 200px;
      height: 100vh;
      box-sizing: border-box;
    }
    .hoods {
      border-right: 1px solid var(--j-color-ui-100);
      background: var(--j-color-white);
      padding: var(--j-space-500);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
    }
    .channels {
      background: var(--j-color-white);
      border-right: 1px solid var(--j-color-ui-100);
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
  title = "";

  @state()
  isCreatingCommunity = false;

  @state()
  isCreatingChannel = false;

  @state()
  isJoiningCommunity = false;

  @state()
  source = "";

  @state()
  theme = "";

  @state()
  showCreate = false;

  @state()
  showCreateChannel = false;

  @state()
  listeners = new Map();

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
    return this.perspectives;
  }

  get appElement() {
    return this.children[0];
  }

  get titleIsNeighbourhoodLink() {
    return this.title.startsWith("neighbourhood://");
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
    console.log("setting perspective");

    const perspective = this.perspectives.find((p) => p.uuid === uuid);

    if (!perspective) {
      return;
    }

    if (!this.listeners[perspective.uuid]) {
      this.listeners[perspective.uuid] = true;
      perspective.addListener("link-added", async (link) => {
        const isChannel = await perspective.isSubjectInstance(
          link.data.source,
          Channel.prototype.className
        );
        if (isChannel) {
          this.channels = await new SubjectRepository(Channel, {
            perspective,
          }).getAllData();
        }
        return null;
      });
    }

    localStorage.setItem("perspectiveUuid", uuid);
    this.perspectiveUuid = uuid;

    try {
      this.isLoading = true;

      const channels = await new SubjectRepository(Channel, {
        perspective: perspective,
      }).getAllData();

      this.channels = channels;

      this.source = channels[0]?.id || "";

      console.log("setting perspective");

      // @ts-ignore
      this.appElement.perspective = perspective;

      // @ts-ignore
      if (!this.appElement.agent) {
        // @ts-ignore
        console.log("setting agent", this.appElement);
        this.appElement.agent = this.client.agent;
      }

      console.log("setting source");

      this.appElement.setAttribute("source", this.source);
    } catch (e) {
      console.log(e);
    } finally {
      this.isLoading = false;
    }
  }

  setChannel(source: string) {
    this.source = source;
    this.appElement.setAttribute("source", source);
    this.requestUpdate();
  }

  setTheme(value: string) {
    this.theme = value;
    document.documentElement.className = value;
    localStorage.setItem("theme", value);
  }

  async onCreateCommunity() {
    this.isCreatingCommunity = true;
    try {
      await createCommunity({ name: this.title });
      this.title = "";
      this.showCreate = false;
    } catch (e) {
      console.log(e);
    } finally {
      this.isCreatingCommunity = false;
    }
  }

  async onCreateChannel() {
    this.isCreatingChannel = true;
    try {
      const model = new SubjectRepository(Channel, {
        perspective: this.perspective,
        source: "ad4m://self",
      });
      await model.create({ name: this.title });
      this.title = "";
      this.showCreateChannel = false;
    } catch (e) {
      console.log(e);
    } finally {
      this.isCreatingChannel = false;
    }
  }

  async onJoinCommunity() {
    this.isJoiningCommunity = true;
    try {
      await joinCommunity({ joiningLink: this.title });
      this.title = "";
      this.showCreate = false;
    } catch (e) {
      console.log(e);
    } finally {
      this.isJoiningCommunity = false;
    }
  }

  render() {
    return html`
      <div class="sidebar-layout" part="layout">
        <aside class="sidebar" part="sidebar">
          <div class="hoods">
            <j-flex gap="500" wrap>
              ${this.neighbourhoods.length
                ? map(
                    this.neighbourhoods,
                    (p) => html`<j-tooltip title=${p.name}>
                      <j-avatar
                        ?selected=${this.perspectiveUuid === p.uuid}
                        initials=${p.name.charAt(0)}
                        @click=${() => this.setPerspective(p.uuid)}
                        :value=${p.uuid}
                        ?disabled=${this.isLoading}
                      >
                        ${p.name}
                      </j-avatar>
                    </j-tooltip>`
                  )
                : ``}
              <j-button
                @click=${() => (this.showCreate = true)}
                circle
                square
                variant="secondary"
              >
                <j-icon name="plus"></j-icon>
              </j-button>
            </j-flex>
            <j-popover>
              <j-button slot="trigger" variant="ghost" square circle>
                <j-icon name="magic"></j-icon>
              </j-button>
              <j-menu slot="content">
                <j-menu-item
                  ?selected=${this.theme === "light"}
                  @click=${() => this.setTheme("light")}
                >
                  Light
                </j-menu-item>
                <j-menu-item
                  ?selected=${this.theme === "dark"}
                  @click=${() => this.setTheme("dark")}
                >
                  Dark
                </j-menu-item>
              </j-menu>
            </j-popover>
          </div>

          ${this.perspective
            ? html` <div class="channels">
                <j-box px="500" pt="800"
                  ><j-text
                    size="300"
                    weight="800"
                    uppercase
                    color="primary-500"
                  >
                    Channels
                  </j-text>
                </j-box>
                ${this.perspective?.uuid
                  ? html`<div>
                      ${this.channels.map((c) => {
                        return html`<j-menu-item
                          ?selected=${c.id === this.source}
                          @click=${() => this.setChannel(c.id)}
                          >${c.name}</j-menu-item
                        >`;
                      })}
                    </div>`
                  : ``}
                <j-menu-item @click=${() => (this.showCreateChannel = true)}>
                  Create channel
                  <j-icon slot="end" name="plus" size="xs"></j-icon>
                </j-menu-item>
              </div>`
            : ""}
        </aside>
        <div class="content" part="content">
          ${this.isLoading
            ? html`<j-box py="900">
                <j-flex a="center" j="center">
                  <j-spinner></j-spinner>
                </j-flex>
              </j-box>`
            : this.perspective?.uuid && this.source
            ? html`<slot></slot>`
            : html`<j-box py="900">
                <j-flex a="center" j="center">
                  <j-text>Please select a community and a channel</j-text>
                </j-flex>
              </j-box>`}
        </div>
      </div>
      <j-modal
        ?open=${this.showCreate}
        @toggle=${(e) => (this.showCreate = e.target.open)}
      >
        <j-box px="800" py="600">
          <j-box pb="800">
            <j-text nomargin variant="heading">Create or join community</j-text>
          </j-box>
          <j-flex direction="column" gap="400">
            <j-input
              placeholder="Name"
              size="lg"
              .value=${this.title}
              @input=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.title = target.value;
              }}
            ></j-input>
            ${this.titleIsNeighbourhoodLink
              ? html`<j-button
                  variant="primary"
                  ?loading=${this.isJoiningCommunity}
                  ?disabled=${this.isJoiningCommunity}
                  @click=${() => this.onJoinCommunity()}
                  full
                  size="lg"
                >
                  Join
                </j-button>`
              : html`<j-button
                  variant="primary"
                  ?loading=${this.isCreatingCommunity}
                  ?disabled=${this.isCreatingCommunity}
                  @click=${() => this.onCreateCommunity()}
                  full
                  size="lg"
                >
                  Create
                </j-button>`}
          </j-flex>
        </j-box>
      </j-modal>
      <j-modal
        ?open=${this.showCreateChannel}
        @toggle=${(e) => (this.showCreateChannel = e.target.open)}
      >
        <j-box px="800" py="600">
          <j-box pb="800">
            <j-text nomargin variant="heading">Create a channel</j-text>
          </j-box>
          <j-flex direction="column" gap="400">
            <j-input
              placeholder="Name"
              size="lg"
              .value=${this.title}
              @input=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.title = target.value;
              }}
            ></j-input>
            <j-button
              variant="primary"
              ?loading=${this.isCreatingChannel}
              ?disabled=${this.isCreatingChannel}
              @click=${() => this.onCreateChannel()}
              full
              size="lg"
            >
              Create
            </j-button>
          </j-flex>
        </j-box>
      </j-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "flux-container": MyElement;
  }
}

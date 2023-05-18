import { LitElement, html, property, state, css } from "lit-element";
import { map } from "lit/directives/map.js";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { PluginKey } from "prosemirror-state";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { Channel, Message, SubjectRepository, getProfile } from "@fluxapp/api";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@fluxapp/types";
import defaultActions from "./defaultActions";

type Suggestion = {
  id: string;
  label: string;
};

export default class MyElement extends LitElement {
  static styles = css`
    :host {
      --grid-template-areas: "toolbar" "body" "footer";
      --body-min-height: 80px;
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
    .base {
      border-radius: var(--j-border-radius);
      display: grid;
      border: 1px solid var(--j-color-ui-100);
      grid-template-areas: var(--grid-template-areas);
    }
    .base:hover:not(:focus-within) {
      border: 1px solid var(--j-color-ui-200);
    }
    .base:focus-within {
      border: 1px solid var(--j-color-focus);
    }

    .toolbar {
      grid-area: toolbar;
      background: var(--j-color-white);
      border-top-left-radius: var(--j-border-radius);
      border-top-right-radius: var(--j-border-radius);
      border-bottom: 1px solid var(--j-color-ui-100);
    }

    .body {
      grid-area: body;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: end;
      gap: var(--j-space-300);
      padding: var(--j-space-300);
      border-top: 1px solid var(--j-color-ui-100);
      grid-area: footer;
    }

    .mention {
      word-break: break-word;
      text-decoration: none;
      cursor: pointer;
      padding: 2px var(--j-space-200);
      border-radius: var(--j-border-radius);
      background: var(--j-color-primary-100);
      color: var(--j-color-primary-700);
    }

    .editor > div {
      padding: var(--j-space-400);
    }

    .editor > div > *:first-of-type {
      margin-top: 0;
    }

    .editor > div > *:last-of-type {
      margin-bottom: 0;
    }

    .suggestions {
      position: absolute;
    }

    .ProseMirror {
      min-height: var(--body-min-height);
    }

    .ProseMirror:focus {
      outline: none;
    }

    .ProseMirror p.is-editor-empty:first-child::before {
      color: #adb5bd;
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }
  `;

  @property({ type: PerspectiveProxy })
  perspective: PerspectiveProxy | null;

  @property({ type: Ad4mClient })
  client: null;

  @property({ type: String })
  source: null;

  @property({ type: String })
  placeholder: "";

  @state()
  editor: Editor | null;

  @state()
  model: SubjectRepository<{
    [x: string]: any;
  }>;

  @state()
  members: Profile[] = [];

  @state()
  channels: Channel[] = [];

  @state()
  suggestions: Suggestion[] = [];

  @state()
  suggestionIndex: number = -1;

  @state()
  isSuggesting: boolean = false;

  @state()
  isCreating: boolean = false;

  @state()
  suggestionCallback: (props: any) => void | null = null;

  constructor() {
    super();

    this.upHandler = this.upHandler.bind(this);
    this.downHandler = this.downHandler.bind(this);
    this.selectSuggestion = this.selectSuggestion.bind(this);
    this.getMentionSuggestions = this.getMentionSuggestions.bind(this);
    this.renderSuggestions = this.renderSuggestions.bind(this);
    this.fetchProfiles = this.fetchProfiles.bind(this);
    this.fetchChannels = this.fetchChannels.bind(this);
  }

  get editorElement() {
    return this.renderRoot.querySelector("#editor") as HTMLElement;
  }

  get suggestionsEl() {
    return this.renderRoot.querySelector("#suggestions") as HTMLElement;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  async updated(changedProperties) {
    if (changedProperties.has("perspective")) {
      this.fetchProfiles();
      this.fetchChannels();
    }
  }

  firstUpdated() {
    this.editor = new Editor({
      element: this.editorElement,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: this.placeholder || "",
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          suggestion: {
            char: "@",
            pluginKey: new PluginKey("atKey"),
            items: ({ query }) => this.getMentionSuggestions(query),
            render: this.renderSuggestions,
          },
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          suggestion: {
            char: "#",
            pluginKey: new PluginKey("hashKey"),
            items: ({ query }) => this.getChannelSuggestions(query),
            render: this.renderSuggestions,
          },
        }),
      ],
    });
    this.editor.on("blur", (e) => {
      let event = new CustomEvent("change", {
        detail: {
          json: e.editor.getJSON(),
          html: e.editor.getHTML(),
        },
      });
      this.dispatchEvent(event);
    });
  }

  renderSuggestions() {
    return {
      onStart: (props: SuggestionProps<any>) => {
        this.isSuggesting = true;

        if (this.suggestionsEl) {
          const { x, y, height } = props.clientRect();
          this.suggestionsEl.style.top = `${y + height}px`;
          this.suggestionsEl.style.left = `${x}px`;
        }

        // Save select callback
        this.suggestionCallback = props.command;
      },

      onUpdate: (props: SuggestionProps<any>) => {
        if (this.suggestionsEl) {
          const { x, y, height } = props.clientRect();
          this.suggestionsEl.style.top = `${y + height}px`;
          this.suggestionsEl.style.left = `${x}px`;
        }

        // Save select callback
        this.suggestionCallback = props.command;
      },

      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === "ArrowUp") {
          this.upHandler();
          return true;
        }

        if (props.event.key === "ArrowDown") {
          this.downHandler();
          return true;
        }

        if (props.event.key === "Enter") {
          this.selectSuggestion(this.suggestionIndex);
          return true;
        }

        return false;
      },

      onExit: () => {
        this.suggestions = [];
      },
    };
  }

  upHandler() {
    this.suggestionIndex =
      (this.suggestionIndex + this.suggestions.length - 1) %
      this.suggestions.length;
  }

  downHandler() {
    this.suggestionIndex = (this.suggestionIndex + 1) % this.suggestions.length;
  }

  selectSuggestion(index: number) {
    const item = this.suggestions[index];
    this.suggestionCallback({ id: item.id });
  }

  async getMentionSuggestions(query: string) {
    const matches = this.members
      .filter((m) => m.username.toLowerCase().startsWith(query.toLowerCase()))
      .map((m) => ({ id: m.did, label: m.username }))
      .slice(0, 10) as Suggestion[];

    this.suggestions = matches;
    return matches;
  }

  async getChannelSuggestions(query: string) {
    const matches = this.channels
      .filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase()))
      .map((m) => ({ id: m.name, label: m.name }))
      .slice(0, 10) as Suggestion[];

    this.suggestions = matches;
    return matches;
  }

  async fetchProfiles() {
    if (this.perspective) {
      const neighbourhood = this.perspective.getNeighbourhoodProxy();
      const othersDids = await neighbourhood.otherAgents();
      const profilePromises = othersDids.map(async (did) => getProfile(did));
      const newProfiles = await Promise.all(profilePromises);

      this.members = newProfiles;
    }
  }

  async fetchChannels() {
    if (this.perspective) {
      const model = new SubjectRepository(Channel, {
        perspective: this.perspective,
        source: "ad4m://self",
      });

      model
        .getAllData()
        .then((entries) => {
          this.channels = entries;
        })
        .catch((error) => console.log);
    }
  }

  async submit() {
    const model = new SubjectRepository(Message, {
      perspective: this.perspective,
      source: this.source,
    });

    try {
      const html = this.editor.getHTML();
      this.isCreating = true;
      const result = await model.create({ body: html });
      console.log("CREATED: ", result);
      this.editor.commands.clearContent();
    } catch (e) {
      console.log(e);
    } finally {
      this.isCreating = false;
    }
  }

  render() {
    return html`
      <div class="base" part="base">
        <div class="toolbar" part="toolbar">
          ${map(
            defaultActions,
            (a) => html`<j-button square variant="ghost" @click=${() =>
              this.editor?.commands[a.command]()}>
                <j-icon name=${a.icon}
                  color=${
                    this.editor?.isActive([a.name]) ? "primary-500" : "ui-500"
                  }
                ></j-icon>
              </j-tooltip>`
          )}
        </div>

        <div class="body" part="body">
          <div class="editor" part="editor" id="editor"></div>

          ${this.suggestions.length
            ? html` <div
                class="suggestions"
                part="suggestions"
                id="suggestions"
              >
                <j-menu>
                  ${map(
                    this.suggestions,
                    (s, i) => html`<j-menu-item
                      square
                      variant="ghost"
                      ?selected=${i === this.suggestionIndex}
                      @click=${() => this.selectSuggestion(i)}
                    >
                      <j-flex a="center" gap="300">
                        <j-avatar hash=${s.id} size="xs"></j-avatar>
                        <j-text variant="body" nomargin> ${s.label} </j-text>
                      </j-flex>
                    </j-menu-item>`
                  )}
                </j-menu>
              </div>`
            : ``}
        </div>
        <slot class="footer" name="footer" part="footer">
          <slot name="trigger">
            <j-button
              ?loading=${this.isCreating}
              variant="primary"
              size="sm"
              @click=${this.submit}
            >
              Create
            </j-button>
          </slot>
        </slot>
      </div>
    `;
  }
}

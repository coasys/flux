import {
  LitElement,
  html,
  customElement,
  property,
  state,
  css,
} from "lit-element";
import { map } from "lit/directives/map.js";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { Message, SubjectRepository, getProfile } from "@fluxapp/api";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";
import { Profile } from "@fluxapp/types";
import defaultActions from "./defaultActions";

@customElement("flux-editor")
export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
    .wrapper {
      display: block;
      width: 100%;
      background: var(--j-color-white);
      border: 1px solid var(--j-border-color);
      border-radius: var(--j-border-radius);
      outline: 0;
      min-height: 100px;
    }
    .wrapper:hover:not(:focus-within) {
      border: 1px solid var(--j-border-color-strong);
    }

    .wrapper:focus-within {
      border: 1px solid var(--j-color-focus);
    }

    .header {
      background: var(--j-color-ui-50);
      border-top-left-radius: var(--j-border-radius);
      border-top-right-radius: var(--j-border-radius);
      border-bottom: 1px solid var(--j-color-ui-100);
    }

    .footer {
      padding-top: var(--j-space-400);
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

    .ProseMirror:focus {
      outline: none;
    }
  `;

  @property({ type: PerspectiveProxy })
  perspective: PerspectiveProxy | null;

  @property({ type: Ad4mClient })
  client: null;

  @property({ type: String })
  source: null;

  @state()
  editor: Editor | null;

  @state()
  model: SubjectRepository<{
    [x: string]: any;
  }>;

  @state()
  members: Profile[] = [];

  @state()
  suggestions: Profile[] = [];

  @state()
  suggestionIndex: number = -1;

  @state()
  suggestionCallback: (props: any) => void | null = null;

  constructor() {
    super();
    this.fetchProfiles();
    this.renderSuggestions = this.renderSuggestions.bind(this);
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

  firstUpdated() {
    this.editor = new Editor({
      element: this.editorElement,
      extensions: [
        StarterKit,
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.username ?? node.attrs.id
            }`;
          },
          suggestion: {
            items: ({ query }) => this.getSuggestions(query),
            render: this.renderSuggestions,
          },
        }),
      ],
      content: "<p>Hello World!</p>",
    });
  }

  renderSuggestions() {
    return {
      onStart: (props: SuggestionProps<any>) => {
        const { x, y, height } = props.clientRect();

        this.suggestionsEl.style.top = `${y + height}px`;
        this.suggestionsEl.style.left = `${x}px`;

        // Save select callback
        this.suggestionCallback = props.command;
      },

      onUpdate: (props: SuggestionProps<any>) => {
        const { x, y, height } = props.clientRect();

        this.suggestionsEl.style.top = `${y + height}px`;
        this.suggestionsEl.style.left = `${x}px`;
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
        this.suggestionCallback = null;
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
    this.suggestionCallback({
      id: this.suggestionIndex,
      username: item.username,
    });
  }

  async getSuggestions(query: string) {
    const matches = [
      { did: "123", username: "BambinoToad" },
      { did: "223", username: "ToadChrisT" },
      { did: "323", username: "Toad" },
      { did: "423", username: "ToadRoxblang" },
    ]
      .filter((m) => m.username.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10) as Profile[];

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

  async onSubmit() {
    const model = new SubjectRepository(Message, {
      perspective: this.perspective,
      source: this.source,
    });
    const html = this.editor.getHTML();

    model
      .create({ body: html })
      .then((result) => {
        console.log("CREATED: ", result);
      })
      .catch(console.log);
  }

  render() {
    return html`
      <div class="base" part="base">
        <div class="wrapper" part="wrapper">
          <div class="header" part="header">
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
                      (p, i) => html`<j-menu-item
                        square
                        variant="ghost"
                        ?selected=${i === this.suggestionIndex}
                        @click=${() => this.selectSuggestion(i)}
                      >
                        <j-flex a="center" gap="300">
                          <j-avatar
                            hash=${`did:key:${p.did}`}
                            size="xs"
                          ></j-avatar>
                          <j-text variant="body" nomargin>
                            ${p.username}
                          </j-text>
                        </j-flex>
                      </j-menu-item>`
                    )}
                  </j-menu>
                </div>`
              : ``}
          </div>
        </div>

        <div class="footer" part="footer">
          <j-button @click=${this.onSubmit}>Post</j-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "flux-editor>": MyElement;
  }
}

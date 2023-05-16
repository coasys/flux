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

  constructor() {
    super();

    this.fetchProfiles();
  }

  get editorElement() {
    return this.renderRoot.querySelector("#editor");
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
        }),
      ],
      content: "<p>Hello World!</p>",
    });
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

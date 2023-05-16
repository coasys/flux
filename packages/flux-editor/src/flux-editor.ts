import {
  LitElement,
  html,
  customElement,
  property,
  state,
  css,
} from "lit-element";
import { map } from "lit/directives/map.js";

import Bold from "@tiptap/extension-bold";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { Message, SubjectRepository, getProfile } from "@fluxapp/api";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";
import { Profile } from "@fluxapp/types";

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
      extensions: [StarterKit, Bold],
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
    console.log("perspective: ", this.perspective);

    return html`
      <div class="base" part="base">
        <div class="wrapper" part="wrapper">
          <div class="header" part="header">
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleBold()}
            >
              <j-icon
                name="type-bold"
                color=${this.editor?.isActive("bold")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleItalic()}
            >
              <j-icon
                name="type-italic"
                color=${this.editor?.isActive("italic")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleStrike()}
            >
              <j-icon
                name="type-strikethrough"
                color=${this.editor?.isActive("strike")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleBulletList()}
            >
              <j-icon
                name="list-ul"
                color=${this.editor?.isActive("bulletList")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleOrderedList()}
            >
              <j-icon
                name="list-ol"
                color=${this.editor?.isActive("orderedList")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleCodeBlock()}
            >
              <j-icon
                name="braces"
                color=${this.editor?.isActive("codeBlock")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
            <j-button
              square
              variant="ghost"
              @click=${() => this.editor?.commands.toggleBlockquote()}
            >
              <j-icon
                name="quote"
                color=${this.editor?.isActive("blockquote")
                  ? "primary-500"
                  : "ui-500"}
              ></j-icon>
            </j-button>
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

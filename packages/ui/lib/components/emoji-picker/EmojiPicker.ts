import { Picker } from "emoji-mart";
import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";
import data from "./data.json";

// TODO: Do we need this type  of generic component?

const styles = css`
  :host {
  }
  [part="base"] {
    display: block;
  }
`;

@customElement("j-emoji-picker")
export default class Box extends LitElement {
  static styles = [sharedStyles, styles];

  private picker: any;
  private handleDocumentClick = (event: Event) => {
    // Check if click is outside this component
    if (!event.composedPath().includes(this)) {
      const clickOutsideEvent = new CustomEvent("clickoutside", {
        bubbles: true,
      });
      this.dispatchEvent(clickOutsideEvent);
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.picker = new Picker({
      data,
      onEmojiSelect: (emoji) => {
        const event = new CustomEvent("change", {
          detail: emoji,
          bubbles: true,
        });
        this.dispatchEvent(event);
      },
    });
    this.shadowRoot.appendChild(this.picker);

    // Add our own click outside handler
    setTimeout(() => {
      document.addEventListener("click", this.handleDocumentClick, true);
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleDocumentClick, true);
  }

  render() {
    return html` <div part="base"></div> `;
  }
}

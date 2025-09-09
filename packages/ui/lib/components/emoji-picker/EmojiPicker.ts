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

  private picker: any = null;
  private listenerSetupTimeout?: number;
  private documentListenerAttached = false;
  private handleDocumentClick = (event: Event) => {
    // Check if click is outside this component
    if (!event.composedPath().includes(this)) {
      const clickOutsideEvent = new CustomEvent("clickoutside", {
        bubbles: true,
        composed: true,
        detail: { originalEvent: event },
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
    this.listenerSetupTimeout = window.setTimeout(() => {
      if (!this.isConnected || this.documentListenerAttached) return;
      document.addEventListener("click", this.handleDocumentClick, true);
      this.documentListenerAttached = true;
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.listenerSetupTimeout) {
      clearTimeout(this.listenerSetupTimeout);
      this.listenerSetupTimeout = undefined;
    }
    if (this.documentListenerAttached) {
      document.removeEventListener("click", this.handleDocumentClick, true);
      this.documentListenerAttached = false;
    }
    this.picker?.remove?.();
    this.picker = null;
  }

  render() {
    return html` <div part="base"></div> `;
  }
}

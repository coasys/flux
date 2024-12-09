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

  connectedCallback() {
    super.connectedCallback();
    const picker = new Picker({
      data,
      onEmojiSelect: (emoji) => {
        const event = new CustomEvent("change", {
          detail: emoji,
          bubbles: true,
        });
        this.dispatchEvent(event);
      },
      onClickOutside: () => {
        const event = new CustomEvent("clickoutside", {
          bubbles: true,
        });
        this.dispatchEvent(event);
      },
    });
    this.shadowRoot.appendChild(picker);
  }

  render() {
    return html` <div part="base"></div> `;
  }
}

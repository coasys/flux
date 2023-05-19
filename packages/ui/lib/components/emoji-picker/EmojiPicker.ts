import { html, css, LitElement, adoptStyles } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";
import { Picker } from "emoji-mart";

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
      data: async () => {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/@emoji-mart/data"
        );

        return response.json();
      },
      onEmojiSelect: (emoji) => {
        const event = new CustomEvent("change", {
          detail: emoji,
          bubbles: true,
        });
        this.dispatchEvent(event);
      },
      onClickOutside: () => {
        console.log("click outside");
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

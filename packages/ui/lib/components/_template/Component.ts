import { html, css, LitElement } from "lit";
import { property, customElement } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host button {
    border: 0;
    display: inline-block;
    padding: 25px;
    background: var(--junto-color-text, gray);
    color: var(--junto-color-primary, black);
  }
  :host([variant="primary"]) button {
    background: var(--junto-color-text, green);
    color: var(--junto-color-secondary, white);
  }
  :host([variant="secondary"]) button {
    background: var(--junto-color-text, white);
    color: var(--junto-color-secondary, black);
  }
`;

@customElement("j-component")
export default class Component extends LitElement {
  static styles = [styles, sharedStyles];

  @property({ type: String, reflect: true }) variant = null;

  render() {
    return html`<div><slot></slot></div>`;
  }
}

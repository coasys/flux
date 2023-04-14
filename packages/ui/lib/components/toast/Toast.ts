import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-toast-border: 1px solid var(--j-color-primary-400);
    --j-toast-background: var(--j-color-primary-500);
    --j-toast-color: var(--j-color-white);
  }
  :host([variant="success"]) {
    --j-toast-border: 1px solid var(--j-color-success-400);
    --j-toast-background: var(--j-color-success-500);
    --j-toast-color: var(--j-color-white);
  }
  :host([variant="danger"]) {
    --j-toast-border: 1px solid var(--j-color-danger-400);
    --j-toast-background: var(--j-color-danger-500);
    --j-toast-color: var(--j-color-white);
  }
  :host([variant="warning"]) {
    --j-toast-border: 1px solid var(--j-color-warning-400);
    --j-toast-background: var(--j-color-warning-500);
    --j-toast-color: var(--j-color-white);
  }
  :host {
    visibility: hidden;
    position: absolute;
    left: 0;
    top: 0;
  }
  :host([open]) {
    position: relative;
    visibility: visible;
    display: block;
    position: fixed;
    top: calc(100% - var(--j-space-500));
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    z-index: 999999;
  }

  :host([open]) [part="base"] {
    opacity: 1;
    transform: translateY(0px);
    transition: all 0.2s ease;
  }

  [part="base"] {
    opacity: 0;
    transform: translateY(10px);
    position: relative;
    box-shadow: var(--j-depth-100);
    display: block;
    border-radius: var(--j-border-radius);
    background: var(--j-toast-background);
    border: var(--j-toast-border);
    color: var(--j-toast-color);
    max-width: 900px;
    min-width: 150px;
    padding-top: var(--j-space-400);
    padding-bottom: var(--j-space-400);
    padding-left: var(--j-space-500);
    padding-right: var(--j-space-900);
  }

  [part="base"] j-button {
    position: absolute;
    top: var(--j-space-300);
    right: var(--j-space-300);
  }
`;

@customElement("j-toast")
export default class Component extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Variant
   * @type {""|"success"|"danger"|"warning"}
   * @attr
   */
  @property({ type: String, reflect: true }) variant = null;

  /**
   * Open
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) open = false;

  /**
   * Number of seconds before toast autohides
   * @type {Number}
   * @attr
   */
  @property({ type: Number, reflect: true }) autohide = 5;

  #timeout = null;

  autoClose() {
    if (this.autohide > 0) {
      this.#timeout = setTimeout(() => {
        this.open = false;
      }, this.autohide * 1000);
    }
  }

  shouldUpdate() {
    if (this.open) {
      clearTimeout(this.#timeout);
      this.autoClose();
      this.dispatchEvent(new CustomEvent("toggle", { bubbles: true }));
    } else {
      clearTimeout(this.#timeout);
      this.dispatchEvent(new CustomEvent("toggle", { bubbles: true }));
    }
    return true;
  }

  render() {
    return html`<div part="base">
      <div part="content"><slot></slot></div>
      <j-button @click=${() => (this.open = false)} size="sm" variant="ghost">
        <j-icon size="sm" name="x"></j-icon>
      </j-button>
    </div>`;
  }
}

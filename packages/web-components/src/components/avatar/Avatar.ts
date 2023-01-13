import { html, css, LitElement } from "lit";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { toSvg } from "jdenticon";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    display: contents;
    --j-avatar-size: var(--j-size-md);
    --j-avatar-box-shadow: none;
    --j-avatar-border: none;
    --j-avatar-color: var(--j-color-black);
    --j-avatar-bg: var(--j-color-ui-100);
  }
  :host([src]) {
    --j-avatar-bg: transparent;
  }
  :host([selected]) {
    --j-avatar-box-shadow: 0px 0px 0px 2px var(--j-color-primary-500);
  }
  :host([online]):before {
    position: absolute;
    right: 0;
    bottom: 0;
    content: "";
    display: block;
    width: 25%;
    height: 25%;
    border-radius: 50%;
    background: var(--j-color-primary-500);
  }
  :host([size="xxs"]) {
    --j-avatar-size: var(--j-size-xxs);
  }
  :host([size="xs"]) {
    --j-avatar-size: var(--j-size-xs);
  }
  :host([size="sm"]) {
    --j-avatar-size: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-avatar-size: var(--j-size-lg);
  }
  :host([size="xl"]) {
    --j-avatar-size: var(--j-size-xl);
  }
  :host([size="xxl"]) {
    --j-avatar-size: var(--j-size-xxl);
  }
  [part="base"] {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: inherit;
    box-shadow: var(--j-avatar-box-shadow);
    color: var(--j-avatar-color);
    background: var(--j-avatar-bg);
    border: var(--j-avatar-border);
    padding: 0;
    width: var(--j-avatar-size);
    height: var(--j-avatar-size);
    border-radius: 50%;
  }

  svg {
    width: calc(var(--j-avatar-size) - 30%);
    height: calc(var(--j-avatar-size) - 30%);
  }

  [part="icon"] {
    --j-icon-size: calc(var(--j-avatar-size) * 0.6);
  }

  [part="img"] {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  [part="initials"] {
    font-weight: 600;
    text-transform: uppercase;
  }
`;

@customElement("j-avatar")
export default class Component extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Img src
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) src = null;

  /**
   * Hash
   * @type {String}
   * @attr
   */
  @property({ type: Uint8Array, reflect: true }) hash = null;

  /**
   * Avatar is selected
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) selected = false;

  /**
   * User is online
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) online = false;

  /**
   * Placeholder initials
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) initials = null;

  /**
   * Icon
   * @type {String}
   * @attr
   */
  @property({ type: String }) icon = "person-fill";

  /**
   * Sizes
   * @type {""|"xxs"|"xs"|"sm"|"lg"|"xl"|"xxl"}
   * @attr
   */
  @property({ type: String, reflect: true }) size = null;

  firstUpdated() {
    const canvas = this.shadowRoot.querySelector("#identicon");
    const opts = {
      hash: this.hash,
      size: 100,
    };
    if (canvas) {
      //renderIcon(opts, canvas);
    }
  }

  render() {
    if (this.src) {
      return html`<button part="base">
        <img part="img" src=${this.src} />
      </button>`;
    }

    if (this.hash) {
      return html`
        <button part="base">${unsafeSVG(toSvg(this.hash || "", 100))}</button>
      `;
    }

    if (this.initials) {
      return html`<button part="base">
        <span part="initials">${this.initials}</span>
      </button>`;
    }

    return html`<button part="base">
      <j-icon part="icon" name=${this.icon}></j-icon>
    </button>`;
  }
}

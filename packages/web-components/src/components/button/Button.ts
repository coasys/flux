import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-button-opacity: 1;
    --j-button-text-decoration: none;
    --j-button-depth: none;
    --j-button-display: inline-flex;
    --j-button-width: initial;
    --j-button-padding: 0 var(--j-space-400);
    --j-button-bg: var(--j-color-white);
    --j-button-border: 1px solid var(--j-color-primary-600);
    --j-button-color: var(--j-color-primary-600);
    --j-button-height: var(--j-size-md);
    --j-button-border-radius: var(--j-border-radius);
    --j-button-font-size: var(--j-font-size-500);
  }
  [part="base"] {
    opacity: var(--j-button-opacity);
    text-decoration: var(--j-button-text-decoration);
    transition: box-shadow 0.2s ease;
    cursor: pointer;
    border: 0;
    gap: var(--j-space-400);
    align-items: center;
    justify-content: center;
    box-shadow: var(--j-button-depth);
    display: var(--j-button-display);
    width: var(--j-button-width);
    padding: var(--j-button-padding);
    height: var(--j-button-height);
    border-radius: var(--j-button-border-radius);
    background: var(--j-button-bg);
    color: var(--j-button-color);
    fill: var(--j-button-color);
    font-size: var(--j-button-font-size);
    font-family: inherit;
    font-weight: 600;
    border: var(--j-button-border);
    position: relative;
  }

  :host([disabled]) [part="base"] {
    --j-button-opacity: 0.5;
    cursor: default;
  }

  j-spinner {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
  }

  :host([loading]) j-spinner {
    display: block;
    --j-spinner-size: calc(var(--j-button-height) / 2);
    --j-spinner-color: var(--j-button-color);
  }

  :host([loading]) [part="base"] slot {
    visibility: hidden;
    opacity: 0;
  }

  :host([variant="primary"]) {
    --j-button-bg: var(--j-color-primary-600);
    --j-button-color: var(--j-color-white);
    --j-button-border: 1px solid transparent;
  }

  :host([variant="primary"]:hover) {
    --j-button-bg: var(--j-color-primary-700);
    cursor: pointer;
  }

  :host([variant="link"]) {
    --j-button-color: var(--j-color-primary-700);
    --j-button-bg: transparent;
    --j-button-border: 1px solid transparent;
  }

  :host([variant="link"]:hover) {
    --j-button-bg: transparent;
    --j-button-text-decoration: underline;
    --j-button-color: var(--j-color-primary-600);
  }

  :host([variant="subtle"]) {
    --j-button-bg: rgb(0 0 0 / 16%);
    --j-button-color: var(--j-color-ui-800);
    --j-button-border: 1px solid transparent;
  }

  :host([variant="subtle"]:hover) {
    --j-button-color: var(--j-color-black);
    --j-button-bg: rgb(0 0 0 / 20%);
  }

  :host([variant="ghost"]) {
    --j-button-opacity: 0.5;
    --j-button-bg: transparent;
    --j-button-color: currentColor;
    --j-button-border: 1px solid transparent;
  }

  :host([variant="ghost"]:hover) {
    --j-button-opacity: 1;
  }

  :host([size="xs"]) {
    --j-button-font-size: var(--j-font-size-400);
    --j-button-padding: 0 var(--j-space-200);
    --j-button-height: var(--j-size-xs);
  }

  :host([size="sm"]) {
    --j-button-font-size: var(--j-font-size-400);
    --j-button-padding: 0 var(--j-space-300);
    --j-button-height: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-button-font-size: var(--j-font-size-500);
    --j-button-height: var(--j-size-lg);
    --j-button-padding: 0 var(--j-space-600);
  }
  :host([size="xl"]) {
    --j-button-font-size: var(--j-font-size-600);
    --j-button-height: var(--j-size-xl);
    --j-button-padding: 0 var(--j-space-600);
  }
  :host([full]) {
    --j-button-display: flex;
    --j-button-width: 100%;
  }
  :host([square]) {
    --j-button-padding: 0;
    --j-button-width: var(--j-button-height);
  }
  :host([circle]) {
    --j-button-border-radius: 50%;
  }
`;

@customElement("j-button")
export default class Button extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Variations
   * @type {""|"link"|"primary"|"subtle"|"transparent"|}
   * @attr
   */
  @property({ type: String, reflect: true })
  variant = null;

  /**
   * Sizes
   * @type {""|"xs"|"sm"|"lg"|"xl"}
   * @attr
   */
  @property({ type: String, reflect: true })
  size = null;

  /**
   * Disabled
   * @type {boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Loading
   * @type {boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Squared
   * @type {boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  square = false;

  /**
   * Full
   * @type {boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  full = false;

  /**
   * Circle
   * @type {boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  circle = false;

  handleClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  render() {
    return html`
      <button @click=${this.handleClick} part="base">
        <j-spinner></j-spinner>
        <slot name="start"></slot>
        <slot></slot>
        <slot name="end"></slot>
      </button>
    `;
  }
}

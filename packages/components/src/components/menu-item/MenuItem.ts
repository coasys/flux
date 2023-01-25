import { html, css, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-menu-item-gap: var(--j-space-300);
    --j-menu-item-border-left: none;
    --j-menu-item-border-radius: none;
    --j-menu-item-height: var(--j-size-md);
    --j-menu-item-bg: transparent;
    --j-menu-item-color: var(--j-color-ui-600);
    --j-menu-item-padding: 0 var(--j-space-500) 0 var(--j-space-500);
    --j-menu-item-font-weight: 500;
    --j-menu-item-font-size: var(--j-font-size-500);
  }
  :host(:hover) {
    --j-menu-item-color: var(--j-color-ui-700);
    --j-menu-item-bg: var(--j-color-ui-50);
  }
  :host([active]) {
    --j-menu-item-bg: var(--j-color-ui-50);
    --j-menu-item-color: var(--j-color-ui-600);
  }
  :host([selected]) {
    --j-menu-item-bg: var(--j-color-primary-100);
    --j-menu-item-color: var(--j-color-primary-700);
  }
  :host([size="sm"]) {
    --j-menu-item-gap: var(--j-space-300);
    --j-menu-item-font-size: var(--j-font-size-400);
    --j-menu-item-height: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-menu-item-gap: var(--j-space-400);
    --j-menu-item-height: var(--j-size-lg);
  }
  :host([size="xl"]) {
    --j-menu-item-gap: var(--j-space-500);
    --j-menu-item-height: var(--j-size-xl);
  }
  :host(:last-of-type) [part="base"] {
    margin-bottom: 0;
  }
  [part="base"] {
    display: flex;
    align-items: center;
    gap: var(--j-menu-item-gap);
    border-radius: var(--j-menu-item-border-radius);
    background: var(--j-menu-item-bg);
    text-decoration: none;
    cursor: pointer;
    font-size: var(--j-menu-item-font-size);
    height: var(--j-menu-item-height);
    padding: var(--j-menu-item-padding);
    color: var(--j-menu-item-color);
    font-weight: var(--j-menu-item-font-weight);
    border-left: var(--j-menu-item-border-left);
  }
  [part="content"] {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

@customElement("j-menu-item")
export default class MenuItem extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Selected
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * Active
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  active = false;

  @state()
  _value = null;

  @state()
  _label = null;

  get label() {
    return this._label || this.getAttribute("label") || this.innerText;
  }

  set label(val) {
    this._label = val;
    this.setAttribute("label", val);
  }

  get value() {
    return this._value || this.getAttribute("value") || this.innerText;
  }

  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
  }

  render() {
    return html`<div part="base" role="menuitem">
      <slot name="start"></slot>
      <div part="content">
        <slot></slot>
      </div>
      <slot name="end"></slot>
    </div>`;
  }
}

import { LitElement, html, css } from "lit";
import { state, customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-tab-item-width: inherit;
    --j-tab-item-background: none;
    --j-tab-item-border-radius: none;
    --j-tab-item-border: none;
    --j-tab-item-color: var(--j-color-ui-600);
    --j-tab-item-box-shadow: none;
    --j-tab-item-padding: 0 var(--j-space-500);
    --j-tab-item-height: var(--j-size-md);
    --j-tab-item-font-size: var(--j-font-size-500);
  }
  :host([size="sm"]) {
    --j-tab-item-height: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-tab-item-height: var(--j-size-lg);
  }
  [part="base"] {
    display: flex;
    align-items: center;
    gap: var(--j-space-400);
    justify-content: space-between;
    white-space: nowrap;
    width: var(--j-tab-item-width);
    outline: 0;
    border: var(--j-tab-item-border);
    border-radius: var(--j-tab-item-border-radius);
    box-shadow: var(--j-tab-item-box-shadow);
    font-family: var(--j-font-family);
    color: var(--j-tab-item-color);
    cursor: pointer;
    z-index: 1;
    border: none;
    text-align: var(--j-tab-item-text-align, center);
    height: var(--j-tab-item-height);
    font-weight: 600;
    font-size: var(--j-tab-item-font-size);
    background: var(--j-tab-item-background);
    padding: var(--j-tab-item-padding);
  }
  [part="content"] {
    flex: 1;
  }
  :host([disabled]) [part="base"] {
    cursor: not-allowed;
    opacity: 0.6;
  }
  :host([disabled][checked]) [part="base"] {
    opacity: 1;
  }
`;

@customElement("j-tab-item")
class TabItem extends LitElement {
  /**
   * Checked
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Disabled
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  _label = null;

  @state()
  _value = null;

  get label() {
    return this._label || this.getAttribute("label") || this.innerText || this.innerHTML;
  }

  set label(val) {
    this._label = val;
    this.setAttribute("label", val);
  }

  get value() {
    return this._value || this.getAttribute("value") || this.innerText || this.innerHTML;
  }

  set value(val) {
    this._value = val;
    this.setAttribute("value", val);
  }

  static get styles() {
    return [styles, sharedStyles];
  }

  _handleChange(e) {
    e.stopPropagation();
    this.checked = true;
    this.dispatchEvent(new CustomEvent("tab-selected", { bubbles: true }));
  }

  render() {
    return html`
      <button
        aria-selected=${this.checked}
        aria-controls=${this.value}
        ?disabled=${this.disabled}
        @click=${this._handleChange}
        part="base"
        role="tab"
      >
        <slot name="start"></slot>
        <div part="content">
          <slot></slot>
        </div>
        <slot name="start"></slot>
      </button>
    `;
  }
}

export default TabItem;

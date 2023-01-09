import { LitElement, html, css } from "lit";
import { state, customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-tab-item-height: var(--j-size-md);
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
    width: inherit;
    outline: 0;
    font-family: var(--j-font-family);
    color: var(--j-color-ui-600);
    cursor: pointer;
    z-index: 1;
    border: none;
    text-align: var(--j-tab-item-text-align, center);
    height: var(--j-tab-item-height);
    font-weight: 600;
    font-size: var(--j-font-size-500);
    background: 0;
    padding: 0 var(--j-space-500);
  }
  [part="base"]:hover {
    box-shadow: var(
      --j-tab-item-border-hover,
      0px 4px 0px -2px var(--j-color-ui-700)
    );
    color: var(--j-color-ui-700);
  }
  [part="content"] {
    flex: 1;
  }
  :host([checked]) [part="base"] {
    color: var(--j-color-primary-600);
    box-shadow: var(
      --j-tab-item-border-selected,
      0px 4px 0px -2px var(--j-color-primary-600)
    );
  }
  :host([variant="button"]) [part="base"] {
    border-radius: var(--j-border-radius);
    box-shadow: none;
    color: var(--j-color-ui-600);
  }
  :host([variant="button"]) [part="base"]:hover {
    background: var(--j-color-ui-50);
    color: var(--j-color-ui-700);
  }
  :host([variant="button"][checked]) [part="base"] {
    background: var(--j-color-primary-100);
    color: var(--j-color-primary-700);
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

  /**
   * Size
   * @type {"sm"|"lg"}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  size = null;

  /**
   * Variant
   * @type {""|"button"}
   * @attr
   */
  @property({ type: String, reflect: true })
  variant = null;

  @state()
  _label = null;

  @state()
  _value = null;

  get label() {
    return (
      this._label ||
      this.getAttribute("label") ||
      this.innerText ||
      this.innerHTML
    );
  }

  set label(val) {
    this._label = val;
    this.setAttribute("label", val);
  }

  get value() {
    return (
      this._value ||
      this.getAttribute("value") ||
      this.innerText ||
      this.innerHTML
    );
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
        disabled=${this.disabled}
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

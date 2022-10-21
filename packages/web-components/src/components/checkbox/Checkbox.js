import { LitElement, html, css } from "lit";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-checkbox-size: var(--j-size-md);
  }
  :host([size="sm"]) {
    --j-checkbox-size: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-checkbox-size: var(--j-size-lg);
  }
  :host([disabled]) [part="base"] {
    opacity: 0.5;
    cursor: default;
  }
  input {
    position: absolute;
    clip: rect(1px 1px 1px 1px);
    clip: rect(1px, 1px, 1px, 1px);
    vertical-align: middle;
  }
  [part="base"] {
    cursor: pointer;
    display: flex;
    height: var(--j-checkbox-size);
    align-items: center;
    gap: var(--j-space-400);
  }
  :host(:not([disabled]):not([checked]))
    [part="base"]:hover
    [part="indicator"] {
    border-color: var(--j-color-ui-300);
  }
  [part="indicator"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--j-color-ui-200);
    width: calc(var(--j-checkbox-size) * 0.6);
    height: calc(var(--j-checkbox-size) * 0.6);
    border-radius: var(--j-border-radius);
    color: var(--j-color-white);
  }
  [part="checkmark"] {
    display: none;
  }
  :host([checked]) [part="checkmark"] {
    display: contents;
  }
  :host([checked]) [part="indicator"] {
    border-color: var(--j-color-primary-500);
    background: var(--j-color-primary-500);
  }
`;

class Checkbox extends LitElement {
  constructor() {
    super();
    /**
     * Checked
     * @type {Boolean}
     * @attr
     */
    this.checked = false;
    /**
     * Full width
     * @type {Boolean}
     * @attr
     */
    this.full = false;
    /**
     * Disabled
     * @type {Boolean}
     * @attr
     */
    this.disabled = false;
    /**
     * Size
     * @type {""|"sm"|"lg"}
     * @attr
     */
    this.size = null;
    /**
     * Value
     * @type {String}
     * @attr
     */
    this.value = null;
    this._handleChange = this._handleChange.bind(this);
  }

  static get properties() {
    return {
      checked: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true },
      full: { type: Boolean, reflect: true },
      size: { type: String, reflect: true },
      value: { type: String },
    };
  }

  static get styles() {
    return [styles, sharedStyles];
  }

  _handleChange(e) {
    e.stopPropagation();
    this.checked = e.target.checked;
    this.dispatchEvent(new CustomEvent("change", e));
  }

  render() {
    return html`
      <label part="base">
        <input
          ?disabled=${this.disabled}
          @change=${this._handleChange}
          ?checked=${this.checked}
          value=${this.value}
          type="checkbox"
        />
        <span aria-hidden="true" part="indicator">
          <slot part="checkmark" name="checkmark">
            <j-icon name="check"></j-icon>
          </slot>
        </span>
        <span part="label"><slot></slot></span>
      </label>
    `;
  }
}

customElements.define("j-checkbox", Checkbox);

export default Checkbox;

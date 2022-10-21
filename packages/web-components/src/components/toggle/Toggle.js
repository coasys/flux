import { LitElement, html, css } from "lit";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-toggle-size: var(--j-size-md);
  }
  :host([size="sm"]) {
    --j-toggle-size: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-toggle-size: var(--j-size-lg);
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
    height: var(--j-toggle-size);
    align-items: center;
    gap: var(--j-space-400);
  }
  :host([disabled]) [part="base"] {
    opacity: 0.5;
    cursor: default;
  }
  :host(:not([disabled]):not([checked])) [part="base"]:hover [part="toggle"] {
    background: var(--j-color-ui-300);
  }
  [part="toggle"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--j-toggle-size) * 1);
    height: calc(var(--j-toggle-size) * 0.6);
    border-radius: var(--j-border-radius);
    background: var(--j-color-ui-200);
    color: var(--j-color-white);
    position: relative;
    border-radius: 300px;
  }
  :host([checked]) [part="toggle"] {
    background: var(--j-color-primary-500);
  }
  [part="indicator"] {
    position: absolute;
    transition: all 0.2s ease;
    top: 50%;
    transform: translateY(-50%) translateX(0px);
    left: 5px;
    display: inline-block;
    border-radius: 50%;
    background: var(--j-color-white);
    width: calc(var(--j-toggle-size) * 0.4);
    height: calc(var(--j-toggle-size) * 0.4);
  }
  :host([checked]) [part="indicator"] {
    left: calc(100% - 5px);
    transform: translateY(-50%) translateX(-100%);
  }
`;

class Toggle extends LitElement {
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
    this.dispatchEvent(new CustomEvent("change"));
  }

  render() {
    return html`
      <label part="base">
        <input
          ?disabled=${this.disabled}
          @change=${this._handleChange}
          .checked=${this.checked}
          value=${this.value}
          type="checkbox"
        />
        <span aria-hidden="true" part="toggle">
          <span part="indicator" name="indicator"></span>
        </span>
        <span part="label"><slot></slot></span>
      </label>
    `;
  }
}

customElements.define("j-toggle", Toggle);

export default Toggle;

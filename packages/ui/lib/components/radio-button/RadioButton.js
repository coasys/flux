import { html, css, LitElement } from "lit";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-radio-button-size: 16px;
    --j-radio-button-gap: var(--j-space-300);
    --j-radio-button-font-size: 0 var(--j-font-size-500);
    --j-radio-button-indicator-color: var(--j-color-ui-500);
  }
  :host([full]) label {
    display: flex;
    width: 100%;
  }
  :host([disabled]) label {
    opacity: 0.5;
    cursor: default;
  }
  :host([checked]) {
    --j-radio-button-indicator-color: var(--j-color-primary-500);
  }
  :host([size="sm"]) {
    --j-radio-button-size: 10px;
    --j-radio-button-font-size: var(--j-font-size-400);
  }
  :host([size="lg"]) {
    --j-radio-button-size: 20px;
    --j-radio-button-font-size: var(--j-font-size-600);
  }
  label {
    display: inline-flex;
    gap: var(--j-radio-button-gap);
    font-size: var(--j-radio-button-font-size);
    align-items: center;
    cursor: pointer;
    position: relative;
  }
  input {
    position: absolute;
    clip: rect(1px 1px 1px 1px);
    clip: rect(1px, 1px, 1px, 1px);
    vertical-align: middle;
  }
  span {
    display: block;
  }
  i {
    display: block;
    border-radius: 50%;
    border: 2px solid var(--j-radio-button-indicator-color);
    width: var(--j-radio-button-size);
    height: var(--j-radio-button-size);
    position: relative;
  }
  input:checked ~ i:after {
    position: absolute;
    display: block;
    content: "";
    width: calc(var(--j-radio-button-size) / 2);
    height: calc(var(--j-radio-button-size) / 2);
    background: var(--j-radio-button-indicator-color);
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
  }
`;

class RadioButton extends LitElement {
  constructor() {
    super();
    this.value = null;
    this.name = null;
    /**
     * Sizes
     * @type {""|"sm"|"md"|"lg"}
     * @attr
     */
    this.size = null;
    this.full = false;
    this.disabled = false;
    this._checked = false;
    this.focus = this.focus.bind(this);
    this.selectNext = this.selectNext.bind(this);
    this.selectPrevious = this.selectPrevious.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._handleKeyPress = this._handleKeyPress.bind(this);
  }

  static get properties() {
    return {
      checked: { type: Boolean, reflect: true },
      disabled: { type: Boolean },
      full: { type: Boolean },
      size: { type: String },
      name: { type: String, reflect: true },
      value: { type: String },
    };
  }

  static get styles() {
    return [styles, sharedStyles];
  }

  get options() {
    return [...document.querySelectorAll(`[name="${this.name}"]`)];
  }

  get currentCheckedItem() {
    return this.options.find((option) => option.checked);
  }

  get formElement() {
    return this.shadowRoot.querySelector("input");
  }

  get checked() {
    return this._checked;
  }

  set checked(checked) {
    if (checked === this._checked) {
      return;
    }

    if (checked === true && this.currentCheckedItem) {
      this.currentCheckedItem.checked = false;
    }

    if (this.formElement) {
      this.formElement.checked = checked;
    }

    checked
      ? this.setAttribute("checked", "")
      : this.removeAttribute("checked");

    this._checked = checked;

    this.requestUpdate();
  }

  selectNext() {
    const options = this.options;
    const checkedIndex = options.findIndex((option) => option.checked);
    const isLastOption = options.length === checkedIndex + 1;
    const nextIndex = isLastOption ? 0 : checkedIndex + 1;
    options[nextIndex].focus();
    options[nextIndex].checked = true;
  }

  selectPrevious() {
    const options = this.options;
    const checkedIndex = options.findIndex((option) => option.checked);
    const isFirstOption = checkedIndex === 0;
    const nextIndex = isFirstOption ? options.length - 1 : checkedIndex - 1;
    options[nextIndex].focus();
    options[nextIndex].checked = true;
  }

  focus() {
    this.formElement.focus();
  }

  _handleChange(e) {
    e.stopPropagation();
    this.checked = e.target.checked;
    this.dispatchEvent(new CustomEvent("change", e));
  }

  _handleKeyPress(e) {
    // Left
    if (e.keyCode === 37) {
      this.selectPrevious();
    }
    // Right
    if (e.keyCode === 39) {
      this.selectNext();
    }
  }

  render() {
    return html`
      <label part="base">
        <input
          name=${this.name}
          ?disabled=${this.disabled}
          @keydown=${this._handleKeyPress}
          @change=${this._handleChange}
          ?checked=${this.checked}
          value=${this.value}
          type="radio"
        />
        <i></i>
        <span><slot></slot></span>
      </label>
    `;
  }
}

customElements.define("j-radio-button", RadioButton);

export default RadioButton;

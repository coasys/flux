import { LitElement, html, css } from "lit";
import { ifDefined } from "lit-html/directives/if-defined.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-input-label-size: var(--j-font-size-500);
    --j-input-height: var(--j-size-md);
    --j-input-padding: var(--j-space-400);
  }
  :host([size="sm"]) {
    --j-input-height: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-input-height: var(--j-size-lg);
  }
  :host([size="xl"]) {
    --j-input-height: var(--j-size-xl);
    --j-input-padding: var(--j-space-500);
  }
  :host([full]) {
    display: block;
    width: 100%;
  }
  [part="base"] {
    display: block;
  }
  [part="input-wrapper"] {
    display: flex;
    align-items: center;
    position: relative;
    height: var(--j-input-height);
    font-size: var(--j-font-size-400);
    color: var(--j-color-black);
    background: var(--j-color-white);
    border-radius: var(--j-border-radius);
    border: 1px solid var(--j-border-color);
    width: 100%;
    min-width: 200px;
    padding: 0px;
  }
  [part="input-wrapper"]:hover {
    border: 1px solid var(--j-border-color-strong);
  }
  [part="input-wrapper"]:focus-within {
    border: 1px solid var(--j-color-focus);
  }
  [part="input-field"] {
    border: 0;
    flex: 1;
    background: none;
    outline: 0;
    color: var(--j-color-black);
    font-size: inherit;
    height: 100%;
    width: 100%;
    padding: 0px var(--j-input-padding);
  }
  [part="input-field"]::placeholder {
    color: var(--j-color-ui-400);
  }
  [part="help-text"],
  [part="error-text"] {
    margin-top: var(--j-space-300);
    font-size: var(--j-font-size-400);
  }
  [part="error-text"] {
    color: var(--j-color-danger-500);
  }
  [part="start"]::slotted(*) {
    padding-left: var(--j-space-400);
  }
  [part="end"]::slotted(*) {
    padding-right: var(--j-space-400);
  }
`;

class Input extends LitElement {
  constructor() {
    super();
    this.value = null;
    this._initialValue = null;
    this.max = null;
    this.min = null;
    this.maxlength = null;
    this.minlength = null;
    this.pattern = null;
    this.label = null;
    this.name = null;
    this.size = null;
    this.placeholder = null;
    this.errorText = null;
    this.helpText = null;
    this.autocomplete = false;
    this.autovalidate = false;
    this.autofocus = false;
    this.disabled = false;
    this.full = false;
    this.error = false;
    this.required = false;
    this.readonly = false;
    this.type = "text";
    this.focus = this.focus.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  static get properties() {
    return {
      errorText: { type: String, attribute: "errortext" },
      helpText: { type: String, attribute: "helptext" },
      size: { type: String, reflect: true },
      placeholder: { type: String },
      label: { type: String },
      name: { type: String },
      full: { type: Boolean, reflect: true },
      value: { type: String, reflect: true },
      error: { type: Boolean, reflect: true },
      max: { type: Number },
      min: { type: Number },
      maxlength: { type: Number },
      minlength: { type: Number },
      pattern: { type: String },
      autocomplete: { type: Boolean },
      autovalidate: { type: Boolean },
      autofocus: { type: Boolean },
      disabled: { type: Boolean, reflect: true },
      readonly: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
      type: { type: String },
    };
  }

  static get styles() {
    return [styles, sharedStyles];
  }

  connectedCallback() {
    super.connectedCallback();
    this._initialValue = this.value;
  }

  onInput(e) {
    // First stop default input event to bubble up
    e.stopPropagation();
    // Set the value to the target value
    // this will then become the e.target.value of the custom event
    this.value = e.target.value;
    this.dispatchEvent(new CustomEvent("input", e));
  }

  onChange(e) {
    // First stop default input event to bubble up
    e.stopPropagation();
    // Set the value to the target value
    // this will then become the e.target.value of the custom event
    this.value = e.target.value;

    this.dispatchEvent(new CustomEvent("change", e));
  }

  select() {
    this.renderRoot.querySelector("input").select();
  }

  focus() {
    this.renderRoot.querySelector("input").focus();
  }

  onFocus(e) {
    e.stopPropagation();
    this.value = e.target.value;
    this.dispatchEvent(new CustomEvent("change", e));
  }

  onBlur(e) {
    e.stopPropagation();

    if (this.autovalidate) {
      const valid = this.renderRoot.querySelector("input").checkValidity();

      const message = this.renderRoot.querySelector("input").validationMessage;

      if (!this.errorText) {
        this.errorText = message;
      }

      if (!valid) {
        this.error = true;
      } else {
        this.error = false;
      }
      this.dispatchEvent(new CustomEvent("validate", e));
    }

    this.dispatchEvent(new CustomEvent("blur", e));
  }

  render() {
    return html`
      <div part="base">
        ${this.label &&
        html`
          <j-text tag="label" variant="label" part="label"
            >${this.label}
          </j-text>
        `}
        <div part="input-wrapper">
          <slot part="start" name="start"></slot>
          <input
            part="input-field"
            .value=${this.value}
            max=${ifDefined(this.max)}
            min=${ifDefined(this.min)}
            maxlength=${ifDefined(this.maxlength)}
            minlength=${ifDefined(this.minlength)}
            pattern="${ifDefined(this.pattern)}"
            placeholder="${ifDefined(this.placeholder)}"
            type=${ifDefined(this.type)}
            @input=${this.onInput}
            @blur=${this.onBlur}
            @focus=${this.onFocus}
            @change=${this.onChange}
            @invalid=${this.onInvalid}
            ?autocomplete=${this.autocomplete}
            ?autofocus=${this.autofocus}
            ?readonly=${this.readonly}
            ?required=${this.required}
            ?disabled=${this.disabled}
          />
          <slot part="end" name="end"></slot>
        </div>
        ${this.error
          ? this.errorText
            ? html`<div part="error-text">${this.errorText}</div>`
            : null
          : this.helpText
          ? html`<div part="help-text">${this.helpText}</div>`
          : null}
      </div>
    `;
  }
}

customElements.define("j-input", Input);

export default Input;

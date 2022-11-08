import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createPopper } from "@popperjs/core";
import sharedStyles from "../../shared/styles";

const keyCodes = {
  32: "space",
  27: "escape",
  13: "enter",
  8: "backspace",
  38: "up",
  40: "down",
};

const styles = css`
  :host {
  }
  [part="base"] {
    position: relative;
  }
  [part="input"]::part(input-field) {
    cursor: pointer;
  }
  [part="menu"] {
    background: var(--j-color-white);
    position: absolute;
    left: 0;
    top: 120%;
    max-height: 200px;
    overflow-y: auto;
    width: 100%;
    border: 1px solid var(--j-color-ui-100);
    border-radius: var(--j-border-radius);
    visibility: hidden;
  }
  :host([open]) [part="menu"] {
    height: fit-content;
    visibility: visible;
    z-index: 999;
  }
`;

@customElement("j-select")
export default class Select extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Value
   * @type {String}
   * @attr
   */
  @property({
    type: String,
    reflect: true,
  })
  value = null;

  /**
   * Label
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true })
  label = null;

  /**
   * Open
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Input value
   * @type {Boolean}
   * @attr
   */
  @property({ type: String, reflect: true })
  inputValue = null;

  constructor() {
    super();

    this._handleClickOutside = this._handleClickOutside.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleInputClick = this._handleInputClick.bind(this);
    this._handleOptionClick = this._handleOptionClick.bind(this);
    this._handleSlotChange = this._handleSlotChange.bind(this);
    this._handleNavMouseOver = this._handleNavMouseOver.bind(this);
  }

  get optionElements() {
    return [...this.querySelectorAll("*")].filter((child: any) => child.value);
  }

  get selectedElement() {
    return this.optionElements.find((el: any) => el.value === this.value);
  }

  get activeElement() {
    return this.optionElements.find((el) => el.hasAttribute("active")) as any;
  }

  firstUpdated() {
    const selectedElement = this.selectedElement as any;
    this.inputValue = selectedElement?.label || selectedElement?.value || "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("keydown", this._handleKeyDown);
    window.addEventListener("click", this._handleClickOutside);
  }

  disconnectedCallback() {
    window.removeEventListener("click", this._handleClickOutside);
    super.disconnectedCallback();
  }

  _handleOptionClick(e) {
    this.open = false;
    this.value = e.target.value;
    this.inputValue = e.target.label;
  }

  _handleClickOutside(e) {
    const clickedInput = this.contains(e.target as Node);
    const clickedMenu = this.contains(e.target as Node);
    if (!clickedInput && !clickedMenu) {
      this.open = false;
    }
  }

  _handleNavMouseOver(e) {
    this.optionElements.forEach((el) => el.removeAttribute("active"));
  }

  _handleKeyDown(e) {
    e.preventDefault();
    const { keyCode } = e;

    const keyName = keyCodes[keyCode];

    if (keyName === "escape") {
      this.open = false;
      return;
    }

    if ((keyName === "up" || "down" || "enter" || "space") && !this.open) {
      this.open = true;
      this.optionElements.forEach((el, index) => {
        if (index === 0) el.setAttribute("active", "");
        else el.removeAttribute("active");
      });
      return;
    }

    if (keyName === "enter" && this.open && this.activeElement) {
      this.open = false;
      this.value = this.activeElement.value;
      this.inputValue = this.activeElement.label;
    }

    if (keyName === "down" && this.open) {
      const activeIndex = this.optionElements.findIndex((el) =>
        el.hasAttribute("active")
      );
      this.activeElement?.removeAttribute("active");

      const firstOption = this.optionElements[0];

      this.optionElements.forEach((el, index) => {
        if (activeIndex === -1) {
          firstOption.setAttribute("active", "");
        } else if (activeIndex >= this.optionElements.length - 1) {
          firstOption.setAttribute("active", "");
        } else if (index === activeIndex + 1) {
          el.setAttribute("active", "");
        }
      });
    }

    if (keyName === "up" && this.open) {
      const activeIndex = this.optionElements.findIndex((el) =>
        el.hasAttribute("active")
      );

      this.activeElement?.removeAttribute("active");

      const lastOption = this.optionElements[this.optionElements.length - 1];

      this.optionElements.forEach((el, index) => {
        if (activeIndex === 0 || activeIndex === -1) {
          lastOption.setAttribute("active", "");
        } else if (index === activeIndex - 1) {
          el.setAttribute("active", "");
        }
      });
    }
  }

  _handleInputClick(e) {
    e.preventDefault();
    setTimeout(() => {
      this.open = true;
    }, 0);
  }

  _handleSlotChange(e) {
    const slottedElements = e.target.assignedNodes();
    [...slottedElements].forEach((el) => {
      el.removeEventListener("mousedown", this._handleOptionClick);
      el.addEventListener("mousedown", this._handleOptionClick);
    });
  }

  shouldUpdate(changedProperties) {
    if (changedProperties.has("value")) {
      this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
      this.optionElements.forEach((option: any) => {
        if (option.value === this.value) {
          option.setAttribute("selected", "");
        } else {
          option.removeAttribute("selected");
        }
      });
    }

    return true;
  }

  render() {
    return html` <div part="base">
      <j-input
        label=${this.label}
        readonly
        @click=${this._handleInputClick}
        .value=${this.inputValue}
        part="input"
      >
        <j-icon size="sm" slot="end" part="arrow" name="chevron-down"></j-icon>
      </j-input>

      <nav part="menu" @mouseover=${this._handleNavMouseOver}>
        <slot @slotchange=${this._handleSlotChange}></slot>
      </nav>
    </div>`;
  }
}

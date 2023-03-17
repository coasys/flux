import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-tabs-padding: 0 4px 2px 4px;
    --j-tabs-border-radius: none;
    --j-tab-item-border-selected: 0px 4px 0px -2px var(--j-color-primary-500);
    --j-tab-item-border-hover: 0px 4px 0px -2px var(--j-color-ui-200);
    --j-tab-item-box-shadow: none;
    --j-tab-item-color: var(--j-color-ui-600);
  }
  [part="base"] {
    overflow-x: auto;
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    border-radius: var(--j-tabs-border-radius);
    padding: var(--j-tabs-padding);
  }
  :host([vertical]) [part="base"] {
    flex-direction: column;
    --j-tab-item-text-align: left;
    --j-tab-item-width: 100%;
  }
  :host([vertical]) ::slotted(*[checked]) {
    --j-tab-item-color: var(--j-color-primary-500);
    --j-tab-item-box-shadow: 2px 0px 0px 0px var(--j-color-primary-500);
  }
  :host([full]) [part="base"] {
    width: 100%;
    display: flex;
  }
  :host([full]) {
    --j-tab-item-width: 100%;
  }
  :host([size="sm"]) ::slotted(*) {
    --j-tab-item-height: var(--j-size-sm);
    --j-tab-item-font-size: var(--j-font-size-400);
  }
  :host([size="lg"]) ::slotted(*) {
    --j-tab-item-height: var(--j-size-lg);
    --j-tab-item-font-size: var(--j-font-size-600);
  }
  :host ::slotted(*:hover) {
    --j-tab-item-color: var(--j-color-ui-700);
  }
  :host ::slotted(*[checked]) {
    --j-tab-item-color: var(--j-color-primary-500);
    --j-tab-item-box-shadow: 0px 2px 0px 0px var(--j-color-primary-500);
  }
  :host([variant="button"]) ::slotted(*) {
    --j-tab-item-border-radius: var(--j-border-radius);
    --j-tab-item-box-shadow: none;
    --j-tab-item-color: var(--j-color-ui-600);
  }
  :host([variant="button"]) ::slotted(*:hover) {
    --j-tab-item-background: var(--j-color-ui-50);
    --j-tab-item-box-shadow: none;
    --j-tab-item-color: var(--j-color-ui-700);
  }
  :host([variant="button"]) ::slotted(*[checked]) {
    --j-tab-item-background: var(--j-color-primary-100);
    --j-tab-item-box-shadow: none;
    --j-tab-item-color: var(--j-color-primary-700);
  }
`;

@customElement("j-tabs")
export default class Menu extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Value
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true })
  value = null;

  /**
   * Variant
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true })
  variant = null;

  /**
   * Size
   * @type {"sm"|"lg"}
   * @attr
   */
  @property({ type: String, reflect: true })
  size = null;

  /**
   * Vertical
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  vertical = false;

  /**
   * Full
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  full = false;

  get optionElements() {
    return [...this.children];
  }

  get selectedElement() {
    return this.optionElements.find(
      (opt: any) => opt.value === this.value
    ) as any;
  }

  firstUpdated() {}

  shouldUpdate(changedProperties) {
    if (changedProperties.has("value")) {
      this.selectTab(this.value);
      this.dispatchEvent(new CustomEvent("change", { bubbles: true }));
    }
    return true;
  }

  selectTab(value) {
    this.optionElements.forEach((el: any) => {
      const isChecked = el.value === value;
      el.checked = isChecked;
      this.value = value;
    });
  }

  connectedCallback() {
    super.connectedCallback();

    if (this.value) {
      setTimeout(() => {
        this.selectTab(this.value);
      }, 100);
    }

    this.addEventListener("tab-selected", (e: any) => {
      e.stopPropagation();
      this.selectTab(e.target.value);
    });
  }

  render() {
    return html` <div part="base" role="tablist"><slot></slot></div>`;
  }
}

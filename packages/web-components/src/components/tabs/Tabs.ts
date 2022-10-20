import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-tabs-padding: 4px;
    --j-tab-item-border-selected: 0px 4px 0px -2px var(--j-color-primary-500);
    --j-tab-item-border-hover: 0px 4px 0px -2px var(--j-color-ui-200);
  }
  :host([vertical]) [part="base"] {
    flex-direction: column;
    --j-tab-item-text-align: left;
    --j-tab-item-border-selected: 2px 0px 0px 0px var(--j-color-primary-500);
    --j-tab-item-border-hover: 2px 0px 0px 0px var(--j-color-ui-200);
  }
  :host([vertical]) ::slotted(*) {
    width: 100%;
  }
  :host([full]) [part="base"] {
    display: flex;
  }
  [part="base"] {
    overflow-x: auto;
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--j-space-200);
    border-radius: var(--j-border-radius);
    padding: 0 var(--j-tabs-padding);
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

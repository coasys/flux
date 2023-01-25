import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-badge-border-radius: var(--j-border-radius);
    --j-badge-bg: var(--j-color-ui-50);
    --j-badge-color: var(--j-color-ui-500);
    --j-badge-font-size: var(--j-font-size-400);
    --j-badge-padding: var(--j-space-200) var(--j-space-300);
  }
  :host([size="sm"]) {
    --j-badge-font-size: var(--j-font-size-300);
    --j-badge-padding: var(--j-space-100) var(--j-space-200);
  }
  :host([size="lg"]) {
    --j-badge-font-size: var(--j-font-size-500);
    --j-badge-padding: var(--j-space-300) var(--j-space-500);
  }
  :host([variant="primary"]) {
    --j-badge-bg: var(--j-color-primary-50);
    --j-badge-color: var(--j-color-primary-600);
  }
  :host([variant="success"]) {
    --j-badge-bg: var(--j-color-success-100);
    --j-badge-color: var(--j-color-success-600);
  }
  :host([variant="warning"]) {
    --j-badge-bg: var(--j-color-warning-100);
    --j-badge-color: var(--j-color-warning-600);
  }
  :host([variant="danger"]) {
    --j-badge-bg: var(--j-color-danger-100);
    --j-badge-color: var(--j-color-danger-600);
  }
  [part="base"] {
    font-size: var(--j-badge-font-size);
    border-radius: var(--j-badge-border-radius);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--j-badge-padding);
    background: var(--j-badge-bg);
    color: var(--j-badge-color);
  }
`;

@customElement("j-badge")
export default class Badge extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Variations
   * @type {""|"primary"|"success"|"danger"|"warning"}
   * @attr
   */
  @property({ type: String, reflect: true }) variant = null;

  /**
   * Sizes
   * @type {""|"sm"|"lg"}
   * @attr
   */
  @property({ type: String, reflect: true }) size = null;

  render() {
    return html`<span part="base">
      <slot></slot>
    </span>`;
  }
}

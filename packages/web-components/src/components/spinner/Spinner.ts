import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    display: contents;
    --j-spinner-size: var(--j-size-md);
    --j-spinner-stroke: 2px;
    --j-spinner-color: var(--j-color-primary-500);
  }

  :host([size="xxs"]) {
    --j-spinner-size: var(--j-size-xxs);
    --j-spinner-stroke: 1px;
    --j-spinner-color: var(--j-color-primary-500);
  }

  :host([size="xs"]) {
    --j-spinner-size: var(--j-size-xs);
    --j-spinner-stroke: 2px;
    --j-spinner-color: var(--j-color-primary-500);
  }

  :host([size="sm"]) {
    --j-spinner-size: var(--j-size-sm);
    --j-spinner-stroke: 2px;
    --j-spinner-color: var(--j-color-primary-500);
  }

  :host([size="lg"]) {
    --j-spinner-size: var(--j-size-lg);
    --j-spinner-stroke: 4px;
    --j-spinner-color: var(--j-color-primary-500);
  }

  .lds-ring {
    display: inline-block;
    position: relative;
    width: var(--j-spinner-size);
    height: var(--j-spinner-size);
  }
  .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: var(--j-spinner-size);
    height: var(--j-spinner-size);
    margin: var(--j-spinner-stroke);
    border: var(--j-spinner-stroke) solid var(--j-spinner-color);
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: var(--j-spinner-color) transparent transparent transparent;
  }
  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }
  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

@customElement("j-spinner")
export default class Component extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Size
   * @type {""|"sm"|"lg"}
   * @attr
   */
  @property({ type: String, reflect: true }) size = null;

  render() {
    return html`<div class="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>`;
  }
}

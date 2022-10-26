import { html, css, LitElement } from "lit";
import { property, customElement } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-skeleton-height: var(--j-size-md);
    --j-skeleton-width: 100%;
    --j-skeleton-border-radius: var(--j-border-radius, 0px);
  }
  [part="base"] {
    width: var(--j-skeleton-width);
    height: var(--j-skeleton-height);
    border-radius: var(--j-skeleton-border-radius);
    background: linear-gradient(
      90deg,
      var(--j-color-ui-100) 0%,
      var(--j-color-ui-200) 50%,
      var(--j-color-ui-100) 100%
    );
    animation: placeHolderShimmer 10s linear infinite;
  }

  :host([height="xs"]) {
    --j-skeleton-height: var(--j-size-xs);
  }

  :host([height="sm"]) {
    --j-skeleton-height: var(--j-size-sm);
  }

  :host([height="md"]) {
    --j-skeleton-height: var(--j-size-md);
  }

  :host([height="lg"]) {
    --j-skeleton-height: var(--j-size-lg);
  }

  :host([height="xl"]) {
    --j-skeleton-height: var(--j-size-xl);
  }

  :host([height="full"]) {
    --j-skeleton-height: 100%;
  }

  :host([width="xs"]) {
    --j-skeleton-width: var(--j-size-xs);
  }

  :host([width="sm"]) {
    --j-skeleton-width: var(--j-size-sm);
  }

  :host([width="md"]) {
    --j-skeleton-width: var(--j-size-md);
  }

  :host([width="lg"]) {
    --j-skeleton-width: var(--j-size-lg);
  }

  :host([width="xl"]) {
    --j-skeleton-width: var(--j-size-xl);
  }

  :host([width="full"]) {
    --j-skeleton-width: 100%;
  }

  :host([variant="circle"]) {
    --j-skeleton-border-radius: 50%;
  }

  :host([variant="circle"]) [part="base"] {
    aspect-ratio: 1/1;
  }

  @keyframes placeHolderShimmer {
    0% {
      background-position: -500px 0;
    }
    100% {
      background-position: 500px 0;
    }
  }
`;

@customElement("j-skeleton")
export default class Skeleton extends LitElement {
  static styles = [styles, sharedStyles];

  /**
   * Variant
   * @type {""|"circle"}
   * @attr
   */
  @property({ type: String, reflect: true }) variant = null;

  /**
   * Height
   * @type {""|"xs"|"sm"|"md"|"lg"|"xl"}
   * @attr
   */
  @property({ type: String, reflect: true }) height = null;

  /**
   * Width
   * @type {""|"xs"|"sm"|"md"|"lg"|"xl"}
   * @attr
   */
  @property({ type: String, reflect: true }) width = null;

  render() {
    return html`<div part="base"></div>`;
  }
}

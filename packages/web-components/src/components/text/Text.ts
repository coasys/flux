import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-text-transform: normal;
    --j-text-color: var(--j-color-ui-800);
    --j-text-weight: initial;
    --j-text-font-size: var(--j-font-size-500);
    --j-text-margin-bottom: 0;
    --j-text-display: block;
    --j-text-family: inherit;
    --j-text-letter-spacing: normal;
    --j-text-heading-letter-spacing: 2px;
    --j-text-heading-family: inherit;
  }

  :host > *:first-child {
    margin: 0;
    letter-spacing: var(--j-text-letter-spacing);
    font-family: var(--j-text-family);
    text-transform: var(--j-text-transform);
    display: var(--j-text-display);
    color: var(--j-text-color);
    font-weight: var(--j-text-weight);
    font-size: var(--j-text-font-size);
    margin-bottom: var(--j-text-margin-bottom);
  }

  :host([inline]) {
    --j-text-display: inline-block;
  }

  :host([uppercase]) {
    --j-text-transform: uppercase;
  }

  :host([variant="heading"]) {
    --j-text-color: var(--j-color-black);
    --j-text-font-size: var(--j-font-size-800);
    --j-text-weight: 600;
    --j-text-margin-bottom: var(--j-space-400);
    --j-text-family: var(--j-text-heading-family);
    --j-text-letter-spacing: var(--j-text-heading-letter-spacing);
  }

  :host([variant="heading-sm"]) {
    --j-text-color: var(--j-color-black);
    --j-text-font-size: var(--j-font-size-700);
    --j-text-weight: 600;
    --j-text-margin-bottom: var(--j-space-300);
    --j-text-family: var(--j-text-heading-family);
    --j-text-letter-spacing: var(--j-text-heading-letter-spacing);
  }

  :host([variant="heading-lg"]) {
    --j-text-color: var(--j-color-black);
    --j-text-font-size: var(--j-font-size-900);
    --j-text-weight: 600;
    --j-text-margin-bottom: var(--j-space-600);
    --j-text-family: var(--j-text-heading-family);
    --j-text-letter-spacing: var(--j-text-heading-letter-spacing);
  }

  :host([variant="subheading"]) {
    --j-text-color: var(--j-color-black);
    --j-text-font-size: var(--j-font-size-700);
    --j-text-weight: 400;
    --j-text-margin-bottom: var(--j-space-600);
    --j-text-family: var(--j-text-heading-family);
    --j-text-letter-spacing: var(--j-text-heading-letter-spacing);
  }

  :host([variant="ingress"]) {
    --j-text-color: var(--j-color-ui-700);
    --j-text-font-size: var(--j-font-size-600);
    --j-text-weight: 400;
    --j-text-margin-bottom: var(--j-space-500);
  }

  :host([variant="body"]) {
    --j-text-color: var(--j-color-ui-600);
    --j-text-font-size: var(--j-font-size-500);
    --j-text-weight: 400;
    --j-text-margin-bottom: var(--j-space-400);
  }

  :host([variant="footnote"]) {
    --j-text-color: var(--j-color-ui-600);
    --j-text-font-size: var(--j-font-size-400);
    --j-text-weight: 400;
    --j-text-margin-bottom: var(--j-space-300);
  }

  :host([variant="label"]) {
    --j-text-display: block;
    --j-text-color: var(--j-color-ui-500);
    --j-text-font-size: var(--j-font-size-500);
    --j-text-weight: 500;
    --j-text-margin-bottom: var(--j-space-300);
  }

  :host([nomargin]) {
    --j-text-margin-bottom: 0;
  }
`;

@customElement("j-text")
export default class Text extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Sizes
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900"|"1000"}
   * @attr
   */
  @property({ type: String, reflect: true }) size = null;

  /**
   * Variants
   * @type {""|"heading-lg"|"heading"|"heading-sm"|"subheading"|""ingress"|"body"|"label"|"footnote"}
   * @attr
   */
  @property({ type: String, reflect: true }) variant = "body";

  /**
   * Tag to render
   * @type {""|"h1"|"h2"|"h3"|"h4"|"h5"|"h6"|"p"|"small"|"b"|"span"|"div"}
   * @attr
   */
  @property({ type: String, reflect: true }) tag = null;

  /**
   * No margin
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) nomargin = false;

  /**
   * Inline block
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) inline = false;

  /**
   * Uppercase
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) uppercase = false;

  /**
   * Color
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) color = null;

  /**
   * Weight
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) weight = null;

  shouldUpdate(changedProperties) {
    if (changedProperties.has("size")) {
      if (this.size) {
        this.style.setProperty(
          "--j-text-font-size",
          `var(--j-font-size-${this.size})`
        );
      } else {
        this.style.removeProperty("--j-text-font-size");
      }
    }
    if (changedProperties.has("weight")) {
      if (this.weight) {
        this.style.setProperty("--j-text-weight", this.weight);
      } else {
        this.style.removeProperty("--j-text-weight");
      }
    }
    if (changedProperties.has("color")) {
      if (this.color) {
        this.style.setProperty(
          "--j-text-color",
          `var(--j-color-${this.color})`
        );
      } else {
        this.style.removeProperty("--j-text-color");
      }
    }

    return true;
  }

  render() {
    switch (this.tag) {
      case "h1":
        return html`<h1 part="base"><slot></slot></h1>`;
      case "h2":
        return html`<h2 part="base"><slot></slot></h2>`;
      case "h3":
        return html`<h3 part="base"><slot></slot></h3>`;
      case "h4":
        return html`<h4 part="base"><slot></slot></h4>`;
      case "h5":
        return html`<h5 part="base"><slot></slot></h5>`;
      case "h6":
        return html`<h6 part="base"><slot></slot></h6>`;
      case "p":
        return html`<p part="base"><slot></slot></p>`;
      case "small":
        return html`<small part="base"><slot></slot></small>`;
      case "b":
        return html`<b part="base"><slot></slot></b>`;
      case "i":
        return html`<i part="base"><slot></slot></i>`;
      case "span":
        return html`<span part="base"><slot></slot></span>`;
      case "label":
        return html`<label part="base"><slot></slot></label>`;
      case "div":
        return html`<div part="base"><slot></slot></div>`;
      default:
        return html`<div part="base"><slot></slot></div>`;
    }
  }
}

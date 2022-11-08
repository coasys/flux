import { html, css, LitElement, adoptStyles } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";
import { generateStylesheet, generateVariable } from "../../utils/stylesheets";

// TODO: Do we need this type  of generic component?

const styles = css`
  :host {
    --j-flex-gap: none;
    --j-flex-align-items: top;
    --j-flex-justify-content: start;
    --j-flex-display: flex;
    --j-flex-wrap: nowrap;
    --j-flex-direction: row;
  }
  :host([inline]) {
    --j-flex-display: inline-flex;
  }
  :host([wrap]) {
    --j-flex-wrap: wrap;
  }
  :host([a="center"]) {
    --j-flex-align-items: center;
  }
  :host([a="start"]) {
    --j-flex-align-items: start;
  }
  :host([a="end"]) {
    --j-flex-align-items: end;
  }
  :host([j="between"]) {
    --j-flex-justify-content: space-between;
  }
  :host([j="around"]) {
    --j-flex-justify-content: space-around;
  }
  :host([j="center"]) {
    --j-flex-justify-content: center;
  }
  :host([direction="row"]) {
    --j-flex-direction: row;
  }
  :host([direction="row-reverse"]) {
    --j-flex-direction: row-reverse;
  }
  :host([direction="column"]) {
    --j-flex-direction: column;
  }
  :host([direction="column-reverse"]) {
    --j-flex-direction: column-reverse;
  }
  [part="base"] {
    display: var(--j-flex-display);
    gap: var(--j-flex-gap);
    flex-direction: var(--j-flex-direction);
    align-items: var(--j-flex-align-items);
    justify-content: var(--j-flex-justify-content);
    flex-wrap: var(--j-flex-wrap);
  }
`;

@customElement("j-flex")
export default class Box extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Justify content
   * @type {""|"center"|"start"|"end"}
   * @attr
   */
  @property({ type: String, reflect: true })
  j = null;

  /**
   * Align items
   * @type {""|"center"|"start"|"end"}
   * @attr
   */
  @property({ type: String, reflect: true })
  a = null;

  /**
   * Wrap
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  wrap = false;

  /**
   * Gap
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  gap = null;

  /**
   * Direction
   * @type {""|"row"|"row-reverse"|"column"|"column-reverse"}
   * @attr
   */
  @property({ type: String, reflect: true })
  direction = null;

  shouldUpdate() {
    const styleSheets = [styles, sharedStyles];

    if (this.gap) {
      const variable = generateVariable("j-space", this.gap);
      styleSheets.push(generateStylesheet("--j-flex-gap", variable));
    }

    // @ts-ignore
    adoptStyles(this.shadowRoot, styleSheets);

    return true;
  }

  render() {
    return html`
      <div part="base">
        <slot></slot>
      </div>
    `;
  }
}

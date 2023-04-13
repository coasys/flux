import { html, css, LitElement, adoptStyles } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";
import { generateStylesheet, generateVariable } from "../../utils/stylesheets";

const styles = css`
  :host {
    --j-icon-color: currentColor;
    --j-icon-size: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  :host i {
    color: var(--j-icon-color);
    fill: var(--j-icon-color);
    display: block;
    font-size: var(--j-icon-size);
  }
  :host([size="xs"]) i {
    --j-icon-size: 16px;
  }
  :host([size="sm"]) i {
    --j-icon-size: 18px;
  }
  :host([size="lg"]) i {
    --j-icon-size: 32px;
  }
  :host([size="xl"]) i {
    --j-icon-size: 48px;
  }
`;

@customElement("j-icon")
export default class Icon extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Open
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true })
  name = null;

  /**
   * Size
   * @type {""|"sm"|"lg"}
   * @attr
   */
  @property({ type: String, reflect: true })
  size = null;

  /**
   * Color
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true })
  color = null;

  @state()
  svg = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">`;
  }

  shouldUpdate() {
    const styleSheets = [styles, sharedStyles];

    if (this.color) {
      const variable = generateVariable("j-color", this.color, "currentColor");
      styleSheets.push(generateStylesheet("--j-icon-color", variable));
    }

    // @ts-ignore
    adoptStyles(this.shadowRoot, styleSheets);

    return true;
  }

  render() {
    return html`<i
      class="bi-${this.name}"
      role="img"
      aria-label="${this.name}"
    ></i>`;
  }
}

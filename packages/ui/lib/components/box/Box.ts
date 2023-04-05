import { html, css, LitElement, adoptStyles } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";
import { generateVariable } from "../../utils/stylesheets";

// TODO: Do we need this type  of generic component?

const styles = css`
  :host {
    --j-box-bg-color: none;
    --j-box-bg-color-hover: none;
    --j-box-border-color: none;
    --j-box-border-color-hover: none;
    --j-box-border-radius: none;
    --j-box-display: block;
    --j-box-padding: 0px;
    --j-box-margin: 0px;
  }
  :host([inline]) {
    --j-box-display: inline-block;
  }
  [part="base"] {
    border-radius: var(--j-box-border-radius);
    background-color: var(--j-box-bg-color);
    padding: var(--j-box-padding);
    margin: var(--j-box-margin);
  }
`;

@customElement("j-box")
export default class Box extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Padding
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  p = null;

  /**
   * Padding left
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  pl = null;

  /**
   * Padding right
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  pr = null;

  /**
   * Padding top
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  pt = null;

  /**
   * Padding bottom
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  pb = null;

  /**
   * Padding horistonal
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  px = null;

  /**
   * Padding vertical
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  py = null;

  /**
   * Margin
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  m = null;

  /**
   * Margin left
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  ml = null;

  /**
   * Margin right
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  mr = null;

  /**
   * Margin top
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  mt = null;

  /**
   * Margin bottom
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  mb = null;

  /**
   * Margin horistonal
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  mx = null;

  /**
   * Margin vertical
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  my = null;

  /**
   * Background color
   * @type {""|"ui-100"|"ui-200"|"ui-300"|"ui-400"|"ui-500"|"ui-600"|"ui-700"|"ui-800"|"ui-900}
   * @attr
   */
  @property({ type: String, reflect: true })
  bg = null;

  /**
   * Border radius
   * @type {""|"sm"|"md"|"lg"}
   * @attr
   */
  @property({ type: String, reflect: true })
  radius = null;

  shouldUpdate() {
    const sheet = new CSSStyleSheet() as any;
    sheet.replaceSync(`
      :host {
        --j-box-bg-color: var(--j-color-${this.bg});
        --j-box-border-radius: var(--j-border-radius-${this.radius});
        --j-box-padding: 
          ${generateVariable("j-space", this.pt || this.py || this.p)}
          ${generateVariable("j-space", this.pr || this.px || this.p)}
          ${generateVariable("j-space", this.pb || this.py || this.p)}
          ${generateVariable("j-space", this.pl || this.px || this.p)};
        --j-box-margin: 
          ${generateVariable("j-space", this.mt || this.my || this.m)}
          ${generateVariable("j-space", this.mr || this.mx || this.m)}
          ${generateVariable("j-space", this.mb || this.my || this.m)}
          ${generateVariable("j-space", this.ml || this.mx || this.m)}  
      }
    `);

    adoptStyles(this.shadowRoot, [styles, sharedStyles, sheet]);

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

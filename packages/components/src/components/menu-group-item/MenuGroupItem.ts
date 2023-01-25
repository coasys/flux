import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    --j-menu-group-item-cursor: default;
    --j-menu-group-item-title-padding-left: var(--j-space-500);
  }
  :host([collapsible]) {
    --j-menu-group-item-cursor: pointer;
    --j-menu-group-item-title-padding-left: var(--j-space-800);
  }
  [part="summary"] {
    position: relative;
    cursor: var(--j-menu-group-item-cursor);
    list-style: none;
    display: flex;
    align-items: center;
    padding-left: var(--j-menu-group-item-title-padding-left);
    margin-bottom: var(--j-space-200);
    -webkit-appearance: none;
  }
  [part="summary"]::marker,
  [part="summary"]::-webkit-details-marker {
    display: none;
  }

  [part="summary"]:hover {
    color: var(--j-color-ui-700);
  }
  :host([collapsible]) [part="summary"]:after {
    top: 50%;
    left: var(--j-space-500);
    position: absolute;
    display: block;
    content: "";
    border-right: 1px solid var(--j-color-ui-500);
    border-bottom: 1px solid var(--j-color-ui-500);
    width: 4px;
    height: 4px;
    transition: all 0.2s ease;
    transform: rotate(-45deg) translateX(-50%);
    transform-origin: center;
  }
  :host([open][collapsible]) [part="summary"]:after {
    transform: rotate(45deg) translateX(-50%);
  }
  [name="start"]::slotted(*) {
    margin-left: var(--j-space-400);
  }
  [name="end"]::slotted(*) {
    margin-right: var(--j-space-400);
  }
  [part="title"] {
    text-transform: uppercase;
    font-size: var(--j-font-size-400);
    color: var(--j-color-ui-400);
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  [part="content"] {
  }
`;

@customElement("j-menu-group-item")
export default class MenuItem extends LitElement {
  static styles = [styles, sharedStyles];

  /**
   * Open
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  collapsible = false;

  /**
   * Open
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Title
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true })
  title = null;

  collapsibleContent() {
    return html`<details
      .open=${this.open}
      @toggle=${(e) => (this.open = e.target.open)}
      part="base"
      role="menuitem"
    >
      <summary part="summary">
        <slot part="start" name="start"></slot>
        <div part="title">${this.title}</div>
        <slot part="end" name="end"></slot>
      </summary>
      <div part="content">
        <slot></slot>
      </div>
    </details>`;
  }

  normal() {
    return html`<div part="base" role="menuitem">
      <div part="summary">
        <slot part="start" name="start"></slot>
        <div part="title">${this.title}</div>
        <slot part="end" name="end"></slot>
      </div>
      <div part="content">
        <slot></slot>
      </div>
    </div>`;
  }

  render() {
    return this.collapsible ? this.collapsibleContent() : this.normal();
  }
}

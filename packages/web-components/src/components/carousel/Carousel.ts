import { html, css, LitElement, adoptStyles } from "lit";
import { property, customElement, state } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";
import { scrollTo, scrollHandler } from "../../utils/scroll";
import { generateStylesheet, generateVariable } from "../../utils/stylesheets";

const styles = css`
  :host {
    --j-carousel-gap: none;
  }
  [part="base"] {
    width: 100%;
    overflow: hidden;
  }

  [part="carousel"] {
    display: flex;
    gap: var(--j-carousel-gap);
    overflow-x: scroll;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    align-items: center;
  }

  [part="carousel"]::-webkit-scrollbar {
    display: none;
  }

  ::slotted(*) {
    min-width: 100%;
    width: 100%;
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  [part="navigation"] {
    display: flex;
    padding-top: var(--j-space-200);
    gap: var(--j-space-500);
    align-items: center;
    justify-content: center;
  }

  [part="navigation-button"] {
    border: 1px solid transparent;
    cursor: pointer;
    background: var(--j-color-ui-100);
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
  }

  [part="navigation-button"][active] {
    background: var(--j-color-primary-500);
  }
`;

@customElement("j-carousel")
export default class Component extends LitElement {
  static styles = [styles, sharedStyles];

  _timer = null;

  /**
   * Value
   * @type {string}
   * @attr
   */
  _value = 0;
  _isScrolling = false;

  /**
   * Gap
   * @type {""|"100"|"200"|"300"|"400"|"500"|"600"|"700"|"800"|"900}
   * @attr
   */
  @property({ type: String, reflect: true })
  gap = null;

  constructor() {
    super();
    this.goToSlide = this.goToSlide.bind(this);
  }

  get nearestIndex() {
    return Math.round(this.carouselEl.scrollLeft / this.carouselEl.clientWidth);
  }

  goToSlide(index) {
    this.value = index;
  }

  firstUpdated() {
    scrollHandler(this.carouselEl, {
      onScroll: () => {
        this._isScrolling = true;
        this.value = this.nearestIndex;
      },
      onScrollStop: () => {
        this.value = this.nearestIndex;
        this._isScrolling = false;
      },
    });
  }

  shouldUpdate() {
    const styleSheets = [styles, sharedStyles];

    if (this.gap) {
      const variable = generateVariable("j-space", this.gap);
      styleSheets.push(generateStylesheet("--j-carousel-gap", variable));
    }

    // @ts-ignore
    adoptStyles(this.shadowRoot, styleSheets);
    return true;
  }

  set value(index: number) {
    if (index === this._value) return;
    if (this._isScrolling) {
      this._value = index;
      this.dispatchEvent(new CustomEvent("change"));
      this.requestUpdate();
    } else {
      scrollTo(this.carouselEl, index, () => {
        this._value = index;
        this.dispatchEvent(new CustomEvent("change"));
        this.requestUpdate();
      });
    }
  }

  get value() {
    return this._value;
  }

  get slides(): Array<Node> {
    return [...this.children];
  }

  get carouselEl(): HTMLElement {
    return this.renderRoot.querySelector("[part='carousel']");
  }

  render() {
    return html`<div part="base">
      <div part="carousel">
        <slot></slot>
      </div>
      <div part="navigation">
        ${this.slides.map(
          (s, i) =>
            html`<button
              ?active=${this.value === i}
              data-index=${i}
              @click=${() => this.goToSlide(i)}
              part="navigation-button"
            ></button>`
        )}
      </div>
    </div>`;
  }
}

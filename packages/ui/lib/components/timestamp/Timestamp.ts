import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../../shared/styles";

@customElement("j-timestamp")
export default class Component extends LitElement {
  static styles = [sharedStyles];

  /**
   * Value
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) value = "01/01/1970";

  /**
   * Locales
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) locales = "en";

  /**
   * Relative
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true }) relative = false;

  /**
   * Date style
   * @type {""|"full"|"long"|"medium"|"short"}
   * @attr
   */
  @property({ type: String, reflect: true }) dateStyle = null;

  /**
   * Timestyle
   * @type {""|"full"|"long"|"medium"|"short"}
   * @attr
   */
  @property({ type: String, reflect: true }) timeStyle = null;

  /**
   * Day period
   * @type {""|"narrow"|"short"|"long"}
   * @attr
   */
  @property({ type: String, reflect: true }) dayPeriod = null;

  /**
   * Hour cycle
   * @type {""|"h11"|"h12"|"h23"|"h24"}
   * @attr
   */
  @property({ type: String, reflect: true }) hourCycle = null;

  /**
   * Timezone
   * @type {String}
   * @attr
   */
  @property({ type: String, reflect: true }) timeZone = null;

  /**
   * Weekday
   * @type {""|"long"|"short"|"narrow"}
   * @attr
   */
  @property({ type: String, reflect: true }) weekday = null;

  /**
   * Era
   * @type {""|"long"|"short"|"narrow"}
   * @attr
   */
  @property({ type: String, reflect: true }) era = null;

  /**
   * Year
   * @type {""|"numeric"|"2-digit"}
   * @attr
   */
  @property({ type: String, reflect: true }) year = null;

  /**
   * Month
   * @type {""|"numeric"|"2-digit"|"long"|"short"|"narrow"}
   * @attr
   */
  @property({ type: String, reflect: true }) month = null;

  /**
   * Day
   * @type {""|"numeric"|"2-digit"}
   * @attr
   */
  @property({ type: String, reflect: true }) day = null;

  /**
   * Hour
   * @type {""|"numeric"|"2-digit"}
   * @attr
   */
  @property({ type: String, reflect: true }) hour = null;

  /**
   * Minute
   * @type {""|"numeric"|"2-digit"}
   * @attr
   */
  @property({ type: String, reflect: true }) minute = null;

  /**
   * Second
   * @type {""|"numeric"|"2-digit"}
   * @attr
   */
  @property({ type: String, reflect: true }) second = null;

  get options(): DateTimeFormatOptions {
    if (this.dateStyle) {
      return {
        dateStyle: this.dateStyle,
        ...(this.timeStyle && { timeStyle: this.timeStyle }),
        ...(this.timeZone && { timeZone: this.timeZone }),
      };
    }

    return {
      ...(this.dayPeriod && { dayPeriod: this.dayPeriod }),
      ...(this.timeStyle && { timeStyle: this.timeStyle }),
      ...(this.timeZone && { timeZone: this.timeZone }),
      ...(this.weekday && { weekday: this.weekday }),
      ...(this.era && { era: this.era }),
      ...(this.year && { year: this.year }),
      ...(this.month && { month: this.month }),
      ...(this.day && { day: this.day }),
      ...(this.second && { second: this.second }),
      ...(this.hour && { hour: this.hour }),
      ...(this.minute && { minute: this.minute }),
      ...(this.hourCycle && { hourCycle: this.hourCycle }),
    };
  }

  firstUpdated() {
    if (this.relative) {
      this.runLoop();
    }
  }

  runLoop() {
    setTimeout(() => {
      this.requestUpdate();
      this.runLoop();
    }, 60 * 1000);
  }

  get formattedTime() {
    if (this.relative) {
      const rtf = new Intl.RelativeTimeFormat(this.locales, {
        numeric: "auto",
        style: "long",
      });
      return getRelativeTime(new Date(this.value), new Date(), rtf);
    } else {
      return new Intl.DateTimeFormat(this.locales, this.options).format(
        new Date(this.value)
      );
    }
  }

  render() {
    return html`<span>${this.formattedTime}</span>`;
  }
}

// in miliseconds
var units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
};

export function getRelativeTime(d1, d2 = new Date(), rtf) {
  var elapsed = d1 - d2;

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (var u in units) {
    if (Math.abs(elapsed) > units[u] || u == "second") {
      return rtf.format(Math.round(elapsed / units[u]), u);
    }
  }
}

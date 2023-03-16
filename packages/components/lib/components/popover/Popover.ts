import { html, css, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createPopper } from "@popperjs/core";
import sharedStyles from "../../shared/styles";

const generateGetBoundingClientRect = (x = 0, y = 0) => {
  return () => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x,
  });
};

type Placement =
  | "auto"
  | "auto-start"
  | "auto-end"
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "right"
  | "right-start"
  | "right-end"
  | "left"
  | "left-start"
  | "left-end";

const styles = css`
  :host [part="content"] {
    z-index: 999;
    display: none;
  }
  :host([open]) [part="content"] {
    display: inline-block;
    animation: fade-in 0.2s ease;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

@customElement("j-popover")
export default class Popover extends LitElement {
  static styles = [sharedStyles, styles];

  /**
   * Open
   * @type {Boolean}
   * @attr
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Placement
   * @type {"auto"|"auto-start"|"auto-end"|"top"|"top-start"|"top-end"|"bottom"|"bottom-start"|"bottom-end"|"right"|"right-start"|"right-end"|"left"|"left-start"|"left-end}
   * @attr
   */
  @property({ type: String, reflect: true })
  placement = "auto";

  /**
   * Open
   * @type {"contextmenu"|"mouseover"|"click"}
   * @attr
   */
  @property({ type: String, reflect: true })
  event = "click";

  @state()
  clientY = 0;

  @state()
  clientX = 0;

  constructor() {
    super();
    this._createPopover = this._createPopover.bind(this);
  }

  get triggerPart(): HTMLElement {
    return this.renderRoot.querySelector("[part='trigger']");
  }

  get contentPart(): HTMLElement {
    return this.renderRoot.querySelector("[part='content']");
  }

  get triggerAssignedNode(): Node {
    const slot: HTMLSlotElement =
      this.renderRoot.querySelector("[name='trigger']");
    return slot.assignedNodes()[0];
  }

  get contentAssignedNode(): Node {
    const slot: HTMLSlotElement =
      this.renderRoot.querySelector("[name='content']");
    return slot.assignedNodes()[0];
  }

  firstUpdated() {
    const trigger = this.triggerPart;

    trigger.addEventListener(this.event, (e: any) => {
      e.preventDefault();
      this.clientY = e.clientY;
      this.clientX = e.clientX;
      this.open = !this.open;
    });

    if (this.event === "mouseover") {
      trigger.addEventListener("mouseover", () => (this.open = true));
      trigger.addEventListener("mouseleave", () => (this.open = false));
      trigger.addEventListener("mouseleave", () => (this.open = false));
    }

    // Handle click outside
    window.addEventListener("mousedown", (e) => {
      var path = e.path || (e.composedPath && e.composedPath());

      const clickedTrigger = path.includes(this.triggerAssignedNode);
      const clickedInside = path.includes(this.contentAssignedNode);

      if (!clickedInside && !clickedTrigger) {
        this.open = false;
      }
    });
  }

  _createPopover() {
    const trigger = this.triggerPart;
    const content = this.contentPart;

    if (this.event === "contextmenu") {
      const virtualElement = {
        contextElement: trigger,
        getBoundingClientRect: generateGetBoundingClientRect(),
      };

      const instance = createPopper(virtualElement, content, {
        placement: this.placement as Placement,
        strategy: "fixed",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [10, 10],
            },
          },
        ],
      });

      virtualElement.getBoundingClientRect = generateGetBoundingClientRect(
        this.clientX,
        this.clientY
      );
      instance.update();
    } else {
      createPopper(trigger, content, {
        placement: this.placement as Placement,
        strategy: "fixed",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [10, 10],
            },
          },
          {
            name: "computeStyles",
            options: {
              gpuAcceleration: false, // true by default
            },
          },
        ],
      });
    }
  }

  shouldUpdate(changedProperties) {
    if (changedProperties.has("open")) {
      this.dispatchEvent(new CustomEvent("toggle", { bubbles: true }));
      if (this.open) {
        this._createPopover();
      }
    }
    return true;
  }

  render() {
    return html`
      <div part="base">
        <span part="trigger"><slot name="trigger"></slot></span>
        <span part="content"><slot name="content"></slot></span>
      </div>
    `;
  }
}

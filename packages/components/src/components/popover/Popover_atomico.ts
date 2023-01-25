import { c, useProp, useEffect, useHost } from "atomico";
import { css, useStyleSheet } from "atomico/css";
import html from "atomico/html";
import { createPopper } from "@popperjs/core";
import sharedStyles from "../../shared/styles";

const styles = css`
  :host {
    display: none;
  }
  :host([open]) {
    display: inline-block;
  }
`;

export default function Popover({ selector, event }) {
  useStyleSheet(styles);

  const hostNode: any = useHost();

  const [open, setOpen] = useProp("open");

  function openMenu(e) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  useEffect(() => {
    document.querySelector(selector).addEventListener(event, openMenu);

    // Handle click outside
    window.addEventListener("click", (e) => {
      const clickedInside = hostNode.current.contains(e.target as Node);
      if (!clickedInside) {
        setOpen(false);
      }
    });
  }, []);

  useEffect(() => {
    if (open) {
      const trigger = document.querySelector(selector);

      createPopper(trigger, hostNode.current, {
        placement: "right",
      });
    }
  }, [open]);

  return html` <host shadowDom>
    <slot></slot>
  </host>`;
}

Popover.props = {
  open: {
    type: Boolean,
    reflect: true,
    event: {
      type: "toggle",
      bubbles: true,
    },
  },
  selector: {
    type: String,
    reflect: true,
  },
  event: {
    type: String,
    reflect: true,
  },
};

customElements.define("j-popover", c(Popover));

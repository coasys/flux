import { css } from "lit";

export default css`
  :host {
    box-sizing: border-box;
  }

  :host *,
  :host *:before,
  :host *:after {
    box-sizing: inherit;
  }

  :host *:focus {
    outline: 0;
  }

  [hidden] {
    display: none !important;
  }

  ::-webkit-scrollbar {
    width: var(--j-scrollbar-width);
  }

  ::-webkit-scrollbar-track {
    background-image: var(--j-scrollbar-background-image);
    background: var(--j-scrollbar-background);
  }

  ::-webkit-scrollbar-corner {
    background: var(--j-scrollbar-corner-background);
  }

  ::-webkit-scrollbar-thumb {
    box-shadow: var(--j-scrollbar-thumb-box-shadow);
    border-radius: var(--j-scrollbar-thumb-border-radius);
    background-color: var(--j-scrollbar-thumb-background);
  }
`;

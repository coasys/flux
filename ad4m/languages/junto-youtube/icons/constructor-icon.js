export default class ConstructorIcon extends HTMLElement {
  constructor() {
    super();

    const tmpl = document.createElement("template");
    tmpl.innerHTML = `
      <style>
        [part="base"] {
          display: flex;
          width: 100%;
          gap: var(--j-space-400);
        }
        j-input {
          flex: 1;
          width: 100%;
          
        }
      </style>
      <div part="base">
        <j-input part="input" type="url" full></j-input>
        <j-button part="send" variant="primary">Send</j-button>
      </div>
    `;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(tmpl.content.cloneNode(true));

    const button = shadowRoot.querySelector("j-button");
    button.addEventListener("click", () => {
      const input = shadowRoot.querySelector("j-input");
      this.commitExpression({ data: { url: input.value } });
    });
  }
}

export const name = "junto-youtube";

const icon = `

export default class ConstructorIcon extends HTMLElement {
  constructor() {
    super();

    const tmpl = document.createElement("template");
    tmpl.innerHTML = \`
      <style>:host { ... }</style> <!-- look ma, scoped styles -->
      <b>I'm in shadow dom!</b>
      <slot></slot>
    \`;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(tmpl.content.cloneNode(true));
  }
}


`;

function PutAdapter() {
  this.addressOf = async (content) => content.url;
}

function ExpressionAdapter() {
  this.putAdapter = new PutAdapter();
  this.get = () => null;
}

function interactions() {
  return [];
}

export default async function create(context) {
  return {
    name,
    expressionAdapter: new ExpressionAdapter(),
    expressionUI: {
      constructorIcon() {
        return icon;
      },
      icon() {
        return icon;
      },
    },
    settingsUI: {
      settingsIcon() {
        return icon;
      },
    },
    interactions,
  };
}

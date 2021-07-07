const template = `
<style>
  .embed-container { 
    position: relative; 
    padding-bottom: 56.25%; 
    height: 0; 
    overflow: hidden; 
    max-width: 100%; 
  } 
  .embed-container iframe, 
  .embed-container object, 
  .embed-container embed { 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
  }
</style>
<div class='embed-container'>
  <iframe part='iframe' frameborder='0' allowfullscreen>
  </iframe>
</div>
`;

export default class ExpressionIcon extends HTMLElement {
  constructor() {
    super();
    // Set initial epxression data
    this._expression = { url: "" };
    // Create  template
    const tmpl = document.createElement("template");
    tmpl.innerHTML = template;
    // Attach shadow dom
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(tmpl.content.cloneNode(true));
  }

  get expression() {
    return this._expression;
  }

  set expression(expression) {
    this._expression = expression;
    this.shadowRoot.querySelector("iframe").setAttribute("src", expression.url);
  }
}

import { html, h, useRef, useEffect, useState } from "htm/preact";
import xml from "highlight.js/lib/languages/xml.js";
import { lowlight } from "lowlight/lib/core.js";

import prettier from "https://unpkg.com/prettier@2.3.2/esm/standalone.mjs";
import parserHTML from "https://unpkg.com/prettier@2.3.2/esm/parser-html.mjs";

lowlight.registerLanguage("xml", xml);

function mapChildren(child) {
  if (child.tagName) {
    return h(child.tagName, child.properties, child.children?.map(mapChildren));
  }
  return child.value;
}

function isString(val) {
  return typeof val === "string" || val instanceof String;
}

function typeCastValue(prop) {
  if (prop.default === "false") return false;
  if (prop.default === "true") return true;
  if (prop.default === '""') return null;
  if (isString(prop.default)) return prop.default.replace(/"/g, "");
  return prop.default;
}

function getProps(properties) {
  if (!properties) return {};
  return properties.reduce((acc, prop) => {
    if (prop.default === undefined) return acc;
    if (prop.name === "styles") return acc;
    if (prop.default === '""') return acc;
    return { ...acc, [prop.name]: typeCastValue(prop) };
  }, {});
}

function Attribute({ name, type, value, changeProp }) {
  if (!type) return null;
  if (type.includes("|")) {
    const options = type.replace(/"/g, "").split("|");
    return html`
      <tr>
        <td>${name}</td>
        <td>string</td>
        <td>
          <j-select
            value=${value}
            onChange=${(e) => changeProp(name, e.target.value)}
          >
            ${options.map((opt) => {
              return html`
                <j-menu-item label=${opt} value=${opt}> ${opt} </j-menu-item>
              `;
            })}
          </j-select>
        </td>
      </tr>
    `;
  }

  if (type === "string" || type === "String") {
    return html`
      <tr>
        <td>${name}</td>
        <td>${type}</td>
        <td>
          <j-input
            name=${name}
            value=${value}
            onInput=${(e) => changeProp(name, e.target.value)}
            type="text"
          >
          </j-input>
        </td>
      </tr>
    `;
  }

  if (type === "boolean" || type === "Boolean") {
    return html`
      <tr>
        <td>${name}</td>
        <td>${type}</td>
        <td>
          <j-checkbox
            type="checkbox"
            name=${name}
            checked=${value}
            value=${name}
            onChange=${(e) => changeProp(name, e.target.checked)}
          >
          </j-checkbox>
        </td>
      </tr>
    `;
  }

  return null;
}

export default function Element({ el, meta }) {
  if (!meta) return null;

  const elRef = useRef(null);

  const initialProps = getProps(meta.properties);
  const [props, setProps] = useState(initialProps);
  const [ast, setAst] = useState({
    type: "root",
    properites: {},
    children: [{ type: "text", properties: null, value: "Hello" }],
  });

  useEffect(() => {
    const newProps = getProps(meta.properties);
    setProps(newProps);
  }, [meta.properties]);

  useEffect(() => {
    if (elRef.current) {
      const string = elRef.current.innerHTML;
      const pret = prettier.format(string, {
        parser: "html",
        plugins: [parserHTML],
        printWidth: 80,
        htmlWhitespaceSensitivity: "ignore",
      });
      const newAst = lowlight.highlight("xml", pret);
      setAst(newAst);
    }
  }, [props]);

  function handlePropChange(name, value) {
    if (value === "" || value === null) {
      let newProps = { ...props };
      delete newProps[name];
      setProps(newProps);
    } else {
      setProps({ ...props, [name]: value });
    }
  }

  const value = ast.children.map(mapChildren);
  const highlightedCode = h("code", { className: "hljs xml" }, value);

  return html` <section class="section" id=${el.tag}>
    <j-text variant="heading">${el.name}</j-text>
    <div ref=${elRef}>
      <${el.component} ...${props} changeProp=${handlePropChange} />
    </div>
    <pre>
      ${highlightedCode}
    </pre
    >
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${meta?.properties?.map(
            (property) =>
              html`<${Attribute}
                changeProp=${handlePropChange}
                value=${props[property.name]}
                name=${property.name}
                type=${property.type}
              />`
          )}
        </tbody>
      </table>
    </div>
  </section>`;
}

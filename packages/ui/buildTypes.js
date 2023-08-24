const components = require("./components.json");
const fs = require("fs");
var getDirName = require("path").dirname;

const snakeToPascal = (string) => {
  return string
    .split("/")
    .map((snake) =>
      snake
        .split("-")
        .map((substr) => substr.charAt(0).toUpperCase() + substr.slice(1))
        .join("")
    )
    .join("/");
};

const finalList = [];
const componentList = [];

for (const tag of components.tags) {
  const list = [];

  componentList.push(`"${tag.name}": ${snakeToPascal(tag.name)}Props;\n`);

  if (tag.attributes) {
    for (const attribute of tag.attributes) {
      let type = attribute.type;

      if (attribute.type === "String") {
        type = "string";
      } else if (attribute.type === "Boolean") {
        type = "boolean";
      }

      list.push(`${attribute.name}?: ${type};\n\t`);
    }
  }
  list.push("children?: any");

  const newType = `
type ${snakeToPascal(tag.name)}Props = Partial<HTMLElement> & {
  ${list.join("")}
}
  `;

  finalList.push(newType);
}

const finalString = `
import "construct-style-sheets-polyfill";

declare module 'preact' {
  namespace JSX {
      interface IntrinsicElements {
        ${componentList.join("\t\t\t\t")}
      }
  }
}

declare global {
  namespace JSX {
      interface IntrinsicElements {
        ${componentList.join("\t\t\t\t")}
      }
  }
}

${finalList.join("\n")}
`;

function writeFile(path, contents, cb) {
  fs.mkdir(getDirName(path), { recursive: true }, function (err) {
    if (err) return cb(err);

    fs.writeFile(path, contents, cb);
  });
}

writeFile("./dist/main.d.ts", finalString, () => {});

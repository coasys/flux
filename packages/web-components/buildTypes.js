const components = require('./components.json');
const fs = require('fs')

const snakeToPascal = (string) => {
  return string.split("/")
    .map(snake => snake.split("-")
      .map(substr => substr.charAt(0)
        .toUpperCase() +
        substr.slice(1))
      .join(""))
    .join("/");
};

const finalList = [];
const componentList = [];

for (const tag of components.tags) {
  const list = [];

  componentList.push(`"${tag.name}": ${snakeToPascal(tag.name)}Props;\n`)

  if (tag.attributes) {
    for (const attribute of tag.attributes) {
      list.push(`${attribute.name}?: string;\n\t`);  
    }
  }
  list.push('children?: any')


  const newType = `
type ${snakeToPascal(tag.name)}Props = {
  ${list.join('')}
}
  `

  finalList.push(newType)
}

const finalString = `
declare module 'preact' {
  namespace JSX {
      interface IntrinsicElements {
        ${componentList.join('\t\t\t\t')}
      }
  }
}

declare module global {
  namespace JSX {
      interface IntrinsicElements {
        ${componentList.join('\t\t\t\t')}
      }
  }
}

${finalList.join('\n')}
`

fs.writeFileSync('./src/types/index.ts', finalString)
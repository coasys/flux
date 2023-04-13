export function generateStylesheet(property, value) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`:host { ${property}: ${value}; }`);
  return sheet;
}

export function generateStylesheets(properties, variables) {
  return properties.reduce((acc, { name, value }) => {
    if (!value || !variables[name]) return acc;
    const { property, getValue } = variables[name];
    return [...acc, generateStylesheet(property, getValue(value))];
  }, []);
}

export function generateVariable(variable, value, fallback = "0") {
  return value ? `var(--${variable}-${value})` : fallback;
}

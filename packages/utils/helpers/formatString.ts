export function getPrologQuery(query, variables) {
  const regEx = /\$\w+/g;
  const names = query.match(regEx);
  if (!names) return query;
  return names.reduce((string, name) => {
    const variableName = name.replace("$", "");
    const value = variables[variableName];
    if (value === undefined) {
      console.error(`${name} is undefined`);
    }
    return string.replace(name, value);
  }, query);
}

export default function classnames(names) {
  const classes = Object.keys(names).filter(name => {
    return names[name];
  });

  return classes.reduce((acc, name, i) => {
    return acc.concat(i > 0 ? ` ${name}` : `${name}`);
  }, "");
}

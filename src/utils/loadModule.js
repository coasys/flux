export default function loadModule(code) {
  const dataUri =
    "data:text/javascript;charset=utf-8," + encodeURIComponent(code);
  return import(dataUri);
}

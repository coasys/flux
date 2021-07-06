export default function loadModule(code: string): any {
  const dataUri =
    "data:text/javascript;charset=utf-8," + encodeURIComponent(code);
  return import(/*webpackIgnore: true*/ dataUri);
}

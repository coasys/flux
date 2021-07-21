import { ThemeState } from "@/store";

export function setTheme(theme: ThemeState): void {
  document.documentElement.style.setProperty(
    "--j-color-primary-hue",
    theme.hue.toString()
  );
  document.documentElement.style.setProperty(
    "--j-color-saturation",
    theme.saturation + "%"
  );

  if (theme.name === "light") {
    document.documentElement.removeAttribute("theme");
  } else {
    import(`../themes/${theme.name}.css`);
    document.documentElement.setAttribute("theme", theme.name);
  }

  document.documentElement.setAttribute("font-size", theme.fontSize);

  const font = {
    default: `"Avenir", sans-serif`,
    monospace: `monospace`,
    system: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  };
  document.documentElement.style.setProperty(
    "--j-font-family",
    // @ts-ignore
    font[theme.fontFamily]
  );
}

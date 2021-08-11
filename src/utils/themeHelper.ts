import { ThemeState } from "@/store/types";

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

  const head = document.getElementsByTagName("head")[0];
  let link = null;

  link = head.querySelector("link[href^='https://fonts.googleapis.com']");

  if (link) {
    link.setAttribute(
      "href",
      `https://fonts.googleapis.com/css?family=${theme.fontFamily}`
    );
  } else {
    link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute(
      "href",
      `https://fonts.googleapis.com/css?family=${theme.fontFamily}`
    );
    document.getElementsByTagName("head")[0].appendChild(link);
  }

  document.documentElement.style.setProperty(
    "--j-font-family",
    // @ts-ignore
    theme.fontFamily
  );
}

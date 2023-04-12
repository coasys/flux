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

  document.documentElement.style.setProperty(
    "--j-font-base-size",
    theme.fontSize
  );

  console.log({ theme });

  document.documentElement.setAttribute("class", theme.name);

  const head = document.getElementsByTagName("head")[0];
  let link = null;

  link = head.querySelector("link[href^='https://fonts.googleapis.com']");

  if (link) {
    link.setAttribute(
      "href",
      `https://fonts.googleapis.com/css?family=${theme.fontFamily}:wght@300;400;500;600;700;800;900&display=swap`
    );
  } else {
    link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute(
      "href",
      `https://fonts.googleapis.com/css?family=${theme.fontFamily}:wght@300;400;500;600;700;800;900&display=swap`
    );
    document.getElementsByTagName("head")[0].appendChild(link);
  }

  document.documentElement.style.setProperty(
    "--j-font-family",
    // @ts-ignore
    theme.fontFamily
  );
}

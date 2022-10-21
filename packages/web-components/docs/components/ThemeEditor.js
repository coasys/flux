import { html, useEffect, useState } from "htm/preact";

function getPropValue(name) {
  return window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);
}

function setProp(name, value) {
  document.documentElement.style.setProperty(name, value);
}

export default function ThemeEditor() {
  const hueName = "--j-color-primary-hue";
  const saturationName = "--j-color-saturation";
  const radiusName = "--j-border-radius";
  const fontSizeName = "--j-font-base-size";
  const substractorName = "--j-color-subtractor";
  const multiplierName = "--j-color-multiplier";

  const [hue, setHue] = useState(getPropValue(hueName));
  const [saturation, setSaturation] = useState(
    getPropValue(saturationName).replace("%", "")
  );
  const [radius, setRadius] = useState(
    getPropValue(radiusName).replace("px", "")
  );
  const [baseSize, setBaseSize] = useState(
    getPropValue(fontSizeName).replace("px", "")
  );
  const [subtractor, setSubstractor] = useState(
    getPropValue(substractorName).replace("%", "")
  );
  const [multiplier, setMultiplier] = useState(
    getPropValue(multiplierName).replace("", "")
  );

  useEffect(() => {
    setProp(hueName, hue);
    setProp(saturationName, saturation + "%");
    setProp(radiusName, radius + "px");
    setProp(fontSizeName, baseSize + "px");
    setProp(multiplierName, multiplier);
    setProp(substractorName, subtractor + "%");
  }, [hue, saturation, radius, baseSize, subtractor, multiplier]);

  function toggleDarkMode(dark) {
    setMultiplier(dark ? "-1" : "1");
    setSubstractor(dark ? 100 : 0);
  }

  return html`<div>
    <j-flex direction="column" gap="300">
      <j-checkbox onChange=${(e) => toggleDarkMode(e.target.checked)}>
        Dark mode
      </j-checkbox>
    </j-flex>
    <j-flex direction="column" gap="300">
      <j-text variant="label">Base font size: ${baseSize}px</j-text>
      <input
        onInput=${(e) => setBaseSize(e.target.value)}
        min="14"
        step="0.5"
        max="20"
        type="range"
      />
    </j-flex>
    <j-flex direction="column" gap="300">
      <j-text variant="label">Hue: ${hue}</j-text>
      <input
        onInput=${(e) => setHue(e.target.value)}
        min="0"
        max="360"
        type="range"
      />
    </j-flex>
    <j-flex direction="column" gap="300">
      <j-text variant="label">Saturation: ${saturation}%</j-text>
      <input
        onInput=${(e) => setSaturation(e.target.value)}
        min="0"
        max="360"
        type="range"
      />
    </j-flex>
    <j-flex direction="column" gap="300">
      <j-text variant="label">Border radius: ${radius}px</j-text>
      <input
        onInput=${(e) => setRadius(e.target.value)}
        min="0"
        max="12"
        type="range"
      />
    </j-flex>
  </div>`;
}

import { html } from "htm/preact";

export default {
  Colors: [
    {
      name: "Primary",
      prefix: "primary",
      values: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ColorWithValues,
    },
    {
      name: "UI",
      prefix: "ui",
      values: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ColorWithValues,
    },
    {
      name: "Success",
      prefix: "success",
      values: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ColorWithValues,
    },
    {
      name: "Danger",
      prefix: "danger",
      values: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ColorWithValues,
    },
    {
      name: "Warning",
      prefix: "warning",
      values: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ColorWithValues,
    },
    {
      name: "Black",
      prefix: "black",
      render: SingleColor,
    },
    {
      name: "White",
      prefix: "white",
      render: SingleColor,
    },
    {
      name: "Focus",
      prefix: "focus",
      render: SingleColor,
    },
  ],
  Spacing: [
    {
      name: "",
      values: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ({ values }) => {
        return html` <j-flex wrap gap="300" a="center">
          ${values.map(
            (value) => html`<j-tooltip
              placement="top"
              title=${`--j-space-${value}`}
            >
              <div
                class="space-box"
                style=${`padding: var(--j-space-${value})`}
              >
                <div class="space-box__inner"></div>
              </div>
            </j-tooltip>`
          )}
        </j-flex>`;
      },
    },
  ],
  Typography: [
    {
      name: "Font family",
      render: () =>
        html`<j-box pb="500"
          ><j-tooltip title=${`--j-font-family`}>
            <j-text size="600">Avenir</j-text>
          </j-tooltip>
        </j-box>`,
    },
    {
      name: "Sizes",
      sizes: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
      render: ({ sizes }) =>
        sizes.map(
          (size) => html`<j-tooltip title=${`--j-font-size-${size}`}>
            <j-text tag="span" size=${size}>Font size ${size}</j-text>
          </j-tooltip>`
        ),
    },
  ],
  Depth: [
    {
      name: "",
      values: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      render: ({ values }) => {
        return html` <j-flex wrap gap="300" a="center">
          ${values.map(
            (value) => html`<j-tooltip
              placement="top"
              title=${`--j-depth-${value}`}
            >
              <div
                class="depth-box"
                style=${`box-shadow: var(--j-depth-${value})`}
              ></div>
            </j-tooltip>`
          )}
        </j-flex>`;
      },
    },
  ],
};

function SingleColor({ prefix }) {
  return html`<j-box pb="500">
    <j-tooltip placement="top" title=${`--j-color-${prefix}`}>
      <div
        class="color-box"
        p="600"
        style=${`background: var(--j-color-${prefix})`}
      ></div>
    </j-tooltip>
  </j-box>`;
}

function ColorWithValues({ name, values, prefix }) {
  return html` <j-box pb="500">
    <j-flex gap="400" a="center">
      ${values.map(
        (value) => html`<j-tooltip
          placement="top"
          title=${`--j-color-${prefix}-${value}`}
        >
          <div
            class="color-box"
            style=${`background: var(--j-color-${`${prefix}-${value}`}`}
          ></div>
        </j-tooltip>`
      )}
    </j-flex>
  </j-box>`;
}

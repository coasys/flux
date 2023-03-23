import "./chunk-HYZYPRER.js";

// ../../node_modules/jdenticon/dist/jdenticon-module.mjs
function parseHex(hash, startPosition, octets) {
  return parseInt(hash.substr(startPosition, octets), 16);
}
function decToHex(v) {
  v |= 0;
  return v < 0 ? "00" : v < 16 ? "0" + v.toString(16) : v < 256 ? v.toString(16) : "ff";
}
function hueToRgb(m1, m2, h) {
  h = h < 0 ? h + 6 : h > 6 ? h - 6 : h;
  return decToHex(255 * (h < 1 ? m1 + (m2 - m1) * h : h < 3 ? m2 : h < 4 ? m1 + (m2 - m1) * (4 - h) : m1));
}
function parseColor(color) {
  if (/^#[0-9a-f]{3,8}$/i.test(color)) {
    let result;
    const colorLength = color.length;
    if (colorLength < 6) {
      const r = color[1], g = color[2], b = color[3], a = color[4] || "";
      result = "#" + r + r + g + g + b + b + a + a;
    }
    if (colorLength == 7 || colorLength > 8) {
      result = color;
    }
    return result;
  }
}
function toCss3Color(hexColor) {
  const a = parseHex(hexColor, 7, 2);
  let result;
  if (isNaN(a)) {
    result = hexColor;
  } else {
    const r = parseHex(hexColor, 1, 2), g = parseHex(hexColor, 3, 2), b = parseHex(hexColor, 5, 2);
    result = "rgba(" + r + "," + g + "," + b + "," + (a / 255).toFixed(2) + ")";
  }
  return result;
}
function hsl(hue, saturation, lightness) {
  let result;
  if (saturation == 0) {
    const partialHex = decToHex(lightness * 255);
    result = partialHex + partialHex + partialHex;
  } else {
    const m2 = lightness <= 0.5 ? lightness * (saturation + 1) : lightness + saturation - lightness * saturation, m1 = lightness * 2 - m2;
    result = hueToRgb(m1, m2, hue * 6 + 2) + hueToRgb(m1, m2, hue * 6) + hueToRgb(m1, m2, hue * 6 - 2);
  }
  return "#" + result;
}
function correctedHsl(hue, saturation, lightness) {
  const correctors = [0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55], corrector = correctors[hue * 6 + 0.5 | 0];
  lightness = lightness < 0.5 ? lightness * corrector * 2 : corrector + (lightness - 0.5) * (1 - corrector) * 2;
  return hsl(hue, saturation, lightness);
}
var GLOBAL = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
var CONFIG_PROPERTIES = {
  V: "jdenticon_config",
  n: "config"
};
var rootConfigurationHolder = {};
function configure(newConfiguration) {
  if (arguments.length) {
    rootConfigurationHolder[
      CONFIG_PROPERTIES.n
      /*MODULE*/
    ] = newConfiguration;
  }
  return rootConfigurationHolder[
    CONFIG_PROPERTIES.n
    /*MODULE*/
  ];
}
function getConfiguration(paddingOrLocalConfig, defaultPadding) {
  const configObject = typeof paddingOrLocalConfig == "object" && paddingOrLocalConfig || rootConfigurationHolder[
    CONFIG_PROPERTIES.n
    /*MODULE*/
  ] || GLOBAL[
    CONFIG_PROPERTIES.V
    /*GLOBAL*/
  ] || {}, lightnessConfig = configObject["lightness"] || {}, saturation = configObject["saturation"] || {}, colorSaturation = "color" in saturation ? saturation["color"] : saturation, grayscaleSaturation = saturation["grayscale"], backColor = configObject["backColor"], padding = configObject["padding"];
  function lightness(configName, defaultRange) {
    let range = lightnessConfig[configName];
    if (!(range && range.length > 1)) {
      range = defaultRange;
    }
    return function(value) {
      value = range[0] + value * (range[1] - range[0]);
      return value < 0 ? 0 : value > 1 ? 1 : value;
    };
  }
  function hueFunction(originalHue) {
    const hueConfig = configObject["hues"];
    let hue;
    if (hueConfig && hueConfig.length > 0) {
      hue = hueConfig[0 | 0.999 * originalHue * hueConfig.length];
    }
    return typeof hue == "number" ? (
      // A hue was specified. We need to convert the hue from
      // degrees on any turn - e.g. 746° is a perfectly valid hue -
      // to turns in the range [0, 1).
      (hue / 360 % 1 + 1) % 1
    ) : (
      // No hue configured => use original hue
      originalHue
    );
  }
  return {
    W: hueFunction,
    o: typeof colorSaturation == "number" ? colorSaturation : 0.5,
    D: typeof grayscaleSaturation == "number" ? grayscaleSaturation : 0,
    p: lightness("color", [0.4, 0.8]),
    F: lightness("grayscale", [0.3, 0.9]),
    G: parseColor(backColor),
    X: typeof paddingOrLocalConfig == "number" ? paddingOrLocalConfig : typeof padding == "number" ? padding : defaultPadding
  };
}
var Point = class {
  /**
   * @param {number} x 
   * @param {number} y 
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
};
var Transform = class {
  /**
   * @param {number} x The x-coordinate of the upper left corner of the transformed rectangle.
   * @param {number} y The y-coordinate of the upper left corner of the transformed rectangle.
   * @param {number} size The size of the transformed rectangle.
   * @param {number} rotation Rotation specified as 0 = 0 rad, 1 = 0.5π rad, 2 = π rad, 3 = 1.5π rad
   */
  constructor(x, y, size, rotation) {
    this.q = x;
    this.t = y;
    this.H = size;
    this.Y = rotation;
  }
  /**
   * Transforms the specified point based on the translation and rotation specification for this Transform.
   * @param {number} x x-coordinate
   * @param {number} y y-coordinate
   * @param {number=} w The width of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
   * @param {number=} h The height of the transformed rectangle. If greater than 0, this will ensure the returned point is of the upper left corner of the transformed rectangle.
   */
  I(x, y, w, h) {
    const right = this.q + this.H, bottom = this.t + this.H, rotation = this.Y;
    return rotation === 1 ? new Point(right - y - (h || 0), this.t + x) : rotation === 2 ? new Point(right - x - (w || 0), bottom - y - (h || 0)) : rotation === 3 ? new Point(this.q + y, bottom - x - (w || 0)) : new Point(this.q + x, this.t + y);
  }
};
var NO_TRANSFORM = new Transform(0, 0, 0, 0);
var Graphics = class {
  /**
   * @param {Renderer} renderer 
   */
  constructor(renderer) {
    this.J = renderer;
    this.u = NO_TRANSFORM;
  }
  /**
   * Adds a polygon to the underlying renderer.
   * @param {Array<number>} points The points of the polygon clockwise on the format [ x0, y0, x1, y1, ..., xn, yn ]
   * @param {boolean=} invert Specifies if the polygon will be inverted.
   */
  g(points, invert) {
    const di = invert ? -2 : 2, transformedPoints = [];
    for (let i = invert ? points.length - 2 : 0; i < points.length && i >= 0; i += di) {
      transformedPoints.push(this.u.I(points[i], points[i + 1]));
    }
    this.J.g(transformedPoints);
  }
  /**
   * Adds a polygon to the underlying renderer.
   * Source: http://stackoverflow.com/a/2173084
   * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the entire ellipse.
   * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the entire ellipse.
   * @param {number} size The size of the ellipse.
   * @param {boolean=} invert Specifies if the ellipse will be inverted.
   */
  h(x, y, size, invert) {
    const p = this.u.I(x, y, size, size);
    this.J.h(p, size, invert);
  }
  /**
   * Adds a rectangle to the underlying renderer.
   * @param {number} x The x-coordinate of the upper left corner of the rectangle.
   * @param {number} y The y-coordinate of the upper left corner of the rectangle.
   * @param {number} w The width of the rectangle.
   * @param {number} h The height of the rectangle.
   * @param {boolean=} invert Specifies if the rectangle will be inverted.
   */
  i(x, y, w, h, invert) {
    this.g([
      x,
      y,
      x + w,
      y,
      x + w,
      y + h,
      x,
      y + h
    ], invert);
  }
  /**
   * Adds a right triangle to the underlying renderer.
   * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the triangle.
   * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the triangle.
   * @param {number} w The width of the triangle.
   * @param {number} h The height of the triangle.
   * @param {number} r The rotation of the triangle (clockwise). 0 = right corner of the triangle in the lower left corner of the bounding rectangle.
   * @param {boolean=} invert Specifies if the triangle will be inverted.
   */
  j(x, y, w, h, r, invert) {
    const points = [
      x + w,
      y,
      x + w,
      y + h,
      x,
      y + h,
      x,
      y
    ];
    points.splice((r || 0) % 4 * 2, 2);
    this.g(points, invert);
  }
  /**
   * Adds a rhombus to the underlying renderer.
   * @param {number} x The x-coordinate of the upper left corner of the rectangle holding the rhombus.
   * @param {number} y The y-coordinate of the upper left corner of the rectangle holding the rhombus.
   * @param {number} w The width of the rhombus.
   * @param {number} h The height of the rhombus.
   * @param {boolean=} invert Specifies if the rhombus will be inverted.
   */
  K(x, y, w, h, invert) {
    this.g([
      x + w / 2,
      y,
      x + w,
      y + h / 2,
      x + w / 2,
      y + h,
      x,
      y + h / 2
    ], invert);
  }
};
function centerShape(index, g, cell, positionIndex) {
  index = index % 14;
  let k, m, w, h, inner, outer;
  !index ? (k = cell * 0.42, g.g([
    0,
    0,
    cell,
    0,
    cell,
    cell - k * 2,
    cell - k,
    cell,
    0,
    cell
  ])) : index == 1 ? (w = 0 | cell * 0.5, h = 0 | cell * 0.8, g.j(cell - w, 0, w, h, 2)) : index == 2 ? (w = 0 | cell / 3, g.i(w, w, cell - w, cell - w)) : index == 3 ? (inner = cell * 0.1, // Use fixed outer border widths in small icons to ensure the border is drawn
  outer = cell < 6 ? 1 : cell < 8 ? 2 : 0 | cell * 0.25, inner = inner > 1 ? 0 | inner : (
    // large icon => truncate decimals
    inner > 0.5 ? 1 : (
      // medium size icon => fixed width
      inner
    )
  ), // small icon => anti-aliased border
  g.i(outer, outer, cell - inner - outer, cell - inner - outer)) : index == 4 ? (m = 0 | cell * 0.15, w = 0 | cell * 0.5, g.h(cell - w - m, cell - w - m, w)) : index == 5 ? (inner = cell * 0.1, outer = inner * 4, // Align edge to nearest pixel in large icons
  outer > 3 && (outer = 0 | outer), g.i(0, 0, cell, cell), g.g([
    outer,
    outer,
    cell - inner,
    outer,
    outer + (cell - outer - inner) / 2,
    cell - inner
  ], true)) : index == 6 ? g.g([
    0,
    0,
    cell,
    0,
    cell,
    cell * 0.7,
    cell * 0.4,
    cell * 0.4,
    cell * 0.7,
    cell,
    0,
    cell
  ]) : index == 7 ? g.j(cell / 2, cell / 2, cell / 2, cell / 2, 3) : index == 8 ? (g.i(0, 0, cell, cell / 2), g.i(0, cell / 2, cell / 2, cell / 2), g.j(cell / 2, cell / 2, cell / 2, cell / 2, 1)) : index == 9 ? (inner = cell * 0.14, // Use fixed outer border widths in small icons to ensure the border is drawn
  outer = cell < 4 ? 1 : cell < 6 ? 2 : 0 | cell * 0.35, inner = cell < 8 ? inner : (
    // small icon => anti-aliased border
    0 | inner
  ), // large icon => truncate decimals
  g.i(0, 0, cell, cell), g.i(outer, outer, cell - outer - inner, cell - outer - inner, true)) : index == 10 ? (inner = cell * 0.12, outer = inner * 3, g.i(0, 0, cell, cell), g.h(outer, outer, cell - inner - outer, true)) : index == 11 ? g.j(cell / 2, cell / 2, cell / 2, cell / 2, 3) : index == 12 ? (m = cell * 0.25, g.i(0, 0, cell, cell), g.K(m, m, cell - m, cell - m, true)) : (
    // 13
    !positionIndex && (m = cell * 0.4, w = cell * 1.2, g.h(m, m, w))
  );
}
function outerShape(index, g, cell) {
  index = index % 4;
  let m;
  !index ? g.j(0, 0, cell, cell, 0) : index == 1 ? g.j(0, cell / 2, cell, cell / 2, 0) : index == 2 ? g.K(0, 0, cell, cell) : (
    // 3
    (m = cell / 6, g.h(m, m, cell - 2 * m))
  );
}
function colorTheme(hue, config) {
  hue = config.W(hue);
  return [
    // Dark gray
    correctedHsl(hue, config.D, config.F(0)),
    // Mid color
    correctedHsl(hue, config.o, config.p(0.5)),
    // Light gray
    correctedHsl(hue, config.D, config.F(1)),
    // Light color
    correctedHsl(hue, config.o, config.p(1)),
    // Dark color
    correctedHsl(hue, config.o, config.p(0))
  ];
}
function iconGenerator(renderer, hash, config) {
  const parsedConfig = getConfiguration(config, 0.08);
  if (parsedConfig.G) {
    renderer.m(
      parsedConfig.G
      /*backColor*/
    );
  }
  let size = renderer.k;
  const padding = 0.5 + size * parsedConfig.X | 0;
  size -= padding * 2;
  const graphics = new Graphics(renderer);
  const cell = 0 | size / 4;
  const x = 0 | padding + size / 2 - cell * 2;
  const y = 0 | padding + size / 2 - cell * 2;
  function renderShape(colorIndex, shapes, index2, rotationIndex, positions) {
    const shapeIndex = parseHex(hash, index2, 1);
    let r = rotationIndex ? parseHex(hash, rotationIndex, 1) : 0;
    renderer.L(availableColors[selectedColorIndexes[colorIndex]]);
    for (let i = 0; i < positions.length; i++) {
      graphics.u = new Transform(x + positions[i][0] * cell, y + positions[i][1] * cell, cell, r++ % 4);
      shapes(shapeIndex, graphics, cell, i);
    }
    renderer.M();
  }
  const hue = parseHex(hash, -7) / 268435455, availableColors = colorTheme(hue, parsedConfig), selectedColorIndexes = [];
  let index;
  function isDuplicate(values) {
    if (values.indexOf(index) >= 0) {
      for (let i = 0; i < values.length; i++) {
        if (selectedColorIndexes.indexOf(values[i]) >= 0) {
          return true;
        }
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    index = parseHex(hash, 8 + i, 1) % availableColors.length;
    if (isDuplicate([0, 4]) || // Disallow dark gray and dark color combo
    isDuplicate([2, 3])) {
      index = 1;
    }
    selectedColorIndexes.push(index);
  }
  renderShape(0, outerShape, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]);
  renderShape(1, outerShape, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]);
  renderShape(2, centerShape, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]);
  renderer.finish();
}
function sha1(message) {
  const HASH_SIZE_HALF_BYTES = 40;
  const BLOCK_SIZE_WORDS = 16;
  var i = 0, f = 0, urlEncodedMessage = encodeURI(message) + "%80", data = [], dataSize, hashBuffer = [], a = 1732584193, b = 4023233417, c = ~a, d = ~b, e = 3285377520, hash = [a, b, c, d, e], blockStartIndex = 0, hexHash = "";
  function rotl(value, shift) {
    return value << shift | value >>> 32 - shift;
  }
  for (; i < urlEncodedMessage.length; f++) {
    data[f >> 2] = data[f >> 2] | (urlEncodedMessage[i] == "%" ? parseInt(urlEncodedMessage.substring(i + 1, i += 3), 16) : urlEncodedMessage.charCodeAt(i++)) << (3 - (f & 3)) * 8;
  }
  dataSize = ((f + 7 >> 6) + 1) * BLOCK_SIZE_WORDS;
  data[dataSize - 1] = f * 8 - 8;
  for (; blockStartIndex < dataSize; blockStartIndex += BLOCK_SIZE_WORDS) {
    for (i = 0; i < 80; i++) {
      f = rotl(a, 5) + e + // Ch
      (i < 20 ? (b & c ^ ~b & d) + 1518500249 : (
        // Parity
        i < 40 ? (b ^ c ^ d) + 1859775393 : (
          // Maj
          i < 60 ? (b & c ^ b & d ^ c & d) + 2400959708 : (
            // Parity
            (b ^ c ^ d) + 3395469782
          )
        )
      )) + (hashBuffer[i] = i < BLOCK_SIZE_WORDS ? data[blockStartIndex + i] | 0 : rotl(hashBuffer[i - 3] ^ hashBuffer[i - 8] ^ hashBuffer[i - 14] ^ hashBuffer[i - 16], 1));
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = f;
    }
    hash[0] = a = hash[0] + a | 0;
    hash[1] = b = hash[1] + b | 0;
    hash[2] = c = hash[2] + c | 0;
    hash[3] = d = hash[3] + d | 0;
    hash[4] = e = hash[4] + e | 0;
  }
  for (i = 0; i < HASH_SIZE_HALF_BYTES; i++) {
    hexHash += // Get word (2^3 half-bytes per word)
    (hash[i >> 3] >>> // Append half-bytes in reverse order
    (7 - (i & 7)) * 4 & 15).toString(16);
  }
  return hexHash;
}
function isValidHash(hashCandidate) {
  return /^[0-9a-f]{11,}$/i.test(hashCandidate) && hashCandidate;
}
function computeHash(value) {
  return sha1(value == null ? "" : "" + value);
}
var CanvasRenderer = class {
  /**
   * @param {number=} iconSize
   */
  constructor(ctx, iconSize) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    ctx.save();
    if (!iconSize) {
      iconSize = Math.min(width, height);
      ctx.translate(
        (width - iconSize) / 2 | 0,
        (height - iconSize) / 2 | 0
      );
    }
    this.l = ctx;
    this.k = iconSize;
    ctx.clearRect(0, 0, iconSize, iconSize);
  }
  /**
   * Fills the background with the specified color.
   * @param {string} fillColor  Fill color on the format #rrggbb[aa].
   */
  m(fillColor) {
    const ctx = this.l;
    const iconSize = this.k;
    ctx.fillStyle = toCss3Color(fillColor);
    ctx.fillRect(0, 0, iconSize, iconSize);
  }
  /**
   * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
   * @param {string} fillColor Fill color on format #rrggbb[aa].
   */
  L(fillColor) {
    const ctx = this.l;
    ctx.fillStyle = toCss3Color(fillColor);
    ctx.beginPath();
  }
  /**
   * Marks the end of the currently drawn shape. This causes the queued paths to be rendered on the canvas.
   */
  M() {
    this.l.fill();
  }
  /**
   * Adds a polygon to the rendering queue.
   * @param points An array of Point objects.
   */
  g(points) {
    const ctx = this.l;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
  }
  /**
   * Adds a circle to the rendering queue.
   * @param {Point} point The upper left corner of the circle bounding box.
   * @param {number} diameter The diameter of the circle.
   * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
   */
  h(point, diameter, counterClockwise) {
    const ctx = this.l, radius = diameter / 2;
    ctx.moveTo(point.x + radius, point.y + radius);
    ctx.arc(point.x + radius, point.y + radius, radius, 0, Math.PI * 2, counterClockwise);
    ctx.closePath();
  }
  /**
   * Called when the icon has been completely drawn.
   */
  finish() {
    this.l.restore();
  }
};
function drawIcon(ctx, hashOrValue, size, config) {
  if (!ctx) {
    throw new Error("No canvas specified.");
  }
  iconGenerator(
    new CanvasRenderer(ctx, size),
    isValidHash(hashOrValue) || computeHash(hashOrValue),
    config
  );
}
function svgValue(value) {
  return (value * 10 + 0.5 | 0) / 10;
}
var SvgPath = class {
  constructor() {
    this.v = "";
  }
  /**
   * Adds a polygon with the current fill color to the SVG path.
   * @param points An array of Point objects.
   */
  g(points) {
    let dataString = "";
    for (let i = 0; i < points.length; i++) {
      dataString += (i ? "L" : "M") + svgValue(points[i].x) + " " + svgValue(points[i].y);
    }
    this.v += dataString + "Z";
  }
  /**
   * Adds a circle with the current fill color to the SVG path.
   * @param {Point} point The upper left corner of the circle bounding box.
   * @param {number} diameter The diameter of the circle.
   * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
   */
  h(point, diameter, counterClockwise) {
    const sweepFlag = counterClockwise ? 0 : 1, svgRadius = svgValue(diameter / 2), svgDiameter = svgValue(diameter), svgArc = "a" + svgRadius + "," + svgRadius + " 0 1," + sweepFlag + " ";
    this.v += "M" + svgValue(point.x) + " " + svgValue(point.y + diameter / 2) + svgArc + svgDiameter + ",0" + svgArc + -svgDiameter + ",0";
  }
};
var SvgRenderer = class {
  /**
   * @param {SvgElement|SvgWriter} target 
   */
  constructor(target) {
    this.A;
    this.B = {};
    this.N = target;
    this.k = target.k;
  }
  /**
   * Fills the background with the specified color.
   * @param {string} fillColor  Fill color on the format #rrggbb[aa].
   */
  m(fillColor) {
    const match = /^(#......)(..)?/.exec(fillColor), opacity = match[2] ? parseHex(match[2], 0) / 255 : 1;
    this.N.m(match[1], opacity);
  }
  /**
   * Marks the beginning of a new shape of the specified color. Should be ended with a call to endShape.
   * @param {string} color Fill color on format #xxxxxx.
   */
  L(color) {
    this.A = this.B[color] || (this.B[color] = new SvgPath());
  }
  /**
   * Marks the end of the currently drawn shape.
   */
  M() {
  }
  /**
   * Adds a polygon with the current fill color to the SVG.
   * @param points An array of Point objects.
   */
  g(points) {
    this.A.g(points);
  }
  /**
   * Adds a circle with the current fill color to the SVG.
   * @param {Point} point The upper left corner of the circle bounding box.
   * @param {number} diameter The diameter of the circle.
   * @param {boolean} counterClockwise True if the circle is drawn counter-clockwise (will result in a hole if rendered on a clockwise path).
   */
  h(point, diameter, counterClockwise) {
    this.A.h(point, diameter, counterClockwise);
  }
  /**
   * Called when the icon has been completely drawn.
   */
  finish() {
    const pathsByColor = this.B;
    for (let color in pathsByColor) {
      if (pathsByColor.hasOwnProperty(color)) {
        this.N.O(
          color,
          pathsByColor[color].v
          /*dataString*/
        );
      }
    }
  }
};
var SVG_CONSTANTS = {
  P: "http://www.w3.org/2000/svg",
  R: "width",
  S: "height"
};
var SvgWriter = class {
  /**
   * @param {number} iconSize - Icon width and height in pixels.
   */
  constructor(iconSize) {
    this.k = iconSize;
    this.C = '<svg xmlns="' + SVG_CONSTANTS.P + '" width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 ' + iconSize + " " + iconSize + '">';
  }
  /**
   * Fills the background with the specified color.
   * @param {string} fillColor  Fill color on the format #rrggbb.
   * @param {number} opacity  Opacity in the range [0.0, 1.0].
   */
  m(fillColor, opacity) {
    if (opacity) {
      this.C += '<rect width="100%" height="100%" fill="' + fillColor + '" opacity="' + opacity.toFixed(2) + '"/>';
    }
  }
  /**
   * Writes a path to the SVG string.
   * @param {string} color Fill color on format #rrggbb.
   * @param {string} dataString The SVG path data string.
   */
  O(color, dataString) {
    this.C += '<path fill="' + color + '" d="' + dataString + '"/>';
  }
  /**
   * Gets the rendered image as an SVG string.
   */
  toString() {
    return this.C + "</svg>";
  }
};
function toSvg(hashOrValue, size, config) {
  const writer = new SvgWriter(size);
  iconGenerator(
    new SvgRenderer(writer),
    isValidHash(hashOrValue) || computeHash(hashOrValue),
    config
  );
  return writer.toString();
}
var ICON_TYPE_SVG = 1;
var ICON_TYPE_CANVAS = 2;
var ATTRIBUTES = {
  Z: "data-jdenticon-hash",
  T: "data-jdenticon-value"
};
var documentQuerySelectorAll = (
  /** @type {!Function} */
  typeof document !== "undefined" && document.querySelectorAll.bind(document)
);
function getIdenticonType(el) {
  if (el) {
    const tagName = el["tagName"];
    if (/^svg$/i.test(tagName)) {
      return ICON_TYPE_SVG;
    }
    if (/^canvas$/i.test(tagName) && "getContext" in el) {
      return ICON_TYPE_CANVAS;
    }
  }
}
function SvgElement_append(parentNode, name, ...keyValuePairs) {
  const el = document.createElementNS(SVG_CONSTANTS.P, name);
  for (let i = 0; i + 1 < keyValuePairs.length; i += 2) {
    el.setAttribute(
      /** @type {string} */
      keyValuePairs[i],
      /** @type {string} */
      keyValuePairs[i + 1]
    );
  }
  parentNode.appendChild(el);
}
var SvgElement = class {
  /**
   * @param {Element} element - Target element
   */
  constructor(element) {
    const iconSize = this.k = Math.min(
      Number(element.getAttribute(
        SVG_CONSTANTS.R
        /*WIDTH*/
      )) || 100,
      Number(element.getAttribute(
        SVG_CONSTANTS.S
        /*HEIGHT*/
      )) || 100
    );
    this.U = element;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    element.setAttribute("viewBox", "0 0 " + iconSize + " " + iconSize);
    element.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
  /**
   * Fills the background with the specified color.
   * @param {string} fillColor  Fill color on the format #rrggbb.
   * @param {number} opacity  Opacity in the range [0.0, 1.0].
   */
  m(fillColor, opacity) {
    if (opacity) {
      SvgElement_append(
        this.U,
        "rect",
        SVG_CONSTANTS.R,
        "100%",
        SVG_CONSTANTS.S,
        "100%",
        "fill",
        fillColor,
        "opacity",
        opacity
      );
    }
  }
  /**
   * Appends a path to the SVG element.
   * @param {string} color Fill color on format #xxxxxx.
   * @param {string} dataString The SVG path data string.
   */
  O(color, dataString) {
    SvgElement_append(
      this.U,
      "path",
      "fill",
      color,
      "d",
      dataString
    );
  }
};
function update(el, hashOrValue, config) {
  renderDomElement(el, hashOrValue, config, function(el2, iconType) {
    if (iconType) {
      return iconType == ICON_TYPE_SVG ? new SvgRenderer(new SvgElement(el2)) : new CanvasRenderer(
        /** @type {HTMLCanvasElement} */
        el2.getContext("2d")
      );
    }
  });
}
function updateCanvas(el, hashOrValue, config) {
  renderDomElement(el, hashOrValue, config, function(el2, iconType) {
    if (iconType == ICON_TYPE_CANVAS) {
      return new CanvasRenderer(
        /** @type {HTMLCanvasElement} */
        el2.getContext("2d")
      );
    }
  });
}
function updateSvg(el, hashOrValue, config) {
  renderDomElement(el, hashOrValue, config, function(el2, iconType) {
    if (iconType == ICON_TYPE_SVG) {
      return new SvgRenderer(new SvgElement(el2));
    }
  });
}
function renderDomElement(el, hashOrValue, config, rendererFactory) {
  if (typeof el === "string") {
    if (documentQuerySelectorAll) {
      const elements = documentQuerySelectorAll(el);
      for (let i = 0; i < elements.length; i++) {
        renderDomElement(elements[i], hashOrValue, config, rendererFactory);
      }
    }
    return;
  }
  const hash = (
    // 1. Explicit valid hash
    isValidHash(hashOrValue) || // 2. Explicit value (`!= null` catches both null and undefined)
    hashOrValue != null && computeHash(hashOrValue) || // 3. `data-jdenticon-hash` attribute
    isValidHash(el.getAttribute(
      ATTRIBUTES.Z
      /*HASH*/
    )) || // 4. `data-jdenticon-value` attribute. 
    // We want to treat an empty attribute as an empty value. 
    // Some browsers return empty string even if the attribute 
    // is not specified, so use hasAttribute to determine if 
    // the attribute is specified.
    el.hasAttribute(
      ATTRIBUTES.T
      /*VALUE*/
    ) && computeHash(el.getAttribute(
      ATTRIBUTES.T
      /*VALUE*/
    ))
  );
  if (!hash) {
    return;
  }
  const renderer = rendererFactory(el, getIdenticonType(el));
  if (renderer) {
    iconGenerator(renderer, hash, config);
  }
}
var version = "3.2.0";
var bundle = "browser-esm";
export {
  bundle,
  configure,
  drawIcon,
  toSvg,
  update,
  updateCanvas,
  updateSvg,
  version
};
//# sourceMappingURL=jdenticon.js.map

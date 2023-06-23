var Ea = Object.defineProperty, ql = Object.getOwnPropertyDescriptor, An = (e, t) => {
  for (var n in t)
    Ea(e, n, { get: t[n], enumerable: !0 });
}, g = (e, t, n, r) => {
  for (var i = r > 1 ? void 0 : r ? ql(t, n) : t, o = e.length - 1, s; o >= 0; o--)
    (s = e[o]) && (i = (r ? s(t, n, i) : s(i)) || i);
  return r && i && Ea(t, n, i), i;
}, ka = (e, t, n) => {
  if (!t.has(e))
    throw TypeError("Cannot " + n);
}, Ns = (e, t, n) => (ka(e, t, "read from private field"), n ? n.call(e) : t.get(e)), Vl = (e, t, n) => {
  if (t.has(e))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(e) : t.set(e, n);
}, Wl = (e, t, n, r) => (ka(e, t, "write to private field"), r ? r.call(e, n) : t.set(e, n), n);
(function() {
  if (typeof document > "u" || "adoptedStyleSheets" in document)
    return;
  var e = "ShadyCSS" in window && !ShadyCSS.nativeShadow, t = document.implementation.createHTMLDocument(""), n = /* @__PURE__ */ new WeakMap(), r = typeof DOMException == "object" ? Error : DOMException, i = Object.defineProperty, o = Array.prototype.forEach, s = /@import.+?;?$/gm;
  function a(S) {
    var T = S.replace(s, "");
    return T !== S && console.warn("@import rules are not allowed here. See https://github.com/WICG/construct-stylesheets/issues/119#issuecomment-588352418"), T.trim();
  }
  function l(S) {
    return "isConnected" in S ? S.isConnected : document.contains(S);
  }
  function c(S) {
    return S.filter(function(T, K) {
      return S.indexOf(T) === K;
    });
  }
  function h(S, T) {
    return S.filter(function(K) {
      return T.indexOf(K) === -1;
    });
  }
  function u(S) {
    S.parentNode.removeChild(S);
  }
  function p(S) {
    return S.shadowRoot || n.get(S);
  }
  var d = ["addRule", "deleteRule", "insertRule", "removeRule"], f = CSSStyleSheet, v = f.prototype;
  v.replace = function() {
    return Promise.reject(new r("Can't call replace on non-constructed CSSStyleSheets."));
  }, v.replaceSync = function() {
    throw new r("Failed to execute 'replaceSync' on 'CSSStyleSheet': Can't call replaceSync on non-constructed CSSStyleSheets.");
  };
  function m(S) {
    return typeof S == "object" ? q.isPrototypeOf(S) || v.isPrototypeOf(S) : !1;
  }
  function b(S) {
    return typeof S == "object" ? v.isPrototypeOf(S) : !1;
  }
  var _ = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new WeakMap(), w = /* @__PURE__ */ new WeakMap(), E = /* @__PURE__ */ new WeakMap();
  function A(S, T) {
    var K = document.createElement("style");
    return w.get(S).set(T, K), j.get(S).push(T), K;
  }
  function O(S, T) {
    return w.get(S).get(T);
  }
  function N(S, T) {
    w.get(S).delete(T), j.set(S, j.get(S).filter(function(K) {
      return K !== T;
    }));
  }
  function F(S, T) {
    requestAnimationFrame(function() {
      T.textContent = _.get(S).textContent, E.get(S).forEach(function(K) {
        return T.sheet[K.method].apply(T.sheet, K.args);
      });
    });
  }
  function M(S) {
    if (!_.has(S))
      throw new TypeError("Illegal invocation");
  }
  function $() {
    var S = this, T = document.createElement("style");
    t.body.appendChild(T), _.set(S, T), j.set(S, []), w.set(S, /* @__PURE__ */ new WeakMap()), E.set(S, []);
  }
  var q = $.prototype;
  q.replace = function(S) {
    try {
      return this.replaceSync(S), Promise.resolve(this);
    } catch (T) {
      return Promise.reject(T);
    }
  }, q.replaceSync = function(S) {
    if (M(this), typeof S == "string") {
      var T = this;
      _.get(T).textContent = a(S), E.set(T, []), j.get(T).forEach(function(K) {
        K.isConnected() && F(T, O(T, K));
      });
    }
  }, i(q, "cssRules", { configurable: !0, enumerable: !0, get: function() {
    return M(this), _.get(this).sheet.cssRules;
  } }), i(q, "media", { configurable: !0, enumerable: !0, get: function() {
    return M(this), _.get(this).sheet.media;
  } }), d.forEach(function(S) {
    q[S] = function() {
      var T = this;
      M(T);
      var K = arguments;
      E.get(T).push({ method: S, args: K }), j.get(T).forEach(function(me) {
        if (me.isConnected()) {
          var le = O(T, me).sheet;
          le[S].apply(le, K);
        }
      });
      var ve = _.get(T).sheet;
      return ve[S].apply(ve, K);
    };
  }), i($, Symbol.hasInstance, { configurable: !0, value: m });
  var R = { childList: !0, subtree: !0 }, ne = /* @__PURE__ */ new WeakMap();
  function X(S) {
    var T = ne.get(S);
    return T || (T = new Re(S), ne.set(S, T)), T;
  }
  function V(S) {
    i(S.prototype, "adoptedStyleSheets", { configurable: !0, enumerable: !0, get: function() {
      return X(this).sheets;
    }, set: function(T) {
      X(this).update(T);
    } });
  }
  function G(S, T) {
    for (var K = document.createNodeIterator(S, NodeFilter.SHOW_ELEMENT, function(me) {
      return p(me) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }, null, !1), ve = void 0; ve = K.nextNode(); )
      T(p(ve));
  }
  var Y = /* @__PURE__ */ new WeakMap(), ae = /* @__PURE__ */ new WeakMap(), $e = /* @__PURE__ */ new WeakMap();
  function Xe(S, T) {
    return T instanceof HTMLStyleElement && ae.get(S).some(function(K) {
      return O(K, S);
    });
  }
  function be(S) {
    var T = Y.get(S);
    return T instanceof Document ? T.body : T;
  }
  function ze(S) {
    var T = document.createDocumentFragment(), K = ae.get(S), ve = $e.get(S), me = be(S);
    ve.disconnect(), K.forEach(function(le) {
      T.appendChild(O(le, S) || A(le, S));
    }), me.insertBefore(T, null), ve.observe(me, R), K.forEach(function(le) {
      F(le, O(le, S));
    });
  }
  function Re(S) {
    var T = this;
    T.sheets = [], Y.set(T, S), ae.set(T, []), $e.set(T, new MutationObserver(function(K, ve) {
      if (!document) {
        ve.disconnect();
        return;
      }
      K.forEach(function(me) {
        e || o.call(me.addedNodes, function(le) {
          le instanceof Element && G(le, function(ct) {
            X(ct).connect();
          });
        }), o.call(me.removedNodes, function(le) {
          le instanceof Element && (Xe(T, le) && ze(T), e || G(le, function(ct) {
            X(ct).disconnect();
          }));
        });
      });
    }));
  }
  if (Re.prototype = { isConnected: function() {
    var S = Y.get(this);
    return S instanceof Document ? S.readyState !== "loading" : l(S.host);
  }, connect: function() {
    var S = be(this);
    $e.get(this).observe(S, R), ae.get(this).length > 0 && ze(this), G(S, function(T) {
      X(T).connect();
    });
  }, disconnect: function() {
    $e.get(this).disconnect();
  }, update: function(S) {
    var T = this, K = Y.get(T) === document ? "Document" : "ShadowRoot";
    if (!Array.isArray(S))
      throw new TypeError("Failed to set the 'adoptedStyleSheets' property on " + K + ": Iterator getter is not callable.");
    if (!S.every(m))
      throw new TypeError("Failed to set the 'adoptedStyleSheets' property on " + K + ": Failed to convert value to 'CSSStyleSheet'");
    if (S.some(b))
      throw new TypeError("Failed to set the 'adoptedStyleSheets' property on " + K + ": Can't adopt non-constructed stylesheets");
    T.sheets = S;
    var ve = ae.get(T), me = c(S), le = h(ve, me);
    le.forEach(function(ct) {
      u(O(ct, T)), N(ct, T);
    }), ae.set(T, me), T.isConnected() && me.length > 0 && ze(T);
  } }, window.CSSStyleSheet = $, V(Document), "ShadowRoot" in window) {
    V(ShadowRoot);
    var Ce = Element.prototype, nn = Ce.attachShadow;
    Ce.attachShadow = function(S) {
      var T = nn.call(this, S);
      return S.mode === "closed" && n.set(this, T), T;
    };
  }
  var qe = X(document);
  qe.isConnected() ? qe.connect() : document.addEventListener("DOMContentLoaded", qe.connect.bind(qe));
})();
var Br = window, Vo = Br.ShadowRoot && (Br.ShadyCSS === void 0 || Br.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Wo = Symbol(), Is = /* @__PURE__ */ new WeakMap(), Sa = class {
  constructor(e, t, n) {
    if (this._$cssResult$ = !0, n !== Wo)
      throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o, t = this.t;
    if (Vo && e === void 0) {
      let n = t !== void 0 && t.length === 1;
      n && (e = Is.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && Is.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
}, Hl = (e) => new Sa(typeof e == "string" ? e : e + "", void 0, Wo), Z = (e, ...t) => {
  let n = e.length === 1 ? e[0] : t.reduce((r, i, o) => r + ((s) => {
    if (s._$cssResult$ === !0)
      return s.cssText;
    if (typeof s == "number")
      return s;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + s + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + e[o + 1], e[0]);
  return new Sa(n, e, Wo);
}, br = (e, t) => {
  Vo ? e.adoptedStyleSheets = t.map((n) => n instanceof CSSStyleSheet ? n : n.styleSheet) : t.forEach((n) => {
    let r = document.createElement("style"), i = Br.litNonce;
    i !== void 0 && r.setAttribute("nonce", i), r.textContent = n.cssText, e.appendChild(r);
  });
}, Rs = Vo ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let n = "";
  for (let r of t.cssRules)
    n += r.cssText;
  return Hl(n);
})(e) : e, zi, ei = window, Cs = ei.trustedTypes, Gl = Cs ? Cs.emptyScript : "", Ds = ei.reactiveElementPolyfillSupport, ro = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Gl : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let n = e;
  switch (t) {
    case Boolean:
      n = e !== null;
      break;
    case Number:
      n = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        n = JSON.parse(e);
      } catch {
        n = null;
      }
  }
  return n;
} }, Aa = (e, t) => t !== e && (t == t || e == e), Li = { attribute: !0, type: String, converter: ro, reflect: !1, hasChanged: Aa }, pn = class extends HTMLElement {
  constructor() {
    super(), this._$Ei = /* @__PURE__ */ new Map(), this.isUpdatePending = !1, this.hasUpdated = !1, this._$El = null, this.u();
  }
  static addInitializer(e) {
    var t;
    this.finalize(), ((t = this.h) !== null && t !== void 0 ? t : this.h = []).push(e);
  }
  static get observedAttributes() {
    this.finalize();
    let e = [];
    return this.elementProperties.forEach((t, n) => {
      let r = this._$Ep(n, t);
      r !== void 0 && (this._$Ev.set(r, n), e.push(r));
    }), e;
  }
  static createProperty(e, t = Li) {
    if (t.state && (t.attribute = !1), this.finalize(), this.elementProperties.set(e, t), !t.noAccessor && !this.prototype.hasOwnProperty(e)) {
      let n = typeof e == "symbol" ? Symbol() : "__" + e, r = this.getPropertyDescriptor(e, n, t);
      r !== void 0 && Object.defineProperty(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, n) {
    return { get() {
      return this[t];
    }, set(r) {
      let i = this[e];
      this[t] = r, this.requestUpdate(e, i, n);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) || Li;
  }
  static finalize() {
    if (this.hasOwnProperty("finalized"))
      return !1;
    this.finalized = !0;
    let e = Object.getPrototypeOf(this);
    if (e.finalize(), e.h !== void 0 && (this.h = [...e.h]), this.elementProperties = new Map(e.elementProperties), this._$Ev = /* @__PURE__ */ new Map(), this.hasOwnProperty("properties")) {
      let t = this.properties, n = [...Object.getOwnPropertyNames(t), ...Object.getOwnPropertySymbols(t)];
      for (let r of n)
        this.createProperty(r, t[r]);
    }
    return this.elementStyles = this.finalizeStyles(this.styles), !0;
  }
  static finalizeStyles(e) {
    let t = [];
    if (Array.isArray(e)) {
      let n = new Set(e.flat(1 / 0).reverse());
      for (let r of n)
        t.unshift(Rs(r));
    } else
      e !== void 0 && t.push(Rs(e));
    return t;
  }
  static _$Ep(e, t) {
    let n = t.attribute;
    return n === !1 ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  u() {
    var e;
    this._$E_ = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$Eg(), this.requestUpdate(), (e = this.constructor.h) === null || e === void 0 || e.forEach((t) => t(this));
  }
  addController(e) {
    var t, n;
    ((t = this._$ES) !== null && t !== void 0 ? t : this._$ES = []).push(e), this.renderRoot !== void 0 && this.isConnected && ((n = e.hostConnected) === null || n === void 0 || n.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$ES) === null || t === void 0 || t.splice(this._$ES.indexOf(e) >>> 0, 1);
  }
  _$Eg() {
    this.constructor.elementProperties.forEach((e, t) => {
      this.hasOwnProperty(t) && (this._$Ei.set(t, this[t]), delete this[t]);
    });
  }
  createRenderRoot() {
    var e;
    let t = (e = this.shadowRoot) !== null && e !== void 0 ? e : this.attachShadow(this.constructor.shadowRootOptions);
    return br(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var e;
    this.renderRoot === void 0 && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$ES) === null || e === void 0 || e.forEach((t) => {
      var n;
      return (n = t.hostConnected) === null || n === void 0 ? void 0 : n.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$ES) === null || e === void 0 || e.forEach((t) => {
      var n;
      return (n = t.hostDisconnected) === null || n === void 0 ? void 0 : n.call(t);
    });
  }
  attributeChangedCallback(e, t, n) {
    this._$AK(e, n);
  }
  _$EO(e, t, n = Li) {
    var r;
    let i = this.constructor._$Ep(e, n);
    if (i !== void 0 && n.reflect === !0) {
      let o = (((r = n.converter) === null || r === void 0 ? void 0 : r.toAttribute) !== void 0 ? n.converter : ro).toAttribute(t, n.type);
      this._$El = e, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$El = null;
    }
  }
  _$AK(e, t) {
    var n;
    let r = this.constructor, i = r._$Ev.get(e);
    if (i !== void 0 && this._$El !== i) {
      let o = r.getPropertyOptions(i), s = typeof o.converter == "function" ? { fromAttribute: o.converter } : ((n = o.converter) === null || n === void 0 ? void 0 : n.fromAttribute) !== void 0 ? o.converter : ro;
      this._$El = i, this[i] = s.fromAttribute(t, o.type), this._$El = null;
    }
  }
  requestUpdate(e, t, n) {
    let r = !0;
    e !== void 0 && (((n = n || this.constructor.getPropertyOptions(e)).hasChanged || Aa)(this[e], t) ? (this._$AL.has(e) || this._$AL.set(e, t), n.reflect === !0 && this._$El !== e && (this._$EC === void 0 && (this._$EC = /* @__PURE__ */ new Map()), this._$EC.set(e, n))) : r = !1), !this.isUpdatePending && r && (this._$E_ = this._$Ej());
  }
  async _$Ej() {
    this.isUpdatePending = !0;
    try {
      await this._$E_;
    } catch (t) {
      Promise.reject(t);
    }
    let e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var e;
    if (!this.isUpdatePending)
      return;
    this.hasUpdated, this._$Ei && (this._$Ei.forEach((r, i) => this[i] = r), this._$Ei = void 0);
    let t = !1, n = this._$AL;
    try {
      t = this.shouldUpdate(n), t ? (this.willUpdate(n), (e = this._$ES) === null || e === void 0 || e.forEach((r) => {
        var i;
        return (i = r.hostUpdate) === null || i === void 0 ? void 0 : i.call(r);
      }), this.update(n)) : this._$Ek();
    } catch (r) {
      throw t = !1, this._$Ek(), r;
    }
    t && this._$AE(n);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$ES) === null || t === void 0 || t.forEach((n) => {
      var r;
      return (r = n.hostUpdated) === null || r === void 0 ? void 0 : r.call(n);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$Ek() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$E_;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$EC !== void 0 && (this._$EC.forEach((t, n) => this._$EO(n, this[n], t)), this._$EC = void 0), this._$Ek();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
pn.finalized = !0, pn.elementProperties = /* @__PURE__ */ new Map(), pn.elementStyles = [], pn.shadowRootOptions = { mode: "open" }, Ds == null || Ds({ ReactiveElement: pn }), ((zi = ei.reactiveElementVersions) !== null && zi !== void 0 ? zi : ei.reactiveElementVersions = []).push("1.6.1");
var Bi, ti = window, vn = ti.trustedTypes, Ps = vn ? vn.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, io = "$lit$", ft = `lit$${(Math.random() + "").slice(9)}$`, Oa = "?" + ft, Yl = `<${Oa}>`, mn = document, er = () => mn.createComment(""), tr = (e) => e === null || typeof e != "object" && typeof e != "function", Ta = Array.isArray, Jl = (e) => Ta(e) || typeof (e == null ? void 0 : e[Symbol.iterator]) == "function", Fi = `[ 	
\f\r]`, $n = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ms = /-->/g, $s = />/g, Nt = RegExp(`>|${Fi}(?:([^\\s"'>=/]+)(${Fi}*=${Fi}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), zs = /'/g, Ls = /"/g, Na = /^(?:script|style|textarea|title)$/i, Xl = (e) => (t, ...n) => ({ _$litType$: e, strings: t, values: n }), B = Xl(1), Bt = Symbol.for("lit-noChange"), ie = Symbol.for("lit-nothing"), Bs = /* @__PURE__ */ new WeakMap(), dn = mn.createTreeWalker(mn, 129, null, !1), Ql = (e, t) => {
  let n = e.length - 1, r = [], i, o = t === 2 ? "<svg>" : "", s = $n;
  for (let l = 0; l < n; l++) {
    let c = e[l], h, u, p = -1, d = 0;
    for (; d < c.length && (s.lastIndex = d, u = s.exec(c), u !== null); )
      d = s.lastIndex, s === $n ? u[1] === "!--" ? s = Ms : u[1] !== void 0 ? s = $s : u[2] !== void 0 ? (Na.test(u[2]) && (i = RegExp("</" + u[2], "g")), s = Nt) : u[3] !== void 0 && (s = Nt) : s === Nt ? u[0] === ">" ? (s = i ?? $n, p = -1) : u[1] === void 0 ? p = -2 : (p = s.lastIndex - u[2].length, h = u[1], s = u[3] === void 0 ? Nt : u[3] === '"' ? Ls : zs) : s === Ls || s === zs ? s = Nt : s === Ms || s === $s ? s = $n : (s = Nt, i = void 0);
    let f = s === Nt && e[l + 1].startsWith("/>") ? " " : "";
    o += s === $n ? c + Yl : p >= 0 ? (r.push(h), c.slice(0, p) + io + c.slice(p) + ft + f) : c + ft + (p === -2 ? (r.push(void 0), l) : f);
  }
  let a = o + (e[n] || "<?>") + (t === 2 ? "</svg>" : "");
  if (!Array.isArray(e) || !e.hasOwnProperty("raw"))
    throw Error("invalid template strings array");
  return [Ps !== void 0 ? Ps.createHTML(a) : a, r];
}, ni = class {
  constructor({ strings: e, _$litType$: t }, n) {
    let r;
    this.parts = [];
    let i = 0, o = 0, s = e.length - 1, a = this.parts, [l, c] = Ql(e, t);
    if (this.el = ni.createElement(l, n), dn.currentNode = this.el.content, t === 2) {
      let h = this.el.content, u = h.firstChild;
      u.remove(), h.append(...u.childNodes);
    }
    for (; (r = dn.nextNode()) !== null && a.length < s; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) {
          let h = [];
          for (let u of r.getAttributeNames())
            if (u.endsWith(io) || u.startsWith(ft)) {
              let p = c[o++];
              if (h.push(u), p !== void 0) {
                let d = r.getAttribute(p.toLowerCase() + io).split(ft), f = /([.?@])?(.*)/.exec(p);
                a.push({ type: 1, index: i, name: f[2], strings: d, ctor: f[1] === "." ? ec : f[1] === "?" ? nc : f[1] === "@" ? rc : Oi });
              } else
                a.push({ type: 6, index: i });
            }
          for (let u of h)
            r.removeAttribute(u);
        }
        if (Na.test(r.tagName)) {
          let h = r.textContent.split(ft), u = h.length - 1;
          if (u > 0) {
            r.textContent = vn ? vn.emptyScript : "";
            for (let p = 0; p < u; p++)
              r.append(h[p], er()), dn.nextNode(), a.push({ type: 2, index: ++i });
            r.append(h[u], er());
          }
        }
      } else if (r.nodeType === 8)
        if (r.data === Oa)
          a.push({ type: 2, index: i });
        else {
          let h = -1;
          for (; (h = r.data.indexOf(ft, h + 1)) !== -1; )
            a.push({ type: 7, index: i }), h += ft.length - 1;
        }
      i++;
    }
  }
  static createElement(e, t) {
    let n = mn.createElement("template");
    return n.innerHTML = e, n;
  }
};
function gn(e, t, n = e, r) {
  var i, o, s, a;
  if (t === Bt)
    return t;
  let l = r !== void 0 ? (i = n._$Co) === null || i === void 0 ? void 0 : i[r] : n._$Cl, c = tr(t) ? void 0 : t._$litDirective$;
  return (l == null ? void 0 : l.constructor) !== c && ((o = l == null ? void 0 : l._$AO) === null || o === void 0 || o.call(l, !1), c === void 0 ? l = void 0 : (l = new c(e), l._$AT(e, n, r)), r !== void 0 ? ((s = (a = n)._$Co) !== null && s !== void 0 ? s : a._$Co = [])[r] = l : n._$Cl = l), l !== void 0 && (t = gn(e, l._$AS(e, t.values), l, r)), t;
}
var Zl = class {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    var t;
    let { el: { content: n }, parts: r } = this._$AD, i = ((t = e == null ? void 0 : e.creationScope) !== null && t !== void 0 ? t : mn).importNode(n, !0);
    dn.currentNode = i;
    let o = dn.nextNode(), s = 0, a = 0, l = r[0];
    for (; l !== void 0; ) {
      if (s === l.index) {
        let c;
        l.type === 2 ? c = new Ai(o, o.nextSibling, this, e) : l.type === 1 ? c = new l.ctor(o, l.name, l.strings, this, e) : l.type === 6 && (c = new ic(o, this, e)), this._$AV.push(c), l = r[++a];
      }
      s !== (l == null ? void 0 : l.index) && (o = dn.nextNode(), s++);
    }
    return i;
  }
  v(e) {
    let t = 0;
    for (let n of this._$AV)
      n !== void 0 && (n.strings !== void 0 ? (n._$AI(e, n, t), t += n.strings.length - 2) : n._$AI(e[t])), t++;
  }
}, Ai = class {
  constructor(e, t, n, r) {
    var i;
    this.type = 2, this._$AH = ie, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cp = (i = r == null ? void 0 : r.isConnected) === null || i === void 0 || i;
  }
  get _$AU() {
    var e, t;
    return (t = (e = this._$AM) === null || e === void 0 ? void 0 : e._$AU) !== null && t !== void 0 ? t : this._$Cp;
  }
  get parentNode() {
    let e = this._$AA.parentNode, t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = gn(this, e, t), tr(e) ? e === ie || e == null || e === "" ? (this._$AH !== ie && this._$AR(), this._$AH = ie) : e !== this._$AH && e !== Bt && this._(e) : e._$litType$ !== void 0 ? this.g(e) : e.nodeType !== void 0 ? this.$(e) : Jl(e) ? this.T(e) : this._(e);
  }
  k(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  $(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.k(e));
  }
  _(e) {
    this._$AH !== ie && tr(this._$AH) ? this._$AA.nextSibling.data = e : this.$(mn.createTextNode(e)), this._$AH = e;
  }
  g(e) {
    var t;
    let { values: n, _$litType$: r } = e, i = typeof r == "number" ? this._$AC(e) : (r.el === void 0 && (r.el = ni.createElement(r.h, this.options)), r);
    if (((t = this._$AH) === null || t === void 0 ? void 0 : t._$AD) === i)
      this._$AH.v(n);
    else {
      let o = new Zl(i, this), s = o.u(this.options);
      o.v(n), this.$(s), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Bs.get(e.strings);
    return t === void 0 && Bs.set(e.strings, t = new ni(e)), t;
  }
  T(e) {
    Ta(this._$AH) || (this._$AH = [], this._$AR());
    let t = this._$AH, n, r = 0;
    for (let i of e)
      r === t.length ? t.push(n = new Ai(this.k(er()), this.k(er()), this, this.options)) : n = t[r], n._$AI(i), r++;
    r < t.length && (this._$AR(n && n._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var n;
    for ((n = this._$AP) === null || n === void 0 || n.call(this, !1, !0, t); e && e !== this._$AB; ) {
      let r = e.nextSibling;
      e.remove(), e = r;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cp = e, (t = this._$AP) === null || t === void 0 || t.call(this, e));
  }
}, Oi = class {
  constructor(e, t, n, r, i) {
    this.type = 1, this._$AH = ie, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(new String()), this.strings = n) : this._$AH = ie;
  }
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e, t = this, n, r) {
    let i = this.strings, o = !1;
    if (i === void 0)
      e = gn(this, e, t, 0), o = !tr(e) || e !== this._$AH && e !== Bt, o && (this._$AH = e);
    else {
      let s = e, a, l;
      for (e = i[0], a = 0; a < i.length - 1; a++)
        l = gn(this, s[n + a], t, a), l === Bt && (l = this._$AH[a]), o || (o = !tr(l) || l !== this._$AH[a]), l === ie ? e = ie : e !== ie && (e += (l ?? "") + i[a + 1]), this._$AH[a] = l;
    }
    o && !r && this.j(e);
  }
  j(e) {
    e === ie ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}, ec = class extends Oi {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === ie ? void 0 : e;
  }
}, tc = vn ? vn.emptyScript : "", nc = class extends Oi {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    e && e !== ie ? this.element.setAttribute(this.name, tc) : this.element.removeAttribute(this.name);
  }
}, rc = class extends Oi {
  constructor(e, t, n, r, i) {
    super(e, t, n, r, i), this.type = 5;
  }
  _$AI(e, t = this) {
    var n;
    if ((e = (n = gn(this, e, t, 0)) !== null && n !== void 0 ? n : ie) === Bt)
      return;
    let r = this._$AH, i = e === ie && r !== ie || e.capture !== r.capture || e.once !== r.once || e.passive !== r.passive, o = e !== ie && (r === ie || i);
    i && this.element.removeEventListener(this.name, this, r), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t, n;
    typeof this._$AH == "function" ? this._$AH.call((n = (t = this.options) === null || t === void 0 ? void 0 : t.host) !== null && n !== void 0 ? n : this.element, e) : this._$AH.handleEvent(e);
  }
}, ic = class {
  constructor(e, t, n) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    gn(this, e);
  }
}, Fs = ti.litHtmlPolyfillSupport;
Fs == null || Fs(ni, Ai), ((Bi = ti.litHtmlVersions) !== null && Bi !== void 0 ? Bi : ti.litHtmlVersions = []).push("2.7.3");
var oc = (e, t, n) => {
  var r, i;
  let o = (r = n == null ? void 0 : n.renderBefore) !== null && r !== void 0 ? r : t, s = o._$litPart$;
  if (s === void 0) {
    let a = (i = n == null ? void 0 : n.renderBefore) !== null && i !== void 0 ? i : null;
    o._$litPart$ = s = new Ai(t.insertBefore(er(), a), a, void 0, n ?? {});
  }
  return s._$AI(e), s;
}, Ki, Ui, W = class extends pn {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e, t;
    let n = super.createRenderRoot();
    return (e = (t = this.renderOptions).renderBefore) !== null && e !== void 0 || (t.renderBefore = n.firstChild), n;
  }
  update(e) {
    let t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = oc(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) === null || e === void 0 || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) === null || e === void 0 || e.setConnected(!1);
  }
  render() {
    return Bt;
  }
};
W.finalized = !0, W._$litElement$ = !0, (Ki = globalThis.litElementHydrateSupport) === null || Ki === void 0 || Ki.call(globalThis, { LitElement: W });
var Ks = globalThis.litElementPolyfillSupport;
Ks == null || Ks({ LitElement: W });
((Ui = globalThis.litElementVersions) !== null && Ui !== void 0 ? Ui : globalThis.litElementVersions = []).push("3.3.2");
var oe = (e) => (t) => typeof t == "function" ? ((n, r) => (customElements.define(n, r), r))(e, t) : ((n, r) => {
  let { kind: i, elements: o } = r;
  return { kind: i, elements: o, finisher(s) {
    customElements.define(n, s);
  } };
})(e, t), sc = (e, t) => t.kind === "method" && t.descriptor && !("value" in t.descriptor) ? { ...t, finisher(n) {
  n.createProperty(t.key, e);
} } : { kind: "field", key: Symbol(), placement: "own", descriptor: {}, originalKey: t.key, initializer() {
  typeof t.initializer == "function" && (this[t.key] = t.initializer.call(this));
}, finisher(n) {
  n.createProperty(t.key, e);
} };
function k(e) {
  return (t, n) => n !== void 0 ? ((r, i, o) => {
    i.constructor.createProperty(o, r);
  })(e, t, n) : sc(e, t);
}
function mt(e) {
  return k({ ...e, state: !0 });
}
var qi;
((qi = window.HTMLSlotElement) === null || qi === void 0 ? void 0 : qi.prototype.assignedElements) != null;
var H = Z`:host{box-sizing:border-box}:host *,:host :after,:host :before{box-sizing:inherit}:host :focus{outline:0}[hidden]{display:none!important}::-webkit-scrollbar{width:var(--j-scrollbar-width)}::-webkit-scrollbar-track{background-image:var(--j-scrollbar-background-image);background:var(--j-scrollbar-background)}::-webkit-scrollbar-corner{background:var(--j-scrollbar-corner-background)}::-webkit-scrollbar-thumb{box-shadow:var(--j-scrollbar-thumb-box-shadow);border-radius:var(--j-scrollbar-thumb-border-radius);background-color:var(--j-scrollbar-thumb-background)}`, ac = Z`:host{--j-button-opacity:1;--j-button-text-decoration:none;--j-button-depth:none;--j-button-display:inline-flex;--j-button-width:initial;--j-button-padding:0 var(--j-space-400);--j-button-bg:var(--j-color-white);--j-button-border:1px solid var(--j-color-primary-600);--j-button-color:var(--j-color-primary-600);--j-button-height:var(--j-size-md);--j-button-border-radius:var(--j-border-radius);--j-button-font-size:var(--j-font-size-500)}[part=base]{opacity:var(--j-button-opacity);text-decoration:var(--j-button-text-decoration);transition:box-shadow .2s ease;cursor:pointer;border:0;gap:var(--j-space-400);align-items:center;justify-content:center;box-shadow:var(--j-button-depth);display:var(--j-button-display);width:var(--j-button-width);padding:var(--j-button-padding);height:var(--j-button-height);border-radius:var(--j-button-border-radius);background:var(--j-button-bg);color:var(--j-button-color);fill:var(--j-button-color);font-size:var(--j-button-font-size);font-family:inherit;font-weight:600;border:var(--j-button-border);position:relative;white-space:nowrap}:host([disabled]) [part=base]{--j-button-opacity:0.5;cursor:default}j-spinner{display:none;position:absolute;top:50%;left:50%;transform:translateX(-50%) translateY(-50%)}:host([loading]) j-spinner{display:block;--j-spinner-size:calc(var(--j-button-height) / 2);--j-spinner-color:var(--j-button-color)}:host([loading]) [part=base] slot{visibility:hidden;opacity:0}:host([variant=primary]){--j-button-bg:var(--j-color-primary-600);--j-button-color:var(--j-color-white);--j-button-border:1px solid transparent}:host([variant=primary]:hover){--j-button-bg:var(--j-color-primary-700);cursor:pointer}:host([variant=link]){--j-button-color:var(--j-color-primary-700);--j-button-bg:transparent;--j-button-border:1px solid transparent}:host([variant=link]:hover){--j-button-bg:transparent;--j-button-text-decoration:underline;--j-button-color:var(--j-color-primary-600)}:host([variant=subtle]){--j-button-bg:rgb(0 0 0 / 10%);--j-button-color:var(--j-color-ui-800);--j-button-border:1px solid transparent}:host([variant=subtle]:hover){--j-button-color:var(--j-color-black);--j-button-bg:rgb(0 0 0 / 15%)}:host([variant=ghost]){--j-button-opacity:0.5;--j-button-bg:transparent;--j-button-color:currentColor;--j-button-border:1px solid transparent}:host([variant=ghost]:hover){--j-button-opacity:1}:host([variant=danger]){--j-button-bg:var(--j-color-danger-200);--j-button-color:currentColor;--j-button-border:1px solid transparent}:host([variant=danger]:hover){--j-button-opacity:1}:host([size=xs]){--j-button-font-size:var(--j-font-size-400);--j-button-padding:0 var(--j-space-200);--j-button-height:var(--j-size-xs)}:host([size=sm]){--j-button-font-size:var(--j-font-size-400);--j-button-padding:0 var(--j-space-300);--j-button-height:var(--j-size-sm)}:host([size=lg]){--j-button-font-size:var(--j-font-size-500);--j-button-height:var(--j-size-lg);--j-button-padding:0 var(--j-space-600)}:host([size=xl]){--j-button-font-size:var(--j-font-size-600);--j-button-height:var(--j-size-xl);--j-button-padding:0 var(--j-space-600)}:host([full]){--j-button-display:flex;--j-button-width:100%}:host([square]){--j-button-padding:0;--j-button-width:var(--j-button-height)}:host([circle]){--j-button-width:var(--j-button-height);--j-button-border-radius:50%}`, Le = class extends W {
  constructor() {
    super(...arguments), this.variant = null, this.href = null, this.size = null, this.disabled = !1, this.loading = !1, this.square = !1, this.full = !1, this.circle = !1;
  }
  handleClick(e) {
    (this.disabled || this.loading) && (e.preventDefault(), e.stopPropagation());
  }
  render() {
    return this.href ? B`<a href="${this.href}" @click="${this.handleClick}" target="_blank" part="base"><j-spinner></j-spinner><slot name="start"></slot><slot></slot><slot name="end"></slot></a>` : B`<button ?disabled="${this.disabled || this.loading}" @click="${this.handleClick}" part="base"><j-spinner></j-spinner><slot name="start"></slot><slot></slot><slot name="end"></slot></button>`;
  }
};
Le.styles = [H, ac], g([k({ type: String, reflect: !0 })], Le.prototype, "variant", 2), g([k({ type: String, reflect: !0 })], Le.prototype, "href", 2), g([k({ type: String, reflect: !0 })], Le.prototype, "size", 2), g([k({ type: Boolean, reflect: !0 })], Le.prototype, "disabled", 2), g([k({ type: Boolean, reflect: !0 })], Le.prototype, "loading", 2), g([k({ type: Boolean, reflect: !0 })], Le.prototype, "square", 2), g([k({ type: Boolean, reflect: !0 })], Le.prototype, "full", 2), g([k({ type: Boolean, reflect: !0 })], Le.prototype, "circle", 2), Le = g([oe("j-button")], Le);
var lc = Z`:host{--j-text-transform:normal;--j-text-color:var(--j-color-ui-800);--j-text-weight:initial;--j-text-font-size:var(--j-font-size-500);--j-text-margin-bottom:0;--j-text-display:block;--j-text-family:inherit;--j-text-letter-spacing:normal;--j-text-heading-letter-spacing:1px;--j-text-heading-family:inherit;--j-text-line-height:inherit}:host>:first-child{margin:0;line-height:var(--j-text-line-height);letter-spacing:var(--j-text-letter-spacing);font-family:var(--j-text-family);text-transform:var(--j-text-transform);display:var(--j-text-display);color:var(--j-text-color);font-weight:var(--j-text-weight);font-size:var(--j-text-font-size);margin-bottom:var(--j-text-margin-bottom)}:host([inline]){--j-text-display:inline-block}:host([uppercase]){--j-text-transform:uppercase}:host([variant=heading]){--j-text-color:var(--j-color-black);--j-text-font-size:var(--j-font-size-700);--j-text-weight:600;--j-text-margin-bottom:var(--j-space-400);--j-text-family:var(--j-text-heading-family);--j-text-letter-spacing:var(--j-text-heading-letter-spacing)}:host([variant=heading-sm]){--j-text-color:var(--j-color-black);--j-text-font-size:var(--j-font-size-600);--j-text-weight:600;--j-text-margin-bottom:var(--j-space-300);--j-text-family:var(--j-text-heading-family);--j-text-letter-spacing:var(--j-text-heading-letter-spacing)}:host([variant=heading-lg]){--j-text-color:var(--j-color-black);--j-text-font-size:var(--j-font-size-800);--j-text-weight:600;--j-text-margin-bottom:var(--j-space-600);--j-text-family:var(--j-text-heading-family);--j-text-line-height:1;--j-text-letter-spacing:var(--j-text-heading-letter-spacing)}:host([variant=subheading]){--j-text-color:var(--j-color-black);--j-text-font-size:var(--j-font-size-700);--j-text-weight:400;--j-text-margin-bottom:var(--j-space-600);--j-text-family:var(--j-text-heading-family);--j-text-letter-spacing:var(--j-text-heading-letter-spacing)}:host([variant=ingress]){--j-text-color:var(--j-color-ui-700);--j-text-font-size:var(--j-font-size-600);--j-text-weight:400;--j-text-margin-bottom:var(--j-space-500)}:host([variant=body]){--j-text-color:var(--j-color-ui-600);--j-text-font-size:var(--j-font-size-500);--j-text-weight:400;--j-text-margin-bottom:var(--j-space-400)}:host([variant=footnote]){--j-text-color:var(--j-color-ui-600);--j-text-font-size:var(--j-font-size-400);--j-text-weight:400;--j-text-margin-bottom:var(--j-space-300)}:host([variant=label]){--j-text-display:block;--j-text-color:var(--j-color-ui-500);--j-text-font-size:var(--j-font-size-500);--j-text-weight:500;--j-text-margin-bottom:var(--j-space-300)}:host([nomargin]){--j-text-margin-bottom:0}`, Be = class extends W {
  constructor() {
    super(...arguments), this.size = null, this.variant = "body", this.tag = null, this.nomargin = !1, this.inline = !1, this.uppercase = !1, this.color = null, this.weight = null;
  }
  shouldUpdate(e) {
    return e.has("size") && (this.size ? this.style.setProperty("--j-text-font-size", `var(--j-font-size-${this.size})`) : this.style.removeProperty("--j-text-font-size")), e.has("weight") && (this.weight ? this.style.setProperty("--j-text-weight", this.weight) : this.style.removeProperty("--j-text-weight")), e.has("color") && (this.color ? this.style.setProperty("--j-text-color", `var(--j-color-${this.color})`) : this.style.removeProperty("--j-text-color")), !0;
  }
  render() {
    switch (this.tag) {
      case "h1":
        return B`<h1 part="base"><slot></slot></h1>`;
      case "h2":
        return B`<h2 part="base"><slot></slot></h2>`;
      case "h3":
        return B`<h3 part="base"><slot></slot></h3>`;
      case "h4":
        return B`<h4 part="base"><slot></slot></h4>`;
      case "h5":
        return B`<h5 part="base"><slot></slot></h5>`;
      case "h6":
        return B`<h6 part="base"><slot></slot></h6>`;
      case "p":
        return B`<p part="base"><slot></slot></p>`;
      case "small":
        return B`<small part="base"><slot></slot></small>`;
      case "b":
        return B`<b part="base"><slot></slot></b>`;
      case "i":
        return B`<i part="base"><slot></slot></i>`;
      case "span":
        return B`<span part="base"><slot></slot></span>`;
      case "label":
        return B`<label part="base"><slot></slot></label>`;
      case "div":
        return B`<div part="base"><slot></slot></div>`;
      default:
        return B`<div part="base"><slot></slot></div>`;
    }
  }
};
Be.styles = [H, lc], g([k({ type: String, reflect: !0 })], Be.prototype, "size", 2), g([k({ type: String, reflect: !0 })], Be.prototype, "variant", 2), g([k({ type: String, reflect: !0 })], Be.prototype, "tag", 2), g([k({ type: Boolean, reflect: !0 })], Be.prototype, "nomargin", 2), g([k({ type: Boolean, reflect: !0 })], Be.prototype, "inline", 2), g([k({ type: Boolean, reflect: !0 })], Be.prototype, "uppercase", 2), g([k({ type: String, reflect: !0 })], Be.prototype, "color", 2), g([k({ type: String, reflect: !0 })], Be.prototype, "weight", 2), Be = g([oe("j-text")], Be);
function Ho(e, t) {
  let n = new CSSStyleSheet();
  return n.replaceSync(`:host { ${e}: ${t}; }`), n;
}
function Fe(e, t, n = "0") {
  return t ? `var(--${e}-${t})` : n;
}
var Ia = Z`:host{--j-box-bg-color:none;--j-box-bg-color-hover:none;--j-box-border-color:none;--j-box-border-color-hover:none;--j-box-border-radius:none;--j-box-display:block;--j-box-padding:0px;--j-box-margin:0px;--j-box-color:inherit}:host([inline]){--j-box-display:inline-block}[part=base]{color:var(--j-box-color);border-radius:var(--j-box-border-radius);background-color:var(--j-box-bg-color);padding:var(--j-box-padding);margin:var(--j-box-margin)}`, ce = class extends W {
  constructor() {
    super(...arguments), this.p = null, this.pl = null, this.pr = null, this.pt = null, this.pb = null, this.px = null, this.py = null, this.m = null, this.ml = null, this.mr = null, this.mt = null, this.mb = null, this.mx = null, this.my = null, this.bg = null, this.color = null, this.radius = null;
  }
  shouldUpdate() {
    let e = new CSSStyleSheet();
    return e.replaceSync(`
      :host {
        --j-box-bg-color: var(--j-color-${this.bg});
        --j-box-color: var(--j-color-${this.color});
        --j-box-border-radius: var(--j-border-radius-${this.radius});
        --j-box-padding: 
          ${Fe("j-space", this.pt || this.py || this.p)}
          ${Fe("j-space", this.pr || this.px || this.p)}
          ${Fe("j-space", this.pb || this.py || this.p)}
          ${Fe("j-space", this.pl || this.px || this.p)};
        --j-box-margin: 
          ${Fe("j-space", this.mt || this.my || this.m)}
          ${Fe("j-space", this.mr || this.mx || this.m)}
          ${Fe("j-space", this.mb || this.my || this.m)}
          ${Fe("j-space", this.ml || this.mx || this.m)}  
      }
    `), br(this.shadowRoot, [Ia, H, e]), !0;
  }
  render() {
    return B`<div part="base"><slot></slot></div>`;
  }
};
ce.styles = [H, Ia], g([k({ type: String, reflect: !0 })], ce.prototype, "p", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "pl", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "pr", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "pt", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "pb", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "px", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "py", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "m", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "ml", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "mr", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "mt", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "mb", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "mx", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "my", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "bg", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "color", 2), g([k({ type: String, reflect: !0 })], ce.prototype, "radius", 2), ce = g([oe("j-box")], ce);
var Ee = "top", Pe = "bottom", Me = "right", ke = "left", Go = "auto", jr = [Ee, Pe, Me, ke], yn = "start", nr = "end", cc = "clippingParents", Ra = "viewport", zn = "popper", uc = "reference", Us = jr.reduce(function(e, t) {
  return e.concat([t + "-" + yn, t + "-" + nr]);
}, []), Ca = [].concat(jr, [Go]).reduce(function(e, t) {
  return e.concat([t, t + "-" + yn, t + "-" + nr]);
}, []), pc = "beforeRead", hc = "read", dc = "afterRead", fc = "beforeMain", vc = "main", mc = "afterMain", gc = "beforeWrite", yc = "write", bc = "afterWrite", jc = [pc, hc, dc, fc, vc, mc, gc, yc, bc];
function Ge(e) {
  return e ? (e.nodeName || "").toLowerCase() : null;
}
function Te(e) {
  if (e == null)
    return window;
  if (e.toString() !== "[object Window]") {
    var t = e.ownerDocument;
    return t && t.defaultView || window;
  }
  return e;
}
function Ft(e) {
  var t = Te(e).Element;
  return e instanceof t || e instanceof Element;
}
function De(e) {
  var t = Te(e).HTMLElement;
  return e instanceof t || e instanceof HTMLElement;
}
function Yo(e) {
  if (typeof ShadowRoot > "u")
    return !1;
  var t = Te(e).ShadowRoot;
  return e instanceof t || e instanceof ShadowRoot;
}
function xc(e) {
  var t = e.state;
  Object.keys(t.elements).forEach(function(n) {
    var r = t.styles[n] || {}, i = t.attributes[n] || {}, o = t.elements[n];
    !De(o) || !Ge(o) || (Object.assign(o.style, r), Object.keys(i).forEach(function(s) {
      var a = i[s];
      a === !1 ? o.removeAttribute(s) : o.setAttribute(s, a === !0 ? "" : a);
    }));
  });
}
function wc(e) {
  var t = e.state, n = { popper: { position: t.options.strategy, left: "0", top: "0", margin: "0" }, arrow: { position: "absolute" }, reference: {} };
  return Object.assign(t.elements.popper.style, n.popper), t.styles = n, t.elements.arrow && Object.assign(t.elements.arrow.style, n.arrow), function() {
    Object.keys(t.elements).forEach(function(r) {
      var i = t.elements[r], o = t.attributes[r] || {}, s = Object.keys(t.styles.hasOwnProperty(r) ? t.styles[r] : n[r]), a = s.reduce(function(l, c) {
        return l[c] = "", l;
      }, {});
      !De(i) || !Ge(i) || (Object.assign(i.style, a), Object.keys(o).forEach(function(l) {
        i.removeAttribute(l);
      }));
    });
  };
}
var _c = { name: "applyStyles", enabled: !0, phase: "write", fn: xc, effect: wc, requires: ["computeStyles"] };
function He(e) {
  return e.split("-")[0];
}
var $t = Math.max, ri = Math.min, bn = Math.round;
function oo() {
  var e = navigator.userAgentData;
  return e != null && e.brands && Array.isArray(e.brands) ? e.brands.map(function(t) {
    return t.brand + "/" + t.version;
  }).join(" ") : navigator.userAgent;
}
function Da() {
  return !/^((?!chrome|android).)*safari/i.test(oo());
}
function jn(e, t, n) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  var r = e.getBoundingClientRect(), i = 1, o = 1;
  t && De(e) && (i = e.offsetWidth > 0 && bn(r.width) / e.offsetWidth || 1, o = e.offsetHeight > 0 && bn(r.height) / e.offsetHeight || 1);
  var s = Ft(e) ? Te(e) : window, a = s.visualViewport, l = !Da() && n, c = (r.left + (l && a ? a.offsetLeft : 0)) / i, h = (r.top + (l && a ? a.offsetTop : 0)) / o, u = r.width / i, p = r.height / o;
  return { width: u, height: p, top: h, right: c + u, bottom: h + p, left: c, x: c, y: h };
}
function Jo(e) {
  var t = jn(e), n = e.offsetWidth, r = e.offsetHeight;
  return Math.abs(t.width - n) <= 1 && (n = t.width), Math.abs(t.height - r) <= 1 && (r = t.height), { x: e.offsetLeft, y: e.offsetTop, width: n, height: r };
}
function Pa(e, t) {
  var n = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (n && Yo(n)) {
    var r = t;
    do {
      if (r && e.isSameNode(r))
        return !0;
      r = r.parentNode || r.host;
    } while (r);
  }
  return !1;
}
function ot(e) {
  return Te(e).getComputedStyle(e);
}
function Ec(e) {
  return ["table", "td", "th"].indexOf(Ge(e)) >= 0;
}
function At(e) {
  return ((Ft(e) ? e.ownerDocument : e.document) || window.document).documentElement;
}
function Ti(e) {
  return Ge(e) === "html" ? e : e.assignedSlot || e.parentNode || (Yo(e) ? e.host : null) || At(e);
}
function qs(e) {
  return !De(e) || ot(e).position === "fixed" ? null : e.offsetParent;
}
function kc(e) {
  var t = /firefox/i.test(oo()), n = /Trident/i.test(oo());
  if (n && De(e)) {
    var r = ot(e);
    if (r.position === "fixed")
      return null;
  }
  var i = Ti(e);
  for (Yo(i) && (i = i.host); De(i) && ["html", "body"].indexOf(Ge(i)) < 0; ) {
    var o = ot(i);
    if (o.transform !== "none" || o.perspective !== "none" || o.contain === "paint" || ["transform", "perspective"].indexOf(o.willChange) !== -1 || t && o.willChange === "filter" || t && o.filter && o.filter !== "none")
      return i;
    i = i.parentNode;
  }
  return null;
}
function xr(e) {
  for (var t = Te(e), n = qs(e); n && Ec(n) && ot(n).position === "static"; )
    n = qs(n);
  return n && (Ge(n) === "html" || Ge(n) === "body" && ot(n).position === "static") ? t : n || kc(e) || t;
}
function Xo(e) {
  return ["top", "bottom"].indexOf(e) >= 0 ? "x" : "y";
}
function Gn(e, t, n) {
  return $t(e, ri(t, n));
}
function Sc(e, t, n) {
  var r = Gn(e, t, n);
  return r > n ? n : r;
}
function Ma() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}
function $a(e) {
  return Object.assign({}, Ma(), e);
}
function za(e, t) {
  return t.reduce(function(n, r) {
    return n[r] = e, n;
  }, {});
}
var Ac = function(e, t) {
  return e = typeof e == "function" ? e(Object.assign({}, t.rects, { placement: t.placement })) : e, $a(typeof e != "number" ? e : za(e, jr));
};
function Oc(e) {
  var t, n = e.state, r = e.name, i = e.options, o = n.elements.arrow, s = n.modifiersData.popperOffsets, a = He(n.placement), l = Xo(a), c = [ke, Me].indexOf(a) >= 0, h = c ? "height" : "width";
  if (!(!o || !s)) {
    var u = Ac(i.padding, n), p = Jo(o), d = l === "y" ? Ee : ke, f = l === "y" ? Pe : Me, v = n.rects.reference[h] + n.rects.reference[l] - s[l] - n.rects.popper[h], m = s[l] - n.rects.reference[l], b = xr(o), _ = b ? l === "y" ? b.clientHeight || 0 : b.clientWidth || 0 : 0, j = v / 2 - m / 2, w = u[d], E = _ - p[h] - u[f], A = _ / 2 - p[h] / 2 + j, O = Gn(w, A, E), N = l;
    n.modifiersData[r] = (t = {}, t[N] = O, t.centerOffset = O - A, t);
  }
}
function Tc(e) {
  var t = e.state, n = e.options, r = n.element, i = r === void 0 ? "[data-popper-arrow]" : r;
  i != null && (typeof i == "string" && (i = t.elements.popper.querySelector(i), !i) || Pa(t.elements.popper, i) && (t.elements.arrow = i));
}
var Nc = { name: "arrow", enabled: !0, phase: "main", fn: Oc, effect: Tc, requires: ["popperOffsets"], requiresIfExists: ["preventOverflow"] };
function xn(e) {
  return e.split("-")[1];
}
var Ic = { top: "auto", right: "auto", bottom: "auto", left: "auto" };
function Rc(e, t) {
  var n = e.x, r = e.y, i = t.devicePixelRatio || 1;
  return { x: bn(n * i) / i || 0, y: bn(r * i) / i || 0 };
}
function Vs(e) {
  var t, n = e.popper, r = e.popperRect, i = e.placement, o = e.variation, s = e.offsets, a = e.position, l = e.gpuAcceleration, c = e.adaptive, h = e.roundOffsets, u = e.isFixed, p = s.x, d = p === void 0 ? 0 : p, f = s.y, v = f === void 0 ? 0 : f, m = typeof h == "function" ? h({ x: d, y: v }) : { x: d, y: v };
  d = m.x, v = m.y;
  var b = s.hasOwnProperty("x"), _ = s.hasOwnProperty("y"), j = ke, w = Ee, E = window;
  if (c) {
    var A = xr(n), O = "clientHeight", N = "clientWidth";
    if (A === Te(n) && (A = At(n), ot(A).position !== "static" && a === "absolute" && (O = "scrollHeight", N = "scrollWidth")), A = A, i === Ee || (i === ke || i === Me) && o === nr) {
      w = Pe;
      var F = u && A === E && E.visualViewport ? E.visualViewport.height : A[O];
      v -= F - r.height, v *= l ? 1 : -1;
    }
    if (i === ke || (i === Ee || i === Pe) && o === nr) {
      j = Me;
      var M = u && A === E && E.visualViewport ? E.visualViewport.width : A[N];
      d -= M - r.width, d *= l ? 1 : -1;
    }
  }
  var $ = Object.assign({ position: a }, c && Ic), q = h === !0 ? Rc({ x: d, y: v }, Te(n)) : { x: d, y: v };
  if (d = q.x, v = q.y, l) {
    var R;
    return Object.assign({}, $, (R = {}, R[w] = _ ? "0" : "", R[j] = b ? "0" : "", R.transform = (E.devicePixelRatio || 1) <= 1 ? "translate(" + d + "px, " + v + "px)" : "translate3d(" + d + "px, " + v + "px, 0)", R));
  }
  return Object.assign({}, $, (t = {}, t[w] = _ ? v + "px" : "", t[j] = b ? d + "px" : "", t.transform = "", t));
}
function Cc(e) {
  var t = e.state, n = e.options, r = n.gpuAcceleration, i = r === void 0 ? !0 : r, o = n.adaptive, s = o === void 0 ? !0 : o, a = n.roundOffsets, l = a === void 0 ? !0 : a, c = { placement: He(t.placement), variation: xn(t.placement), popper: t.elements.popper, popperRect: t.rects.popper, gpuAcceleration: i, isFixed: t.options.strategy === "fixed" };
  t.modifiersData.popperOffsets != null && (t.styles.popper = Object.assign({}, t.styles.popper, Vs(Object.assign({}, c, { offsets: t.modifiersData.popperOffsets, position: t.options.strategy, adaptive: s, roundOffsets: l })))), t.modifiersData.arrow != null && (t.styles.arrow = Object.assign({}, t.styles.arrow, Vs(Object.assign({}, c, { offsets: t.modifiersData.arrow, position: "absolute", adaptive: !1, roundOffsets: l })))), t.attributes.popper = Object.assign({}, t.attributes.popper, { "data-popper-placement": t.placement });
}
var Dc = { name: "computeStyles", enabled: !0, phase: "beforeWrite", fn: Cc, data: {} }, Nr = { passive: !0 };
function Pc(e) {
  var t = e.state, n = e.instance, r = e.options, i = r.scroll, o = i === void 0 ? !0 : i, s = r.resize, a = s === void 0 ? !0 : s, l = Te(t.elements.popper), c = [].concat(t.scrollParents.reference, t.scrollParents.popper);
  return o && c.forEach(function(h) {
    h.addEventListener("scroll", n.update, Nr);
  }), a && l.addEventListener("resize", n.update, Nr), function() {
    o && c.forEach(function(h) {
      h.removeEventListener("scroll", n.update, Nr);
    }), a && l.removeEventListener("resize", n.update, Nr);
  };
}
var Mc = { name: "eventListeners", enabled: !0, phase: "write", fn: function() {
}, effect: Pc, data: {} }, $c = { left: "right", right: "left", bottom: "top", top: "bottom" };
function Fr(e) {
  return e.replace(/left|right|bottom|top/g, function(t) {
    return $c[t];
  });
}
var zc = { start: "end", end: "start" };
function Ws(e) {
  return e.replace(/start|end/g, function(t) {
    return zc[t];
  });
}
function Qo(e) {
  var t = Te(e), n = t.pageXOffset, r = t.pageYOffset;
  return { scrollLeft: n, scrollTop: r };
}
function Zo(e) {
  return jn(At(e)).left + Qo(e).scrollLeft;
}
function Lc(e, t) {
  var n = Te(e), r = At(e), i = n.visualViewport, o = r.clientWidth, s = r.clientHeight, a = 0, l = 0;
  if (i) {
    o = i.width, s = i.height;
    var c = Da();
    (c || !c && t === "fixed") && (a = i.offsetLeft, l = i.offsetTop);
  }
  return { width: o, height: s, x: a + Zo(e), y: l };
}
function Bc(e) {
  var t, n = At(e), r = Qo(e), i = (t = e.ownerDocument) == null ? void 0 : t.body, o = $t(n.scrollWidth, n.clientWidth, i ? i.scrollWidth : 0, i ? i.clientWidth : 0), s = $t(n.scrollHeight, n.clientHeight, i ? i.scrollHeight : 0, i ? i.clientHeight : 0), a = -r.scrollLeft + Zo(e), l = -r.scrollTop;
  return ot(i || n).direction === "rtl" && (a += $t(n.clientWidth, i ? i.clientWidth : 0) - o), { width: o, height: s, x: a, y: l };
}
function es(e) {
  var t = ot(e), n = t.overflow, r = t.overflowX, i = t.overflowY;
  return /auto|scroll|overlay|hidden/.test(n + i + r);
}
function La(e) {
  return ["html", "body", "#document"].indexOf(Ge(e)) >= 0 ? e.ownerDocument.body : De(e) && es(e) ? e : La(Ti(e));
}
function Yn(e, t) {
  var n;
  t === void 0 && (t = []);
  var r = La(e), i = r === ((n = e.ownerDocument) == null ? void 0 : n.body), o = Te(r), s = i ? [o].concat(o.visualViewport || [], es(r) ? r : []) : r, a = t.concat(s);
  return i ? a : a.concat(Yn(Ti(s)));
}
function so(e) {
  return Object.assign({}, e, { left: e.x, top: e.y, right: e.x + e.width, bottom: e.y + e.height });
}
function Fc(e, t) {
  var n = jn(e, !1, t === "fixed");
  return n.top = n.top + e.clientTop, n.left = n.left + e.clientLeft, n.bottom = n.top + e.clientHeight, n.right = n.left + e.clientWidth, n.width = e.clientWidth, n.height = e.clientHeight, n.x = n.left, n.y = n.top, n;
}
function Hs(e, t, n) {
  return t === Ra ? so(Lc(e, n)) : Ft(t) ? Fc(t, n) : so(Bc(At(e)));
}
function Kc(e) {
  var t = Yn(Ti(e)), n = ["absolute", "fixed"].indexOf(ot(e).position) >= 0, r = n && De(e) ? xr(e) : e;
  return Ft(r) ? t.filter(function(i) {
    return Ft(i) && Pa(i, r) && Ge(i) !== "body";
  }) : [];
}
function Uc(e, t, n, r) {
  var i = t === "clippingParents" ? Kc(e) : [].concat(t), o = [].concat(i, [n]), s = o[0], a = o.reduce(function(l, c) {
    var h = Hs(e, c, r);
    return l.top = $t(h.top, l.top), l.right = ri(h.right, l.right), l.bottom = ri(h.bottom, l.bottom), l.left = $t(h.left, l.left), l;
  }, Hs(e, s, r));
  return a.width = a.right - a.left, a.height = a.bottom - a.top, a.x = a.left, a.y = a.top, a;
}
function Ba(e) {
  var t = e.reference, n = e.element, r = e.placement, i = r ? He(r) : null, o = r ? xn(r) : null, s = t.x + t.width / 2 - n.width / 2, a = t.y + t.height / 2 - n.height / 2, l;
  switch (i) {
    case Ee:
      l = { x: s, y: t.y - n.height };
      break;
    case Pe:
      l = { x: s, y: t.y + t.height };
      break;
    case Me:
      l = { x: t.x + t.width, y: a };
      break;
    case ke:
      l = { x: t.x - n.width, y: a };
      break;
    default:
      l = { x: t.x, y: t.y };
  }
  var c = i ? Xo(i) : null;
  if (c != null) {
    var h = c === "y" ? "height" : "width";
    switch (o) {
      case yn:
        l[c] = l[c] - (t[h] / 2 - n[h] / 2);
        break;
      case nr:
        l[c] = l[c] + (t[h] / 2 - n[h] / 2);
        break;
    }
  }
  return l;
}
function rr(e, t) {
  t === void 0 && (t = {});
  var n = t, r = n.placement, i = r === void 0 ? e.placement : r, o = n.strategy, s = o === void 0 ? e.strategy : o, a = n.boundary, l = a === void 0 ? cc : a, c = n.rootBoundary, h = c === void 0 ? Ra : c, u = n.elementContext, p = u === void 0 ? zn : u, d = n.altBoundary, f = d === void 0 ? !1 : d, v = n.padding, m = v === void 0 ? 0 : v, b = $a(typeof m != "number" ? m : za(m, jr)), _ = p === zn ? uc : zn, j = e.rects.popper, w = e.elements[f ? _ : p], E = Uc(Ft(w) ? w : w.contextElement || At(e.elements.popper), l, h, s), A = jn(e.elements.reference), O = Ba({ reference: A, element: j, strategy: "absolute", placement: i }), N = so(Object.assign({}, j, O)), F = p === zn ? N : A, M = { top: E.top - F.top + b.top, bottom: F.bottom - E.bottom + b.bottom, left: E.left - F.left + b.left, right: F.right - E.right + b.right }, $ = e.modifiersData.offset;
  if (p === zn && $) {
    var q = $[i];
    Object.keys(M).forEach(function(R) {
      var ne = [Me, Pe].indexOf(R) >= 0 ? 1 : -1, X = [Ee, Pe].indexOf(R) >= 0 ? "y" : "x";
      M[R] += q[X] * ne;
    });
  }
  return M;
}
function qc(e, t) {
  t === void 0 && (t = {});
  var n = t, r = n.placement, i = n.boundary, o = n.rootBoundary, s = n.padding, a = n.flipVariations, l = n.allowedAutoPlacements, c = l === void 0 ? Ca : l, h = xn(r), u = h ? a ? Us : Us.filter(function(f) {
    return xn(f) === h;
  }) : jr, p = u.filter(function(f) {
    return c.indexOf(f) >= 0;
  });
  p.length === 0 && (p = u);
  var d = p.reduce(function(f, v) {
    return f[v] = rr(e, { placement: v, boundary: i, rootBoundary: o, padding: s })[He(v)], f;
  }, {});
  return Object.keys(d).sort(function(f, v) {
    return d[f] - d[v];
  });
}
function Vc(e) {
  if (He(e) === Go)
    return [];
  var t = Fr(e);
  return [Ws(e), t, Ws(t)];
}
function Wc(e) {
  var t = e.state, n = e.options, r = e.name;
  if (!t.modifiersData[r]._skip) {
    for (var i = n.mainAxis, o = i === void 0 ? !0 : i, s = n.altAxis, a = s === void 0 ? !0 : s, l = n.fallbackPlacements, c = n.padding, h = n.boundary, u = n.rootBoundary, p = n.altBoundary, d = n.flipVariations, f = d === void 0 ? !0 : d, v = n.allowedAutoPlacements, m = t.options.placement, b = He(m), _ = b === m, j = l || (_ || !f ? [Fr(m)] : Vc(m)), w = [m].concat(j).reduce(function(Re, Ce) {
      return Re.concat(He(Ce) === Go ? qc(t, { placement: Ce, boundary: h, rootBoundary: u, padding: c, flipVariations: f, allowedAutoPlacements: v }) : Ce);
    }, []), E = t.rects.reference, A = t.rects.popper, O = /* @__PURE__ */ new Map(), N = !0, F = w[0], M = 0; M < w.length; M++) {
      var $ = w[M], q = He($), R = xn($) === yn, ne = [Ee, Pe].indexOf(q) >= 0, X = ne ? "width" : "height", V = rr(t, { placement: $, boundary: h, rootBoundary: u, altBoundary: p, padding: c }), G = ne ? R ? Me : ke : R ? Pe : Ee;
      E[X] > A[X] && (G = Fr(G));
      var Y = Fr(G), ae = [];
      if (o && ae.push(V[q] <= 0), a && ae.push(V[G] <= 0, V[Y] <= 0), ae.every(function(Re) {
        return Re;
      })) {
        F = $, N = !1;
        break;
      }
      O.set($, ae);
    }
    if (N)
      for (var $e = f ? 3 : 1, Xe = function(Re) {
        var Ce = w.find(function(nn) {
          var qe = O.get(nn);
          if (qe)
            return qe.slice(0, Re).every(function(S) {
              return S;
            });
        });
        if (Ce)
          return F = Ce, "break";
      }, be = $e; be > 0; be--) {
        var ze = Xe(be);
        if (ze === "break")
          break;
      }
    t.placement !== F && (t.modifiersData[r]._skip = !0, t.placement = F, t.reset = !0);
  }
}
var Hc = { name: "flip", enabled: !0, phase: "main", fn: Wc, requiresIfExists: ["offset"], data: { _skip: !1 } };
function Gs(e, t, n) {
  return n === void 0 && (n = { x: 0, y: 0 }), { top: e.top - t.height - n.y, right: e.right - t.width + n.x, bottom: e.bottom - t.height + n.y, left: e.left - t.width - n.x };
}
function Ys(e) {
  return [Ee, Me, Pe, ke].some(function(t) {
    return e[t] >= 0;
  });
}
function Gc(e) {
  var t = e.state, n = e.name, r = t.rects.reference, i = t.rects.popper, o = t.modifiersData.preventOverflow, s = rr(t, { elementContext: "reference" }), a = rr(t, { altBoundary: !0 }), l = Gs(s, r), c = Gs(a, i, o), h = Ys(l), u = Ys(c);
  t.modifiersData[n] = { referenceClippingOffsets: l, popperEscapeOffsets: c, isReferenceHidden: h, hasPopperEscaped: u }, t.attributes.popper = Object.assign({}, t.attributes.popper, { "data-popper-reference-hidden": h, "data-popper-escaped": u });
}
var Yc = { name: "hide", enabled: !0, phase: "main", requiresIfExists: ["preventOverflow"], fn: Gc };
function Jc(e, t, n) {
  var r = He(e), i = [ke, Ee].indexOf(r) >= 0 ? -1 : 1, o = typeof n == "function" ? n(Object.assign({}, t, { placement: e })) : n, s = o[0], a = o[1];
  return s = s || 0, a = (a || 0) * i, [ke, Me].indexOf(r) >= 0 ? { x: a, y: s } : { x: s, y: a };
}
function Xc(e) {
  var t = e.state, n = e.options, r = e.name, i = n.offset, o = i === void 0 ? [0, 0] : i, s = Ca.reduce(function(h, u) {
    return h[u] = Jc(u, t.rects, o), h;
  }, {}), a = s[t.placement], l = a.x, c = a.y;
  t.modifiersData.popperOffsets != null && (t.modifiersData.popperOffsets.x += l, t.modifiersData.popperOffsets.y += c), t.modifiersData[r] = s;
}
var Qc = { name: "offset", enabled: !0, phase: "main", requires: ["popperOffsets"], fn: Xc };
function Zc(e) {
  var t = e.state, n = e.name;
  t.modifiersData[n] = Ba({ reference: t.rects.reference, element: t.rects.popper, strategy: "absolute", placement: t.placement });
}
var eu = { name: "popperOffsets", enabled: !0, phase: "read", fn: Zc, data: {} };
function tu(e) {
  return e === "x" ? "y" : "x";
}
function nu(e) {
  var t = e.state, n = e.options, r = e.name, i = n.mainAxis, o = i === void 0 ? !0 : i, s = n.altAxis, a = s === void 0 ? !1 : s, l = n.boundary, c = n.rootBoundary, h = n.altBoundary, u = n.padding, p = n.tether, d = p === void 0 ? !0 : p, f = n.tetherOffset, v = f === void 0 ? 0 : f, m = rr(t, { boundary: l, rootBoundary: c, padding: u, altBoundary: h }), b = He(t.placement), _ = xn(t.placement), j = !_, w = Xo(b), E = tu(w), A = t.modifiersData.popperOffsets, O = t.rects.reference, N = t.rects.popper, F = typeof v == "function" ? v(Object.assign({}, t.rects, { placement: t.placement })) : v, M = typeof F == "number" ? { mainAxis: F, altAxis: F } : Object.assign({ mainAxis: 0, altAxis: 0 }, F), $ = t.modifiersData.offset ? t.modifiersData.offset[t.placement] : null, q = { x: 0, y: 0 };
  if (A) {
    if (o) {
      var R, ne = w === "y" ? Ee : ke, X = w === "y" ? Pe : Me, V = w === "y" ? "height" : "width", G = A[w], Y = G + m[ne], ae = G - m[X], $e = d ? -N[V] / 2 : 0, Xe = _ === yn ? O[V] : N[V], be = _ === yn ? -N[V] : -O[V], ze = t.elements.arrow, Re = d && ze ? Jo(ze) : { width: 0, height: 0 }, Ce = t.modifiersData["arrow#persistent"] ? t.modifiersData["arrow#persistent"].padding : Ma(), nn = Ce[ne], qe = Ce[X], S = Gn(0, O[V], Re[V]), T = j ? O[V] / 2 - $e - S - nn - M.mainAxis : Xe - S - nn - M.mainAxis, K = j ? -O[V] / 2 + $e + S + qe + M.mainAxis : be + S + qe + M.mainAxis, ve = t.elements.arrow && xr(t.elements.arrow), me = ve ? w === "y" ? ve.clientTop || 0 : ve.clientLeft || 0 : 0, le = (R = $ == null ? void 0 : $[w]) != null ? R : 0, ct = G + T - le - me, Fl = G + K - le, ws = Gn(d ? ri(Y, ct) : Y, G, d ? $t(ae, Fl) : ae);
      A[w] = ws, q[w] = ws - G;
    }
    if (a) {
      var _s, Kl = w === "x" ? Ee : ke, Ul = w === "x" ? Pe : Me, Tt = A[E], Tr = E === "y" ? "height" : "width", Es = Tt + m[Kl], ks = Tt - m[Ul], $i = [Ee, ke].indexOf(b) !== -1, Ss = (_s = $ == null ? void 0 : $[E]) != null ? _s : 0, As = $i ? Es : Tt - O[Tr] - N[Tr] - Ss + M.altAxis, Os = $i ? Tt + O[Tr] + N[Tr] - Ss - M.altAxis : ks, Ts = d && $i ? Sc(As, Tt, Os) : Gn(d ? As : Es, Tt, d ? Os : ks);
      A[E] = Ts, q[E] = Ts - Tt;
    }
    t.modifiersData[r] = q;
  }
}
var ru = { name: "preventOverflow", enabled: !0, phase: "main", fn: nu, requiresIfExists: ["offset"] };
function iu(e) {
  return { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop };
}
function ou(e) {
  return e === Te(e) || !De(e) ? Qo(e) : iu(e);
}
function su(e) {
  var t = e.getBoundingClientRect(), n = bn(t.width) / e.offsetWidth || 1, r = bn(t.height) / e.offsetHeight || 1;
  return n !== 1 || r !== 1;
}
function au(e, t, n) {
  n === void 0 && (n = !1);
  var r = De(t), i = De(t) && su(t), o = At(t), s = jn(e, i, n), a = { scrollLeft: 0, scrollTop: 0 }, l = { x: 0, y: 0 };
  return (r || !r && !n) && ((Ge(t) !== "body" || es(o)) && (a = ou(t)), De(t) ? (l = jn(t, !0), l.x += t.clientLeft, l.y += t.clientTop) : o && (l.x = Zo(o))), { x: s.left + a.scrollLeft - l.x, y: s.top + a.scrollTop - l.y, width: s.width, height: s.height };
}
function lu(e) {
  var t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set(), r = [];
  e.forEach(function(o) {
    t.set(o.name, o);
  });
  function i(o) {
    n.add(o.name);
    var s = [].concat(o.requires || [], o.requiresIfExists || []);
    s.forEach(function(a) {
      if (!n.has(a)) {
        var l = t.get(a);
        l && i(l);
      }
    }), r.push(o);
  }
  return e.forEach(function(o) {
    n.has(o.name) || i(o);
  }), r;
}
function cu(e) {
  var t = lu(e);
  return jc.reduce(function(n, r) {
    return n.concat(t.filter(function(i) {
      return i.phase === r;
    }));
  }, []);
}
function uu(e) {
  var t;
  return function() {
    return t || (t = new Promise(function(n) {
      Promise.resolve().then(function() {
        t = void 0, n(e());
      });
    })), t;
  };
}
function pu(e) {
  var t = e.reduce(function(n, r) {
    var i = n[r.name];
    return n[r.name] = i ? Object.assign({}, i, r, { options: Object.assign({}, i.options, r.options), data: Object.assign({}, i.data, r.data) }) : r, n;
  }, {});
  return Object.keys(t).map(function(n) {
    return t[n];
  });
}
var Js = { placement: "bottom", modifiers: [], strategy: "absolute" };
function Xs() {
  for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
    t[n] = arguments[n];
  return !t.some(function(r) {
    return !(r && typeof r.getBoundingClientRect == "function");
  });
}
function hu(e) {
  e === void 0 && (e = {});
  var t = e, n = t.defaultModifiers, r = n === void 0 ? [] : n, i = t.defaultOptions, o = i === void 0 ? Js : i;
  return function(s, a, l) {
    l === void 0 && (l = o);
    var c = { placement: "bottom", orderedModifiers: [], options: Object.assign({}, Js, o), modifiersData: {}, elements: { reference: s, popper: a }, attributes: {}, styles: {} }, h = [], u = !1, p = { state: c, setOptions: function(v) {
      var m = typeof v == "function" ? v(c.options) : v;
      f(), c.options = Object.assign({}, o, c.options, m), c.scrollParents = { reference: Ft(s) ? Yn(s) : s.contextElement ? Yn(s.contextElement) : [], popper: Yn(a) };
      var b = cu(pu([].concat(r, c.options.modifiers)));
      return c.orderedModifiers = b.filter(function(_) {
        return _.enabled;
      }), d(), p.update();
    }, forceUpdate: function() {
      if (!u) {
        var v = c.elements, m = v.reference, b = v.popper;
        if (Xs(m, b)) {
          c.rects = { reference: au(m, xr(b), c.options.strategy === "fixed"), popper: Jo(b) }, c.reset = !1, c.placement = c.options.placement, c.orderedModifiers.forEach(function(F) {
            return c.modifiersData[F.name] = Object.assign({}, F.data);
          });
          for (var _ = 0, j = 0; j < c.orderedModifiers.length; j++) {
            if (c.reset === !0) {
              c.reset = !1, j = -1;
              continue;
            }
            var w = c.orderedModifiers[j], E = w.fn, A = w.options, O = A === void 0 ? {} : A, N = w.name;
            typeof E == "function" && (c = E({ state: c, options: O, name: N, instance: p }) || c);
          }
        }
      }
    }, update: uu(function() {
      return new Promise(function(v) {
        p.forceUpdate(), v(c);
      });
    }), destroy: function() {
      f(), u = !0;
    } };
    if (!Xs(s, a))
      return p;
    p.setOptions(l).then(function(v) {
      !u && l.onFirstUpdate && l.onFirstUpdate(v);
    });
    function d() {
      c.orderedModifiers.forEach(function(v) {
        var m = v.name, b = v.options, _ = b === void 0 ? {} : b, j = v.effect;
        if (typeof j == "function") {
          var w = j({ state: c, name: m, instance: p, options: _ }), E = function() {
          };
          h.push(w || E);
        }
      });
    }
    function f() {
      h.forEach(function(v) {
        return v();
      }), h = [];
    }
    return p;
  };
}
var du = [Mc, eu, Dc, _c, Qc, Hc, ru, Nc, Yc], ao = hu({ defaultModifiers: du }), Qs = (e = 0, t = 0) => () => ({ width: 0, height: 0, top: t, right: e, bottom: t, left: e }), fu = Z`:host [part=content]{z-index:999;display:none}:host([open]) [part=content]{display:inline-block;animation:fade-in .2s ease}@keyframes fade-in{from{opacity:0}to{opacity:1}}`, ut = class extends W {
  constructor() {
    super(), this.open = !1, this.placement = "auto", this.event = "click", this.clientY = 0, this.clientX = 0, this._createPopover = this._createPopover.bind(this);
  }
  get triggerPart() {
    return this.renderRoot.querySelector("[part='trigger']");
  }
  get contentPart() {
    return this.renderRoot.querySelector("[part='content']");
  }
  get triggerAssignedNode() {
    return this.renderRoot.querySelector("[name='trigger']").assignedNodes()[0];
  }
  get contentAssignedNode() {
    return this.renderRoot.querySelector("[name='content']").assignedNodes()[0];
  }
  firstUpdated() {
    let e = this.triggerPart;
    e.addEventListener(this.event, (t) => {
      t.preventDefault(), this.clientY = t.clientY, this.clientX = t.clientX, this.open = !this.open;
    }), this.event === "mouseover" && (e.addEventListener("mouseover", () => this.open = !0), e.addEventListener("mouseleave", () => this.open = !1), e.addEventListener("mouseleave", () => this.open = !1)), window.addEventListener("mousedown", (t) => {
      var n = t.path || t.composedPath && t.composedPath();
      let r = n.includes(this.triggerAssignedNode);
      !n.includes(this.contentAssignedNode) && !r && (this.open = !1);
    });
  }
  _createPopover() {
    let e = this.triggerPart, t = this.contentPart;
    if (this.event === "contextmenu") {
      let n = { contextElement: e, getBoundingClientRect: Qs() }, r = ao(n, t, { placement: this.placement, strategy: "fixed", modifiers: [{ name: "offset", options: { offset: [10, 10] } }] });
      n.getBoundingClientRect = Qs(this.clientX, this.clientY), r.update();
    } else
      ao(e, t, { placement: this.placement, strategy: "fixed", modifiers: [{ name: "offset", options: { offset: [10, 10] } }, { name: "computeStyles", options: { gpuAcceleration: !1 } }] });
  }
  shouldUpdate(e) {
    return e.has("open") && (this.dispatchEvent(new CustomEvent("toggle", { bubbles: !0 })), this.open && this._createPopover()), !0;
  }
  render() {
    return B`<div part="base"><span part="trigger"><slot name="trigger"></slot></span><span part="content"><slot name="content"></slot></span></div>`;
  }
};
ut.styles = [H, fu], g([k({ type: Boolean, reflect: !0 })], ut.prototype, "open", 2), g([k({ type: String, reflect: !0 })], ut.prototype, "placement", 2), g([k({ type: String, reflect: !0 })], ut.prototype, "event", 2), g([mt()], ut.prototype, "clientY", 2), g([mt()], ut.prototype, "clientX", 2), ut = g([oe("j-popover")], ut);
var vu = Z`[part=base]{border-radius:var(--j-border-radius);padding:var(--j-space-300) 0;min-width:200px;background:var(--j-color-white);border:1px solid var(--j-border-color);overflow:hidden}`, Vi = class extends W {
  render() {
    return B`<div part="base" role="menu"><slot></slot></div>`;
  }
};
Vi.styles = [H, vu], Vi = g([oe("j-menu")], Vi);
var mu = Z`:host{--j-menu-group-item-cursor:default;--j-menu-group-item-title-padding:0 var(--j-space-500)}:host([collapsible]){--j-menu-group-item-cursor:pointer;--j-menu-group-item-title-padding:0 var(--j-space-800)}[part=summary]{position:relative;cursor:var(--j-menu-group-item-cursor);list-style:none;display:flex;gap:var(--j-space-400);align-items:center;padding:var(--j-menu-group-item-title-padding);margin-bottom:var(--j-space-200);-webkit-appearance:none}[part=summary]::-webkit-details-marker,[part=summary]::marker{display:none}[part=summary]:hover{color:var(--j-color-ui-700)}:host([collapsible]) [part=summary]:after{top:50%;left:var(--j-space-500);position:absolute;display:block;content:"";border-right:1px solid var(--j-color-ui-500);border-bottom:1px solid var(--j-color-ui-500);width:4px;height:4px;transition:all .2s ease;transform:rotate(-45deg) translateX(-50%);transform-origin:center}:host([open][collapsible]) [part=summary]:after{transform:rotate(45deg) translateX(-50%)}[part=title]{text-transform:uppercase;font-size:var(--j-font-size-400);color:var(--j-color-ui-400);font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`, rn = class extends W {
  constructor() {
    super(...arguments), this.collapsible = !1, this.open = !1, this.title = null;
  }
  collapsibleContent() {
    return B`<details .open="${this.open}" @toggle="${(e) => this.open = e.target.open}" part="base" role="menuitem"><summary part="summary"><slot part="start" name="start"></slot><div part="title">${this.title}</div><slot part="end" name="end"></slot></summary><div part="content"><slot></slot></div></details>`;
  }
  normal() {
    return B`<div part="base" role="menuitem"><div part="summary"><slot part="start" name="start"></slot><div part="title">${this.title}</div><slot part="end" name="end"></slot></div><div part="content"><slot></slot></div></div>`;
  }
  render() {
    return this.collapsible ? this.collapsibleContent() : this.normal();
  }
};
rn.styles = [mu, H], g([k({ type: Boolean, reflect: !0 })], rn.prototype, "collapsible", 2), g([k({ type: Boolean, reflect: !0 })], rn.prototype, "open", 2), g([k({ type: String, reflect: !0 })], rn.prototype, "title", 2), rn = g([oe("j-menu-group")], rn);
var gu = Z`:host{--j-menu-item-gap:var(--j-space-300);--j-menu-item-border-left:none;--j-menu-item-border-radius:none;--j-menu-item-height:var(--j-size-md);--j-menu-item-bg:transparent;--j-menu-item-color:var(--j-color-ui-600);--j-menu-item-padding:0 var(--j-space-500) 0 var(--j-space-500);--j-menu-item-font-weight:500;--j-menu-item-font-size:var(--j-font-size-500)}:host(:hover){--j-menu-item-color:var(--j-color-ui-700);--j-menu-item-bg:var(--j-color-ui-50)}:host([active]){--j-menu-item-bg:var(--j-color-ui-50);--j-menu-item-color:var(--j-color-ui-600)}:host([selected]){--j-menu-item-bg:var(--j-color-primary-100);--j-menu-item-color:var(--j-color-primary-700)}:host([size=sm]){--j-menu-item-gap:var(--j-space-300);--j-menu-item-font-size:var(--j-font-size-400);--j-menu-item-height:var(--j-size-sm)}:host([size=lg]){--j-menu-item-gap:var(--j-space-400);--j-menu-item-height:var(--j-size-lg)}:host([size=xl]){--j-menu-item-gap:var(--j-space-500);--j-menu-item-height:var(--j-size-xl)}:host(:last-of-type) [part=base]{margin-bottom:0}[part=base]{display:flex;align-items:center;gap:var(--j-menu-item-gap);border-radius:var(--j-menu-item-border-radius);background:var(--j-menu-item-bg);text-decoration:none;cursor:pointer;font-size:var(--j-menu-item-font-size);height:var(--j-menu-item-height);padding:var(--j-menu-item-padding);color:var(--j-menu-item-color);font-weight:var(--j-menu-item-font-weight);border-left:var(--j-menu-item-border-left)}[part=content]{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`, It = class extends W {
  constructor() {
    super(...arguments), this.selected = !1, this.active = !1, this._value = null, this._label = null;
  }
  get label() {
    return this._label || this.getAttribute("label") || this.innerText;
  }
  set label(e) {
    this._label = e, this.setAttribute("label", e);
  }
  get value() {
    return this._value || this.getAttribute("value") || this.innerText;
  }
  set value(e) {
    this._value = e, this.setAttribute("value", e);
  }
  render() {
    return B`<div part="base" role="menuitem"><slot name="start"></slot><div part="content"><slot></slot></div><slot name="end"></slot></div>`;
  }
};
It.styles = [H, gu], g([k({ type: Boolean, reflect: !0 })], It.prototype, "selected", 2), g([k({ type: Boolean, reflect: !0 })], It.prototype, "active", 2), g([mt()], It.prototype, "_value", 2), g([mt()], It.prototype, "_label", 2), It = g([oe("j-menu-item")], It);
var yu = Z`:host{--j-radio-button-size:16px;--j-radio-button-gap:var(--j-space-300);--j-radio-button-font-size:0 var(--j-font-size-500);--j-radio-button-indicator-color:var(--j-color-ui-500)}:host([full]) label{display:flex;width:100%}:host([disabled]) label{opacity:.5;cursor:default}:host([checked]){--j-radio-button-indicator-color:var(--j-color-primary-500)}:host([size=sm]){--j-radio-button-size:10px;--j-radio-button-font-size:var(--j-font-size-400)}:host([size=lg]){--j-radio-button-size:20px;--j-radio-button-font-size:var(--j-font-size-600)}label{display:inline-flex;gap:var(--j-radio-button-gap);font-size:var(--j-radio-button-font-size);align-items:center;cursor:pointer;position:relative}input{position:absolute;clip:rect(1px 1px 1px 1px);clip:rect(1px,1px,1px,1px);vertical-align:middle}span{display:block}i{display:block;border-radius:50%;border:2px solid var(--j-radio-button-indicator-color);width:var(--j-radio-button-size);height:var(--j-radio-button-size);position:relative}input:checked~i:after{position:absolute;display:block;content:"";width:calc(var(--j-radio-button-size)/ 2);height:calc(var(--j-radio-button-size)/ 2);background:var(--j-radio-button-indicator-color);border-radius:50%;left:50%;top:50%;transform:translateX(-50%) translateY(-50%)}`, bu = class extends W {
  constructor() {
    super(), this.value = null, this.name = null, this.size = null, this.full = !1, this.disabled = !1, this._checked = !1, this.focus = this.focus.bind(this), this.selectNext = this.selectNext.bind(this), this.selectPrevious = this.selectPrevious.bind(this), this._handleChange = this._handleChange.bind(this), this._handleKeyPress = this._handleKeyPress.bind(this);
  }
  static get properties() {
    return { checked: { type: Boolean, reflect: !0 }, disabled: { type: Boolean }, full: { type: Boolean }, size: { type: String }, name: { type: String, reflect: !0 }, value: { type: String } };
  }
  static get styles() {
    return [yu, H];
  }
  get options() {
    return [...document.querySelectorAll(`[name="${this.name}"]`)];
  }
  get currentCheckedItem() {
    return this.options.find((e) => e.checked);
  }
  get formElement() {
    return this.shadowRoot.querySelector("input");
  }
  get checked() {
    return this._checked;
  }
  set checked(e) {
    e !== this._checked && (e === !0 && this.currentCheckedItem && (this.currentCheckedItem.checked = !1), this.formElement && (this.formElement.checked = e), e ? this.setAttribute("checked", "") : this.removeAttribute("checked"), this._checked = e, this.requestUpdate());
  }
  selectNext() {
    let e = this.options, t = e.findIndex((r) => r.checked), n = e.length === t + 1 ? 0 : t + 1;
    e[n].focus(), e[n].checked = !0;
  }
  selectPrevious() {
    let e = this.options, t = e.findIndex((r) => r.checked), n = t === 0 ? e.length - 1 : t - 1;
    e[n].focus(), e[n].checked = !0;
  }
  focus() {
    this.formElement.focus();
  }
  _handleChange(e) {
    e.stopPropagation(), this.checked = e.target.checked, this.dispatchEvent(new CustomEvent("change", e));
  }
  _handleKeyPress(e) {
    e.keyCode === 37 && this.selectPrevious(), e.keyCode === 39 && this.selectNext();
  }
  render() {
    return B`<label part="base"><input name="${this.name}" ?disabled="${this.disabled}" @keydown="${this._handleKeyPress}" @change="${this._handleChange}" ?checked="${this.checked}" value="${this.value}" type="radio"> <i></i> <span><slot></slot></span></label>`;
  }
};
customElements.define("j-radio-button", bu);
var ju = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 }, xu = (e) => (...t) => ({ _$litDirective$: e, values: t }), wu = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, n) {
    this._$Ct = e, this._$AM = t, this._$Ci = n;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
}, lo = class extends wu {
  constructor(e) {
    if (super(e), this.et = ie, e.type !== ju.CHILD)
      throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(e) {
    if (e === ie || e == null)
      return this.ft = void 0, this.et = e;
    if (e === Bt)
      return e;
    if (typeof e != "string")
      throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (e === this.et)
      return this.ft;
    this.et = e;
    let t = [e];
    return t.raw = t, this.ft = { _$litType$: this.constructor.resultType, strings: t, values: [] };
  }
};
lo.directiveName = "unsafeHTML", lo.resultType = 1;
var co = class extends lo {
};
co.directiveName = "unsafeSVG", co.resultType = 2;
var _u = xu(co);
function Un(e, t, n) {
  return parseInt(e.substr(t, n), 16);
}
function Fa(e) {
  return e |= 0, e < 0 ? "00" : e < 16 ? "0" + e.toString(16) : e < 256 ? e.toString(16) : "ff";
}
function Wi(e, t, n) {
  return n = n < 0 ? n + 6 : n > 6 ? n - 6 : n, Fa(255 * (n < 1 ? e + (t - e) * n : n < 3 ? t : n < 4 ? e + (t - e) * (4 - n) : e));
}
function Eu(e) {
  if (/^#[0-9a-f]{3,8}$/i.test(e)) {
    let t, n = e.length;
    if (n < 6) {
      let r = e[1], i = e[2], o = e[3], s = e[4] || "";
      t = "#" + r + r + i + i + o + o + s + s;
    }
    return (n == 7 || n > 8) && (t = e), t;
  }
}
function ku(e, t, n) {
  let r;
  if (t == 0) {
    let i = Fa(n * 255);
    r = i + i + i;
  } else {
    let i = n <= 0.5 ? n * (t + 1) : n + t - n * t, o = n * 2 - i;
    r = Wi(o, i, e * 6 + 2) + Wi(o, i, e * 6) + Wi(o, i, e * 6 - 2);
  }
  return "#" + r;
}
function Ln(e, t, n) {
  let r = [0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55], i = r[e * 6 + 0.5 | 0];
  return n = n < 0.5 ? n * i * 2 : i + (n - 0.5) * (1 - i) * 2, ku(e, t, n);
}
var Su = typeof window < "u" ? window : typeof self < "u" ? self : typeof global < "u" ? global : {}, Zs = { V: "jdenticon_config", n: "config" }, Au = {};
function Ou(e, t) {
  let n = typeof e == "object" && e || Au[Zs.n] || Su[Zs.V] || {}, r = n.lightness || {}, i = n.saturation || {}, o = "color" in i ? i.color : i, s = i.grayscale, a = n.backColor, l = n.padding;
  function c(u, p) {
    let d = r[u];
    return d && d.length > 1 || (d = p), function(f) {
      return f = d[0] + f * (d[1] - d[0]), f < 0 ? 0 : f > 1 ? 1 : f;
    };
  }
  function h(u) {
    let p = n.hues, d;
    return p && p.length > 0 && (d = p[0 | 0.999 * u * p.length]), typeof d == "number" ? (d / 360 % 1 + 1) % 1 : u;
  }
  return { W: h, o: typeof o == "number" ? o : 0.5, D: typeof s == "number" ? s : 0, p: c("color", [0.4, 0.8]), F: c("grayscale", [0.3, 0.9]), G: Eu(a), X: typeof e == "number" ? e : typeof l == "number" ? l : t };
}
var Ir = class {
  constructor(e, t) {
    this.x = e, this.y = t;
  }
}, Ka = class {
  constructor(e, t, n, r) {
    this.q = e, this.t = t, this.H = n, this.Y = r;
  }
  I(e, t, n, r) {
    let i = this.q + this.H, o = this.t + this.H, s = this.Y;
    return s === 1 ? new Ir(i - t - (r || 0), this.t + e) : s === 2 ? new Ir(i - e - (n || 0), o - t - (r || 0)) : s === 3 ? new Ir(this.q + t, o - e - (n || 0)) : new Ir(this.q + e, this.t + t);
  }
}, Tu = new Ka(0, 0, 0, 0), Nu = class {
  constructor(e) {
    this.J = e, this.u = Tu;
  }
  g(e, t) {
    let n = t ? -2 : 2, r = [];
    for (let i = t ? e.length - 2 : 0; i < e.length && i >= 0; i += n)
      r.push(this.u.I(e[i], e[i + 1]));
    this.J.g(r);
  }
  h(e, t, n, r) {
    let i = this.u.I(e, t, n, n);
    this.J.h(i, n, r);
  }
  i(e, t, n, r, i) {
    this.g([e, t, e + n, t, e + n, t + r, e, t + r], i);
  }
  j(e, t, n, r, i, o) {
    let s = [e + n, t, e + n, t + r, e, t + r, e, t];
    s.splice((i || 0) % 4 * 2, 2), this.g(s, o);
  }
  K(e, t, n, r, i) {
    this.g([e + n / 2, t, e + n, t + r / 2, e + n / 2, t + r, e, t + r / 2], i);
  }
};
function Iu(e, t, n, r) {
  e = e % 14;
  let i, o, s, a, l, c;
  e ? e == 1 ? (s = 0 | n * 0.5, a = 0 | n * 0.8, t.j(n - s, 0, s, a, 2)) : e == 2 ? (s = 0 | n / 3, t.i(s, s, n - s, n - s)) : e == 3 ? (l = n * 0.1, c = n < 6 ? 1 : n < 8 ? 2 : 0 | n * 0.25, l = l > 1 ? 0 | l : l > 0.5 ? 1 : l, t.i(c, c, n - l - c, n - l - c)) : e == 4 ? (o = 0 | n * 0.15, s = 0 | n * 0.5, t.h(n - s - o, n - s - o, s)) : e == 5 ? (l = n * 0.1, c = l * 4, c > 3 && (c = 0 | c), t.i(0, 0, n, n), t.g([c, c, n - l, c, c + (n - c - l) / 2, n - l], !0)) : e == 6 ? t.g([0, 0, n, 0, n, n * 0.7, n * 0.4, n * 0.4, n * 0.7, n, 0, n]) : e == 7 ? t.j(n / 2, n / 2, n / 2, n / 2, 3) : e == 8 ? (t.i(0, 0, n, n / 2), t.i(0, n / 2, n / 2, n / 2), t.j(n / 2, n / 2, n / 2, n / 2, 1)) : e == 9 ? (l = n * 0.14, c = n < 4 ? 1 : n < 6 ? 2 : 0 | n * 0.35, l = n < 8 ? l : 0 | l, t.i(0, 0, n, n), t.i(c, c, n - c - l, n - c - l, !0)) : e == 10 ? (l = n * 0.12, c = l * 3, t.i(0, 0, n, n), t.h(c, c, n - l - c, !0)) : e == 11 ? t.j(n / 2, n / 2, n / 2, n / 2, 3) : e == 12 ? (o = n * 0.25, t.i(0, 0, n, n), t.K(o, o, n - o, n - o, !0)) : !r && (o = n * 0.4, s = n * 1.2, t.h(o, o, s)) : (i = n * 0.42, t.g([0, 0, n, 0, n, n - i * 2, n - i, n, 0, n]));
}
function ea(e, t, n) {
  e = e % 4;
  let r;
  e ? e == 1 ? t.j(0, n / 2, n, n / 2, 0) : e == 2 ? t.K(0, 0, n, n) : (r = n / 6, t.h(r, r, n - 2 * r)) : t.j(0, 0, n, n, 0);
}
function Ru(e, t) {
  return e = t.W(e), [Ln(e, t.D, t.F(0)), Ln(e, t.o, t.p(0.5)), Ln(e, t.D, t.F(1)), Ln(e, t.o, t.p(1)), Ln(e, t.o, t.p(0))];
}
function Cu(e, t, n) {
  let r = Ou(n, 0.08);
  r.G && e.m(r.G);
  let i = e.k, o = 0.5 + i * r.X | 0;
  i -= o * 2;
  let s = new Nu(e), a = 0 | i / 4, l = 0 | o + i / 2 - a * 2, c = 0 | o + i / 2 - a * 2;
  function h(m, b, _, j, w) {
    let E = Un(t, _, 1), A = j ? Un(t, j, 1) : 0;
    e.L(p[d[m]]);
    for (let O = 0; O < w.length; O++)
      s.u = new Ka(l + w[O][0] * a, c + w[O][1] * a, a, A++ % 4), b(E, s, a, O);
    e.M();
  }
  let u = Un(t, -7) / 268435455, p = Ru(u, r), d = [], f;
  function v(m) {
    if (m.indexOf(f) >= 0) {
      for (let b = 0; b < m.length; b++)
        if (d.indexOf(m[b]) >= 0)
          return !0;
    }
  }
  for (let m = 0; m < 3; m++)
    f = Un(t, 8 + m, 1) % p.length, (v([0, 4]) || v([2, 3])) && (f = 1), d.push(f);
  h(0, ea, 2, 3, [[1, 0], [2, 0], [2, 3], [1, 3], [0, 1], [3, 1], [3, 2], [0, 2]]), h(1, ea, 4, 5, [[0, 0], [3, 0], [3, 3], [0, 3]]), h(2, Iu, 1, null, [[1, 1], [2, 1], [2, 2], [1, 2]]), e.finish();
}
function Du(e) {
  var t = 0, n = 0, r = encodeURI(e) + "%80", i = [], o, s = [], a = 1732584193, l = 4023233417, c = ~a, h = ~l, u = 3285377520, p = [a, l, c, h, u], d = 0, f = "";
  function v(m, b) {
    return m << b | m >>> 32 - b;
  }
  for (; t < r.length; n++)
    i[n >> 2] = i[n >> 2] | (r[t] == "%" ? parseInt(r.substring(t + 1, t += 3), 16) : r.charCodeAt(t++)) << (3 - (n & 3)) * 8;
  for (o = ((n + 7 >> 6) + 1) * 16, i[o - 1] = n * 8 - 8; d < o; d += 16) {
    for (t = 0; t < 80; t++)
      n = v(a, 5) + u + (t < 20 ? (l & c ^ ~l & h) + 1518500249 : t < 40 ? (l ^ c ^ h) + 1859775393 : t < 60 ? (l & c ^ l & h ^ c & h) + 2400959708 : (l ^ c ^ h) + 3395469782) + (s[t] = t < 16 ? i[d + t] | 0 : v(s[t - 3] ^ s[t - 8] ^ s[t - 14] ^ s[t - 16], 1)), u = h, h = c, c = v(l, 30), l = a, a = n;
    p[0] = a = p[0] + a | 0, p[1] = l = p[1] + l | 0, p[2] = c = p[2] + c | 0, p[3] = h = p[3] + h | 0, p[4] = u = p[4] + u | 0;
  }
  for (t = 0; t < 40; t++)
    f += (p[t >> 3] >>> (7 - (t & 7)) * 4 & 15).toString(16);
  return f;
}
function Pu(e) {
  return /^[0-9a-f]{11,}$/i.test(e) && e;
}
function Mu(e) {
  return Du(e == null ? "" : "" + e);
}
function on(e) {
  return (e * 10 + 0.5 | 0) / 10;
}
var $u = class {
  constructor() {
    this.v = "";
  }
  g(e) {
    let t = "";
    for (let n = 0; n < e.length; n++)
      t += (n ? "L" : "M") + on(e[n].x) + " " + on(e[n].y);
    this.v += t + "Z";
  }
  h(e, t, n) {
    let r = n ? 0 : 1, i = on(t / 2), o = on(t), s = "a" + i + "," + i + " 0 1," + r + " ";
    this.v += "M" + on(e.x) + " " + on(e.y + t / 2) + s + o + ",0" + s + -o + ",0";
  }
}, zu = class {
  constructor(e) {
    this.A, this.B = {}, this.N = e, this.k = e.k;
  }
  m(e) {
    let t = /^(#......)(..)?/.exec(e), n = t[2] ? Un(t[2], 0) / 255 : 1;
    this.N.m(t[1], n);
  }
  L(e) {
    this.A = this.B[e] || (this.B[e] = new $u());
  }
  M() {
  }
  g(e) {
    this.A.g(e);
  }
  h(e, t, n) {
    this.A.h(e, t, n);
  }
  finish() {
    let e = this.B;
    for (let t in e)
      e.hasOwnProperty(t) && this.N.O(t, e[t].v);
  }
}, Lu = { P: "http://www.w3.org/2000/svg", R: "width", S: "height" }, Bu = class {
  constructor(e) {
    this.k = e, this.C = '<svg xmlns="' + Lu.P + '" width="' + e + '" height="' + e + '" viewBox="0 0 ' + e + " " + e + '">';
  }
  m(e, t) {
    t && (this.C += '<rect width="100%" height="100%" fill="' + e + '" opacity="' + t.toFixed(2) + '"/>');
  }
  O(e, t) {
    this.C += '<path fill="' + e + '" d="' + t + '"/>';
  }
  toString() {
    return this.C + "</svg>";
  }
};
function Fu(e, t, n) {
  let r = new Bu(t);
  return Cu(new zu(r), Pu(e) || Mu(e), n), r.toString();
}
typeof document < "u" && document.querySelectorAll.bind(document);
var Ku = Z`:host{display:contents;--j-avatar-size:var(--j-size-md);--j-avatar-box-shadow:none;--j-avatar-border:none;--j-avatar-color:var(--j-color-black);--j-avatar-bg:var(--j-color-ui-100)}:host([src]){--j-avatar-bg:transparent}:host([selected]){--j-avatar-box-shadow:0px 0px 0px 2px var(--j-color-primary-500)}:host([online]) [part=base]:before{position:absolute;right:0;bottom:0;content:"";display:block;width:25%;height:25%;border-radius:50%;background:var(--j-color-primary-500)}:host([size=xxs]){--j-avatar-size:var(--j-size-xxs)}:host([size=xs]){--j-avatar-size:var(--j-size-xs)}:host([size=sm]){--j-avatar-size:var(--j-size-sm)}:host([size=lg]){--j-avatar-size:var(--j-size-lg)}:host([size=xl]){--j-avatar-size:var(--j-size-xl)}:host([size=xxl]){--j-avatar-size:var(--j-size-xxl)}[part=base]{position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:inherit;box-shadow:var(--j-avatar-box-shadow);color:var(--j-avatar-color);background:var(--j-avatar-bg);border:var(--j-avatar-border);padding:0;width:var(--j-avatar-size);height:var(--j-avatar-size);border-radius:50%}svg{width:calc(var(--j-avatar-size) - 30%);height:calc(var(--j-avatar-size) - 30%)}[part=icon]{--j-icon-size:calc(var(--j-avatar-size) * 0.6)}[part=img]{width:100%;height:100%;border-radius:50%}[part=initials]{font-weight:600;text-transform:uppercase}`, Ve = class extends W {
  constructor() {
    super(...arguments), this.src = null, this.hash = null, this.selected = !1, this.online = !1, this.initials = null, this.icon = "", this.size = null;
  }
  firstUpdated() {
    this.shadowRoot.querySelector("#identicon"), this.hash;
  }
  render() {
    return this.src ? B`<button part="base"><img part="img" src="${this.src}"></button>` : this.hash ? B`<button part="base">${_u(Fu(this.hash || "", 100))}</button>` : this.initials ? B`<button part="base"><span part="initials">${this.initials}</span></button>` : B`<button part="base"><j-icon part="icon" name="${this.icon}"></j-icon></button>`;
  }
};
Ve.styles = [H, Ku], g([k({ type: String, reflect: !0 })], Ve.prototype, "src", 2), g([k({ type: Uint8Array, reflect: !0 })], Ve.prototype, "hash", 2), g([k({ type: Boolean, reflect: !0 })], Ve.prototype, "selected", 2), g([k({ type: Boolean, reflect: !0 })], Ve.prototype, "online", 2), g([k({ type: String, reflect: !0 })], Ve.prototype, "initials", 2), g([k({ type: String })], Ve.prototype, "icon", 2), g([k({ type: String, reflect: !0 })], Ve.prototype, "size", 2), Ve = g([oe("j-avatar")], Ve);
var Qe = (e) => e ?? ie, Uu = Z`:host{--j-input-label-size:var(--j-font-size-500);--j-input-height:var(--j-size-md);--j-input-padding:var(--j-space-400)}:host([size=sm]){--j-input-height:var(--j-size-sm)}:host([size=lg]){--j-input-height:var(--j-size-lg)}:host([size=xl]){--j-input-height:var(--j-size-xl);--j-input-padding:var(--j-space-500)}:host([full]){display:block;width:100%}[part=base]{display:block;position:relative}[part=input-wrapper]{display:flex;align-items:center;position:relative;height:var(--j-input-height);font-size:var(--j-font-size-400);color:var(--j-color-black);background:var(--j-color-white);border-radius:var(--j-border-radius);border:1px solid var(--j-border-color);width:100%;min-width:200px;padding:0}[part=input-wrapper]:hover{border:1px solid var(--j-border-color-strong)}[part=input-wrapper]:focus-within{border:1px solid var(--j-color-focus)}[part=input-field]{border:0;flex:1;background:0 0;outline:0;font-family:inherit;color:var(--j-color-black);font-size:inherit;height:100%;width:100%;padding:0 var(--j-input-padding)}[part=input-field]::placeholder{color:var(--j-color-ui-400)}[part=error-text],[part=help-text]{left:0;bottom:-20px;position:absolute;font-size:var(--j-font-size-300)}[part=error-text]{color:var(--j-color-danger-500)}[part=start]::slotted(*){padding-left:var(--j-space-400)}[part=end]::slotted(*){padding-right:var(--j-space-400)}`, qu = class extends W {
  constructor() {
    super(), this.value = null, this._initialValue = null, this.max = null, this.min = null, this.maxlength = null, this.minlength = null, this.pattern = null, this.label = null, this.name = null, this.size = null, this.list = null, this.step = null, this.placeholder = null, this.errorText = null, this.helpText = null, this.autocomplete = !1, this.autovalidate = !1, this.autofocus = !1, this.disabled = !1, this.full = !1, this.error = !1, this.required = !1, this.readonly = !1, this.type = "text", this.focus = this.focus.bind(this), this.onFocus = this.onFocus.bind(this), this.onBlur = this.onBlur.bind(this), this.validate = this.validate.bind(this);
  }
  static get properties() {
    return { errorText: { type: String, attribute: "errortext" }, helpText: { type: String, attribute: "helptext" }, size: { type: String, reflect: !0 }, placeholder: { type: String }, label: { type: String }, name: { type: String }, full: { type: Boolean, reflect: !0 }, value: { type: String, reflect: !0 }, error: { type: Boolean, reflect: !0 }, max: { type: String, reflect: !0 }, min: { type: String, reflect: !0 }, list: { type: String, reflect: !0 }, step: { type: String, reflect: !0 }, maxlength: { type: Number }, minlength: { type: Number }, pattern: { type: String }, autocomplete: { type: Boolean }, autovalidate: { type: Boolean }, autofocus: { type: Boolean }, disabled: { type: Boolean, reflect: !0 }, readonly: { type: Boolean, reflect: !0 }, required: { type: Boolean, reflect: !0 }, type: { type: String } };
  }
  static get styles() {
    return [Uu, H];
  }
  connectedCallback() {
    super.connectedCallback(), this._initialValue = this.value;
  }
  onInput(e) {
    e.stopPropagation(), this.value = e.target.value, this.dispatchEvent(new CustomEvent("input", e));
  }
  onChange(e) {
    e.stopPropagation(), this.value = e.target.value, this.dispatchEvent(new CustomEvent("change", e));
  }
  select() {
    this.renderRoot.querySelector("input").select();
  }
  focus() {
    this.renderRoot.querySelector("input").focus();
  }
  onFocus(e) {
    e.stopPropagation(), this.value = e.target.value, this.dispatchEvent(new CustomEvent("change", e));
  }
  validate() {
    let e = this.renderRoot.querySelector("input").checkValidity(), t = this.errorText || this.renderRoot.querySelector("input").validationMessage;
    return e ? this.error = !1 : (this.error = !0, this.errorText = t), this.dispatchEvent(new CustomEvent("validate")), e;
  }
  onBlur(e) {
    e.stopPropagation(), this.autovalidate && this.validate(), this.dispatchEvent(new CustomEvent("blur", e));
  }
  render() {
    return B`<div part="base">${this.label && B`<j-text tag="label" variant="label" part="label">${this.label}</j-text>`}<div part="input-wrapper"><slot part="start" name="start"></slot><input part="input-field" .value="${this.value}" max="${Qe(this.max)}" min="${Qe(this.min)}" list="${Qe(this.list)}" step="${Qe(this.step)}" maxlength="${Qe(this.maxlength)}" minlength="${Qe(this.minlength)}" pattern="${Qe(this.pattern)}" placeholder="${Qe(this.placeholder)}" type="${Qe(this.type)}" @input="${this.onInput}" @blur="${this.onBlur}" @focus="${this.onFocus}" @change="${this.onChange}" @invalid="${this.onInvalid}" ?autocomplete="${this.autocomplete}" ?autofocus="${this.autofocus}" ?readonly="${this.readonly}" ?required="${this.required}" ?disabled="${this.disabled}"><slot part="end" name="end"></slot></div>${this.error ? this.errorText ? B`<div part="error-text">${this.errorText}</div>` : null : this.helpText ? B`<div part="help-text">${this.helpText}</div>` : null}</div>`;
  }
};
customElements.define("j-input", qu);
var Vu = Z`:host{--j-checkbox-size:var(--j-size-md)}:host([size=sm]){--j-checkbox-size:var(--j-size-sm)}:host([size=lg]){--j-checkbox-size:var(--j-size-lg)}:host([disabled]) [part=base]{opacity:.5;cursor:default}input{position:absolute;clip:rect(1px 1px 1px 1px);clip:rect(1px,1px,1px,1px);vertical-align:middle}[part=base]{cursor:pointer;display:flex;height:var(--j-checkbox-size);align-items:center;gap:var(--j-space-400)}:host(:not([disabled]):not([checked])) [part=base]:hover [part=indicator]{border-color:var(--j-color-ui-300)}[part=indicator]{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--j-color-ui-200);width:calc(var(--j-checkbox-size) * .6);height:calc(var(--j-checkbox-size) * .6);border-radius:var(--j-border-radius);color:var(--j-color-white)}[part=checkmark]{display:none}:host([checked]) [part=checkmark]{display:contents}:host([checked]) [part=indicator]{border-color:var(--j-color-primary-500);background:var(--j-color-primary-500)}`, Wu = class extends W {
  constructor() {
    super(), this.checked = !1, this.full = !1, this.disabled = !1, this.size = null, this.value = null, this._handleChange = this._handleChange.bind(this);
  }
  static get properties() {
    return { checked: { type: Boolean, reflect: !0 }, disabled: { type: Boolean, reflect: !0 }, full: { type: Boolean, reflect: !0 }, size: { type: String, reflect: !0 }, value: { type: String } };
  }
  static get styles() {
    return [Vu, H];
  }
  _handleChange(e) {
    e.stopPropagation(), this.checked = e.target.checked, this.dispatchEvent(new CustomEvent("change", e));
  }
  render() {
    return B`<label part="base"><input ?disabled="${this.disabled}" @change="${this._handleChange}" ?checked="${this.checked}" value="${this.value}" type="checkbox"> <span aria-hidden="true" part="indicator"><slot part="checkmark" name="checkmark"><j-icon name="check"></j-icon></slot></span><span part="label"><slot></slot></span></label>`;
  }
};
customElements.define("j-checkbox", Wu);
var Hu = { 32: "space", 27: "escape", 13: "enter", 8: "backspace", 38: "up", 40: "down" }, Gu = Z`[part=base]{position:relative}[part=input]::part(input-field){cursor:pointer}[part=menu]{background:var(--j-color-white);position:absolute;left:0;top:120%;max-height:200px;overflow-y:auto;width:100%;border:1px solid var(--j-color-ui-100);border-radius:var(--j-border-radius);visibility:hidden}:host([open]) [part=menu]{height:fit-content;visibility:visible;z-index:999}`, Rt = class extends W {
  constructor() {
    super(), this.value = null, this.label = null, this.open = !1, this.inputValue = null, this._handleClickOutside = this._handleClickOutside.bind(this), this._handleKeyDown = this._handleKeyDown.bind(this), this._handleInputClick = this._handleInputClick.bind(this), this._handleOptionClick = this._handleOptionClick.bind(this), this._handleSlotChange = this._handleSlotChange.bind(this), this._handleNavMouseOver = this._handleNavMouseOver.bind(this);
  }
  get optionElements() {
    return [...this.querySelectorAll("*")].filter((e) => e.value);
  }
  get selectedElement() {
    return this.optionElements.find((e) => e.value === this.value);
  }
  get activeElement() {
    return this.optionElements.find((e) => e.hasAttribute("active"));
  }
  firstUpdated() {
    let e = this.selectedElement;
    this.inputValue = (e == null ? void 0 : e.label) || (e == null ? void 0 : e.value) || "";
  }
  connectedCallback() {
    super.connectedCallback(), this.addEventListener("keydown", this._handleKeyDown), window.addEventListener("click", this._handleClickOutside);
  }
  disconnectedCallback() {
    window.removeEventListener("click", this._handleClickOutside), super.disconnectedCallback();
  }
  _handleOptionClick(e) {
    this.open = !1, this.value = e.target.value, this.inputValue = e.target.label;
  }
  _handleClickOutside(e) {
    let t = this.contains(e.target), n = this.contains(e.target);
    !t && !n && (this.open = !1);
  }
  _handleNavMouseOver(e) {
    this.optionElements.forEach((t) => t.removeAttribute("active"));
  }
  _handleKeyDown(e) {
    var t, n;
    e.preventDefault();
    let { keyCode: r } = e, i = Hu[r];
    if (i === "escape") {
      this.open = !1;
      return;
    }
    if ((i === "up" || "down") && !this.open) {
      this.open = !0, this.optionElements.forEach((o, s) => {
        s === 0 ? o.setAttribute("active", "") : o.removeAttribute("active");
      });
      return;
    }
    if (i === "enter" && this.open && this.activeElement && (this.open = !1, this.value = this.activeElement.value, this.inputValue = this.activeElement.label), i === "down" && this.open) {
      let o = this.optionElements.findIndex((a) => a.hasAttribute("active"));
      (t = this.activeElement) == null || t.removeAttribute("active");
      let s = this.optionElements[0];
      this.optionElements.forEach((a, l) => {
        o === -1 || o >= this.optionElements.length - 1 ? s.setAttribute("active", "") : l === o + 1 && a.setAttribute("active", "");
      });
    }
    if (i === "up" && this.open) {
      let o = this.optionElements.findIndex((a) => a.hasAttribute("active"));
      (n = this.activeElement) == null || n.removeAttribute("active");
      let s = this.optionElements[this.optionElements.length - 1];
      this.optionElements.forEach((a, l) => {
        o === 0 || o === -1 ? s.setAttribute("active", "") : l === o - 1 && a.setAttribute("active", "");
      });
    }
  }
  _handleInputClick(e) {
    e.preventDefault(), setTimeout(() => {
      this.open = !0;
    }, 0);
  }
  _handleSlotChange(e) {
    [...e.target.assignedNodes()].forEach((t) => {
      t.removeEventListener("mousedown", this._handleOptionClick), t.addEventListener("mousedown", this._handleOptionClick);
    });
  }
  shouldUpdate(e) {
    return e.has("value") && (this.dispatchEvent(new CustomEvent("change", { bubbles: !0 })), this.optionElements.forEach((t) => {
      t.value === this.value ? t.setAttribute("selected", "") : t.removeAttribute("selected");
    })), !0;
  }
  render() {
    return B`<div part="base"><j-input label="${this.label}" readonly="readonly" @click="${this._handleInputClick}" .value="${this.inputValue}" part="input"><j-icon size="sm" slot="end" part="arrow" name="chevron-down"></j-icon></j-input><nav part="menu" @mouseover="${this._handleNavMouseOver}"><slot @slotchange="${this._handleSlotChange}"></slot></nav></div>`;
  }
};
Rt.styles = [H, Gu], g([k({ type: String, reflect: !0 })], Rt.prototype, "value", 2), g([k({ type: String, reflect: !0 })], Rt.prototype, "label", 2), g([k({ type: Boolean, reflect: !0 })], Rt.prototype, "open", 2), g([k({ type: String, reflect: !0 })], Rt.prototype, "inputValue", 2), Rt = g([oe("j-select")], Rt);
var Yu = Z`:host{--j-modal-backdrop-bg-color:rgba(0, 0, 0, 0.1);--j-modal-backdrop-transition:all 0.2s cubic-bezier(0.785, 0.135, 0.15, 0.86);--j-modal-transition:all 0.4s cubic-bezier(0.785, 0.135, 0.15, 0.86);--j-modal-box-shadow:none;--j-modal-width:clamp(600px, 50vw, 800px);--j-modal-width-mobile:95vw;--j-modal-height:auto;--j-modal-padding:var(--j-space-400);--j-modal-border:1px solid transparent;--j-modal-translateY:100%;--j-modal-translateX:0px;--j-modal-justify:center;--j-modal-align:flex-end;--j-modal-max-height:90vh}:host([size=xs]){--j-modal-width-mobile:95vw;--j-modal-width:clamp(350px, 30vw, 500px)}:host([size=sm]){--j-modal-width-mobile:95vw;--j-modal-width:clamp(350px, 40vw, 600px)}:host([size=lg]){--j-modal-width-mobile:95vw;--j-modal-width:clamp(350px, 50vw, 1000px)}:host([size=xl]){--j-modal-width-mobile:95vw;--j-modal-width:clamp(350px, 60vw, 1200px)}:host([size=fullscreen]){--j-modal-width-mobile:100vw;--j-modal-width:100vw;--j-modal-height:100vh;--j-modal-max-height:100vh}:host{width:100vw;height:100vh;z-index:999999;position:fixed;left:0;top:0;display:flex;align-items:var(--j-modal-align);justify-content:var(--j-modal-justify);padding-bottom:var(--j-space-400);visibility:hidden}:host([open]){visibility:visible}:host([open]) [part=modal]{opacity:1;transform:scale(1)}[part=modal]{transition:all .2s ease;opacity:0;transform:scale(.95);display:flex;flex-direction:column;justify-content:space-between;position:relative;z-index:999;border-radius:var(--j-border-radius);width:var(--j-modal-width-mobile);height:var(--j-modal-height);max-height:var(--j-modal-max-height);background:var(--j-color-white);border:1px solid var(--j-border-color)}@media screen and (min-width:1000px){:host{--j-modal-align:center}[part=modal]{width:var(--j-modal-width)}}[part=content]{flex:1;overflow-y:auto}[part=close-button]{cursor:pointer;padding:0;background:0 0;border:0;width:15px;height:15px;color:var(--j-color-black);fill:currentColor;position:absolute;right:var(--j-space-600);top:var(--j-space-600)}[part=close-icon]{width:15px;height:15px}[part=backdrop]{opacity:0;transition:opacity .2s cubic-bezier(.785,.135,.15,.86);overflow:visible;z-index:400;position:absolute;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.6)}:host([open]) [part=backdrop]{opacity:1}`, Bn = class extends W {
  constructor() {
    super(...arguments), this.size = null, this.open = !1;
  }
  shouldUpdate(e) {
    return e.has("open") && this.dispatchEvent(new CustomEvent("toggle", { bubbles: !0 })), !0;
  }
  disconnectedCallback() {
    document.body.style.overflow = "visible";
  }
  render() {
    return B`<div part="base"><div part="backdrop" @click="${() => this.open = !1}"></div><div part="modal"><button @click="${() => this.open = !1}" part="close-button"><svg part="close-icon" viewBox="0 0 329.26933 329" xmlns="http://www.w3.org/2000/svg"><path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/></svg></button><slot name="header" part="header"></slot><div part="content"><slot></slot></div><slot name="footer" part="footer"></slot></div></div>`;
  }
};
Bn.styles = [H, Yu], g([k({ type: String, reflect: !0 })], Bn.prototype, "size", 2), g([k({ type: Boolean, reflect: !0, hasChanged(e) {
  return e ? document.body.style.overflow = "hidden" : document.body.style.overflow = "visible", !0;
} })], Bn.prototype, "open", 2), Bn = g([oe("j-modal")], Bn);
var Ju = Z`:host([open]) [part=tooltip]{display:inline-block}[part=base]{display:inline-block}[part=tooltip]{white-space:nowrap;z-index:999;display:none;font-size:var(--j-font-size-400);font-weight:500;padding:var(--j-space-300) var(--j-space-300);background:#222;color:#fff;border-radius:var(--j-border-radius)}[part=content]{display:inline-block;position:relative}[part=arrow],[part=arrow]::before{position:absolute;width:8px;height:8px;background:inherit}[part=arrow]{visibility:hidden}[part=arrow]::before{visibility:visible;content:"";transform:rotate(45deg)}[part=tooltip][data-popper-placement^=top]>[part=arrow]{bottom:-4px}[part=tooltip][data-popper-placement^=bottom]>[part=arrow]{top:-4px}[part=tooltip][data-popper-placement^=left]>[part=arrow]{right:-4px}[part=tooltip][data-popper-placement^=right]>[part=arrow]{left:-4px}`, Ct = class extends W {
  constructor() {
    super(...arguments), this.open = !1, this.title = null, this.placement = "auto", this.popperInstance = null;
  }
  get tooltipEl() {
    return this.renderRoot.querySelector("[part='tooltip']");
  }
  get contentEl() {
    return this.renderRoot.querySelector("[part='content']");
  }
  shouldUpdate(e) {
    var t;
    return e.has("open") && (this.open ? this.popperInstance ? (this.popperInstance.setOptions({ placement: this.placement }), this.popperInstance.update()) : this.createTooltip() : (t = this.tooltipEl) == null || t.removeAttribute("data-show"), this.dispatchEvent(new CustomEvent("toggle", { bubbles: !0 }))), !0;
  }
  createTooltip() {
    this.contentEl && this.tooltipEl && (this.popperInstance = ao(this.contentEl, this.tooltipEl, { placement: this.placement, strategy: "absolute", modifiers: [{ name: "offset", options: { offset: [0, 10] } }] }));
  }
  firstUpdated() {
    this.createTooltip();
  }
  connectedCallback() {
    super.connectedCallback(), this.addEventListener("mouseover", () => this.show()), this.addEventListener("mouseleave", () => this.hide()), this.addEventListener("focusin", () => this.show()), this.addEventListener("focusout", () => this.hide());
  }
  show() {
    this.open = !0;
  }
  hide() {
    this.open = !1;
  }
  render() {
    return B`<div part="base"><div part="tooltip"><slot name="title">${this.title}</slot><div part="arrow" data-popper-arrow></div></div><div part="content" @click="${() => this.hide()}" @contextmenu="${() => this.hide()}"><slot></slot></div></div>`;
  }
};
Ct.styles = [H, Ju], g([k({ type: Boolean, reflect: !0 })], Ct.prototype, "open", 2), g([k({ type: String, reflect: !0 })], Ct.prototype, "title", 2), g([k({ type: String, reflect: !0 })], Ct.prototype, "placement", 2), g([mt()], Ct.prototype, "popperInstance", 2), Ct = g([oe("j-tooltip")], Ct);
var Ua = Z`:host{--j-icon-color:currentColor;--j-icon-size:24px;display:inline-flex;align-items:center;justify-content:center}:host i{color:var(--j-icon-color);fill:var(--j-icon-color);display:block;font-size:var(--j-icon-size)}:host([size=xs]) i{--j-icon-size:16px}:host([size=sm]) i{--j-icon-size:18px}:host([size=lg]) i{--j-icon-size:32px}:host([size=xl]) i{--j-icon-size:48px}`, Dt = class extends W {
  constructor() {
    super(), this.name = null, this.size = null, this.color = null, this.svg = "", this.attachShadow({ mode: "open" }), this.shadowRoot.innerHTML = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">';
  }
  shouldUpdate() {
    let e = [Ua, H];
    if (this.color) {
      let t = Fe("j-color", this.color, "currentColor");
      e.push(Ho("--j-icon-color", t));
    }
    return br(this.shadowRoot, e), !0;
  }
  render() {
    return B`<i class="bi-${this.name}" role="img" aria-label="${this.name}"></i>`;
  }
};
Dt.styles = [H, Ua], g([k({ type: String, reflect: !0 })], Dt.prototype, "name", 2), g([k({ type: String, reflect: !0 })], Dt.prototype, "size", 2), g([k({ type: String, reflect: !0 })], Dt.prototype, "color", 2), g([mt()], Dt.prototype, "svg", 2), Dt = g([oe("j-icon")], Dt);
var Xu = Z`:host{--j-tabs-padding:0 4px 2px 4px;--j-tabs-border-radius:none;--j-tab-item-border-selected:0px 4px 0px -2px var(--j-color-primary-500);--j-tab-item-border-hover:0px 4px 0px -2px var(--j-color-ui-200);--j-tab-item-box-shadow:none;--j-tab-item-color:var(--j-color-ui-600);display:block;overflow-x:auto}[part=base]{display:inline-flex;align-items:center;flex-wrap:nowrap;border-radius:var(--j-tabs-border-radius);padding:var(--j-tabs-padding)}:host([wrap]) [part=base]{flex-wrap:wrap}:host([vertical]) [part=base]{flex-direction:column;--j-tab-item-text-align:left;--j-tab-item-width:100%}:host([vertical]) ::slotted([checked]){--j-tab-item-box-shadow:2px 0px 0px 0px var(--j-color-primary-500)}:host([full]) [part=base]{width:100%;display:flex}:host([full]){--j-tab-item-width:100%}:host([size=sm]) ::slotted(*){--j-tab-item-height:var(--j-size-sm);--j-tab-item-font-size:var(--j-font-size-400)}:host([size=lg]) ::slotted(*){--j-tab-item-height:var(--j-size-lg);--j-tab-item-font-size:var(--j-font-size-600)}:host ::slotted(:hover){--j-tab-item-color:var(--j-color-black)}:host ::slotted([checked]){--j-tab-item-color:var(--j-color-black);--j-tab-item-box-shadow:0px 2px 0px 0px var(--j-color-primary-500)}:host([variant=button]) ::slotted(*){--j-tab-item-border-radius:var(--j-border-radius);--j-tab-item-box-shadow:none;--j-tab-item-color:var(--j-color-ui-600)}:host([variant=button]) ::slotted(:hover){--j-tab-item-box-shadow:none;--j-tab-item-color:var(--j-color-ui-700)}:host([variant=button]) ::slotted([checked]){--j-tab-item-background:var(--j-color-primary-100);--j-tab-item-box-shadow:none;--j-tab-item-color:var(--j-color-black)}`, Ze = class extends W {
  constructor() {
    super(...arguments), this.value = null, this.variant = null, this.size = null, this.vertical = !1, this.wrap = !1, this.full = !1;
  }
  get optionElements() {
    return [...this.children];
  }
  get selectedElement() {
    return this.optionElements.find((e) => e.value === this.value);
  }
  firstUpdated() {
  }
  shouldUpdate(e) {
    return e.has("value") && (this.selectTab(this.value), this.dispatchEvent(new CustomEvent("change", { bubbles: !0 }))), !0;
  }
  selectTab(e) {
    this.optionElements.forEach((t) => {
      let n = t.value === e;
      t.checked = n, this.value = e;
    });
  }
  connectedCallback() {
    super.connectedCallback(), this.value && setTimeout(() => {
      this.selectTab(this.value);
    }, 100), this.addEventListener("tab-selected", (e) => {
      e.stopPropagation(), this.selectTab(e.target.value);
    });
  }
  render() {
    return B`<div part="base" role="tablist"><slot></slot></div>`;
  }
};
Ze.styles = [H, Xu], g([k({ type: String, reflect: !0 })], Ze.prototype, "value", 2), g([k({ type: String, reflect: !0 })], Ze.prototype, "variant", 2), g([k({ type: String, reflect: !0 })], Ze.prototype, "size", 2), g([k({ type: Boolean, reflect: !0 })], Ze.prototype, "vertical", 2), g([k({ type: Boolean, reflect: !0 })], Ze.prototype, "wrap", 2), g([k({ type: Boolean, reflect: !0 })], Ze.prototype, "full", 2), Ze = g([oe("j-tabs")], Ze);
var Qu = Z`:host{--j-tab-item-width:inherit;--j-tab-item-background:none;--j-tab-item-border-radius:none;--j-tab-item-border:none;--j-tab-item-color:var(--j-color-ui-600);--j-tab-item-box-shadow:none;--j-tab-item-padding:0 var(--j-space-500);--j-tab-item-height:var(--j-size-md);--j-tab-item-font-size:var(--j-font-size-500)}:host([size=sm]){--j-tab-item-height:var(--j-size-sm)}:host([size=lg]){--j-tab-item-height:var(--j-size-lg)}[part=base]{display:flex;align-items:center;gap:var(--j-space-400);justify-content:space-between;white-space:nowrap;width:var(--j-tab-item-width);outline:0;border:var(--j-tab-item-border);border-radius:var(--j-tab-item-border-radius);box-shadow:var(--j-tab-item-box-shadow);font-family:var(--j-font-family);color:var(--j-tab-item-color);cursor:pointer;z-index:1;border:none;text-align:var(--j-tab-item-text-align,center);height:var(--j-tab-item-height);font-weight:600;font-size:var(--j-tab-item-font-size);background:var(--j-tab-item-background);padding:var(--j-tab-item-padding)}[part=content]{flex:1}:host([disabled]) [part=base]{cursor:not-allowed;opacity:.6}:host([disabled][checked]) [part=base]{opacity:1}`, sn = class extends W {
  constructor() {
    super(...arguments), this.checked = !1, this.disabled = !1, this._label = null, this._value = null;
  }
  get label() {
    return this._label || this.getAttribute("label") || this.innerText || this.innerHTML;
  }
  set label(e) {
    this._label = e, this.setAttribute("label", e);
  }
  get value() {
    return this._value || this.getAttribute("value") || this.innerText || this.innerHTML;
  }
  set value(e) {
    this._value = e, this.setAttribute("value", e);
  }
  static get styles() {
    return [Qu, H];
  }
  _handleChange(e) {
    e.stopPropagation(), this.checked = !0, this.dispatchEvent(new CustomEvent("tab-selected", { bubbles: !0 }));
  }
  render() {
    return B`<button aria-selected="${this.checked}" aria-controls="${this.value}" ?disabled="${this.disabled}" @click="${this._handleChange}" part="base" role="tab"><slot name="start"></slot><div part="content"><slot></slot></div><slot name="start"></slot></button>`;
  }
};
g([k({ type: Boolean, reflect: !0 })], sn.prototype, "checked", 2), g([k({ type: Boolean, reflect: !0 })], sn.prototype, "disabled", 2), g([mt()], sn.prototype, "_label", 2), g([mt()], sn.prototype, "_value", 2), sn = g([oe("j-tab-item")], sn);
var qa = Z`:host{--j-flex-gap:none;--j-flex-align-items:top;--j-flex-justify-content:start;--j-flex-display:flex;--j-flex-wrap:nowrap;--j-flex-direction:row}:host([inline]){--j-flex-display:inline-flex}:host([wrap]){--j-flex-wrap:wrap}:host([a=center]){--j-flex-align-items:center}:host([a=start]){--j-flex-align-items:start}:host([a=end]){--j-flex-align-items:end}:host([j=between]){--j-flex-justify-content:space-between}:host([j=around]){--j-flex-justify-content:space-around}:host([j=center]){--j-flex-justify-content:center}:host([j=end]){--j-flex-justify-content:flex-end}:host([j=start]){--j-flex-justify-content:flex-start}:host([direction=row]){--j-flex-direction:row}:host([direction=row-reverse]){--j-flex-direction:row-reverse}:host([direction=column]){--j-flex-direction:column}:host([direction=column-reverse]){--j-flex-direction:column-reverse}[part=base]{display:var(--j-flex-display);gap:var(--j-flex-gap);flex-direction:var(--j-flex-direction);align-items:var(--j-flex-align-items);justify-content:var(--j-flex-justify-content);flex-wrap:var(--j-flex-wrap)}`, pt = class extends W {
  constructor() {
    super(...arguments), this.j = null, this.a = null, this.wrap = !1, this.gap = null, this.direction = null;
  }
  shouldUpdate() {
    let e = [qa, H];
    if (this.gap) {
      let t = Fe("j-space", this.gap);
      e.push(Ho("--j-flex-gap", t));
    }
    return br(this.shadowRoot, e), !0;
  }
  render() {
    return B`<div part="base"><slot></slot></div>`;
  }
};
pt.styles = [H, qa], g([k({ type: String, reflect: !0 })], pt.prototype, "j", 2), g([k({ type: String, reflect: !0 })], pt.prototype, "a", 2), g([k({ type: Boolean, reflect: !0 })], pt.prototype, "wrap", 2), g([k({ type: String, reflect: !0 })], pt.prototype, "gap", 2), g([k({ type: String, reflect: !0 })], pt.prototype, "direction", 2), pt = g([oe("j-flex")], pt);
var Zu = Z`:host{--j-badge-border-radius:var(--j-border-radius);--j-badge-bg:var(--j-color-ui-100);--j-badge-color:var(--j-color-ui-500);--j-badge-font-size:var(--j-font-size-400);--j-badge-padding:var(--j-space-200) var(--j-space-300)}:host([size=sm]){--j-badge-font-size:var(--j-font-size-300);--j-badge-padding:var(--j-space-100) var(--j-space-200)}:host([size=lg]){--j-badge-font-size:var(--j-font-size-500);--j-badge-padding:var(--j-space-300) var(--j-space-500)}:host([variant=primary]){--j-badge-bg:var(--j-color-primary-100);--j-badge-color:var(--j-color-primary-600)}:host([variant=success]){--j-badge-bg:var(--j-color-success-100);--j-badge-color:var(--j-color-success-600)}:host([variant=warning]){--j-badge-bg:var(--j-color-warning-100);--j-badge-color:var(--j-color-warning-600)}:host([variant=danger]){--j-badge-bg:var(--j-color-danger-100);--j-badge-color:var(--j-color-danger-600)}[part=base]{font-size:var(--j-badge-font-size);border-radius:var(--j-badge-border-radius);display:inline-flex;align-items:center;justify-content:center;padding:var(--j-badge-padding);background:var(--j-badge-bg);color:var(--j-badge-color)}`, Fn = class extends W {
  constructor() {
    super(...arguments), this.variant = null, this.size = null;
  }
  render() {
    return B`<span part="base"><slot></slot></span>`;
  }
};
Fn.styles = [H, Zu], g([k({ type: String, reflect: !0 })], Fn.prototype, "variant", 2), g([k({ type: String, reflect: !0 })], Fn.prototype, "size", 2), Fn = g([oe("j-badge")], Fn);
var ep = Z`:host{display:contents;--j-spinner-size:var(--j-size-md);--j-spinner-stroke:2px;--j-spinner-color:var(--j-color-primary-500)}:host([size=xxs]){--j-spinner-size:var(--j-size-xxs);--j-spinner-stroke:1px;--j-spinner-color:var(--j-color-primary-500)}:host([size=xs]){--j-spinner-size:var(--j-size-xs);--j-spinner-stroke:2px;--j-spinner-color:var(--j-color-primary-500)}:host([size=sm]){--j-spinner-size:var(--j-size-sm);--j-spinner-stroke:2px;--j-spinner-color:var(--j-color-primary-500)}:host([size=lg]){--j-spinner-size:var(--j-size-lg);--j-spinner-stroke:4px;--j-spinner-color:var(--j-color-primary-500)}.lds-ring{display:inline-block;position:relative;width:var(--j-spinner-size);height:var(--j-spinner-size)}.lds-ring div{box-sizing:border-box;display:block;position:absolute;width:var(--j-spinner-size);height:var(--j-spinner-size);margin:var(--j-spinner-stroke);border:var(--j-spinner-stroke) solid var(--j-spinner-color);border-radius:50%;animation:lds-ring 1.2s cubic-bezier(.5,0,.5,1) infinite;border-color:var(--j-spinner-color) transparent transparent transparent}.lds-ring div:nth-child(1){animation-delay:-.45s}.lds-ring div:nth-child(2){animation-delay:-.3s}.lds-ring div:nth-child(3){animation-delay:-.15s}@keyframes lds-ring{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`, Rr = class extends W {
  constructor() {
    super(...arguments), this.size = null;
  }
  render() {
    return B`<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;
  }
};
Rr.styles = [H, ep], g([k({ type: String, reflect: !0 })], Rr.prototype, "size", 2), Rr = g([oe("j-spinner")], Rr);
var tp = Z`:host{--j-toast-border:1px solid var(--j-color-primary-400);--j-toast-background:var(--j-color-primary-500);--j-toast-color:var(--j-color-white)}:host([variant=success]){--j-toast-border:1px solid var(--j-color-success-400);--j-toast-background:var(--j-color-success-500);--j-toast-color:var(--j-color-white)}:host([variant=danger]){--j-toast-border:1px solid var(--j-color-danger-400);--j-toast-background:var(--j-color-danger-500);--j-toast-color:var(--j-color-white)}:host([variant=warning]){--j-toast-border:1px solid var(--j-color-warning-400);--j-toast-background:var(--j-color-warning-500);--j-toast-color:var(--j-color-white)}:host{visibility:hidden;position:absolute;left:0;top:0}:host([open]){position:relative;visibility:visible;display:block;position:fixed;top:calc(100% - var(--j-space-500));left:50%;transform:translateX(-50%) translateY(-100%);z-index:999999}:host([open]) [part=base]{opacity:1;transform:translateY(0);transition:all .2s ease}[part=base]{opacity:0;transform:translateY(10px);position:relative;box-shadow:var(--j-depth-100);display:block;border-radius:var(--j-border-radius);background:var(--j-toast-background);border:var(--j-toast-border);color:var(--j-toast-color);max-width:900px;min-width:150px;padding-top:var(--j-space-400);padding-bottom:var(--j-space-400);padding-left:var(--j-space-500);padding-right:var(--j-space-900)}[part=base] j-button{position:absolute;top:var(--j-space-300);right:var(--j-space-300)}`, qn, an = class extends W {
  constructor() {
    super(...arguments), this.variant = null, this.open = !1, this.autohide = 5, Vl(this, qn, null);
  }
  autoClose() {
    this.autohide > 0 && Wl(this, qn, setTimeout(() => {
      this.open = !1;
    }, this.autohide * 1e3));
  }
  shouldUpdate() {
    return this.open ? (clearTimeout(Ns(this, qn)), this.autoClose(), this.dispatchEvent(new CustomEvent("toggle", { bubbles: !0 }))) : (clearTimeout(Ns(this, qn)), this.dispatchEvent(new CustomEvent("toggle", { bubbles: !0 }))), !0;
  }
  render() {
    return B`<div part="base"><div part="content"><slot></slot></div><j-button @click="${() => this.open = !1}" size="sm" variant="ghost"><j-icon size="sm" name="x"></j-icon></j-button></div>`;
  }
};
qn = /* @__PURE__ */ new WeakMap(), an.styles = [H, tp], g([k({ type: String, reflect: !0 })], an.prototype, "variant", 2), g([k({ type: Boolean, reflect: !0 })], an.prototype, "open", 2), g([k({ type: Number, reflect: !0 })], an.prototype, "autohide", 2), an = g([oe("j-toast")], an);
var Q = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, pe = Object.keys, ye = Array.isArray;
typeof Promise < "u" && !Q.Promise && (Q.Promise = Promise);
function xe(e, t) {
  return typeof t != "object" || pe(t).forEach(function(n) {
    e[n] = t[n];
  }), e;
}
var ir = Object.getPrototypeOf, np = {}.hasOwnProperty;
function Ne(e, t) {
  return np.call(e, t);
}
function wn(e, t) {
  typeof t == "function" && (t = t(ir(e))), (typeof Reflect > "u" ? pe : Reflect.ownKeys)(t).forEach((n) => {
    st(e, n, t[n]);
  });
}
var Va = Object.defineProperty;
function st(e, t, n, r) {
  Va(e, t, xe(n && Ne(n, "get") && typeof n.get == "function" ? { get: n.get, set: n.set, configurable: !0 } : { value: n, configurable: !0, writable: !0 }, r));
}
function On(e) {
  return { from: function(t) {
    return e.prototype = Object.create(t.prototype), st(e.prototype, "constructor", e), { extend: wn.bind(null, e.prototype) };
  } };
}
var rp = Object.getOwnPropertyDescriptor;
function ts(e, t) {
  let n = rp(e, t), r;
  return n || (r = ir(e)) && ts(r, t);
}
var ip = [].slice;
function Ni(e, t, n) {
  return ip.call(e, t, n);
}
function Wa(e, t) {
  return t(e);
}
function Vn(e) {
  if (!e)
    throw new Error("Assertion Failed");
}
function Ha(e) {
  Q.setImmediate ? setImmediate(e) : setTimeout(e, 0);
}
function Ga(e, t) {
  return e.reduce((n, r, i) => {
    var o = t(r, i);
    return o && (n[o[0]] = o[1]), n;
  }, {});
}
function op(e, t, n) {
  try {
    e.apply(null, n);
  } catch (r) {
    t && t(r);
  }
}
function it(e, t) {
  if (Ne(e, t))
    return e[t];
  if (!t)
    return e;
  if (typeof t != "string") {
    for (var n = [], r = 0, i = t.length; r < i; ++r) {
      var o = it(e, t[r]);
      n.push(o);
    }
    return n;
  }
  var s = t.indexOf(".");
  if (s !== -1) {
    var a = e[t.substr(0, s)];
    return a === void 0 ? void 0 : it(a, t.substr(s + 1));
  }
}
function Ke(e, t, n) {
  if (!(!e || t === void 0) && !("isFrozen" in Object && Object.isFrozen(e)))
    if (typeof t != "string" && "length" in t) {
      Vn(typeof n != "string" && "length" in n);
      for (var r = 0, i = t.length; r < i; ++r)
        Ke(e, t[r], n[r]);
    } else {
      var o = t.indexOf(".");
      if (o !== -1) {
        var s = t.substr(0, o), a = t.substr(o + 1);
        if (a === "")
          n === void 0 ? ye(e) && !isNaN(parseInt(s)) ? e.splice(s, 1) : delete e[s] : e[s] = n;
        else {
          var l = e[s];
          (!l || !Ne(e, s)) && (l = e[s] = {}), Ke(l, a, n);
        }
      } else
        n === void 0 ? ye(e) && !isNaN(parseInt(t)) ? e.splice(t, 1) : delete e[t] : e[t] = n;
    }
}
function sp(e, t) {
  typeof t == "string" ? Ke(e, t, void 0) : "length" in t && [].map.call(t, function(n) {
    Ke(e, n, void 0);
  });
}
function Ya(e) {
  var t = {};
  for (var n in e)
    Ne(e, n) && (t[n] = e[n]);
  return t;
}
var ap = [].concat;
function Ja(e) {
  return ap.apply([], e);
}
var Xa = "Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(Ja([8, 16, 32, 64].map((e) => ["Int", "Uint", "Float"].map((t) => t + e + "Array")))).filter((e) => Q[e]), lp = Xa.map((e) => Q[e]);
Ga(Xa, (e) => [e, !0]);
var dt = null;
function wr(e) {
  dt = typeof WeakMap < "u" && /* @__PURE__ */ new WeakMap();
  let t = uo(e);
  return dt = null, t;
}
function uo(e) {
  if (!e || typeof e != "object")
    return e;
  let t = dt && dt.get(e);
  if (t)
    return t;
  if (ye(e)) {
    t = [], dt && dt.set(e, t);
    for (var n = 0, r = e.length; n < r; ++n)
      t.push(uo(e[n]));
  } else if (lp.indexOf(e.constructor) >= 0)
    t = e;
  else {
    let o = ir(e);
    t = o === Object.prototype ? {} : Object.create(o), dt && dt.set(e, t);
    for (var i in e)
      Ne(e, i) && (t[i] = uo(e[i]));
  }
  return t;
}
var { toString: cp } = {};
function po(e) {
  return cp.call(e).slice(8, -1);
}
var ho = typeof Symbol < "u" ? Symbol.iterator : "@@iterator", up = typeof ho == "symbol" ? function(e) {
  var t;
  return e != null && (t = e[ho]) && t.apply(e);
} : function() {
  return null;
}, hn = {};
function nt(e) {
  var t, n, r, i;
  if (arguments.length === 1) {
    if (ye(e))
      return e.slice();
    if (this === hn && typeof e == "string")
      return [e];
    if (i = up(e)) {
      for (n = []; r = i.next(), !r.done; )
        n.push(r.value);
      return n;
    }
    if (e == null)
      return [e];
    if (t = e.length, typeof t == "number") {
      for (n = new Array(t); t--; )
        n[t] = e[t];
      return n;
    }
    return [e];
  }
  for (t = arguments.length, n = new Array(t); t--; )
    n[t] = arguments[t];
  return n;
}
var ns = typeof Symbol < "u" ? (e) => e[Symbol.toStringTag] === "AsyncFunction" : () => !1, Ye = typeof location < "u" && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
function Qa(e, t) {
  Ye = e, Za = t;
}
var Za = () => !0, pp = !new Error("").stack;
function Xt() {
  if (pp)
    try {
      throw Xt.arguments, new Error();
    } catch (e) {
      return e;
    }
  return new Error();
}
function fo(e, t) {
  var n = e.stack;
  return n ? (t = t || 0, n.indexOf(e.name) === 0 && (t += (e.name + e.message).split(`
`).length), n.split(`
`).slice(t).filter(Za).map((r) => `
` + r).join("")) : "";
}
var hp = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"], el = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"], rs = hp.concat(el), dp = { VersionChanged: "Database version changed by other database connection", DatabaseClosed: "Database has been closed", Abort: "Transaction aborted", TransactionInactive: "Transaction has already completed or failed", MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb" };
function Tn(e, t) {
  this._e = Xt(), this.name = e, this.message = t;
}
On(Tn).from(Error).extend({ stack: { get: function() {
  return this._stack || (this._stack = this.name + ": " + this.message + fo(this._e, 2));
} }, toString: function() {
  return this.name + ": " + this.message;
} });
function tl(e, t) {
  return e + ". Errors: " + Object.keys(t).map((n) => t[n].toString()).filter((n, r, i) => i.indexOf(n) === r).join(`
`);
}
function ii(e, t, n, r) {
  this._e = Xt(), this.failures = t, this.failedKeys = r, this.successCount = n, this.message = tl(e, t);
}
On(ii).from(Tn);
function Jn(e, t) {
  this._e = Xt(), this.name = "BulkError", this.failures = Object.keys(t).map((n) => t[n]), this.failuresByPos = t, this.message = tl(e, t);
}
On(Jn).from(Tn);
var is = rs.reduce((e, t) => (e[t] = t + "Error", e), {}), fp = Tn, z = rs.reduce((e, t) => {
  var n = t + "Error";
  function r(i, o) {
    this._e = Xt(), this.name = n, i ? typeof i == "string" ? (this.message = `${i}${o ? `
 ` + o : ""}`, this.inner = o || null) : typeof i == "object" && (this.message = `${i.name} ${i.message}`, this.inner = i) : (this.message = dp[t] || n, this.inner = null);
  }
  return On(r).from(fp), e[t] = r, e;
}, {});
z.Syntax = SyntaxError;
z.Type = TypeError;
z.Range = RangeError;
var ta = el.reduce((e, t) => (e[t + "Error"] = z[t], e), {});
function vp(e, t) {
  if (!e || e instanceof Tn || e instanceof TypeError || e instanceof SyntaxError || !e.name || !ta[e.name])
    return e;
  var n = new ta[e.name](t || e.message, e);
  return "stack" in e && st(n, "stack", { get: function() {
    return this.inner.stack;
  } }), n;
}
var Ii = rs.reduce((e, t) => (["Syntax", "Type", "Range"].indexOf(t) === -1 && (e[t + "Error"] = z[t]), e), {});
Ii.ModifyError = ii;
Ii.DexieError = Tn;
Ii.BulkError = Jn;
function J() {
}
function _r(e) {
  return e;
}
function mp(e, t) {
  return e == null || e === _r ? t : function(n) {
    return t(e(n));
  };
}
function Kt(e, t) {
  return function() {
    e.apply(this, arguments), t.apply(this, arguments);
  };
}
function gp(e, t) {
  return e === J ? t : function() {
    var n = e.apply(this, arguments);
    n !== void 0 && (arguments[0] = n);
    var r = this.onsuccess, i = this.onerror;
    this.onsuccess = null, this.onerror = null;
    var o = t.apply(this, arguments);
    return r && (this.onsuccess = this.onsuccess ? Kt(r, this.onsuccess) : r), i && (this.onerror = this.onerror ? Kt(i, this.onerror) : i), o !== void 0 ? o : n;
  };
}
function yp(e, t) {
  return e === J ? t : function() {
    e.apply(this, arguments);
    var n = this.onsuccess, r = this.onerror;
    this.onsuccess = this.onerror = null, t.apply(this, arguments), n && (this.onsuccess = this.onsuccess ? Kt(n, this.onsuccess) : n), r && (this.onerror = this.onerror ? Kt(r, this.onerror) : r);
  };
}
function bp(e, t) {
  return e === J ? t : function(n) {
    var r = e.apply(this, arguments);
    xe(n, r);
    var i = this.onsuccess, o = this.onerror;
    this.onsuccess = null, this.onerror = null;
    var s = t.apply(this, arguments);
    return i && (this.onsuccess = this.onsuccess ? Kt(i, this.onsuccess) : i), o && (this.onerror = this.onerror ? Kt(o, this.onerror) : o), r === void 0 ? s === void 0 ? void 0 : s : xe(r, s);
  };
}
function jp(e, t) {
  return e === J ? t : function() {
    return t.apply(this, arguments) === !1 ? !1 : e.apply(this, arguments);
  };
}
function os(e, t) {
  return e === J ? t : function() {
    var n = e.apply(this, arguments);
    if (n && typeof n.then == "function") {
      for (var r = this, i = arguments.length, o = new Array(i); i--; )
        o[i] = arguments[i];
      return n.then(function() {
        return t.apply(r, o);
      });
    }
    return t.apply(this, arguments);
  };
}
var or = {}, xp = 100, wp = 20, nl = 100, [vo, oi, mo] = typeof Promise > "u" ? [] : (() => {
  let e = Promise.resolve();
  if (typeof crypto > "u" || !crypto.subtle)
    return [e, ir(e), e];
  let t = crypto.subtle.digest("SHA-512", new Uint8Array([0]));
  return [t, ir(t), e];
})(), rl = oi && oi.then, Kr = vo && vo.constructor, ss = !!mo, go = !1, _p = mo ? () => {
  mo.then(Cr);
} : Q.setImmediate ? setImmediate.bind(null, Cr) : Q.MutationObserver ? () => {
  var e = document.createElement("div");
  new MutationObserver(() => {
    Cr(), e = null;
  }).observe(e, { attributes: !0 }), e.setAttribute("i", "1");
} : () => {
  setTimeout(Cr, 0);
}, sr = function(e, t) {
  Wn.push([e, t]), si && (_p(), si = !1);
}, yo = !0, si = !0, zt = [], Ur = [], bo = null, jo = _r, fn = { id: "global", global: !0, ref: 0, unhandleds: [], onunhandled: ia, pgp: !1, env: {}, finalize: function() {
  this.unhandleds.forEach((e) => {
    try {
      ia(e[0], e[1]);
    } catch {
    }
  });
} }, C = fn, Wn = [], Lt = 0, qr = [];
function I(e) {
  if (typeof this != "object")
    throw new TypeError("Promises must be constructed via new");
  this._listeners = [], this.onuncatched = J, this._lib = !1;
  var t = this._PSD = C;
  if (Ye && (this._stackHolder = Xt(), this._prev = null, this._numPrev = 0), typeof e != "function") {
    if (e !== or)
      throw new TypeError("Not a function");
    this._state = arguments[1], this._value = arguments[2], this._state === !1 && wo(this, this._value);
    return;
  }
  this._state = null, this._value = null, ++t.ref, ol(this, e);
}
var xo = { get: function() {
  var e = C, t = ai;
  function n(r, i) {
    var o = !e.global && (e !== C || t !== ai);
    let s = o && !at();
    var a = new I((l, c) => {
      as(this, new il(ci(r, e, o, s), ci(i, e, o, s), l, c, e));
    });
    return Ye && ll(a, this), a;
  }
  return n.prototype = or, n;
}, set: function(e) {
  st(this, "then", e && e.prototype === or ? xo : { get: function() {
    return e;
  }, set: xo.set });
} };
wn(I.prototype, { then: xo, _then: function(e, t) {
  as(this, new il(null, null, e, t, C));
}, catch: function(e) {
  if (arguments.length === 1)
    return this.then(null, e);
  var t = arguments[0], n = arguments[1];
  return typeof t == "function" ? this.then(null, (r) => r instanceof t ? n(r) : Vr(r)) : this.then(null, (r) => r && r.name === t ? n(r) : Vr(r));
}, finally: function(e) {
  return this.then((t) => (e(), t), (t) => (e(), Vr(t)));
}, stack: { get: function() {
  if (this._stack)
    return this._stack;
  try {
    go = !0;
    var e = al(this, [], wp), t = e.join(`
From previous: `);
    return this._state !== null && (this._stack = t), t;
  } finally {
    go = !1;
  }
} }, timeout: function(e, t) {
  return e < 1 / 0 ? new I((n, r) => {
    var i = setTimeout(() => r(new z.Timeout(t)), e);
    this.then(n, r).finally(clearTimeout.bind(null, i));
  }) : this;
} });
typeof Symbol < "u" && Symbol.toStringTag && st(I.prototype, Symbol.toStringTag, "Dexie.Promise");
fn.env = cl();
function il(e, t, n, r, i) {
  this.onFulfilled = typeof e == "function" ? e : null, this.onRejected = typeof t == "function" ? t : null, this.resolve = n, this.reject = r, this.psd = i;
}
wn(I, { all: function() {
  var e = nt.apply(null, arguments).map(li);
  return new I(function(t, n) {
    e.length === 0 && t([]);
    var r = e.length;
    e.forEach((i, o) => I.resolve(i).then((s) => {
      e[o] = s, --r || t(e);
    }, n));
  });
}, resolve: (e) => {
  if (e instanceof I)
    return e;
  if (e && typeof e.then == "function")
    return new I((n, r) => {
      e.then(n, r);
    });
  var t = new I(or, !0, e);
  return ll(t, bo), t;
}, reject: Vr, race: function() {
  var e = nt.apply(null, arguments).map(li);
  return new I((t, n) => {
    e.map((r) => I.resolve(r).then(t, n));
  });
}, PSD: { get: () => C, set: (e) => C = e }, totalEchoes: { get: () => ai }, newPSD: gt, usePSD: In, scheduler: { get: () => sr, set: (e) => {
  sr = e;
} }, rejectionMapper: { get: () => jo, set: (e) => {
  jo = e;
} }, follow: (e, t) => new I((n, r) => gt((i, o) => {
  var s = C;
  s.unhandleds = [], s.onunhandled = o, s.finalize = Kt(function() {
    kp(() => {
      this.unhandleds.length === 0 ? i() : o(this.unhandleds[0]);
    });
  }, s.finalize), e();
}, t, n, r)) });
Kr && (Kr.allSettled && st(I, "allSettled", function() {
  let e = nt.apply(null, arguments).map(li);
  return new I((t) => {
    e.length === 0 && t([]);
    let n = e.length, r = new Array(n);
    e.forEach((i, o) => I.resolve(i).then((s) => r[o] = { status: "fulfilled", value: s }, (s) => r[o] = { status: "rejected", reason: s }).then(() => --n || t(r)));
  });
}), Kr.any && typeof AggregateError < "u" && st(I, "any", function() {
  let e = nt.apply(null, arguments).map(li);
  return new I((t, n) => {
    e.length === 0 && n(new AggregateError([]));
    let r = e.length, i = new Array(r);
    e.forEach((o, s) => I.resolve(o).then((a) => t(a), (a) => {
      i[s] = a, --r || n(new AggregateError(i));
    }));
  });
}));
function ol(e, t) {
  try {
    t((n) => {
      if (e._state === null) {
        if (n === e)
          throw new TypeError("A promise cannot be resolved with itself.");
        var r = e._lib && Er();
        n && typeof n.then == "function" ? ol(e, (i, o) => {
          n instanceof I ? n._then(i, o) : n.then(i, o);
        }) : (e._state = !0, e._value = n, sl(e)), r && kr();
      }
    }, wo.bind(null, e));
  } catch (n) {
    wo(e, n);
  }
}
function wo(e, t) {
  if (Ur.push(t), e._state === null) {
    var n = e._lib && Er();
    t = jo(t), e._state = !1, e._value = t, Ye && t !== null && typeof t == "object" && !t._promise && op(() => {
      var r = ts(t, "stack");
      t._promise = e, st(t, "stack", { get: () => go ? r && (r.get ? r.get.apply(t) : r.value) : e.stack });
    }), Sp(e), sl(e), n && kr();
  }
}
function sl(e) {
  var t = e._listeners;
  e._listeners = [];
  for (var n = 0, r = t.length; n < r; ++n)
    as(e, t[n]);
  var i = e._PSD;
  --i.ref || i.finalize(), Lt === 0 && (++Lt, sr(() => {
    --Lt === 0 && ls();
  }, []));
}
function as(e, t) {
  if (e._state === null) {
    e._listeners.push(t);
    return;
  }
  var n = e._state ? t.onFulfilled : t.onRejected;
  if (n === null)
    return (e._state ? t.resolve : t.reject)(e._value);
  ++t.psd.ref, ++Lt, sr(Ep, [n, e, t]);
}
function Ep(e, t, n) {
  try {
    bo = t;
    var r, i = t._value;
    t._state ? r = e(i) : (Ur.length && (Ur = []), r = e(i), Ur.indexOf(i) === -1 && Ap(t)), n.resolve(r);
  } catch (o) {
    n.reject(o);
  } finally {
    bo = null, --Lt === 0 && ls(), --n.psd.ref || n.psd.finalize();
  }
}
function al(e, t, n) {
  if (t.length === n)
    return t;
  var r = "";
  if (e._state === !1) {
    var i = e._value, o, s;
    i != null ? (o = i.name || "Error", s = i.message || i, r = fo(i, 0)) : (o = i, s = ""), t.push(o + (s ? ": " + s : "") + r);
  }
  return Ye && (r = fo(e._stackHolder, 2), r && t.indexOf(r) === -1 && t.push(r), e._prev && al(e._prev, t, n)), t;
}
function ll(e, t) {
  var n = t ? t._numPrev + 1 : 0;
  n < xp && (e._prev = t, e._numPrev = n);
}
function Cr() {
  Er() && kr();
}
function Er() {
  var e = yo;
  return yo = !1, si = !1, e;
}
function kr() {
  var e, t, n;
  do
    for (; Wn.length > 0; )
      for (e = Wn, Wn = [], n = e.length, t = 0; t < n; ++t) {
        var r = e[t];
        r[0].apply(null, r[1]);
      }
  while (Wn.length > 0);
  yo = !0, si = !0;
}
function ls() {
  var e = zt;
  zt = [], e.forEach((r) => {
    r._PSD.onunhandled.call(null, r._value, r);
  });
  for (var t = qr.slice(0), n = t.length; n; )
    t[--n]();
}
function kp(e) {
  function t() {
    e(), qr.splice(qr.indexOf(t), 1);
  }
  qr.push(t), ++Lt, sr(() => {
    --Lt === 0 && ls();
  }, []);
}
function Sp(e) {
  zt.some((t) => t._value === e._value) || zt.push(e);
}
function Ap(e) {
  for (var t = zt.length; t; )
    if (zt[--t]._value === e._value) {
      zt.splice(t, 1);
      return;
    }
}
function Vr(e) {
  return new I(or, !1, e);
}
function ee(e, t) {
  var n = C;
  return function() {
    var r = Er(), i = C;
    try {
      return yt(n, !0), e.apply(this, arguments);
    } catch (o) {
      t && t(o);
    } finally {
      yt(i, !1), r && kr();
    }
  };
}
var ge = { awaits: 0, echoes: 0, id: 0 }, Op = 0, Wr = [], Hi = 0, ai = 0, Tp = 0;
function gt(e, t, n, r) {
  var i = C, o = Object.create(i);
  o.parent = i, o.ref = 0, o.global = !1, o.id = ++Tp;
  var s = fn.env;
  o.env = ss ? { Promise: I, PromiseProp: { value: I, configurable: !0, writable: !0 }, all: I.all, race: I.race, allSettled: I.allSettled, any: I.any, resolve: I.resolve, reject: I.reject, nthen: na(s.nthen, o), gthen: na(s.gthen, o) } : {}, t && xe(o, t), ++i.ref, o.finalize = function() {
    --this.parent.ref || this.parent.finalize();
  };
  var a = In(o, e, n, r);
  return o.ref === 0 && o.finalize(), a;
}
function Nn() {
  return ge.id || (ge.id = ++Op), ++ge.awaits, ge.echoes += nl, ge.id;
}
function at() {
  return ge.awaits ? (--ge.awaits === 0 && (ge.id = 0), ge.echoes = ge.awaits * nl, !0) : !1;
}
("" + rl).indexOf("[native code]") === -1 && (Nn = at = J);
function li(e) {
  return ge.echoes && e && e.constructor === Kr ? (Nn(), e.then((t) => (at(), t), (t) => (at(), de(t)))) : e;
}
function Np(e) {
  ++ai, (!ge.echoes || --ge.echoes === 0) && (ge.echoes = ge.id = 0), Wr.push(C), yt(e, !0);
}
function Ip() {
  var e = Wr[Wr.length - 1];
  Wr.pop(), yt(e, !1);
}
function yt(e, t) {
  var n = C;
  if ((t ? ge.echoes && (!Hi++ || e !== C) : Hi && (!--Hi || e !== C)) && ul(t ? Np.bind(null, e) : Ip), e !== C && (C = e, n === fn && (fn.env = cl()), ss)) {
    var r = fn.env.Promise, i = e.env;
    oi.then = i.nthen, r.prototype.then = i.gthen, (n.global || e.global) && (Object.defineProperty(Q, "Promise", i.PromiseProp), r.all = i.all, r.race = i.race, r.resolve = i.resolve, r.reject = i.reject, i.allSettled && (r.allSettled = i.allSettled), i.any && (r.any = i.any));
  }
}
function cl() {
  var e = Q.Promise;
  return ss ? { Promise: e, PromiseProp: Object.getOwnPropertyDescriptor(Q, "Promise"), all: e.all, race: e.race, allSettled: e.allSettled, any: e.any, resolve: e.resolve, reject: e.reject, nthen: oi.then, gthen: e.prototype.then } : {};
}
function In(e, t, n, r, i) {
  var o = C;
  try {
    return yt(e, !0), t(n, r, i);
  } finally {
    yt(o, !1);
  }
}
function ul(e) {
  rl.call(vo, e);
}
function ci(e, t, n, r) {
  return typeof e != "function" ? e : function() {
    var i = C;
    n && Nn(), yt(t, !0);
    try {
      return e.apply(this, arguments);
    } finally {
      yt(i, !1), r && ul(at);
    }
  };
}
function na(e, t) {
  return function(n, r) {
    return e.call(this, ci(n, t), ci(r, t));
  };
}
var ra = "unhandledrejection";
function ia(e, t) {
  var n;
  try {
    n = t.onuncatched(e);
  } catch {
  }
  if (n !== !1)
    try {
      var r, i = { promise: t, reason: e };
      if (Q.document && document.createEvent ? (r = document.createEvent("Event"), r.initEvent(ra, !0, !0), xe(r, i)) : Q.CustomEvent && (r = new CustomEvent(ra, { detail: i }), xe(r, i)), r && Q.dispatchEvent && (dispatchEvent(r), !Q.PromiseRejectionEvent && Q.onunhandledrejection))
        try {
          Q.onunhandledrejection(r);
        } catch {
        }
      Ye && r && !r.defaultPrevented && console.warn(`Unhandled rejection: ${e.stack || e}`);
    } catch {
    }
}
var de = I.reject;
function _o(e, t, n, r) {
  if (!e.idbdb || !e._state.openComplete && !C.letThrough && !e._vip) {
    if (e._state.openComplete)
      return de(new z.DatabaseClosed(e._state.dbOpenError));
    if (!e._state.isBeingOpened) {
      if (!e._options.autoOpen)
        return de(new z.DatabaseClosed());
      e.open().catch(J);
    }
    return e._state.dbReadyPromise.then(() => _o(e, t, n, r));
  } else {
    var i = e._createTransaction(t, n, e._dbSchema);
    try {
      i.create(), e._state.PR1398_maxLoop = 3;
    } catch (o) {
      return o.name === is.InvalidState && e.isOpen() && --e._state.PR1398_maxLoop > 0 ? (console.warn("Dexie: Need to reopen db"), e._close(), e.open().then(() => _o(e, t, n, r))) : de(o);
    }
    return i._promise(t, (o, s) => gt(() => (C.trans = i, r(o, s, i)))).then((o) => i._completion.then(() => o));
  }
}
var oa = "3.2.3", Mt = String.fromCharCode(65535), Eo = -1 / 0, et = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", pl = "String expected.", Xn = [], Ri = typeof navigator < "u" && /(MSIE|Trident|Edge)/.test(navigator.userAgent), Rp = Ri, Cp = Ri, hl = (e) => !/(dexie\.js|dexie\.min\.js)/.test(e), Ci = "__dbnames", Gi = "readonly", Yi = "readwrite";
function Ut(e, t) {
  return e ? t ? function() {
    return e.apply(this, arguments) && t.apply(this, arguments);
  } : e : t;
}
var dl = { type: 3, lower: -1 / 0, lowerOpen: !1, upper: [[]], upperOpen: !1 };
function Dr(e) {
  return typeof e == "string" && !/\./.test(e) ? (t) => (t[e] === void 0 && e in t && (t = wr(t), delete t[e]), t) : (t) => t;
}
var Dp = class {
  _trans(e, t, n) {
    let r = this._tx || C.trans, i = this.name;
    function o(a, l, c) {
      if (!c.schema[i])
        throw new z.NotFound("Table " + i + " not part of transaction");
      return t(c.idbtrans, c);
    }
    let s = Er();
    try {
      return r && r.db === this.db ? r === C.trans ? r._promise(e, o, n) : gt(() => r._promise(e, o, n), { trans: r, transless: C.transless || C }) : _o(this.db, e, [this.name], o);
    } finally {
      s && kr();
    }
  }
  get(e, t) {
    return e && e.constructor === Object ? this.where(e).first(t) : this._trans("readonly", (n) => this.core.get({ trans: n, key: e }).then((r) => this.hook.reading.fire(r))).then(t);
  }
  where(e) {
    if (typeof e == "string")
      return new this.db.WhereClause(this, e);
    if (ye(e))
      return new this.db.WhereClause(this, `[${e.join("+")}]`);
    let t = pe(e);
    if (t.length === 1)
      return this.where(t[0]).equals(e[t[0]]);
    let n = this.schema.indexes.concat(this.schema.primKey).filter((l) => l.compound && t.every((c) => l.keyPath.indexOf(c) >= 0) && l.keyPath.every((c) => t.indexOf(c) >= 0))[0];
    if (n && this.db._maxKey !== Mt)
      return this.where(n.name).equals(n.keyPath.map((l) => e[l]));
    !n && Ye && console.warn(`The query ${JSON.stringify(e)} on ${this.name} would benefit of a compound index [${t.join("+")}]`);
    let { idxByName: r } = this.schema, i = this.db._deps.indexedDB;
    function o(l, c) {
      try {
        return i.cmp(l, c) === 0;
      } catch {
        return !1;
      }
    }
    let [s, a] = t.reduce(([l, c], h) => {
      let u = r[h], p = e[h];
      return [l || u, l || !u ? Ut(c, u && u.multi ? (d) => {
        let f = it(d, h);
        return ye(f) && f.some((v) => o(p, v));
      } : (d) => o(p, it(d, h))) : c];
    }, [null, null]);
    return s ? this.where(s.name).equals(e[s.keyPath]).filter(a) : n ? this.filter(a) : this.where(t).equals("");
  }
  filter(e) {
    return this.toCollection().and(e);
  }
  count(e) {
    return this.toCollection().count(e);
  }
  offset(e) {
    return this.toCollection().offset(e);
  }
  limit(e) {
    return this.toCollection().limit(e);
  }
  each(e) {
    return this.toCollection().each(e);
  }
  toArray(e) {
    return this.toCollection().toArray(e);
  }
  toCollection() {
    return new this.db.Collection(new this.db.WhereClause(this));
  }
  orderBy(e) {
    return new this.db.Collection(new this.db.WhereClause(this, ye(e) ? `[${e.join("+")}]` : e));
  }
  reverse() {
    return this.toCollection().reverse();
  }
  mapToClass(e) {
    this.schema.mappedClass = e;
    let t = (n) => {
      if (!n)
        return n;
      let r = Object.create(e.prototype);
      for (var i in n)
        if (Ne(n, i))
          try {
            r[i] = n[i];
          } catch {
          }
      return r;
    };
    return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = t, this.hook("reading", t), e;
  }
  defineClass() {
    function e(t) {
      xe(this, t);
    }
    return this.mapToClass(e);
  }
  add(e, t) {
    let { auto: n, keyPath: r } = this.schema.primKey, i = e;
    return r && n && (i = Dr(r)(e)), this._trans("readwrite", (o) => this.core.mutate({ trans: o, type: "add", keys: t != null ? [t] : null, values: [i] })).then((o) => o.numFailures ? I.reject(o.failures[0]) : o.lastResult).then((o) => {
      if (r)
        try {
          Ke(e, r, o);
        } catch {
        }
      return o;
    });
  }
  update(e, t) {
    if (typeof e == "object" && !ye(e)) {
      let n = it(e, this.schema.primKey.keyPath);
      if (n === void 0)
        return de(new z.InvalidArgument("Given object does not contain its primary key"));
      try {
        typeof t != "function" ? pe(t).forEach((r) => {
          Ke(e, r, t[r]);
        }) : t(e, { value: e, primKey: n });
      } catch {
      }
      return this.where(":id").equals(n).modify(t);
    } else
      return this.where(":id").equals(e).modify(t);
  }
  put(e, t) {
    let { auto: n, keyPath: r } = this.schema.primKey, i = e;
    return r && n && (i = Dr(r)(e)), this._trans("readwrite", (o) => this.core.mutate({ trans: o, type: "put", values: [i], keys: t != null ? [t] : null })).then((o) => o.numFailures ? I.reject(o.failures[0]) : o.lastResult).then((o) => {
      if (r)
        try {
          Ke(e, r, o);
        } catch {
        }
      return o;
    });
  }
  delete(e) {
    return this._trans("readwrite", (t) => this.core.mutate({ trans: t, type: "delete", keys: [e] })).then((t) => t.numFailures ? I.reject(t.failures[0]) : void 0);
  }
  clear() {
    return this._trans("readwrite", (e) => this.core.mutate({ trans: e, type: "deleteRange", range: dl })).then((e) => e.numFailures ? I.reject(e.failures[0]) : void 0);
  }
  bulkGet(e) {
    return this._trans("readonly", (t) => this.core.getMany({ keys: e, trans: t }).then((n) => n.map((r) => this.hook.reading.fire(r))));
  }
  bulkAdd(e, t, n) {
    let r = Array.isArray(t) ? t : void 0;
    n = n || (r ? void 0 : t);
    let i = n ? n.allKeys : void 0;
    return this._trans("readwrite", (o) => {
      let { auto: s, keyPath: a } = this.schema.primKey;
      if (a && r)
        throw new z.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
      if (r && r.length !== e.length)
        throw new z.InvalidArgument("Arguments objects and keys must have the same length");
      let l = e.length, c = a && s ? e.map(Dr(a)) : e;
      return this.core.mutate({ trans: o, type: "add", keys: r, values: c, wantResults: i }).then(({ numFailures: h, results: u, lastResult: p, failures: d }) => {
        let f = i ? u : p;
        if (h === 0)
          return f;
        throw new Jn(`${this.name}.bulkAdd(): ${h} of ${l} operations failed`, d);
      });
    });
  }
  bulkPut(e, t, n) {
    let r = Array.isArray(t) ? t : void 0;
    n = n || (r ? void 0 : t);
    let i = n ? n.allKeys : void 0;
    return this._trans("readwrite", (o) => {
      let { auto: s, keyPath: a } = this.schema.primKey;
      if (a && r)
        throw new z.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
      if (r && r.length !== e.length)
        throw new z.InvalidArgument("Arguments objects and keys must have the same length");
      let l = e.length, c = a && s ? e.map(Dr(a)) : e;
      return this.core.mutate({ trans: o, type: "put", keys: r, values: c, wantResults: i }).then(({ numFailures: h, results: u, lastResult: p, failures: d }) => {
        let f = i ? u : p;
        if (h === 0)
          return f;
        throw new Jn(`${this.name}.bulkPut(): ${h} of ${l} operations failed`, d);
      });
    });
  }
  bulkDelete(e) {
    let t = e.length;
    return this._trans("readwrite", (n) => this.core.mutate({ trans: n, type: "delete", keys: e })).then(({ numFailures: n, lastResult: r, failures: i }) => {
      if (n === 0)
        return r;
      throw new Jn(`${this.name}.bulkDelete(): ${n} of ${t} operations failed`, i);
    });
  }
};
function Sr(e) {
  var t = {}, n = function(a, l) {
    if (l) {
      for (var c = arguments.length, h = new Array(c - 1); --c; )
        h[c - 1] = arguments[c];
      return t[a].subscribe.apply(null, h), e;
    } else if (typeof a == "string")
      return t[a];
  };
  n.addEventType = o;
  for (var r = 1, i = arguments.length; r < i; ++r)
    o(arguments[r]);
  return n;
  function o(a, l, c) {
    if (typeof a == "object")
      return s(a);
    l || (l = jp), c || (c = J);
    var h = { subscribers: [], fire: c, subscribe: function(u) {
      h.subscribers.indexOf(u) === -1 && (h.subscribers.push(u), h.fire = l(h.fire, u));
    }, unsubscribe: function(u) {
      h.subscribers = h.subscribers.filter(function(p) {
        return p !== u;
      }), h.fire = h.subscribers.reduce(l, c);
    } };
    return t[a] = n[a] = h, h;
  }
  function s(a) {
    pe(a).forEach(function(l) {
      var c = a[l];
      if (ye(c))
        o(l, a[l][0], a[l][1]);
      else if (c === "asap")
        var h = o(l, _r, function() {
          for (var u = arguments.length, p = new Array(u); u--; )
            p[u] = arguments[u];
          h.subscribers.forEach(function(d) {
            Ha(function() {
              d.apply(null, p);
            });
          });
        });
      else
        throw new z.InvalidArgument("Invalid event config");
    });
  }
}
function Ar(e, t) {
  return On(t).from({ prototype: e }), t;
}
function Pp(e) {
  return Ar(Dp.prototype, function(t, n, r) {
    this.db = e, this._tx = r, this.name = t, this.schema = n, this.hook = e._allTables[t] ? e._allTables[t].hook : Sr(null, { creating: [gp, J], reading: [mp, _r], updating: [bp, J], deleting: [yp, J] });
  });
}
function ln(e, t) {
  return !(e.filter || e.algorithm || e.or) && (t ? e.justLimit : !e.replayFilter);
}
function Ji(e, t) {
  e.filter = Ut(e.filter, t);
}
function Xi(e, t, n) {
  var r = e.replayFilter;
  e.replayFilter = r ? () => Ut(r(), t()) : t, e.justLimit = n && !r;
}
function Mp(e, t) {
  e.isMatch = Ut(e.isMatch, t);
}
function Hr(e, t) {
  if (e.isPrimKey)
    return t.primaryKey;
  let n = t.getIndexByKeyPath(e.index);
  if (!n)
    throw new z.Schema("KeyPath " + e.index + " on object store " + t.name + " is not indexed");
  return n;
}
function sa(e, t, n) {
  let r = Hr(e, t.schema);
  return t.openCursor({ trans: n, values: !e.keysOnly, reverse: e.dir === "prev", unique: !!e.unique, query: { index: r, range: e.range } });
}
function Pr(e, t, n, r) {
  let i = e.replayFilter ? Ut(e.filter, e.replayFilter()) : e.filter;
  if (e.or) {
    let o = {}, s = (a, l, c) => {
      if (!i || i(l, c, (p) => l.stop(p), (p) => l.fail(p))) {
        var h = l.primaryKey, u = "" + h;
        u === "[object ArrayBuffer]" && (u = "" + new Uint8Array(h)), Ne(o, u) || (o[u] = !0, t(a, l, c));
      }
    };
    return Promise.all([e.or._iterate(s, n), aa(sa(e, r, n), e.algorithm, s, !e.keysOnly && e.valueMapper)]);
  } else
    return aa(sa(e, r, n), Ut(e.algorithm, i), t, !e.keysOnly && e.valueMapper);
}
function aa(e, t, n, r) {
  var i = r ? (s, a, l) => n(r(s), a, l) : n, o = ee(i);
  return e.then((s) => {
    if (s)
      return s.start(() => {
        var a = () => s.continue();
        (!t || t(s, (l) => a = l, (l) => {
          s.stop(l), a = J;
        }, (l) => {
          s.fail(l), a = J;
        })) && o(s.value, s, (l) => a = l), a();
      });
  });
}
function je(e, t) {
  try {
    let n = la(e), r = la(t);
    if (n !== r)
      return n === "Array" ? 1 : r === "Array" ? -1 : n === "binary" ? 1 : r === "binary" ? -1 : n === "string" ? 1 : r === "string" ? -1 : n === "Date" ? 1 : r !== "Date" ? NaN : -1;
    switch (n) {
      case "number":
      case "Date":
      case "string":
        return e > t ? 1 : e < t ? -1 : 0;
      case "binary":
        return zp(ca(e), ca(t));
      case "Array":
        return $p(e, t);
    }
  } catch {
  }
  return NaN;
}
function $p(e, t) {
  let n = e.length, r = t.length, i = n < r ? n : r;
  for (let o = 0; o < i; ++o) {
    let s = je(e[o], t[o]);
    if (s !== 0)
      return s;
  }
  return n === r ? 0 : n < r ? -1 : 1;
}
function zp(e, t) {
  let n = e.length, r = t.length, i = n < r ? n : r;
  for (let o = 0; o < i; ++o)
    if (e[o] !== t[o])
      return e[o] < t[o] ? -1 : 1;
  return n === r ? 0 : n < r ? -1 : 1;
}
function la(e) {
  let t = typeof e;
  if (t !== "object")
    return t;
  if (ArrayBuffer.isView(e))
    return "binary";
  let n = po(e);
  return n === "ArrayBuffer" ? "binary" : n;
}
function ca(e) {
  return e instanceof Uint8Array ? e : ArrayBuffer.isView(e) ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : new Uint8Array(e);
}
var Lp = class {
  _read(e, t) {
    var n = this._ctx;
    return n.error ? n.table._trans(null, de.bind(null, n.error)) : n.table._trans("readonly", e).then(t);
  }
  _write(e) {
    var t = this._ctx;
    return t.error ? t.table._trans(null, de.bind(null, t.error)) : t.table._trans("readwrite", e, "locked");
  }
  _addAlgorithm(e) {
    var t = this._ctx;
    t.algorithm = Ut(t.algorithm, e);
  }
  _iterate(e, t) {
    return Pr(this._ctx, e, t, this._ctx.table.core);
  }
  clone(e) {
    var t = Object.create(this.constructor.prototype), n = Object.create(this._ctx);
    return e && xe(n, e), t._ctx = n, t;
  }
  raw() {
    return this._ctx.valueMapper = null, this;
  }
  each(e) {
    var t = this._ctx;
    return this._read((n) => Pr(t, e, n, t.table.core));
  }
  count(e) {
    return this._read((t) => {
      let n = this._ctx, r = n.table.core;
      if (ln(n, !0))
        return r.count({ trans: t, query: { index: Hr(n, r.schema), range: n.range } }).then((o) => Math.min(o, n.limit));
      var i = 0;
      return Pr(n, () => (++i, !1), t, r).then(() => i);
    }).then(e);
  }
  sortBy(e, t) {
    let n = e.split(".").reverse(), r = n[0], i = n.length - 1;
    function o(l, c) {
      return c ? o(l[n[c]], c - 1) : l[r];
    }
    var s = this._ctx.dir === "next" ? 1 : -1;
    function a(l, c) {
      var h = o(l, i), u = o(c, i);
      return h < u ? -s : h > u ? s : 0;
    }
    return this.toArray(function(l) {
      return l.sort(a);
    }).then(t);
  }
  toArray(e) {
    return this._read((t) => {
      var n = this._ctx;
      if (n.dir === "next" && ln(n, !0) && n.limit > 0) {
        let { valueMapper: r } = n, i = Hr(n, n.table.core.schema);
        return n.table.core.query({ trans: t, limit: n.limit, values: !0, query: { index: i, range: n.range } }).then(({ result: o }) => r ? o.map(r) : o);
      } else {
        let r = [];
        return Pr(n, (i) => r.push(i), t, n.table.core).then(() => r);
      }
    }, e);
  }
  offset(e) {
    var t = this._ctx;
    return e <= 0 ? this : (t.offset += e, ln(t) ? Xi(t, () => {
      var n = e;
      return (r, i) => n === 0 ? !0 : n === 1 ? (--n, !1) : (i(() => {
        r.advance(n), n = 0;
      }), !1);
    }) : Xi(t, () => {
      var n = e;
      return () => --n < 0;
    }), this);
  }
  limit(e) {
    return this._ctx.limit = Math.min(this._ctx.limit, e), Xi(this._ctx, () => {
      var t = e;
      return function(n, r, i) {
        return --t <= 0 && r(i), t >= 0;
      };
    }, !0), this;
  }
  until(e, t) {
    return Ji(this._ctx, function(n, r, i) {
      return e(n.value) ? (r(i), t) : !0;
    }), this;
  }
  first(e) {
    return this.limit(1).toArray(function(t) {
      return t[0];
    }).then(e);
  }
  last(e) {
    return this.reverse().first(e);
  }
  filter(e) {
    return Ji(this._ctx, function(t) {
      return e(t.value);
    }), Mp(this._ctx, e), this;
  }
  and(e) {
    return this.filter(e);
  }
  or(e) {
    return new this.db.WhereClause(this._ctx.table, e, this);
  }
  reverse() {
    return this._ctx.dir = this._ctx.dir === "prev" ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
  }
  desc() {
    return this.reverse();
  }
  eachKey(e) {
    var t = this._ctx;
    return t.keysOnly = !t.isMatch, this.each(function(n, r) {
      e(r.key, r);
    });
  }
  eachUniqueKey(e) {
    return this._ctx.unique = "unique", this.eachKey(e);
  }
  eachPrimaryKey(e) {
    var t = this._ctx;
    return t.keysOnly = !t.isMatch, this.each(function(n, r) {
      e(r.primaryKey, r);
    });
  }
  keys(e) {
    var t = this._ctx;
    t.keysOnly = !t.isMatch;
    var n = [];
    return this.each(function(r, i) {
      n.push(i.key);
    }).then(function() {
      return n;
    }).then(e);
  }
  primaryKeys(e) {
    var t = this._ctx;
    if (t.dir === "next" && ln(t, !0) && t.limit > 0)
      return this._read((r) => {
        var i = Hr(t, t.table.core.schema);
        return t.table.core.query({ trans: r, values: !1, limit: t.limit, query: { index: i, range: t.range } });
      }).then(({ result: r }) => r).then(e);
    t.keysOnly = !t.isMatch;
    var n = [];
    return this.each(function(r, i) {
      n.push(i.primaryKey);
    }).then(function() {
      return n;
    }).then(e);
  }
  uniqueKeys(e) {
    return this._ctx.unique = "unique", this.keys(e);
  }
  firstKey(e) {
    return this.limit(1).keys(function(t) {
      return t[0];
    }).then(e);
  }
  lastKey(e) {
    return this.reverse().firstKey(e);
  }
  distinct() {
    var e = this._ctx, t = e.index && e.table.schema.idxByName[e.index];
    if (!t || !t.multi)
      return this;
    var n = {};
    return Ji(this._ctx, function(r) {
      var i = r.primaryKey.toString(), o = Ne(n, i);
      return n[i] = !0, !o;
    }), this;
  }
  modify(e) {
    var t = this._ctx;
    return this._write((n) => {
      var r;
      if (typeof e == "function")
        r = e;
      else {
        var i = pe(e), o = i.length;
        r = function(f) {
          for (var v = !1, m = 0; m < o; ++m) {
            var b = i[m], _ = e[b];
            it(f, b) !== _ && (Ke(f, b, _), v = !0);
          }
          return v;
        };
      }
      let s = t.table.core, { outbound: a, extractKey: l } = s.schema.primaryKey, c = this.db._options.modifyChunkSize || 200, h = [], u = 0, p = [], d = (f, v) => {
        let { failures: m, numFailures: b } = v;
        u += f - b;
        for (let _ of pe(m))
          h.push(m[_]);
      };
      return this.clone().primaryKeys().then((f) => {
        let v = (m) => {
          let b = Math.min(c, f.length - m);
          return s.getMany({ trans: n, keys: f.slice(m, m + b), cache: "immutable" }).then((_) => {
            let j = [], w = [], E = a ? [] : null, A = [];
            for (let N = 0; N < b; ++N) {
              let F = _[N], M = { value: wr(F), primKey: f[m + N] };
              r.call(M, M.value, M) !== !1 && (M.value == null ? A.push(f[m + N]) : !a && je(l(F), l(M.value)) !== 0 ? (A.push(f[m + N]), j.push(M.value)) : (w.push(M.value), a && E.push(f[m + N])));
            }
            let O = ln(t) && t.limit === 1 / 0 && (typeof e != "function" || e === Qi) && { index: t.index, range: t.range };
            return Promise.resolve(j.length > 0 && s.mutate({ trans: n, type: "add", values: j }).then((N) => {
              for (let F in N.failures)
                A.splice(parseInt(F), 1);
              d(j.length, N);
            })).then(() => (w.length > 0 || O && typeof e == "object") && s.mutate({ trans: n, type: "put", keys: E, values: w, criteria: O, changeSpec: typeof e != "function" && e }).then((N) => d(w.length, N))).then(() => (A.length > 0 || O && e === Qi) && s.mutate({ trans: n, type: "delete", keys: A, criteria: O }).then((N) => d(A.length, N))).then(() => f.length > m + b && v(m + c));
          });
        };
        return v(0).then(() => {
          if (h.length > 0)
            throw new ii("Error modifying one or more objects", h, u, p);
          return f.length;
        });
      });
    });
  }
  delete() {
    var e = this._ctx, t = e.range;
    return ln(e) && (e.isPrimKey && !Cp || t.type === 3) ? this._write((n) => {
      let { primaryKey: r } = e.table.core.schema, i = t;
      return e.table.core.count({ trans: n, query: { index: r, range: i } }).then((o) => e.table.core.mutate({ trans: n, type: "deleteRange", range: i }).then(({ failures: s, lastResult: a, results: l, numFailures: c }) => {
        if (c)
          throw new ii("Could not delete some values", Object.keys(s).map((h) => s[h]), o - c);
        return o - c;
      }));
    }) : this.modify(Qi);
  }
}, Qi = (e, t) => t.value = null;
function Bp(e) {
  return Ar(Lp.prototype, function(t, n) {
    this.db = e;
    let r = dl, i = null;
    if (n)
      try {
        r = n();
      } catch (l) {
        i = l;
      }
    let o = t._ctx, s = o.table, a = s.hook.reading.fire;
    this._ctx = { table: s, index: o.index, isPrimKey: !o.index || s.schema.primKey.keyPath && o.index === s.schema.primKey.name, range: r, keysOnly: !1, dir: "next", unique: "", algorithm: null, filter: null, replayFilter: null, justLimit: !0, isMatch: null, offset: 0, limit: 1 / 0, error: i, or: o.or, valueMapper: a !== _r ? a : null };
  });
}
function Fp(e, t) {
  return e < t ? -1 : e === t ? 0 : 1;
}
function Kp(e, t) {
  return e > t ? -1 : e === t ? 0 : 1;
}
function Ae(e, t, n) {
  var r = e instanceof vl ? new e.Collection(e) : e;
  return r._ctx.error = n ? new n(t) : new TypeError(t), r;
}
function cn(e) {
  return new e.Collection(e, () => fl("")).limit(0);
}
function Up(e) {
  return e === "next" ? (t) => t.toUpperCase() : (t) => t.toLowerCase();
}
function qp(e) {
  return e === "next" ? (t) => t.toLowerCase() : (t) => t.toUpperCase();
}
function Vp(e, t, n, r, i, o) {
  for (var s = Math.min(e.length, r.length), a = -1, l = 0; l < s; ++l) {
    var c = t[l];
    if (c !== r[l])
      return i(e[l], n[l]) < 0 ? e.substr(0, l) + n[l] + n.substr(l + 1) : i(e[l], r[l]) < 0 ? e.substr(0, l) + r[l] + n.substr(l + 1) : a >= 0 ? e.substr(0, a) + t[a] + n.substr(a + 1) : null;
    i(e[l], c) < 0 && (a = l);
  }
  return s < r.length && o === "next" ? e + n.substr(e.length) : s < e.length && o === "prev" ? e.substr(0, n.length) : a < 0 ? null : e.substr(0, a) + r[a] + n.substr(a + 1);
}
function Mr(e, t, n, r) {
  var i, o, s, a, l, c, h, u = n.length;
  if (!n.every((v) => typeof v == "string"))
    return Ae(e, pl);
  function p(v) {
    i = Up(v), o = qp(v), s = v === "next" ? Fp : Kp;
    var m = n.map(function(b) {
      return { lower: o(b), upper: i(b) };
    }).sort(function(b, _) {
      return s(b.lower, _.lower);
    });
    a = m.map(function(b) {
      return b.upper;
    }), l = m.map(function(b) {
      return b.lower;
    }), c = v, h = v === "next" ? "" : r;
  }
  p("next");
  var d = new e.Collection(e, () => ht(a[0], l[u - 1] + r));
  d._ondirectionchange = function(v) {
    p(v);
  };
  var f = 0;
  return d._addAlgorithm(function(v, m, b) {
    var _ = v.key;
    if (typeof _ != "string")
      return !1;
    var j = o(_);
    if (t(j, l, f))
      return !0;
    for (var w = null, E = f; E < u; ++E) {
      var A = Vp(_, j, a[E], l[E], s, c);
      A === null && w === null ? f = E + 1 : (w === null || s(w, A) > 0) && (w = A);
    }
    return m(w !== null ? function() {
      v.continue(w + h);
    } : b), !1;
  }), d;
}
function ht(e, t, n, r) {
  return { type: 2, lower: e, upper: t, lowerOpen: n, upperOpen: r };
}
function fl(e) {
  return { type: 1, lower: e, upper: e };
}
var vl = class {
  get Collection() {
    return this._ctx.table.db.Collection;
  }
  between(e, t, n, r) {
    n = n !== !1, r = r === !0;
    try {
      return this._cmp(e, t) > 0 || this._cmp(e, t) === 0 && (n || r) && !(n && r) ? cn(this) : new this.Collection(this, () => ht(e, t, !n, !r));
    } catch {
      return Ae(this, et);
    }
  }
  equals(e) {
    return e == null ? Ae(this, et) : new this.Collection(this, () => fl(e));
  }
  above(e) {
    return e == null ? Ae(this, et) : new this.Collection(this, () => ht(e, void 0, !0));
  }
  aboveOrEqual(e) {
    return e == null ? Ae(this, et) : new this.Collection(this, () => ht(e, void 0, !1));
  }
  below(e) {
    return e == null ? Ae(this, et) : new this.Collection(this, () => ht(void 0, e, !1, !0));
  }
  belowOrEqual(e) {
    return e == null ? Ae(this, et) : new this.Collection(this, () => ht(void 0, e));
  }
  startsWith(e) {
    return typeof e != "string" ? Ae(this, pl) : this.between(e, e + Mt, !0, !0);
  }
  startsWithIgnoreCase(e) {
    return e === "" ? this.startsWith(e) : Mr(this, (t, n) => t.indexOf(n[0]) === 0, [e], Mt);
  }
  equalsIgnoreCase(e) {
    return Mr(this, (t, n) => t === n[0], [e], "");
  }
  anyOfIgnoreCase() {
    var e = nt.apply(hn, arguments);
    return e.length === 0 ? cn(this) : Mr(this, (t, n) => n.indexOf(t) !== -1, e, "");
  }
  startsWithAnyOfIgnoreCase() {
    var e = nt.apply(hn, arguments);
    return e.length === 0 ? cn(this) : Mr(this, (t, n) => n.some((r) => t.indexOf(r) === 0), e, Mt);
  }
  anyOf() {
    let e = nt.apply(hn, arguments), t = this._cmp;
    try {
      e.sort(t);
    } catch {
      return Ae(this, et);
    }
    if (e.length === 0)
      return cn(this);
    let n = new this.Collection(this, () => ht(e[0], e[e.length - 1]));
    n._ondirectionchange = (i) => {
      t = i === "next" ? this._ascending : this._descending, e.sort(t);
    };
    let r = 0;
    return n._addAlgorithm((i, o, s) => {
      let a = i.key;
      for (; t(a, e[r]) > 0; )
        if (++r, r === e.length)
          return o(s), !1;
      return t(a, e[r]) === 0 ? !0 : (o(() => {
        i.continue(e[r]);
      }), !1);
    }), n;
  }
  notEqual(e) {
    return this.inAnyRange([[Eo, e], [e, this.db._maxKey]], { includeLowers: !1, includeUppers: !1 });
  }
  noneOf() {
    let e = nt.apply(hn, arguments);
    if (e.length === 0)
      return new this.Collection(this);
    try {
      e.sort(this._ascending);
    } catch {
      return Ae(this, et);
    }
    let t = e.reduce((n, r) => n ? n.concat([[n[n.length - 1][1], r]]) : [[Eo, r]], null);
    return t.push([e[e.length - 1], this.db._maxKey]), this.inAnyRange(t, { includeLowers: !1, includeUppers: !1 });
  }
  inAnyRange(e, t) {
    let n = this._cmp, r = this._ascending, i = this._descending, o = this._min, s = this._max;
    if (e.length === 0)
      return cn(this);
    if (!e.every((j) => j[0] !== void 0 && j[1] !== void 0 && r(j[0], j[1]) <= 0))
      return Ae(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", z.InvalidArgument);
    let a = !t || t.includeLowers !== !1, l = t && t.includeUppers === !0;
    function c(j, w) {
      let E = 0, A = j.length;
      for (; E < A; ++E) {
        let O = j[E];
        if (n(w[0], O[1]) < 0 && n(w[1], O[0]) > 0) {
          O[0] = o(O[0], w[0]), O[1] = s(O[1], w[1]);
          break;
        }
      }
      return E === A && j.push(w), j;
    }
    let h = r;
    function u(j, w) {
      return h(j[0], w[0]);
    }
    let p;
    try {
      p = e.reduce(c, []), p.sort(u);
    } catch {
      return Ae(this, et);
    }
    let d = 0, f = l ? (j) => r(j, p[d][1]) > 0 : (j) => r(j, p[d][1]) >= 0, v = a ? (j) => i(j, p[d][0]) > 0 : (j) => i(j, p[d][0]) >= 0;
    function m(j) {
      return !f(j) && !v(j);
    }
    let b = f, _ = new this.Collection(this, () => ht(p[0][0], p[p.length - 1][1], !a, !l));
    return _._ondirectionchange = (j) => {
      j === "next" ? (b = f, h = r) : (b = v, h = i), p.sort(u);
    }, _._addAlgorithm((j, w, E) => {
      for (var A = j.key; b(A); )
        if (++d, d === p.length)
          return w(E), !1;
      return m(A) ? !0 : (this._cmp(A, p[d][1]) === 0 || this._cmp(A, p[d][0]) === 0 || w(() => {
        h === r ? j.continue(p[d][0]) : j.continue(p[d][1]);
      }), !1);
    }), _;
  }
  startsWithAnyOf() {
    let e = nt.apply(hn, arguments);
    return e.every((t) => typeof t == "string") ? e.length === 0 ? cn(this) : this.inAnyRange(e.map((t) => [t, t + Mt])) : Ae(this, "startsWithAnyOf() only works with strings");
  }
};
function Wp(e) {
  return Ar(vl.prototype, function(t, n, r) {
    this.db = e, this._ctx = { table: t, index: n === ":id" ? null : n, or: r };
    let i = e._deps.indexedDB;
    if (!i)
      throw new z.MissingAPI();
    this._cmp = this._ascending = i.cmp.bind(i), this._descending = (o, s) => i.cmp(s, o), this._max = (o, s) => i.cmp(o, s) > 0 ? o : s, this._min = (o, s) => i.cmp(o, s) < 0 ? o : s, this._IDBKeyRange = e._deps.IDBKeyRange;
  });
}
function We(e) {
  return ee(function(t) {
    return ar(t), e(t.target.error), !1;
  });
}
function ar(e) {
  e.stopPropagation && e.stopPropagation(), e.preventDefault && e.preventDefault();
}
var lr = "storagemutated", vt = "x-storagemutated-1", bt = Sr(null, lr), Hp = class {
  _lock() {
    return Vn(!C.global), ++this._reculock, this._reculock === 1 && !C.global && (C.lockOwnerFor = this), this;
  }
  _unlock() {
    if (Vn(!C.global), --this._reculock === 0)
      for (C.global || (C.lockOwnerFor = null); this._blockedFuncs.length > 0 && !this._locked(); ) {
        var e = this._blockedFuncs.shift();
        try {
          In(e[1], e[0]);
        } catch {
        }
      }
    return this;
  }
  _locked() {
    return this._reculock && C.lockOwnerFor !== this;
  }
  create(e) {
    if (!this.mode)
      return this;
    let t = this.db.idbdb, n = this.db._state.dbOpenError;
    if (Vn(!this.idbtrans), !e && !t)
      switch (n && n.name) {
        case "DatabaseClosedError":
          throw new z.DatabaseClosed(n);
        case "MissingAPIError":
          throw new z.MissingAPI(n.message, n);
        default:
          throw new z.OpenFailed(n);
      }
    if (!this.active)
      throw new z.TransactionInactive();
    return Vn(this._completion._state === null), e = this.idbtrans = e || (this.db.core ? this.db.core.transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability }) : t.transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })), e.onerror = ee((r) => {
      ar(r), this._reject(e.error);
    }), e.onabort = ee((r) => {
      ar(r), this.active && this._reject(new z.Abort(e.error)), this.active = !1, this.on("abort").fire(r);
    }), e.oncomplete = ee(() => {
      this.active = !1, this._resolve(), "mutatedParts" in e && bt.storagemutated.fire(e.mutatedParts);
    }), this;
  }
  _promise(e, t, n) {
    if (e === "readwrite" && this.mode !== "readwrite")
      return de(new z.ReadOnly("Transaction is readonly"));
    if (!this.active)
      return de(new z.TransactionInactive());
    if (this._locked())
      return new I((i, o) => {
        this._blockedFuncs.push([() => {
          this._promise(e, t, n).then(i, o);
        }, C]);
      });
    if (n)
      return gt(() => {
        var i = new I((o, s) => {
          this._lock();
          let a = t(o, s, this);
          a && a.then && a.then(o, s);
        });
        return i.finally(() => this._unlock()), i._lib = !0, i;
      });
    var r = new I((i, o) => {
      var s = t(i, o, this);
      s && s.then && s.then(i, o);
    });
    return r._lib = !0, r;
  }
  _root() {
    return this.parent ? this.parent._root() : this;
  }
  waitFor(e) {
    var t = this._root();
    let n = I.resolve(e);
    if (t._waitingFor)
      t._waitingFor = t._waitingFor.then(() => n);
    else {
      t._waitingFor = n, t._waitingQueue = [];
      var r = t.idbtrans.objectStore(t.storeNames[0]);
      (function o() {
        for (++t._spinCount; t._waitingQueue.length; )
          t._waitingQueue.shift()();
        t._waitingFor && (r.get(-1 / 0).onsuccess = o);
      })();
    }
    var i = t._waitingFor;
    return new I((o, s) => {
      n.then((a) => t._waitingQueue.push(ee(o.bind(null, a))), (a) => t._waitingQueue.push(ee(s.bind(null, a)))).finally(() => {
        t._waitingFor === i && (t._waitingFor = null);
      });
    });
  }
  abort() {
    this.active && (this.active = !1, this.idbtrans && this.idbtrans.abort(), this._reject(new z.Abort()));
  }
  table(e) {
    let t = this._memoizedTables || (this._memoizedTables = {});
    if (Ne(t, e))
      return t[e];
    let n = this.schema[e];
    if (!n)
      throw new z.NotFound("Table " + e + " not part of transaction");
    let r = new this.db.Table(e, n, this);
    return r.core = this.db.core.table(e), t[e] = r, r;
  }
};
function Gp(e) {
  return Ar(Hp.prototype, function(t, n, r, i, o) {
    this.db = e, this.mode = t, this.storeNames = n, this.schema = r, this.chromeTransactionDurability = i, this.idbtrans = null, this.on = Sr(this, "complete", "error", "abort"), this.parent = o || null, this.active = !0, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new I((s, a) => {
      this._resolve = s, this._reject = a;
    }), this._completion.then(() => {
      this.active = !1, this.on.complete.fire();
    }, (s) => {
      var a = this.active;
      return this.active = !1, this.on.error.fire(s), this.parent ? this.parent._reject(s) : a && this.idbtrans && this.idbtrans.abort(), de(s);
    });
  });
}
function ko(e, t, n, r, i, o, s) {
  return { name: e, keyPath: t, unique: n, multi: r, auto: i, compound: o, src: (n && !s ? "&" : "") + (r ? "*" : "") + (i ? "++" : "") + ml(t) };
}
function ml(e) {
  return typeof e == "string" ? e : e ? "[" + [].join.call(e, "+") + "]" : "";
}
function gl(e, t, n) {
  return { name: e, primKey: t, indexes: n, mappedClass: null, idxByName: Ga(n, (r) => [r.name, r]) };
}
function Yp(e) {
  return e.length === 1 ? e[0] : e;
}
var cr = (e) => {
  try {
    return e.only([[]]), cr = () => [[]], [[]];
  } catch {
    return cr = () => Mt, Mt;
  }
};
function So(e) {
  return e == null ? () => {
  } : typeof e == "string" ? Jp(e) : (t) => it(t, e);
}
function Jp(e) {
  return e.split(".").length === 1 ? (t) => t[e] : (t) => it(t, e);
}
function ua(e) {
  return [].slice.call(e);
}
var Xp = 0;
function Qn(e) {
  return e == null ? ":id" : typeof e == "string" ? e : `[${e.join("+")}]`;
}
function Qp(e, t, n) {
  function r(h, u) {
    let p = ua(h.objectStoreNames);
    return { schema: { name: h.name, tables: p.map((d) => u.objectStore(d)).map((d) => {
      let { keyPath: f, autoIncrement: v } = d, m = ye(f), b = f == null, _ = {}, j = { name: d.name, primaryKey: { name: null, isPrimaryKey: !0, outbound: b, compound: m, keyPath: f, autoIncrement: v, unique: !0, extractKey: So(f) }, indexes: ua(d.indexNames).map((w) => d.index(w)).map((w) => {
        let { name: E, unique: A, multiEntry: O, keyPath: N } = w, F = ye(N), M = { name: E, compound: F, keyPath: N, unique: A, multiEntry: O, extractKey: So(N) };
        return _[Qn(N)] = M, M;
      }), getIndexByKeyPath: (w) => _[Qn(w)] };
      return _[":id"] = j.primaryKey, f != null && (_[Qn(f)] = j.primaryKey), j;
    }) }, hasGetAll: p.length > 0 && "getAll" in u.objectStore(p[0]) && !(typeof navigator < "u" && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604) };
  }
  function i(h) {
    if (h.type === 3)
      return null;
    if (h.type === 4)
      throw new Error("Cannot convert never type to IDBKeyRange");
    let { lower: u, upper: p, lowerOpen: d, upperOpen: f } = h;
    return u === void 0 ? p === void 0 ? null : t.upperBound(p, !!f) : p === void 0 ? t.lowerBound(u, !!d) : t.bound(u, p, !!d, !!f);
  }
  function o(h) {
    let u = h.name;
    function p({ trans: v, type: m, keys: b, values: _, range: j }) {
      return new Promise((w, E) => {
        w = ee(w);
        let A = v.objectStore(u), O = A.keyPath == null, N = m === "put" || m === "add";
        if (!N && m !== "delete" && m !== "deleteRange")
          throw new Error("Invalid operation type: " + m);
        let { length: F } = b || _ || { length: 1 };
        if (b && _ && b.length !== _.length)
          throw new Error("Given keys array must have same length as given values array.");
        if (F === 0)
          return w({ numFailures: 0, failures: {}, results: [], lastResult: void 0 });
        let M, $ = [], q = [], R = 0, ne = (V) => {
          ++R, ar(V);
        };
        if (m === "deleteRange") {
          if (j.type === 4)
            return w({ numFailures: R, failures: q, results: [], lastResult: void 0 });
          j.type === 3 ? $.push(M = A.clear()) : $.push(M = A.delete(i(j)));
        } else {
          let [V, G] = N ? O ? [_, b] : [_, null] : [b, null];
          if (N)
            for (let Y = 0; Y < F; ++Y)
              $.push(M = G && G[Y] !== void 0 ? A[m](V[Y], G[Y]) : A[m](V[Y])), M.onerror = ne;
          else
            for (let Y = 0; Y < F; ++Y)
              $.push(M = A[m](V[Y])), M.onerror = ne;
        }
        let X = (V) => {
          let G = V.target.result;
          $.forEach((Y, ae) => Y.error != null && (q[ae] = Y.error)), w({ numFailures: R, failures: q, results: m === "delete" ? b : $.map((Y) => Y.result), lastResult: G });
        };
        M.onerror = (V) => {
          ne(V), X(V);
        }, M.onsuccess = X;
      });
    }
    function d({ trans: v, values: m, query: b, reverse: _, unique: j }) {
      return new Promise((w, E) => {
        w = ee(w);
        let { index: A, range: O } = b, N = v.objectStore(u), F = A.isPrimaryKey ? N : N.index(A.name), M = _ ? j ? "prevunique" : "prev" : j ? "nextunique" : "next", $ = m || !("openKeyCursor" in F) ? F.openCursor(i(O), M) : F.openKeyCursor(i(O), M);
        $.onerror = We(E), $.onsuccess = ee((q) => {
          let R = $.result;
          if (!R) {
            w(null);
            return;
          }
          R.___id = ++Xp, R.done = !1;
          let ne = R.continue.bind(R), X = R.continuePrimaryKey;
          X && (X = X.bind(R));
          let V = R.advance.bind(R), G = () => {
            throw new Error("Cursor not started");
          }, Y = () => {
            throw new Error("Cursor not stopped");
          };
          R.trans = v, R.stop = R.continue = R.continuePrimaryKey = R.advance = G, R.fail = ee(E), R.next = function() {
            let ae = 1;
            return this.start(() => ae-- ? this.continue() : this.stop()).then(() => this);
          }, R.start = (ae) => {
            let $e = new Promise((be, ze) => {
              be = ee(be), $.onerror = We(ze), R.fail = ze, R.stop = (Re) => {
                R.stop = R.continue = R.continuePrimaryKey = R.advance = Y, be(Re);
              };
            }), Xe = () => {
              if ($.result)
                try {
                  ae();
                } catch (be) {
                  R.fail(be);
                }
              else
                R.done = !0, R.start = () => {
                  throw new Error("Cursor behind last entry");
                }, R.stop();
            };
            return $.onsuccess = ee((be) => {
              $.onsuccess = Xe, Xe();
            }), R.continue = ne, R.continuePrimaryKey = X, R.advance = V, Xe(), $e;
          }, w(R);
        }, E);
      });
    }
    function f(v) {
      return (m) => new Promise((b, _) => {
        b = ee(b);
        let { trans: j, values: w, limit: E, query: A } = m, O = E === 1 / 0 ? void 0 : E, { index: N, range: F } = A, M = j.objectStore(u), $ = N.isPrimaryKey ? M : M.index(N.name), q = i(F);
        if (E === 0)
          return b({ result: [] });
        if (v) {
          let R = w ? $.getAll(q, O) : $.getAllKeys(q, O);
          R.onsuccess = (ne) => b({ result: ne.target.result }), R.onerror = We(_);
        } else {
          let R = 0, ne = w || !("openKeyCursor" in $) ? $.openCursor(q) : $.openKeyCursor(q), X = [];
          ne.onsuccess = (V) => {
            let G = ne.result;
            if (!G)
              return b({ result: X });
            if (X.push(w ? G.value : G.primaryKey), ++R === E)
              return b({ result: X });
            G.continue();
          }, ne.onerror = We(_);
        }
      });
    }
    return { name: u, schema: h, mutate: p, getMany({ trans: v, keys: m }) {
      return new Promise((b, _) => {
        b = ee(b);
        let j = v.objectStore(u), w = m.length, E = new Array(w), A = 0, O = 0, N, F = ($) => {
          let q = $.target;
          (E[q._pos] = q.result) != null, ++O === A && b(E);
        }, M = We(_);
        for (let $ = 0; $ < w; ++$)
          m[$] != null && (N = j.get(m[$]), N._pos = $, N.onsuccess = F, N.onerror = M, ++A);
        A === 0 && b(E);
      });
    }, get({ trans: v, key: m }) {
      return new Promise((b, _) => {
        b = ee(b);
        let j = v.objectStore(u).get(m);
        j.onsuccess = (w) => b(w.target.result), j.onerror = We(_);
      });
    }, query: f(a), openCursor: d, count({ query: v, trans: m }) {
      let { index: b, range: _ } = v;
      return new Promise((j, w) => {
        let E = m.objectStore(u), A = b.isPrimaryKey ? E : E.index(b.name), O = i(_), N = O ? A.count(O) : A.count();
        N.onsuccess = ee((F) => j(F.target.result)), N.onerror = We(w);
      });
    } };
  }
  let { schema: s, hasGetAll: a } = r(e, n), l = s.tables.map((h) => o(h)), c = {};
  return l.forEach((h) => c[h.name] = h), { stack: "dbcore", transaction: e.transaction.bind(e), table(h) {
    if (!c[h])
      throw new Error(`Table '${h}' not found`);
    return c[h];
  }, MIN_KEY: -1 / 0, MAX_KEY: cr(t), schema: s };
}
function Zp(e, t) {
  return t.reduce((n, { create: r }) => ({ ...n, ...r(n) }), e);
}
function eh(e, t, { IDBKeyRange: n, indexedDB: r }, i) {
  return { dbcore: Zp(Qp(t, n, i), e.dbcore) };
}
function cs({ _novip: e }, t) {
  let n = t.db, r = eh(e._middlewares, n, e._deps, t);
  e.core = r.dbcore, e.tables.forEach((i) => {
    let o = i.name;
    e.core.schema.tables.some((s) => s.name === o) && (i.core = e.core.table(o), e[o] instanceof e.Table && (e[o].core = i.core));
  });
}
function ui({ _novip: e }, t, n, r) {
  n.forEach((i) => {
    let o = r[i];
    t.forEach((s) => {
      let a = ts(s, i);
      (!a || "value" in a && a.value === void 0) && (s === e.Transaction.prototype || s instanceof e.Transaction ? st(s, i, { get() {
        return this.table(i);
      }, set(l) {
        Va(this, i, { value: l, writable: !0, configurable: !0, enumerable: !0 });
      } }) : s[i] = new e.Table(i, o));
    });
  });
}
function Ao({ _novip: e }, t) {
  t.forEach((n) => {
    for (let r in n)
      n[r] instanceof e.Table && delete n[r];
  });
}
function th(e, t) {
  return e._cfg.version - t._cfg.version;
}
function nh(e, t, n, r) {
  let i = e._dbSchema, o = e._createTransaction("readwrite", e._storeNames, i);
  o.create(n), o._completion.catch(r);
  let s = o._reject.bind(o), a = C.transless || C;
  gt(() => {
    C.trans = o, C.transless = a, t === 0 ? (pe(i).forEach((l) => {
      us(n, l, i[l].primKey, i[l].indexes);
    }), cs(e, n), I.follow(() => e.on.populate.fire(o)).catch(s)) : rh(e, t, o, n).catch(s);
  });
}
function rh({ _novip: e }, t, n, r) {
  let i = [], o = e._versions, s = e._dbSchema = ps(e, e.idbdb, r), a = !1;
  o.filter((c) => c._cfg.version >= t).forEach((c) => {
    i.push(() => {
      let h = s, u = c._cfg.dbschema;
      To(e, h, r), To(e, u, r), s = e._dbSchema = u;
      let p = yl(h, u);
      p.add.forEach((f) => {
        us(r, f[0], f[1].primKey, f[1].indexes);
      }), p.change.forEach((f) => {
        if (f.recreate)
          throw new z.Upgrade("Not yet support for changing primary key");
        {
          let v = r.objectStore(f.name);
          f.add.forEach((m) => Oo(v, m)), f.change.forEach((m) => {
            v.deleteIndex(m.name), Oo(v, m);
          }), f.del.forEach((m) => v.deleteIndex(m));
        }
      });
      let d = c._cfg.contentUpgrade;
      if (d && c._cfg.version > t) {
        cs(e, r), n._memoizedTables = {}, a = !0;
        let f = Ya(u);
        p.del.forEach((_) => {
          f[_] = h[_];
        }), Ao(e, [e.Transaction.prototype]), ui(e, [e.Transaction.prototype], pe(f), f), n.schema = f;
        let v = ns(d);
        v && Nn();
        let m, b = I.follow(() => {
          if (m = d(n), m && v) {
            var _ = at.bind(null, null);
            m.then(_, _);
          }
        });
        return m && typeof m.then == "function" ? I.resolve(m) : b.then(() => m);
      }
    }), i.push((h) => {
      if (!a || !Rp) {
        let u = c._cfg.dbschema;
        oh(u, h);
      }
      Ao(e, [e.Transaction.prototype]), ui(e, [e.Transaction.prototype], e._storeNames, e._dbSchema), n.schema = e._dbSchema;
    });
  });
  function l() {
    return i.length ? I.resolve(i.shift()(n.idbtrans)).then(l) : I.resolve();
  }
  return l().then(() => {
    ih(s, r);
  });
}
function yl(e, t) {
  let n = { del: [], add: [], change: [] }, r;
  for (r in e)
    t[r] || n.del.push(r);
  for (r in t) {
    let i = e[r], o = t[r];
    if (!i)
      n.add.push([r, o]);
    else {
      let s = { name: r, def: o, recreate: !1, del: [], add: [], change: [] };
      if ("" + (i.primKey.keyPath || "") != "" + (o.primKey.keyPath || "") || i.primKey.auto !== o.primKey.auto && !Ri)
        s.recreate = !0, n.change.push(s);
      else {
        let a = i.idxByName, l = o.idxByName, c;
        for (c in a)
          l[c] || s.del.push(c);
        for (c in l) {
          let h = a[c], u = l[c];
          h ? h.src !== u.src && s.change.push(u) : s.add.push(u);
        }
        (s.del.length > 0 || s.add.length > 0 || s.change.length > 0) && n.change.push(s);
      }
    }
  }
  return n;
}
function us(e, t, n, r) {
  let i = e.db.createObjectStore(t, n.keyPath ? { keyPath: n.keyPath, autoIncrement: n.auto } : { autoIncrement: n.auto });
  return r.forEach((o) => Oo(i, o)), i;
}
function ih(e, t) {
  pe(e).forEach((n) => {
    t.db.objectStoreNames.contains(n) || us(t, n, e[n].primKey, e[n].indexes);
  });
}
function oh(e, t) {
  [].slice.call(t.db.objectStoreNames).forEach((n) => e[n] == null && t.db.deleteObjectStore(n));
}
function Oo(e, t) {
  e.createIndex(t.name, t.keyPath, { unique: t.unique, multiEntry: t.multi });
}
function ps(e, t, n) {
  let r = {};
  return Ni(t.objectStoreNames, 0).forEach((i) => {
    let o = n.objectStore(i), s = o.keyPath, a = ko(ml(s), s || "", !1, !1, !!o.autoIncrement, s && typeof s != "string", !0), l = [];
    for (let h = 0; h < o.indexNames.length; ++h) {
      let u = o.index(o.indexNames[h]);
      s = u.keyPath;
      var c = ko(u.name, s, !!u.unique, !!u.multiEntry, !1, s && typeof s != "string", !1);
      l.push(c);
    }
    r[i] = gl(i, a, l);
  }), r;
}
function sh({ _novip: e }, t, n) {
  e.verno = t.version / 10;
  let r = e._dbSchema = ps(e, t, n);
  e._storeNames = Ni(t.objectStoreNames, 0), ui(e, [e._allTables], pe(r), r);
}
function ah(e, t) {
  let n = ps(e, e.idbdb, t), r = yl(n, e._dbSchema);
  return !(r.add.length || r.change.some((i) => i.add.length || i.change.length));
}
function To({ _novip: e }, t, n) {
  let r = n.db.objectStoreNames;
  for (let i = 0; i < r.length; ++i) {
    let o = r[i], s = n.objectStore(o);
    e._hasGetAll = "getAll" in s;
    for (let a = 0; a < s.indexNames.length; ++a) {
      let l = s.indexNames[a], c = s.index(l).keyPath, h = typeof c == "string" ? c : "[" + Ni(c).join("+") + "]";
      if (t[o]) {
        let u = t[o].idxByName[h];
        u && (u.name = l, delete t[o].idxByName[h], t[o].idxByName[l] = u);
      }
    }
  }
  typeof navigator < "u" && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && Q.WorkerGlobalScope && Q instanceof Q.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e._hasGetAll = !1);
}
function lh(e) {
  return e.split(",").map((t, n) => {
    t = t.trim();
    let r = t.replace(/([&*]|\+\+)/g, ""), i = /^\[/.test(r) ? r.match(/^\[(.*)\]$/)[1].split("+") : r;
    return ko(r, i || null, /\&/.test(t), /\*/.test(t), /\+\+/.test(t), ye(i), n === 0);
  });
}
var ch = class {
  _parseStoresSpec(e, t) {
    pe(e).forEach((n) => {
      if (e[n] !== null) {
        var r = lh(e[n]), i = r.shift();
        if (i.multi)
          throw new z.Schema("Primary key cannot be multi-valued");
        r.forEach((o) => {
          if (o.auto)
            throw new z.Schema("Only primary key can be marked as autoIncrement (++)");
          if (!o.keyPath)
            throw new z.Schema("Index must have a name and cannot be an empty string");
        }), t[n] = gl(n, i, r);
      }
    });
  }
  stores(e) {
    let t = this.db;
    this._cfg.storesSource = this._cfg.storesSource ? xe(this._cfg.storesSource, e) : e;
    let n = t._versions, r = {}, i = {};
    return n.forEach((o) => {
      xe(r, o._cfg.storesSource), i = o._cfg.dbschema = {}, o._parseStoresSpec(r, i);
    }), t._dbSchema = i, Ao(t, [t._allTables, t, t.Transaction.prototype]), ui(t, [t._allTables, t, t.Transaction.prototype, this._cfg.tables], pe(i), i), t._storeNames = pe(i), this;
  }
  upgrade(e) {
    return this._cfg.contentUpgrade = os(this._cfg.contentUpgrade || J, e), this;
  }
};
function uh(e) {
  return Ar(ch.prototype, function(t) {
    this.db = e, this._cfg = { version: t, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };
  });
}
function hs(e, t) {
  let n = e._dbNamesDB;
  return n || (n = e._dbNamesDB = new Zn(Ci, { addons: [], indexedDB: e, IDBKeyRange: t }), n.version(1).stores({ dbnames: "name" })), n.table("dbnames");
}
function ds(e) {
  return e && typeof e.databases == "function";
}
function ph({ indexedDB: e, IDBKeyRange: t }) {
  return ds(e) ? Promise.resolve(e.databases()).then((n) => n.map((r) => r.name).filter((r) => r !== Ci)) : hs(e, t).toCollection().primaryKeys();
}
function hh({ indexedDB: e, IDBKeyRange: t }, n) {
  !ds(e) && n !== Ci && hs(e, t).put({ name: n }).catch(J);
}
function dh({ indexedDB: e, IDBKeyRange: t }, n) {
  !ds(e) && n !== Ci && hs(e, t).delete(n).catch(J);
}
function No(e) {
  return gt(function() {
    return C.letThrough = !0, e();
  });
}
function fh() {
  var e = !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent);
  if (!e || !indexedDB.databases)
    return Promise.resolve();
  var t;
  return new Promise(function(n) {
    var r = function() {
      return indexedDB.databases().finally(n);
    };
    t = setInterval(r, 100), r();
  }).finally(function() {
    return clearInterval(t);
  });
}
function vh(e) {
  let t = e._state, { indexedDB: n } = e._deps;
  if (t.isBeingOpened || e.idbdb)
    return t.dbReadyPromise.then(() => t.dbOpenError ? de(t.dbOpenError) : e);
  Ye && (t.openCanceller._stackHolder = Xt()), t.isBeingOpened = !0, t.dbOpenError = null, t.openComplete = !1;
  let r = t.openCanceller;
  function i() {
    if (t.openCanceller !== r)
      throw new z.DatabaseClosed("db.open() was cancelled");
  }
  let o = t.dbReadyResolve, s = null, a = !1;
  return I.race([r, (typeof navigator > "u" ? I.resolve() : fh()).then(() => new I((l, c) => {
    if (i(), !n)
      throw new z.MissingAPI();
    let h = e.name, u = t.autoSchema ? n.open(h) : n.open(h, Math.round(e.verno * 10));
    if (!u)
      throw new z.MissingAPI();
    u.onerror = We(c), u.onblocked = ee(e._fireOnBlocked), u.onupgradeneeded = ee((p) => {
      if (s = u.transaction, t.autoSchema && !e._options.allowEmptyDB) {
        u.onerror = ar, s.abort(), u.result.close();
        let f = n.deleteDatabase(h);
        f.onsuccess = f.onerror = ee(() => {
          c(new z.NoSuchDatabase(`Database ${h} doesnt exist`));
        });
      } else {
        s.onerror = We(c);
        var d = p.oldVersion > Math.pow(2, 62) ? 0 : p.oldVersion;
        a = d < 1, e._novip.idbdb = u.result, nh(e, d / 10, s, c);
      }
    }, c), u.onsuccess = ee(() => {
      s = null;
      let p = e._novip.idbdb = u.result, d = Ni(p.objectStoreNames);
      if (d.length > 0)
        try {
          let f = p.transaction(Yp(d), "readonly");
          t.autoSchema ? sh(e, p, f) : (To(e, e._dbSchema, f), ah(e, f) || console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Some queries may fail.")), cs(e, f);
        } catch {
        }
      Xn.push(e), p.onversionchange = ee((f) => {
        t.vcFired = !0, e.on("versionchange").fire(f);
      }), p.onclose = ee((f) => {
        e.on("close").fire(f);
      }), a && hh(e._deps, h), l();
    }, c);
  }))]).then(() => (i(), t.onReadyBeingFired = [], I.resolve(No(() => e.on.ready.fire(e.vip))).then(function l() {
    if (t.onReadyBeingFired.length > 0) {
      let c = t.onReadyBeingFired.reduce(os, J);
      return t.onReadyBeingFired = [], I.resolve(No(() => c(e.vip))).then(l);
    }
  }))).finally(() => {
    t.onReadyBeingFired = null, t.isBeingOpened = !1;
  }).then(() => e).catch((l) => {
    t.dbOpenError = l;
    try {
      s && s.abort();
    } catch {
    }
    return r === t.openCanceller && e._close(), de(l);
  }).finally(() => {
    t.openComplete = !0, o();
  });
}
function Io(e) {
  var t = (s) => e.next(s), n = (s) => e.throw(s), r = o(t), i = o(n);
  function o(s) {
    return (a) => {
      var l = s(a), c = l.value;
      return l.done ? c : !c || typeof c.then != "function" ? ye(c) ? Promise.all(c).then(r, i) : r(c) : c.then(r, i);
    };
  }
  return o(t)();
}
function mh(e, t, n) {
  var r = arguments.length;
  if (r < 2)
    throw new z.InvalidArgument("Too few arguments");
  for (var i = new Array(r - 1); --r; )
    i[r - 1] = arguments[r];
  n = i.pop();
  var o = Ja(i);
  return [e, o, n];
}
function bl(e, t, n, r, i) {
  return I.resolve().then(() => {
    let o = C.transless || C, s = e._createTransaction(t, n, e._dbSchema, r), a = { trans: s, transless: o };
    if (r)
      s.idbtrans = r.idbtrans;
    else
      try {
        s.create(), e._state.PR1398_maxLoop = 3;
      } catch (u) {
        return u.name === is.InvalidState && e.isOpen() && --e._state.PR1398_maxLoop > 0 ? (console.warn("Dexie: Need to reopen db"), e._close(), e.open().then(() => bl(e, t, n, null, i))) : de(u);
      }
    let l = ns(i);
    l && Nn();
    let c, h = I.follow(() => {
      if (c = i.call(s, s), c)
        if (l) {
          var u = at.bind(null, null);
          c.then(u, u);
        } else
          typeof c.next == "function" && typeof c.throw == "function" && (c = Io(c));
    }, a);
    return (c && typeof c.then == "function" ? I.resolve(c).then((u) => s.active ? u : de(new z.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"))) : h.then(() => c)).then((u) => (r && s._resolve(), s._completion.then(() => u))).catch((u) => (s._reject(u), de(u)));
  });
}
function $r(e, t, n) {
  let r = ye(e) ? e.slice() : [e];
  for (let i = 0; i < n; ++i)
    r.push(t);
  return r;
}
function gh(e) {
  return { ...e, table(t) {
    let n = e.table(t), { schema: r } = n, i = {}, o = [];
    function s(u, p, d) {
      let f = Qn(u), v = i[f] = i[f] || [], m = u == null ? 0 : typeof u == "string" ? 1 : u.length, b = p > 0, _ = { ...d, isVirtual: b, keyTail: p, keyLength: m, extractKey: So(u), unique: !b && d.unique };
      if (v.push(_), _.isPrimaryKey || o.push(_), m > 1) {
        let j = m === 2 ? u[0] : u.slice(0, m - 1);
        s(j, p + 1, d);
      }
      return v.sort((j, w) => j.keyTail - w.keyTail), _;
    }
    let a = s(r.primaryKey.keyPath, 0, r.primaryKey);
    i[":id"] = [a];
    for (let u of r.indexes)
      s(u.keyPath, 0, u);
    function l(u) {
      let p = i[Qn(u)];
      return p && p[0];
    }
    function c(u, p) {
      return { type: u.type === 1 ? 2 : u.type, lower: $r(u.lower, u.lowerOpen ? e.MAX_KEY : e.MIN_KEY, p), lowerOpen: !0, upper: $r(u.upper, u.upperOpen ? e.MIN_KEY : e.MAX_KEY, p), upperOpen: !0 };
    }
    function h(u) {
      let p = u.query.index;
      return p.isVirtual ? { ...u, query: { index: p, range: c(u.query.range, p.keyTail) } } : u;
    }
    return { ...n, schema: { ...r, primaryKey: a, indexes: o, getIndexByKeyPath: l }, count(u) {
      return n.count(h(u));
    }, query(u) {
      return n.query(h(u));
    }, openCursor(u) {
      let { keyTail: p, isVirtual: d, keyLength: f } = u.query.index;
      if (!d)
        return n.openCursor(u);
      function v(m) {
        function b(_) {
          _ != null ? m.continue($r(_, u.reverse ? e.MAX_KEY : e.MIN_KEY, p)) : u.unique ? m.continue(m.key.slice(0, f).concat(u.reverse ? e.MIN_KEY : e.MAX_KEY, p)) : m.continue();
        }
        return Object.create(m, { continue: { value: b }, continuePrimaryKey: { value(_, j) {
          m.continuePrimaryKey($r(_, e.MAX_KEY, p), j);
        } }, primaryKey: { get() {
          return m.primaryKey;
        } }, key: { get() {
          let _ = m.key;
          return f === 1 ? _[0] : _.slice(0, f);
        } }, value: { get() {
          return m.value;
        } } });
      }
      return n.openCursor(h(u)).then((m) => m && v(m));
    } };
  } };
}
var yh = { stack: "dbcore", name: "VirtualIndexMiddleware", level: 1, create: gh };
function fs(e, t, n, r) {
  return n = n || {}, r = r || "", pe(e).forEach((i) => {
    if (!Ne(t, i))
      n[r + i] = void 0;
    else {
      var o = e[i], s = t[i];
      if (typeof o == "object" && typeof s == "object" && o && s) {
        let a = po(o), l = po(s);
        a !== l ? n[r + i] = t[i] : a === "Object" ? fs(o, s, n, r + i + ".") : o !== s && (n[r + i] = t[i]);
      } else
        o !== s && (n[r + i] = t[i]);
    }
  }), pe(t).forEach((i) => {
    Ne(e, i) || (n[r + i] = t[i]);
  }), n;
}
function bh(e, t) {
  return t.type === "delete" ? t.keys : t.keys || t.values.map(e.extractKey);
}
var jh = { stack: "dbcore", name: "HooksMiddleware", level: 2, create: (e) => ({ ...e, table(t) {
  let n = e.table(t), { primaryKey: r } = n.schema;
  return { ...n, mutate(i) {
    let o = C.trans, { deleting: s, creating: a, updating: l } = o.table(t).hook;
    switch (i.type) {
      case "add":
        if (a.fire === J)
          break;
        return o._promise("readwrite", () => c(i), !0);
      case "put":
        if (a.fire === J && l.fire === J)
          break;
        return o._promise("readwrite", () => c(i), !0);
      case "delete":
        if (s.fire === J)
          break;
        return o._promise("readwrite", () => c(i), !0);
      case "deleteRange":
        if (s.fire === J)
          break;
        return o._promise("readwrite", () => h(i), !0);
    }
    return n.mutate(i);
    function c(p) {
      let d = C.trans, f = p.keys || bh(r, p);
      if (!f)
        throw new Error("Keys missing");
      return p = p.type === "add" || p.type === "put" ? { ...p, keys: f } : { ...p }, p.type !== "delete" && (p.values = [...p.values]), p.keys && (p.keys = [...p.keys]), xh(n, p, f).then((v) => {
        let m = f.map((b, _) => {
          let j = v[_], w = { onerror: null, onsuccess: null };
          if (p.type === "delete")
            s.fire.call(w, b, j, d);
          else if (p.type === "add" || j === void 0) {
            let E = a.fire.call(w, b, p.values[_], d);
            b == null && E != null && (b = E, p.keys[_] = b, r.outbound || Ke(p.values[_], r.keyPath, b));
          } else {
            let E = fs(j, p.values[_]), A = l.fire.call(w, E, b, j, d);
            if (A) {
              let O = p.values[_];
              Object.keys(A).forEach((N) => {
                Ne(O, N) ? O[N] = A[N] : Ke(O, N, A[N]);
              });
            }
          }
          return w;
        });
        return n.mutate(p).then(({ failures: b, results: _, numFailures: j, lastResult: w }) => {
          for (let E = 0; E < f.length; ++E) {
            let A = _ ? _[E] : f[E], O = m[E];
            A == null ? O.onerror && O.onerror(b[E]) : O.onsuccess && O.onsuccess(p.type === "put" && v[E] ? p.values[E] : A);
          }
          return { failures: b, results: _, numFailures: j, lastResult: w };
        }).catch((b) => (m.forEach((_) => _.onerror && _.onerror(b)), Promise.reject(b)));
      });
    }
    function h(p) {
      return u(p.trans, p.range, 1e4);
    }
    function u(p, d, f) {
      return n.query({ trans: p, values: !1, query: { index: r, range: d }, limit: f }).then(({ result: v }) => c({ type: "delete", keys: v, trans: p }).then((m) => m.numFailures > 0 ? Promise.reject(m.failures[0]) : v.length < f ? { failures: [], numFailures: 0, lastResult: void 0 } : u(p, { ...d, lower: v[v.length - 1], lowerOpen: !0 }, f)));
    }
  } };
} }) };
function xh(e, t, n) {
  return t.type === "add" ? Promise.resolve([]) : e.getMany({ trans: t.trans, keys: n, cache: "immutable" });
}
function jl(e, t, n) {
  try {
    if (!t || t.keys.length < e.length)
      return null;
    let r = [];
    for (let i = 0, o = 0; i < t.keys.length && o < e.length; ++i)
      je(t.keys[i], e[o]) === 0 && (r.push(n ? wr(t.values[i]) : t.values[i]), ++o);
    return r.length === e.length ? r : null;
  } catch {
    return null;
  }
}
var wh = { stack: "dbcore", level: -1, create: (e) => ({ table: (t) => {
  let n = e.table(t);
  return { ...n, getMany: (r) => {
    if (!r.cache)
      return n.getMany(r);
    let i = jl(r.keys, r.trans._cache, r.cache === "clone");
    return i ? I.resolve(i) : n.getMany(r).then((o) => (r.trans._cache = { keys: r.keys, values: r.cache === "clone" ? wr(o) : o }, o));
  }, mutate: (r) => (r.type !== "add" && (r.trans._cache = null), n.mutate(r)) };
} }) };
function vs(e) {
  return !("from" in e);
}
var tt = function(e, t) {
  if (this)
    xe(this, arguments.length ? { d: 1, from: e, to: arguments.length > 1 ? t : e } : { d: 0 });
  else {
    let n = new tt();
    return e && "d" in e && xe(n, e), n;
  }
};
wn(tt.prototype, { add(e) {
  return pi(this, e), this;
}, addKey(e) {
  return ur(this, e, e), this;
}, addKeys(e) {
  return e.forEach((t) => ur(this, t, t)), this;
}, [ho]() {
  return Ro(this);
} });
function ur(e, t, n) {
  let r = je(t, n);
  if (isNaN(r))
    return;
  if (r > 0)
    throw RangeError();
  if (vs(e))
    return xe(e, { from: t, to: n, d: 1 });
  let i = e.l, o = e.r;
  if (je(n, e.from) < 0)
    return i ? ur(i, t, n) : e.l = { from: t, to: n, d: 1, l: null, r: null }, pa(e);
  if (je(t, e.to) > 0)
    return o ? ur(o, t, n) : e.r = { from: t, to: n, d: 1, l: null, r: null }, pa(e);
  je(t, e.from) < 0 && (e.from = t, e.l = null, e.d = o ? o.d + 1 : 1), je(n, e.to) > 0 && (e.to = n, e.r = null, e.d = e.l ? e.l.d + 1 : 1);
  let s = !e.r;
  i && !e.l && pi(e, i), o && s && pi(e, o);
}
function pi(e, t) {
  function n(r, { from: i, to: o, l: s, r: a }) {
    ur(r, i, o), s && n(r, s), a && n(r, a);
  }
  vs(t) || n(e, t);
}
function _h(e, t) {
  let n = Ro(t), r = n.next();
  if (r.done)
    return !1;
  let i = r.value, o = Ro(e), s = o.next(i.from), a = s.value;
  for (; !r.done && !s.done; ) {
    if (je(a.from, i.to) <= 0 && je(a.to, i.from) >= 0)
      return !0;
    je(i.from, a.from) < 0 ? i = (r = n.next(a.from)).value : a = (s = o.next(i.from)).value;
  }
  return !1;
}
function Ro(e) {
  let t = vs(e) ? null : { s: 0, n: e };
  return { next(n) {
    let r = arguments.length > 0;
    for (; t; )
      switch (t.s) {
        case 0:
          if (t.s = 1, r)
            for (; t.n.l && je(n, t.n.from) < 0; )
              t = { up: t, n: t.n.l, s: 1 };
          else
            for (; t.n.l; )
              t = { up: t, n: t.n.l, s: 1 };
        case 1:
          if (t.s = 2, !r || je(n, t.n.to) <= 0)
            return { value: t.n, done: !1 };
        case 2:
          if (t.n.r) {
            t.s = 3, t = { up: t, n: t.n.r, s: 0 };
            continue;
          }
        case 3:
          t = t.up;
      }
    return { done: !0 };
  } };
}
function pa(e) {
  var t, n;
  let r = (((t = e.r) === null || t === void 0 ? void 0 : t.d) || 0) - (((n = e.l) === null || n === void 0 ? void 0 : n.d) || 0), i = r > 1 ? "r" : r < -1 ? "l" : "";
  if (i) {
    let o = i === "r" ? "l" : "r", s = { ...e }, a = e[i];
    e.from = a.from, e.to = a.to, e[i] = a[i], s[i] = a[o], e[o] = s, s.d = ha(s);
  }
  e.d = ha(e);
}
function ha({ r: e, l: t }) {
  return (e ? t ? Math.max(e.d, t.d) : e.d : t ? t.d : 0) + 1;
}
var Eh = { stack: "dbcore", level: 0, create: (e) => {
  let t = e.schema.name, n = new tt(e.MIN_KEY, e.MAX_KEY);
  return { ...e, table: (r) => {
    let i = e.table(r), { schema: o } = i, { primaryKey: s } = o, { extractKey: a, outbound: l } = s, c = { ...i, mutate: (p) => {
      let d = p.trans, f = d.mutatedParts || (d.mutatedParts = {}), v = (A) => {
        let O = `idb://${t}/${r}/${A}`;
        return f[O] || (f[O] = new tt());
      }, m = v(""), b = v(":dels"), { type: _ } = p, [j, w] = p.type === "deleteRange" ? [p.range] : p.type === "delete" ? [p.keys] : p.values.length < 50 ? [[], p.values] : [], E = p.trans._cache;
      return i.mutate(p).then((A) => {
        if (ye(j)) {
          _ !== "delete" && (j = A.results), m.addKeys(j);
          let O = jl(j, E);
          !O && _ !== "add" && b.addKeys(j), (O || w) && kh(v, o, O, w);
        } else if (j) {
          let O = { from: j.lower, to: j.upper };
          b.add(O), m.add(O);
        } else
          m.add(n), b.add(n), o.indexes.forEach((O) => v(O.name).add(n));
        return A;
      });
    } }, h = ({ query: { index: p, range: d } }) => {
      var f, v;
      return [p, new tt((f = d.lower) !== null && f !== void 0 ? f : e.MIN_KEY, (v = d.upper) !== null && v !== void 0 ? v : e.MAX_KEY)];
    }, u = { get: (p) => [s, new tt(p.key)], getMany: (p) => [s, new tt().addKeys(p.keys)], count: h, query: h, openCursor: h };
    return pe(u).forEach((p) => {
      c[p] = function(d) {
        let { subscr: f } = C;
        if (f) {
          let v = (w) => {
            let E = `idb://${t}/${r}/${w}`;
            return f[E] || (f[E] = new tt());
          }, m = v(""), b = v(":dels"), [_, j] = u[p](d);
          if (v(_.name || "").add(j), !_.isPrimaryKey)
            if (p === "count")
              b.add(n);
            else {
              let w = p === "query" && l && d.values && i.query({ ...d, values: !1 });
              return i[p].apply(this, arguments).then((E) => {
                if (p === "query") {
                  if (l && d.values)
                    return w.then(({ result: O }) => (m.addKeys(O), E));
                  let A = d.values ? E.result.map(a) : E.result;
                  d.values ? m.addKeys(A) : b.addKeys(A);
                } else if (p === "openCursor") {
                  let A = E, O = d.values;
                  return A && Object.create(A, { key: { get() {
                    return b.addKey(A.primaryKey), A.key;
                  } }, primaryKey: { get() {
                    let N = A.primaryKey;
                    return b.addKey(N), N;
                  } }, value: { get() {
                    return O && m.addKey(A.primaryKey), A.value;
                  } } });
                }
                return E;
              });
            }
        }
        return i[p].apply(this, arguments);
      };
    }), c;
  } };
} };
function kh(e, t, n, r) {
  function i(o) {
    let s = e(o.name || "");
    function a(c) {
      return c != null ? o.extractKey(c) : null;
    }
    let l = (c) => o.multiEntry && ye(c) ? c.forEach((h) => s.addKey(h)) : s.addKey(c);
    (n || r).forEach((c, h) => {
      let u = n && a(n[h]), p = r && a(r[h]);
      je(u, p) !== 0 && (u != null && l(u), p != null && l(p));
    });
  }
  t.indexes.forEach(i);
}
var Zn = class {
  constructor(e, t) {
    this._middlewares = {}, this.verno = 0;
    let n = Zn.dependencies;
    this._options = t = { addons: Zn.addons, autoOpen: !0, indexedDB: n.indexedDB, IDBKeyRange: n.IDBKeyRange, ...t }, this._deps = { indexedDB: t.indexedDB, IDBKeyRange: t.IDBKeyRange };
    let { addons: r } = t;
    this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this;
    let i = { dbOpenError: null, isBeingOpened: !1, onReadyBeingFired: null, openComplete: !1, dbReadyResolve: J, dbReadyPromise: null, cancelOpen: J, openCanceller: null, autoSchema: !0, PR1398_maxLoop: 3 };
    i.dbReadyPromise = new I((o) => {
      i.dbReadyResolve = o;
    }), i.openCanceller = new I((o, s) => {
      i.cancelOpen = s;
    }), this._state = i, this.name = e, this.on = Sr(this, "populate", "blocked", "versionchange", "close", { ready: [os, J] }), this.on.ready.subscribe = Wa(this.on.ready.subscribe, (o) => (s, a) => {
      Zn.vip(() => {
        let l = this._state;
        if (l.openComplete)
          l.dbOpenError || I.resolve().then(s), a && o(s);
        else if (l.onReadyBeingFired)
          l.onReadyBeingFired.push(s), a && o(s);
        else {
          o(s);
          let c = this;
          a || o(function h() {
            c.on.ready.unsubscribe(s), c.on.ready.unsubscribe(h);
          });
        }
      });
    }), this.Collection = Bp(this), this.Table = Pp(this), this.Transaction = Gp(this), this.Version = uh(this), this.WhereClause = Wp(this), this.on("versionchange", (o) => {
      o.newVersion > 0 ? console.warn(`Another connection wants to upgrade database '${this.name}'. Closing db now to resume the upgrade.`) : console.warn(`Another connection wants to delete database '${this.name}'. Closing db now to resume the delete request.`), this.close();
    }), this.on("blocked", (o) => {
      !o.newVersion || o.newVersion < o.oldVersion ? console.warn(`Dexie.delete('${this.name}') was blocked`) : console.warn(`Upgrade '${this.name}' blocked by other connection holding version ${o.oldVersion / 10}`);
    }), this._maxKey = cr(t.IDBKeyRange), this._createTransaction = (o, s, a, l) => new this.Transaction(o, s, a, this._options.chromeTransactionDurability, l), this._fireOnBlocked = (o) => {
      this.on("blocked").fire(o), Xn.filter((s) => s.name === this.name && s !== this && !s._state.vcFired).map((s) => s.on("versionchange").fire(o));
    }, this.use(yh), this.use(jh), this.use(Eh), this.use(wh), this.vip = Object.create(this, { _vip: { value: !0 } }), r.forEach((o) => o(this));
  }
  version(e) {
    if (isNaN(e) || e < 0.1)
      throw new z.Type("Given version is not a positive number");
    if (e = Math.round(e * 10) / 10, this.idbdb || this._state.isBeingOpened)
      throw new z.Schema("Cannot add version when database is open");
    this.verno = Math.max(this.verno, e);
    let t = this._versions;
    var n = t.filter((r) => r._cfg.version === e)[0];
    return n || (n = new this.Version(e), t.push(n), t.sort(th), n.stores({}), this._state.autoSchema = !1, n);
  }
  _whenReady(e) {
    return this.idbdb && (this._state.openComplete || C.letThrough || this._vip) ? e() : new I((t, n) => {
      if (this._state.openComplete)
        return n(new z.DatabaseClosed(this._state.dbOpenError));
      if (!this._state.isBeingOpened) {
        if (!this._options.autoOpen) {
          n(new z.DatabaseClosed());
          return;
        }
        this.open().catch(J);
      }
      this._state.dbReadyPromise.then(t, n);
    }).then(e);
  }
  use({ stack: e, create: t, level: n, name: r }) {
    r && this.unuse({ stack: e, name: r });
    let i = this._middlewares[e] || (this._middlewares[e] = []);
    return i.push({ stack: e, create: t, level: n ?? 10, name: r }), i.sort((o, s) => o.level - s.level), this;
  }
  unuse({ stack: e, name: t, create: n }) {
    return e && this._middlewares[e] && (this._middlewares[e] = this._middlewares[e].filter((r) => n ? r.create !== n : t ? r.name !== t : !1)), this;
  }
  open() {
    return vh(this);
  }
  _close() {
    let e = this._state, t = Xn.indexOf(this);
    if (t >= 0 && Xn.splice(t, 1), this.idbdb) {
      try {
        this.idbdb.close();
      } catch {
      }
      this._novip.idbdb = null;
    }
    e.dbReadyPromise = new I((n) => {
      e.dbReadyResolve = n;
    }), e.openCanceller = new I((n, r) => {
      e.cancelOpen = r;
    });
  }
  close() {
    this._close();
    let e = this._state;
    this._options.autoOpen = !1, e.dbOpenError = new z.DatabaseClosed(), e.isBeingOpened && e.cancelOpen(e.dbOpenError);
  }
  delete() {
    let e = arguments.length > 0, t = this._state;
    return new I((n, r) => {
      let i = () => {
        this.close();
        var o = this._deps.indexedDB.deleteDatabase(this.name);
        o.onsuccess = ee(() => {
          dh(this._deps, this.name), n();
        }), o.onerror = We(r), o.onblocked = this._fireOnBlocked;
      };
      if (e)
        throw new z.InvalidArgument("Arguments not allowed in db.delete()");
      t.isBeingOpened ? t.dbReadyPromise.then(i) : i();
    });
  }
  backendDB() {
    return this.idbdb;
  }
  isOpen() {
    return this.idbdb !== null;
  }
  hasBeenClosed() {
    let e = this._state.dbOpenError;
    return e && e.name === "DatabaseClosed";
  }
  hasFailed() {
    return this._state.dbOpenError !== null;
  }
  dynamicallyOpened() {
    return this._state.autoSchema;
  }
  get tables() {
    return pe(this._allTables).map((e) => this._allTables[e]);
  }
  transaction() {
    let e = mh.apply(this, arguments);
    return this._transaction.apply(this, e);
  }
  _transaction(e, t, n) {
    let r = C.trans;
    (!r || r.db !== this || e.indexOf("!") !== -1) && (r = null);
    let i = e.indexOf("?") !== -1;
    e = e.replace("!", "").replace("?", "");
    let o, s;
    try {
      if (s = t.map((l) => {
        var c = l instanceof this.Table ? l.name : l;
        if (typeof c != "string")
          throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
        return c;
      }), e == "r" || e === Gi)
        o = Gi;
      else if (e == "rw" || e == Yi)
        o = Yi;
      else
        throw new z.InvalidArgument("Invalid transaction mode: " + e);
      if (r) {
        if (r.mode === Gi && o === Yi)
          if (i)
            r = null;
          else
            throw new z.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
        r && s.forEach((l) => {
          if (r && r.storeNames.indexOf(l) === -1)
            if (i)
              r = null;
            else
              throw new z.SubTransaction("Table " + l + " not included in parent transaction.");
        }), i && r && !r.active && (r = null);
      }
    } catch (l) {
      return r ? r._promise(null, (c, h) => {
        h(l);
      }) : de(l);
    }
    let a = bl.bind(null, this, o, s, r, n);
    return r ? r._promise(o, a, "lock") : C.trans ? In(C.transless, () => this._whenReady(a)) : this._whenReady(a);
  }
  table(e) {
    if (!Ne(this._allTables, e))
      throw new z.InvalidTable(`Table ${e} does not exist`);
    return this._allTables[e];
  }
}, Sh = typeof Symbol < "u" && "observable" in Symbol ? Symbol.observable : "@@observable", Ah = class {
  constructor(e) {
    this._subscribe = e;
  }
  subscribe(e, t, n) {
    return this._subscribe(!e || typeof e == "function" ? { next: e, error: t, complete: n } : e);
  }
  [Sh]() {
    return this;
  }
};
function xl(e, t) {
  return pe(t).forEach((n) => {
    let r = e[n] || (e[n] = new tt());
    pi(r, t[n]);
  }), e;
}
function Oh(e) {
  return new Ah((t) => {
    let n = ns(e);
    function r(d) {
      n && Nn();
      let f = () => gt(e, { subscr: d, trans: null }), v = C.trans ? In(C.transless, f) : f();
      return n && v.then(at, at), v;
    }
    let i = !1, o = {}, s = {}, a = { get closed() {
      return i;
    }, unsubscribe: () => {
      i = !0, bt.storagemutated.unsubscribe(u);
    } };
    t.start && t.start(a);
    let l = !1, c = !1;
    function h() {
      return pe(s).some((d) => o[d] && _h(o[d], s[d]));
    }
    let u = (d) => {
      xl(o, d), h() && p();
    }, p = () => {
      if (l || i)
        return;
      o = {};
      let d = {}, f = r(d);
      c || (bt(lr, u), c = !0), l = !0, Promise.resolve(f).then((v) => {
        l = !1, !i && (h() ? p() : (o = {}, s = d, t.next && t.next(v)));
      }, (v) => {
        l = !1, t.error && t.error(v), a.unsubscribe();
      });
    };
    return p(), a;
  });
}
var Co;
try {
  Co = { indexedDB: Q.indexedDB || Q.mozIndexedDB || Q.webkitIndexedDB || Q.msIndexedDB, IDBKeyRange: Q.IDBKeyRange || Q.webkitIDBKeyRange };
} catch {
  Co = { indexedDB: null, IDBKeyRange: null };
}
var Pt = Zn;
wn(Pt, { ...Ii, delete(e) {
  return new Pt(e, { addons: [] }).delete();
}, exists(e) {
  return new Pt(e, { addons: [] }).open().then((t) => (t.close(), !0)).catch("NoSuchDatabaseError", () => !1);
}, getDatabaseNames(e) {
  try {
    return ph(Pt.dependencies).then(e);
  } catch {
    return de(new z.MissingAPI());
  }
}, defineClass() {
  function e(t) {
    xe(this, t);
  }
  return e;
}, ignoreTransaction(e) {
  return C.trans ? In(C.transless, e) : e();
}, vip: No, async: function(e) {
  return function() {
    try {
      var t = Io(e.apply(this, arguments));
      return !t || typeof t.then != "function" ? I.resolve(t) : t;
    } catch (n) {
      return de(n);
    }
  };
}, spawn: function(e, t, n) {
  try {
    var r = Io(e.apply(n, t || []));
    return !r || typeof r.then != "function" ? I.resolve(r) : r;
  } catch (i) {
    return de(i);
  }
}, currentTransaction: { get: () => C.trans || null }, waitFor: function(e, t) {
  let n = I.resolve(typeof e == "function" ? Pt.ignoreTransaction(e) : e).timeout(t || 6e4);
  return C.trans ? C.trans.waitFor(n) : n;
}, Promise: I, debug: { get: () => Ye, set: (e) => {
  Qa(e, e === "dexie" ? () => !0 : hl);
} }, derive: On, extend: xe, props: wn, override: Wa, Events: Sr, on: bt, liveQuery: Oh, extendObservabilitySet: xl, getByKeyPath: it, setByKeyPath: Ke, delByKeyPath: sp, shallowClone: Ya, deepClone: wr, getObjectDiff: fs, cmp: je, asap: Ha, minKey: Eo, addons: [], connections: Xn, errnames: is, dependencies: Co, semVer: oa, version: oa.split(".").map((e) => parseInt(e)).reduce((e, t, n) => e + t / Math.pow(10, n * 2)) });
Pt.maxKey = cr(Pt.dependencies.IDBKeyRange);
typeof dispatchEvent < "u" && typeof addEventListener < "u" && (bt(lr, (e) => {
  if (!rt) {
    let t;
    Ri ? (t = document.createEvent("CustomEvent"), t.initCustomEvent(vt, !0, !0, e)) : t = new CustomEvent(vt, { detail: e }), rt = !0, dispatchEvent(t), rt = !1;
  }
}), addEventListener(vt, ({ detail: e }) => {
  rt || hi(e);
}));
function hi(e) {
  let t = rt;
  try {
    rt = !0, bt.storagemutated.fire(e);
  } finally {
    rt = t;
  }
}
var rt = !1;
if (typeof BroadcastChannel < "u") {
  let e = new BroadcastChannel(vt);
  typeof e.unref == "function" && e.unref(), bt(lr, (t) => {
    rt || e.postMessage(t);
  }), e.onmessage = (t) => {
    t.data && hi(t.data);
  };
} else if (typeof self < "u" && typeof navigator < "u") {
  bt(lr, (t) => {
    try {
      rt || (typeof localStorage < "u" && localStorage.setItem(vt, JSON.stringify({ trig: Math.random(), changedParts: t })), typeof self.clients == "object" && [...self.clients.matchAll({ includeUncontrolled: !0 })].forEach((n) => n.postMessage({ type: vt, changedParts: t })));
    } catch {
    }
  }), typeof addEventListener < "u" && addEventListener("storage", (t) => {
    if (t.key === vt) {
      let n = JSON.parse(t.newValue);
      n && hi(n.changedParts);
    }
  });
  let e = self.document && navigator.serviceWorker;
  e && e.addEventListener("message", Th);
}
function Th({ data: e }) {
  e && e.type === vt && hi(e.changedParts);
}
I.rejectionMapper = vp;
Qa(Ye, hl);
var di = function() {
  return di = Object.assign || function(e) {
    for (var t, n = 1, r = arguments.length; n < r; n++) {
      t = arguments[n];
      for (var i in t)
        Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
    }
    return e;
  }, di.apply(this, arguments);
};
function Gr(e) {
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? Gr = function(t) {
    return typeof t;
  } : Gr = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Gr(e);
}
function Nh(e) {
  return Gr(e) == "object" && e !== null;
}
var wl = typeof Symbol == "function" && Symbol.toStringTag != null ? Symbol.toStringTag : "@@toStringTag";
function Do(e, t) {
  for (var n = /\r\n|[\n\r]/g, r = 1, i = t + 1, o; (o = n.exec(e.body)) && o.index < t; )
    r += 1, i = t + 1 - (o.index + o[0].length);
  return { line: r, column: i };
}
function Ih(e) {
  return _l(e.source, Do(e.source, e.start));
}
function _l(e, t) {
  var n = e.locationOffset.column - 1, r = Yr(n) + e.body, i = t.line - 1, o = e.locationOffset.line - 1, s = t.line + o, a = t.line === 1 ? n : 0, l = t.column + a, c = "".concat(e.name, ":").concat(s, ":").concat(l, `
`), h = r.split(/\r\n|[\n\r]/g), u = h[i];
  if (u.length > 120) {
    for (var p = Math.floor(l / 80), d = l % 80, f = [], v = 0; v < u.length; v += 80)
      f.push(u.slice(v, v + 80));
    return c + da([["".concat(s), f[0]]].concat(f.slice(1, p + 1).map(function(m) {
      return ["", m];
    }), [[" ", Yr(d - 1) + "^"], ["", f[p + 1]]]));
  }
  return c + da([["".concat(s - 1), h[i - 1]], ["".concat(s), u], ["", Yr(l - 1) + "^"], ["".concat(s + 1), h[i + 1]]]);
}
function da(e) {
  var t = e.filter(function(r) {
    r[0];
    var i = r[1];
    return i !== void 0;
  }), n = Math.max.apply(Math, t.map(function(r) {
    var i = r[0];
    return i.length;
  }));
  return t.map(function(r) {
    var i = r[0], o = r[1];
    return Rh(n, i) + (o ? " | " + o : " |");
  }).join(`
`);
}
function Yr(e) {
  return Array(e + 1).join(" ");
}
function Rh(e, t) {
  return Yr(e - t.length) + t;
}
function Jr(e) {
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? Jr = function(t) {
    return typeof t;
  } : Jr = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Jr(e);
}
function fa(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t && (r = r.filter(function(i) {
      return Object.getOwnPropertyDescriptor(e, i).enumerable;
    })), n.push.apply(n, r);
  }
  return n;
}
function Ch(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = arguments[t] != null ? arguments[t] : {};
    t % 2 ? fa(Object(n), !0).forEach(function(r) {
      Dh(e, r, n[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : fa(Object(n)).forEach(function(r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
    });
  }
  return e;
}
function Dh(e, t, n) {
  return t in e ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = n, e;
}
function Ph(e, t) {
  if (!(e instanceof t))
    throw new TypeError("Cannot call a class as a function");
}
function va(e, t) {
  for (var n = 0; n < t.length; n++) {
    var r = t[n];
    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
  }
}
function Mh(e, t, n) {
  return t && va(e.prototype, t), n && va(e, n), e;
}
function $h(e, t) {
  if (typeof t != "function" && t !== null)
    throw new TypeError("Super expression must either be null or a function");
  e.prototype = Object.create(t && t.prototype, { constructor: { value: e, writable: !0, configurable: !0 } }), t && pr(e, t);
}
function zh(e) {
  var t = kl();
  return function() {
    var n = hr(e), r;
    if (t) {
      var i = hr(this).constructor;
      r = Reflect.construct(n, arguments, i);
    } else
      r = n.apply(this, arguments);
    return El(this, r);
  };
}
function El(e, t) {
  return t && (Jr(t) === "object" || typeof t == "function") ? t : Hn(e);
}
function Hn(e) {
  if (e === void 0)
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
function Po(e) {
  var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
  return Po = function(n) {
    if (n === null || !Lh(n))
      return n;
    if (typeof n != "function")
      throw new TypeError("Super expression must either be null or a function");
    if (typeof t < "u") {
      if (t.has(n))
        return t.get(n);
      t.set(n, r);
    }
    function r() {
      return Xr(n, arguments, hr(this).constructor);
    }
    return r.prototype = Object.create(n.prototype, { constructor: { value: r, enumerable: !1, writable: !0, configurable: !0 } }), pr(r, n);
  }, Po(e);
}
function Xr(e, t, n) {
  return kl() ? Xr = Reflect.construct : Xr = function(r, i, o) {
    var s = [null];
    s.push.apply(s, i);
    var a = Function.bind.apply(r, s), l = new a();
    return o && pr(l, o.prototype), l;
  }, Xr.apply(null, arguments);
}
function kl() {
  if (typeof Reflect > "u" || !Reflect.construct || Reflect.construct.sham)
    return !1;
  if (typeof Proxy == "function")
    return !0;
  try {
    return Date.prototype.toString.call(Reflect.construct(Date, [], function() {
    })), !0;
  } catch {
    return !1;
  }
}
function Lh(e) {
  return Function.toString.call(e).indexOf("[native code]") !== -1;
}
function pr(e, t) {
  return pr = Object.setPrototypeOf || function(n, r) {
    return n.__proto__ = r, n;
  }, pr(e, t);
}
function hr(e) {
  return hr = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, hr(e);
}
var Bh = function(e) {
  $h(n, e);
  var t = zh(n);
  function n(r, i, o, s, a, l, c) {
    var h, u, p, d;
    Ph(this, n), d = t.call(this, r), d.name = "GraphQLError", d.originalError = l ?? void 0, d.nodes = ma(Array.isArray(i) ? i : i ? [i] : void 0);
    for (var f = [], v = 0, m = (b = d.nodes) !== null && b !== void 0 ? b : []; v < m.length; v++) {
      var b, _ = m[v], j = _.loc;
      j != null && f.push(j);
    }
    f = ma(f), d.source = o ?? ((h = f) === null || h === void 0 ? void 0 : h[0].source), d.positions = s ?? ((u = f) === null || u === void 0 ? void 0 : u.map(function(E) {
      return E.start;
    })), d.locations = s && o ? s.map(function(E) {
      return Do(o, E);
    }) : (p = f) === null || p === void 0 ? void 0 : p.map(function(E) {
      return Do(E.source, E.start);
    }), d.path = a ?? void 0;
    var w = l == null ? void 0 : l.extensions;
    return c == null && Nh(w) ? d.extensions = Ch({}, w) : d.extensions = c ?? {}, Object.defineProperties(Hn(d), { message: { enumerable: !0 }, locations: { enumerable: d.locations != null }, path: { enumerable: d.path != null }, extensions: { enumerable: d.extensions != null && Object.keys(d.extensions).length > 0 }, name: { enumerable: !1 }, nodes: { enumerable: !1 }, source: { enumerable: !1 }, positions: { enumerable: !1 }, originalError: { enumerable: !1 } }), l != null && l.stack ? (Object.defineProperty(Hn(d), "stack", { value: l.stack, writable: !0, configurable: !0 }), El(d)) : (Error.captureStackTrace ? Error.captureStackTrace(Hn(d), n) : Object.defineProperty(Hn(d), "stack", { value: Error().stack, writable: !0, configurable: !0 }), d);
  }
  return Mh(n, [{ key: "toString", value: function() {
    return Fh(this);
  } }, { key: wl, get: function() {
    return "Object";
  } }]), n;
}(Po(Error));
function ma(e) {
  return e === void 0 || e.length === 0 ? void 0 : e;
}
function Fh(e) {
  var t = e.message;
  if (e.nodes)
    for (var n = 0, r = e.nodes; n < r.length; n++) {
      var i = r[n];
      i.loc && (t += `

` + Ih(i.loc));
    }
  else if (e.source && e.locations)
    for (var o = 0, s = e.locations; o < s.length; o++) {
      var a = s[o];
      t += `

` + _l(e.source, a);
    }
  return t;
}
function Oe(e, t, n) {
  return new Bh("Syntax Error: ".concat(n), void 0, e, [t]);
}
var L = Object.freeze({ NAME: "Name", DOCUMENT: "Document", OPERATION_DEFINITION: "OperationDefinition", VARIABLE_DEFINITION: "VariableDefinition", SELECTION_SET: "SelectionSet", FIELD: "Field", ARGUMENT: "Argument", FRAGMENT_SPREAD: "FragmentSpread", INLINE_FRAGMENT: "InlineFragment", FRAGMENT_DEFINITION: "FragmentDefinition", VARIABLE: "Variable", INT: "IntValue", FLOAT: "FloatValue", STRING: "StringValue", BOOLEAN: "BooleanValue", NULL: "NullValue", ENUM: "EnumValue", LIST: "ListValue", OBJECT: "ObjectValue", OBJECT_FIELD: "ObjectField", DIRECTIVE: "Directive", NAMED_TYPE: "NamedType", LIST_TYPE: "ListType", NON_NULL_TYPE: "NonNullType", SCHEMA_DEFINITION: "SchemaDefinition", OPERATION_TYPE_DEFINITION: "OperationTypeDefinition", SCALAR_TYPE_DEFINITION: "ScalarTypeDefinition", OBJECT_TYPE_DEFINITION: "ObjectTypeDefinition", FIELD_DEFINITION: "FieldDefinition", INPUT_VALUE_DEFINITION: "InputValueDefinition", INTERFACE_TYPE_DEFINITION: "InterfaceTypeDefinition", UNION_TYPE_DEFINITION: "UnionTypeDefinition", ENUM_TYPE_DEFINITION: "EnumTypeDefinition", ENUM_VALUE_DEFINITION: "EnumValueDefinition", INPUT_OBJECT_TYPE_DEFINITION: "InputObjectTypeDefinition", DIRECTIVE_DEFINITION: "DirectiveDefinition", SCHEMA_EXTENSION: "SchemaExtension", SCALAR_TYPE_EXTENSION: "ScalarTypeExtension", OBJECT_TYPE_EXTENSION: "ObjectTypeExtension", INTERFACE_TYPE_EXTENSION: "InterfaceTypeExtension", UNION_TYPE_EXTENSION: "UnionTypeExtension", ENUM_TYPE_EXTENSION: "EnumTypeExtension", INPUT_OBJECT_TYPE_EXTENSION: "InputObjectTypeExtension" });
function Kh(e, t) {
  var n = !!e;
  if (!n)
    throw new Error(t ?? "Unexpected invariant triggered.");
}
var Uh = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : void 0, Mo = Uh;
function Sl(e) {
  var t = e.prototype.toJSON;
  typeof t == "function" || Kh(0), e.prototype.inspect = t, Mo && (e.prototype[Mo] = t);
}
var Al = function() {
  function e(n, r, i) {
    this.start = n.start, this.end = r.end, this.startToken = n, this.endToken = r, this.source = i;
  }
  var t = e.prototype;
  return t.toJSON = function() {
    return { start: this.start, end: this.end };
  }, e;
}();
Sl(Al);
var re = function() {
  function e(n, r, i, o, s, a, l) {
    this.kind = n, this.start = r, this.end = i, this.line = o, this.column = s, this.value = l, this.prev = a, this.next = null;
  }
  var t = e.prototype;
  return t.toJSON = function() {
    return { kind: this.kind, value: this.value, line: this.line, column: this.column };
  }, e;
}();
Sl(re);
var x = Object.freeze({ SOF: "<SOF>", EOF: "<EOF>", BANG: "!", DOLLAR: "$", AMP: "&", PAREN_L: "(", PAREN_R: ")", SPREAD: "...", COLON: ":", EQUALS: "=", AT: "@", BRACKET_L: "[", BRACKET_R: "]", BRACE_L: "{", PIPE: "|", BRACE_R: "}", NAME: "Name", INT: "Int", FLOAT: "Float", STRING: "String", BLOCK_STRING: "BlockString", COMMENT: "Comment" });
function Qr(e) {
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? Qr = function(t) {
    return typeof t;
  } : Qr = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, Qr(e);
}
var qh = 10, Ol = 2;
function Vh(e) {
  return Di(e, []);
}
function Di(e, t) {
  switch (Qr(e)) {
    case "string":
      return JSON.stringify(e);
    case "function":
      return e.name ? "[function ".concat(e.name, "]") : "[function]";
    case "object":
      return e === null ? "null" : Wh(e, t);
    default:
      return String(e);
  }
}
function Wh(e, t) {
  if (t.indexOf(e) !== -1)
    return "[Circular]";
  var n = [].concat(t, [e]), r = Yh(e);
  if (r !== void 0) {
    var i = r.call(e);
    if (i !== e)
      return typeof i == "string" ? i : Di(i, n);
  } else if (Array.isArray(e))
    return Gh(e, n);
  return Hh(e, n);
}
function Hh(e, t) {
  var n = Object.keys(e);
  if (n.length === 0)
    return "{}";
  if (t.length > Ol)
    return "[" + Jh(e) + "]";
  var r = n.map(function(i) {
    var o = Di(e[i], t);
    return i + ": " + o;
  });
  return "{ " + r.join(", ") + " }";
}
function Gh(e, t) {
  if (e.length === 0)
    return "[]";
  if (t.length > Ol)
    return "[Array]";
  for (var n = Math.min(qh, e.length), r = e.length - n, i = [], o = 0; o < n; ++o)
    i.push(Di(e[o], t));
  return r === 1 ? i.push("... 1 more item") : r > 1 && i.push("... ".concat(r, " more items")), "[" + i.join(", ") + "]";
}
function Yh(e) {
  var t = e[String(Mo)];
  if (typeof t == "function")
    return t;
  if (typeof e.inspect == "function")
    return e.inspect;
}
function Jh(e) {
  var t = Object.prototype.toString.call(e).replace(/^\[object /, "").replace(/]$/, "");
  if (t === "Object" && typeof e.constructor == "function") {
    var n = e.constructor.name;
    if (typeof n == "string" && n !== "")
      return n;
  }
  return t;
}
function Zi(e, t) {
  var n = !!e;
  if (!n)
    throw new Error(t);
}
var Xh = function(e, t) {
  return e instanceof t;
};
function ga(e, t) {
  for (var n = 0; n < t.length; n++) {
    var r = t[n];
    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
  }
}
function Qh(e, t, n) {
  return t && ga(e.prototype, t), n && ga(e, n), e;
}
var Tl = function() {
  function e(t) {
    var n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "GraphQL request", r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : { line: 1, column: 1 };
    typeof t == "string" || Zi(0, "Body must be a string. Received: ".concat(Vh(t), ".")), this.body = t, this.name = n, this.locationOffset = r, this.locationOffset.line > 0 || Zi(0, "line in locationOffset is 1-indexed and must be positive."), this.locationOffset.column > 0 || Zi(0, "column in locationOffset is 1-indexed and must be positive.");
  }
  return Qh(e, [{ key: wl, get: function() {
    return "Source";
  } }]), e;
}();
function Zh(e) {
  return Xh(e, Tl);
}
var ed = Object.freeze({ QUERY: "QUERY", MUTATION: "MUTATION", SUBSCRIPTION: "SUBSCRIPTION", FIELD: "FIELD", FRAGMENT_DEFINITION: "FRAGMENT_DEFINITION", FRAGMENT_SPREAD: "FRAGMENT_SPREAD", INLINE_FRAGMENT: "INLINE_FRAGMENT", VARIABLE_DEFINITION: "VARIABLE_DEFINITION", SCHEMA: "SCHEMA", SCALAR: "SCALAR", OBJECT: "OBJECT", FIELD_DEFINITION: "FIELD_DEFINITION", ARGUMENT_DEFINITION: "ARGUMENT_DEFINITION", INTERFACE: "INTERFACE", UNION: "UNION", ENUM: "ENUM", ENUM_VALUE: "ENUM_VALUE", INPUT_OBJECT: "INPUT_OBJECT", INPUT_FIELD_DEFINITION: "INPUT_FIELD_DEFINITION" });
function td(e) {
  var t = e.split(/\r\n|[\n\r]/g), n = nd(e);
  if (n !== 0)
    for (var r = 1; r < t.length; r++)
      t[r] = t[r].slice(n);
  for (var i = 0; i < t.length && ya(t[i]); )
    ++i;
  for (var o = t.length; o > i && ya(t[o - 1]); )
    --o;
  return t.slice(i, o).join(`
`);
}
function ya(e) {
  for (var t = 0; t < e.length; ++t)
    if (e[t] !== " " && e[t] !== "	")
      return !1;
  return !0;
}
function nd(e) {
  for (var t, n = !0, r = !0, i = 0, o = null, s = 0; s < e.length; ++s)
    switch (e.charCodeAt(s)) {
      case 13:
        e.charCodeAt(s + 1) === 10 && ++s;
      case 10:
        n = !1, r = !0, i = 0;
        break;
      case 9:
      case 32:
        ++i;
        break;
      default:
        r && !n && (o === null || i < o) && (o = i), r = !1;
    }
  return (t = o) !== null && t !== void 0 ? t : 0;
}
var rd = function() {
  function e(n) {
    var r = new re(x.SOF, 0, 0, 0, 0, null);
    this.source = n, this.lastToken = r, this.token = r, this.line = 1, this.lineStart = 0;
  }
  var t = e.prototype;
  return t.advance = function() {
    this.lastToken = this.token;
    var n = this.token = this.lookahead();
    return n;
  }, t.lookahead = function() {
    var n = this.token;
    if (n.kind !== x.EOF)
      do {
        var r;
        n = (r = n.next) !== null && r !== void 0 ? r : n.next = od(this, n);
      } while (n.kind === x.COMMENT);
    return n;
  }, e;
}();
function id(e) {
  return e === x.BANG || e === x.DOLLAR || e === x.AMP || e === x.PAREN_L || e === x.PAREN_R || e === x.SPREAD || e === x.COLON || e === x.EQUALS || e === x.AT || e === x.BRACKET_L || e === x.BRACKET_R || e === x.BRACE_L || e === x.PIPE || e === x.BRACE_R;
}
function qt(e) {
  return isNaN(e) ? x.EOF : e < 127 ? JSON.stringify(String.fromCharCode(e)) : '"\\u'.concat(("00" + e.toString(16).toUpperCase()).slice(-4), '"');
}
function od(e, t) {
  for (var n = e.source, r = n.body, i = r.length, o = t.end; o < i; ) {
    var s = r.charCodeAt(o), a = e.line, l = 1 + o - e.lineStart;
    switch (s) {
      case 65279:
      case 9:
      case 32:
      case 44:
        ++o;
        continue;
      case 10:
        ++o, ++e.line, e.lineStart = o;
        continue;
      case 13:
        r.charCodeAt(o + 1) === 10 ? o += 2 : ++o, ++e.line, e.lineStart = o;
        continue;
      case 33:
        return new re(x.BANG, o, o + 1, a, l, t);
      case 35:
        return ad(n, o, a, l, t);
      case 36:
        return new re(x.DOLLAR, o, o + 1, a, l, t);
      case 38:
        return new re(x.AMP, o, o + 1, a, l, t);
      case 40:
        return new re(x.PAREN_L, o, o + 1, a, l, t);
      case 41:
        return new re(x.PAREN_R, o, o + 1, a, l, t);
      case 46:
        if (r.charCodeAt(o + 1) === 46 && r.charCodeAt(o + 2) === 46)
          return new re(x.SPREAD, o, o + 3, a, l, t);
        break;
      case 58:
        return new re(x.COLON, o, o + 1, a, l, t);
      case 61:
        return new re(x.EQUALS, o, o + 1, a, l, t);
      case 64:
        return new re(x.AT, o, o + 1, a, l, t);
      case 91:
        return new re(x.BRACKET_L, o, o + 1, a, l, t);
      case 93:
        return new re(x.BRACKET_R, o, o + 1, a, l, t);
      case 123:
        return new re(x.BRACE_L, o, o + 1, a, l, t);
      case 124:
        return new re(x.PIPE, o, o + 1, a, l, t);
      case 125:
        return new re(x.BRACE_R, o, o + 1, a, l, t);
      case 34:
        return r.charCodeAt(o + 1) === 34 && r.charCodeAt(o + 2) === 34 ? ud(n, o, a, l, t, e) : cd(n, o, a, l, t);
      case 45:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return ld(n, o, s, a, l, t);
      case 65:
      case 66:
      case 67:
      case 68:
      case 69:
      case 70:
      case 71:
      case 72:
      case 73:
      case 74:
      case 75:
      case 76:
      case 77:
      case 78:
      case 79:
      case 80:
      case 81:
      case 82:
      case 83:
      case 84:
      case 85:
      case 86:
      case 87:
      case 88:
      case 89:
      case 90:
      case 95:
      case 97:
      case 98:
      case 99:
      case 100:
      case 101:
      case 102:
      case 103:
      case 104:
      case 105:
      case 106:
      case 107:
      case 108:
      case 109:
      case 110:
      case 111:
      case 112:
      case 113:
      case 114:
      case 115:
      case 116:
      case 117:
      case 118:
      case 119:
      case 120:
      case 121:
      case 122:
        return hd(n, o, a, l, t);
    }
    throw Oe(n, o, sd(s));
  }
  var c = e.line, h = 1 + o - e.lineStart;
  return new re(x.EOF, i, i, c, h, t);
}
function sd(e) {
  return e < 32 && e !== 9 && e !== 10 && e !== 13 ? "Cannot contain the invalid character ".concat(qt(e), ".") : e === 39 ? `Unexpected single quote character ('), did you mean to use a double quote (")?` : "Cannot parse the unexpected character ".concat(qt(e), ".");
}
function ad(e, t, n, r, i) {
  var o = e.body, s, a = t;
  do
    s = o.charCodeAt(++a);
  while (!isNaN(s) && (s > 31 || s === 9));
  return new re(x.COMMENT, t, a, n, r, i, o.slice(t + 1, a));
}
function ld(e, t, n, r, i, o) {
  var s = e.body, a = n, l = t, c = !1;
  if (a === 45 && (a = s.charCodeAt(++l)), a === 48) {
    if (a = s.charCodeAt(++l), a >= 48 && a <= 57)
      throw Oe(e, l, "Invalid number, unexpected digit after 0: ".concat(qt(a), "."));
  } else
    l = eo(e, l, a), a = s.charCodeAt(l);
  if (a === 46 && (c = !0, a = s.charCodeAt(++l), l = eo(e, l, a), a = s.charCodeAt(l)), (a === 69 || a === 101) && (c = !0, a = s.charCodeAt(++l), (a === 43 || a === 45) && (a = s.charCodeAt(++l)), l = eo(e, l, a), a = s.charCodeAt(l)), a === 46 || dd(a))
    throw Oe(e, l, "Invalid number, expected digit but got: ".concat(qt(a), "."));
  return new re(c ? x.FLOAT : x.INT, t, l, r, i, o, s.slice(t, l));
}
function eo(e, t, n) {
  var r = e.body, i = t, o = n;
  if (o >= 48 && o <= 57) {
    do
      o = r.charCodeAt(++i);
    while (o >= 48 && o <= 57);
    return i;
  }
  throw Oe(e, i, "Invalid number, expected digit but got: ".concat(qt(o), "."));
}
function cd(e, t, n, r, i) {
  for (var o = e.body, s = t + 1, a = s, l = 0, c = ""; s < o.length && !isNaN(l = o.charCodeAt(s)) && l !== 10 && l !== 13; ) {
    if (l === 34)
      return c += o.slice(a, s), new re(x.STRING, t, s + 1, n, r, i, c);
    if (l < 32 && l !== 9)
      throw Oe(e, s, "Invalid character within String: ".concat(qt(l), "."));
    if (++s, l === 92) {
      switch (c += o.slice(a, s - 1), l = o.charCodeAt(s), l) {
        case 34:
          c += '"';
          break;
        case 47:
          c += "/";
          break;
        case 92:
          c += "\\";
          break;
        case 98:
          c += "\b";
          break;
        case 102:
          c += "\f";
          break;
        case 110:
          c += `
`;
          break;
        case 114:
          c += "\r";
          break;
        case 116:
          c += "	";
          break;
        case 117: {
          var h = pd(o.charCodeAt(s + 1), o.charCodeAt(s + 2), o.charCodeAt(s + 3), o.charCodeAt(s + 4));
          if (h < 0) {
            var u = o.slice(s + 1, s + 5);
            throw Oe(e, s, "Invalid character escape sequence: \\u".concat(u, "."));
          }
          c += String.fromCharCode(h), s += 4;
          break;
        }
        default:
          throw Oe(e, s, "Invalid character escape sequence: \\".concat(String.fromCharCode(l), "."));
      }
      ++s, a = s;
    }
  }
  throw Oe(e, s, "Unterminated string.");
}
function ud(e, t, n, r, i, o) {
  for (var s = e.body, a = t + 3, l = a, c = 0, h = ""; a < s.length && !isNaN(c = s.charCodeAt(a)); ) {
    if (c === 34 && s.charCodeAt(a + 1) === 34 && s.charCodeAt(a + 2) === 34)
      return h += s.slice(l, a), new re(x.BLOCK_STRING, t, a + 3, n, r, i, td(h));
    if (c < 32 && c !== 9 && c !== 10 && c !== 13)
      throw Oe(e, a, "Invalid character within String: ".concat(qt(c), "."));
    c === 10 ? (++a, ++o.line, o.lineStart = a) : c === 13 ? (s.charCodeAt(a + 1) === 10 ? a += 2 : ++a, ++o.line, o.lineStart = a) : c === 92 && s.charCodeAt(a + 1) === 34 && s.charCodeAt(a + 2) === 34 && s.charCodeAt(a + 3) === 34 ? (h += s.slice(l, a) + '"""', a += 4, l = a) : ++a;
  }
  throw Oe(e, a, "Unterminated string.");
}
function pd(e, t, n, r) {
  return zr(e) << 12 | zr(t) << 8 | zr(n) << 4 | zr(r);
}
function zr(e) {
  return e >= 48 && e <= 57 ? e - 48 : e >= 65 && e <= 70 ? e - 55 : e >= 97 && e <= 102 ? e - 87 : -1;
}
function hd(e, t, n, r, i) {
  for (var o = e.body, s = o.length, a = t + 1, l = 0; a !== s && !isNaN(l = o.charCodeAt(a)) && (l === 95 || l >= 48 && l <= 57 || l >= 65 && l <= 90 || l >= 97 && l <= 122); )
    ++a;
  return new re(x.NAME, t, a, n, r, i, o.slice(t, a));
}
function dd(e) {
  return e === 95 || e >= 65 && e <= 90 || e >= 97 && e <= 122;
}
function fd(e, t) {
  var n = new vd(e, t);
  return n.parseDocument();
}
var vd = function() {
  function e(n, r) {
    var i = Zh(n) ? n : new Tl(n);
    this._lexer = new rd(i), this._options = r;
  }
  var t = e.prototype;
  return t.parseName = function() {
    var n = this.expectToken(x.NAME);
    return { kind: L.NAME, value: n.value, loc: this.loc(n) };
  }, t.parseDocument = function() {
    var n = this._lexer.token;
    return { kind: L.DOCUMENT, definitions: this.many(x.SOF, this.parseDefinition, x.EOF), loc: this.loc(n) };
  }, t.parseDefinition = function() {
    if (this.peek(x.NAME))
      switch (this._lexer.token.value) {
        case "query":
        case "mutation":
        case "subscription":
          return this.parseOperationDefinition();
        case "fragment":
          return this.parseFragmentDefinition();
        case "schema":
        case "scalar":
        case "type":
        case "interface":
        case "union":
        case "enum":
        case "input":
        case "directive":
          return this.parseTypeSystemDefinition();
        case "extend":
          return this.parseTypeSystemExtension();
      }
    else {
      if (this.peek(x.BRACE_L))
        return this.parseOperationDefinition();
      if (this.peekDescription())
        return this.parseTypeSystemDefinition();
    }
    throw this.unexpected();
  }, t.parseOperationDefinition = function() {
    var n = this._lexer.token;
    if (this.peek(x.BRACE_L))
      return { kind: L.OPERATION_DEFINITION, operation: "query", name: void 0, variableDefinitions: [], directives: [], selectionSet: this.parseSelectionSet(), loc: this.loc(n) };
    var r = this.parseOperationType(), i;
    return this.peek(x.NAME) && (i = this.parseName()), { kind: L.OPERATION_DEFINITION, operation: r, name: i, variableDefinitions: this.parseVariableDefinitions(), directives: this.parseDirectives(!1), selectionSet: this.parseSelectionSet(), loc: this.loc(n) };
  }, t.parseOperationType = function() {
    var n = this.expectToken(x.NAME);
    switch (n.value) {
      case "query":
        return "query";
      case "mutation":
        return "mutation";
      case "subscription":
        return "subscription";
    }
    throw this.unexpected(n);
  }, t.parseVariableDefinitions = function() {
    return this.optionalMany(x.PAREN_L, this.parseVariableDefinition, x.PAREN_R);
  }, t.parseVariableDefinition = function() {
    var n = this._lexer.token;
    return { kind: L.VARIABLE_DEFINITION, variable: this.parseVariable(), type: (this.expectToken(x.COLON), this.parseTypeReference()), defaultValue: this.expectOptionalToken(x.EQUALS) ? this.parseValueLiteral(!0) : void 0, directives: this.parseDirectives(!0), loc: this.loc(n) };
  }, t.parseVariable = function() {
    var n = this._lexer.token;
    return this.expectToken(x.DOLLAR), { kind: L.VARIABLE, name: this.parseName(), loc: this.loc(n) };
  }, t.parseSelectionSet = function() {
    var n = this._lexer.token;
    return { kind: L.SELECTION_SET, selections: this.many(x.BRACE_L, this.parseSelection, x.BRACE_R), loc: this.loc(n) };
  }, t.parseSelection = function() {
    return this.peek(x.SPREAD) ? this.parseFragment() : this.parseField();
  }, t.parseField = function() {
    var n = this._lexer.token, r = this.parseName(), i, o;
    return this.expectOptionalToken(x.COLON) ? (i = r, o = this.parseName()) : o = r, { kind: L.FIELD, alias: i, name: o, arguments: this.parseArguments(!1), directives: this.parseDirectives(!1), selectionSet: this.peek(x.BRACE_L) ? this.parseSelectionSet() : void 0, loc: this.loc(n) };
  }, t.parseArguments = function(n) {
    var r = n ? this.parseConstArgument : this.parseArgument;
    return this.optionalMany(x.PAREN_L, r, x.PAREN_R);
  }, t.parseArgument = function() {
    var n = this._lexer.token, r = this.parseName();
    return this.expectToken(x.COLON), { kind: L.ARGUMENT, name: r, value: this.parseValueLiteral(!1), loc: this.loc(n) };
  }, t.parseConstArgument = function() {
    var n = this._lexer.token;
    return { kind: L.ARGUMENT, name: this.parseName(), value: (this.expectToken(x.COLON), this.parseValueLiteral(!0)), loc: this.loc(n) };
  }, t.parseFragment = function() {
    var n = this._lexer.token;
    this.expectToken(x.SPREAD);
    var r = this.expectOptionalKeyword("on");
    return !r && this.peek(x.NAME) ? { kind: L.FRAGMENT_SPREAD, name: this.parseFragmentName(), directives: this.parseDirectives(!1), loc: this.loc(n) } : { kind: L.INLINE_FRAGMENT, typeCondition: r ? this.parseNamedType() : void 0, directives: this.parseDirectives(!1), selectionSet: this.parseSelectionSet(), loc: this.loc(n) };
  }, t.parseFragmentDefinition = function() {
    var n, r = this._lexer.token;
    return this.expectKeyword("fragment"), ((n = this._options) === null || n === void 0 ? void 0 : n.experimentalFragmentVariables) === !0 ? { kind: L.FRAGMENT_DEFINITION, name: this.parseFragmentName(), variableDefinitions: this.parseVariableDefinitions(), typeCondition: (this.expectKeyword("on"), this.parseNamedType()), directives: this.parseDirectives(!1), selectionSet: this.parseSelectionSet(), loc: this.loc(r) } : { kind: L.FRAGMENT_DEFINITION, name: this.parseFragmentName(), typeCondition: (this.expectKeyword("on"), this.parseNamedType()), directives: this.parseDirectives(!1), selectionSet: this.parseSelectionSet(), loc: this.loc(r) };
  }, t.parseFragmentName = function() {
    if (this._lexer.token.value === "on")
      throw this.unexpected();
    return this.parseName();
  }, t.parseValueLiteral = function(n) {
    var r = this._lexer.token;
    switch (r.kind) {
      case x.BRACKET_L:
        return this.parseList(n);
      case x.BRACE_L:
        return this.parseObject(n);
      case x.INT:
        return this._lexer.advance(), { kind: L.INT, value: r.value, loc: this.loc(r) };
      case x.FLOAT:
        return this._lexer.advance(), { kind: L.FLOAT, value: r.value, loc: this.loc(r) };
      case x.STRING:
      case x.BLOCK_STRING:
        return this.parseStringLiteral();
      case x.NAME:
        switch (this._lexer.advance(), r.value) {
          case "true":
            return { kind: L.BOOLEAN, value: !0, loc: this.loc(r) };
          case "false":
            return { kind: L.BOOLEAN, value: !1, loc: this.loc(r) };
          case "null":
            return { kind: L.NULL, loc: this.loc(r) };
          default:
            return { kind: L.ENUM, value: r.value, loc: this.loc(r) };
        }
      case x.DOLLAR:
        if (!n)
          return this.parseVariable();
        break;
    }
    throw this.unexpected();
  }, t.parseStringLiteral = function() {
    var n = this._lexer.token;
    return this._lexer.advance(), { kind: L.STRING, value: n.value, block: n.kind === x.BLOCK_STRING, loc: this.loc(n) };
  }, t.parseList = function(n) {
    var r = this, i = this._lexer.token, o = function() {
      return r.parseValueLiteral(n);
    };
    return { kind: L.LIST, values: this.any(x.BRACKET_L, o, x.BRACKET_R), loc: this.loc(i) };
  }, t.parseObject = function(n) {
    var r = this, i = this._lexer.token, o = function() {
      return r.parseObjectField(n);
    };
    return { kind: L.OBJECT, fields: this.any(x.BRACE_L, o, x.BRACE_R), loc: this.loc(i) };
  }, t.parseObjectField = function(n) {
    var r = this._lexer.token, i = this.parseName();
    return this.expectToken(x.COLON), { kind: L.OBJECT_FIELD, name: i, value: this.parseValueLiteral(n), loc: this.loc(r) };
  }, t.parseDirectives = function(n) {
    for (var r = []; this.peek(x.AT); )
      r.push(this.parseDirective(n));
    return r;
  }, t.parseDirective = function(n) {
    var r = this._lexer.token;
    return this.expectToken(x.AT), { kind: L.DIRECTIVE, name: this.parseName(), arguments: this.parseArguments(n), loc: this.loc(r) };
  }, t.parseTypeReference = function() {
    var n = this._lexer.token, r;
    return this.expectOptionalToken(x.BRACKET_L) ? (r = this.parseTypeReference(), this.expectToken(x.BRACKET_R), r = { kind: L.LIST_TYPE, type: r, loc: this.loc(n) }) : r = this.parseNamedType(), this.expectOptionalToken(x.BANG) ? { kind: L.NON_NULL_TYPE, type: r, loc: this.loc(n) } : r;
  }, t.parseNamedType = function() {
    var n = this._lexer.token;
    return { kind: L.NAMED_TYPE, name: this.parseName(), loc: this.loc(n) };
  }, t.parseTypeSystemDefinition = function() {
    var n = this.peekDescription() ? this._lexer.lookahead() : this._lexer.token;
    if (n.kind === x.NAME)
      switch (n.value) {
        case "schema":
          return this.parseSchemaDefinition();
        case "scalar":
          return this.parseScalarTypeDefinition();
        case "type":
          return this.parseObjectTypeDefinition();
        case "interface":
          return this.parseInterfaceTypeDefinition();
        case "union":
          return this.parseUnionTypeDefinition();
        case "enum":
          return this.parseEnumTypeDefinition();
        case "input":
          return this.parseInputObjectTypeDefinition();
        case "directive":
          return this.parseDirectiveDefinition();
      }
    throw this.unexpected(n);
  }, t.peekDescription = function() {
    return this.peek(x.STRING) || this.peek(x.BLOCK_STRING);
  }, t.parseDescription = function() {
    if (this.peekDescription())
      return this.parseStringLiteral();
  }, t.parseSchemaDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("schema");
    var i = this.parseDirectives(!0), o = this.many(x.BRACE_L, this.parseOperationTypeDefinition, x.BRACE_R);
    return { kind: L.SCHEMA_DEFINITION, description: r, directives: i, operationTypes: o, loc: this.loc(n) };
  }, t.parseOperationTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseOperationType();
    this.expectToken(x.COLON);
    var i = this.parseNamedType();
    return { kind: L.OPERATION_TYPE_DEFINITION, operation: r, type: i, loc: this.loc(n) };
  }, t.parseScalarTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("scalar");
    var i = this.parseName(), o = this.parseDirectives(!0);
    return { kind: L.SCALAR_TYPE_DEFINITION, description: r, name: i, directives: o, loc: this.loc(n) };
  }, t.parseObjectTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("type");
    var i = this.parseName(), o = this.parseImplementsInterfaces(), s = this.parseDirectives(!0), a = this.parseFieldsDefinition();
    return { kind: L.OBJECT_TYPE_DEFINITION, description: r, name: i, interfaces: o, directives: s, fields: a, loc: this.loc(n) };
  }, t.parseImplementsInterfaces = function() {
    var n;
    if (!this.expectOptionalKeyword("implements"))
      return [];
    if (((n = this._options) === null || n === void 0 ? void 0 : n.allowLegacySDLImplementsInterfaces) === !0) {
      var r = [];
      this.expectOptionalToken(x.AMP);
      do
        r.push(this.parseNamedType());
      while (this.expectOptionalToken(x.AMP) || this.peek(x.NAME));
      return r;
    }
    return this.delimitedMany(x.AMP, this.parseNamedType);
  }, t.parseFieldsDefinition = function() {
    var n;
    return ((n = this._options) === null || n === void 0 ? void 0 : n.allowLegacySDLEmptyFields) === !0 && this.peek(x.BRACE_L) && this._lexer.lookahead().kind === x.BRACE_R ? (this._lexer.advance(), this._lexer.advance(), []) : this.optionalMany(x.BRACE_L, this.parseFieldDefinition, x.BRACE_R);
  }, t.parseFieldDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription(), i = this.parseName(), o = this.parseArgumentDefs();
    this.expectToken(x.COLON);
    var s = this.parseTypeReference(), a = this.parseDirectives(!0);
    return { kind: L.FIELD_DEFINITION, description: r, name: i, arguments: o, type: s, directives: a, loc: this.loc(n) };
  }, t.parseArgumentDefs = function() {
    return this.optionalMany(x.PAREN_L, this.parseInputValueDef, x.PAREN_R);
  }, t.parseInputValueDef = function() {
    var n = this._lexer.token, r = this.parseDescription(), i = this.parseName();
    this.expectToken(x.COLON);
    var o = this.parseTypeReference(), s;
    this.expectOptionalToken(x.EQUALS) && (s = this.parseValueLiteral(!0));
    var a = this.parseDirectives(!0);
    return { kind: L.INPUT_VALUE_DEFINITION, description: r, name: i, type: o, defaultValue: s, directives: a, loc: this.loc(n) };
  }, t.parseInterfaceTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("interface");
    var i = this.parseName(), o = this.parseImplementsInterfaces(), s = this.parseDirectives(!0), a = this.parseFieldsDefinition();
    return { kind: L.INTERFACE_TYPE_DEFINITION, description: r, name: i, interfaces: o, directives: s, fields: a, loc: this.loc(n) };
  }, t.parseUnionTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("union");
    var i = this.parseName(), o = this.parseDirectives(!0), s = this.parseUnionMemberTypes();
    return { kind: L.UNION_TYPE_DEFINITION, description: r, name: i, directives: o, types: s, loc: this.loc(n) };
  }, t.parseUnionMemberTypes = function() {
    return this.expectOptionalToken(x.EQUALS) ? this.delimitedMany(x.PIPE, this.parseNamedType) : [];
  }, t.parseEnumTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("enum");
    var i = this.parseName(), o = this.parseDirectives(!0), s = this.parseEnumValuesDefinition();
    return { kind: L.ENUM_TYPE_DEFINITION, description: r, name: i, directives: o, values: s, loc: this.loc(n) };
  }, t.parseEnumValuesDefinition = function() {
    return this.optionalMany(x.BRACE_L, this.parseEnumValueDefinition, x.BRACE_R);
  }, t.parseEnumValueDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription(), i = this.parseName(), o = this.parseDirectives(!0);
    return { kind: L.ENUM_VALUE_DEFINITION, description: r, name: i, directives: o, loc: this.loc(n) };
  }, t.parseInputObjectTypeDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("input");
    var i = this.parseName(), o = this.parseDirectives(!0), s = this.parseInputFieldsDefinition();
    return { kind: L.INPUT_OBJECT_TYPE_DEFINITION, description: r, name: i, directives: o, fields: s, loc: this.loc(n) };
  }, t.parseInputFieldsDefinition = function() {
    return this.optionalMany(x.BRACE_L, this.parseInputValueDef, x.BRACE_R);
  }, t.parseTypeSystemExtension = function() {
    var n = this._lexer.lookahead();
    if (n.kind === x.NAME)
      switch (n.value) {
        case "schema":
          return this.parseSchemaExtension();
        case "scalar":
          return this.parseScalarTypeExtension();
        case "type":
          return this.parseObjectTypeExtension();
        case "interface":
          return this.parseInterfaceTypeExtension();
        case "union":
          return this.parseUnionTypeExtension();
        case "enum":
          return this.parseEnumTypeExtension();
        case "input":
          return this.parseInputObjectTypeExtension();
      }
    throw this.unexpected(n);
  }, t.parseSchemaExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("schema");
    var r = this.parseDirectives(!0), i = this.optionalMany(x.BRACE_L, this.parseOperationTypeDefinition, x.BRACE_R);
    if (r.length === 0 && i.length === 0)
      throw this.unexpected();
    return { kind: L.SCHEMA_EXTENSION, directives: r, operationTypes: i, loc: this.loc(n) };
  }, t.parseScalarTypeExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("scalar");
    var r = this.parseName(), i = this.parseDirectives(!0);
    if (i.length === 0)
      throw this.unexpected();
    return { kind: L.SCALAR_TYPE_EXTENSION, name: r, directives: i, loc: this.loc(n) };
  }, t.parseObjectTypeExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("type");
    var r = this.parseName(), i = this.parseImplementsInterfaces(), o = this.parseDirectives(!0), s = this.parseFieldsDefinition();
    if (i.length === 0 && o.length === 0 && s.length === 0)
      throw this.unexpected();
    return { kind: L.OBJECT_TYPE_EXTENSION, name: r, interfaces: i, directives: o, fields: s, loc: this.loc(n) };
  }, t.parseInterfaceTypeExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("interface");
    var r = this.parseName(), i = this.parseImplementsInterfaces(), o = this.parseDirectives(!0), s = this.parseFieldsDefinition();
    if (i.length === 0 && o.length === 0 && s.length === 0)
      throw this.unexpected();
    return { kind: L.INTERFACE_TYPE_EXTENSION, name: r, interfaces: i, directives: o, fields: s, loc: this.loc(n) };
  }, t.parseUnionTypeExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("union");
    var r = this.parseName(), i = this.parseDirectives(!0), o = this.parseUnionMemberTypes();
    if (i.length === 0 && o.length === 0)
      throw this.unexpected();
    return { kind: L.UNION_TYPE_EXTENSION, name: r, directives: i, types: o, loc: this.loc(n) };
  }, t.parseEnumTypeExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("enum");
    var r = this.parseName(), i = this.parseDirectives(!0), o = this.parseEnumValuesDefinition();
    if (i.length === 0 && o.length === 0)
      throw this.unexpected();
    return { kind: L.ENUM_TYPE_EXTENSION, name: r, directives: i, values: o, loc: this.loc(n) };
  }, t.parseInputObjectTypeExtension = function() {
    var n = this._lexer.token;
    this.expectKeyword("extend"), this.expectKeyword("input");
    var r = this.parseName(), i = this.parseDirectives(!0), o = this.parseInputFieldsDefinition();
    if (i.length === 0 && o.length === 0)
      throw this.unexpected();
    return { kind: L.INPUT_OBJECT_TYPE_EXTENSION, name: r, directives: i, fields: o, loc: this.loc(n) };
  }, t.parseDirectiveDefinition = function() {
    var n = this._lexer.token, r = this.parseDescription();
    this.expectKeyword("directive"), this.expectToken(x.AT);
    var i = this.parseName(), o = this.parseArgumentDefs(), s = this.expectOptionalKeyword("repeatable");
    this.expectKeyword("on");
    var a = this.parseDirectiveLocations();
    return { kind: L.DIRECTIVE_DEFINITION, description: r, name: i, arguments: o, repeatable: s, locations: a, loc: this.loc(n) };
  }, t.parseDirectiveLocations = function() {
    return this.delimitedMany(x.PIPE, this.parseDirectiveLocation);
  }, t.parseDirectiveLocation = function() {
    var n = this._lexer.token, r = this.parseName();
    if (ed[r.value] !== void 0)
      return r;
    throw this.unexpected(n);
  }, t.loc = function(n) {
    var r;
    if (((r = this._options) === null || r === void 0 ? void 0 : r.noLocation) !== !0)
      return new Al(n, this._lexer.lastToken, this._lexer.source);
  }, t.peek = function(n) {
    return this._lexer.token.kind === n;
  }, t.expectToken = function(n) {
    var r = this._lexer.token;
    if (r.kind === n)
      return this._lexer.advance(), r;
    throw Oe(this._lexer.source, r.start, "Expected ".concat(Nl(n), ", found ").concat(to(r), "."));
  }, t.expectOptionalToken = function(n) {
    var r = this._lexer.token;
    if (r.kind === n)
      return this._lexer.advance(), r;
  }, t.expectKeyword = function(n) {
    var r = this._lexer.token;
    if (r.kind === x.NAME && r.value === n)
      this._lexer.advance();
    else
      throw Oe(this._lexer.source, r.start, 'Expected "'.concat(n, '", found ').concat(to(r), "."));
  }, t.expectOptionalKeyword = function(n) {
    var r = this._lexer.token;
    return r.kind === x.NAME && r.value === n ? (this._lexer.advance(), !0) : !1;
  }, t.unexpected = function(n) {
    var r = n ?? this._lexer.token;
    return Oe(this._lexer.source, r.start, "Unexpected ".concat(to(r), "."));
  }, t.any = function(n, r, i) {
    this.expectToken(n);
    for (var o = []; !this.expectOptionalToken(i); )
      o.push(r.call(this));
    return o;
  }, t.optionalMany = function(n, r, i) {
    if (this.expectOptionalToken(n)) {
      var o = [];
      do
        o.push(r.call(this));
      while (!this.expectOptionalToken(i));
      return o;
    }
    return [];
  }, t.many = function(n, r, i) {
    this.expectToken(n);
    var o = [];
    do
      o.push(r.call(this));
    while (!this.expectOptionalToken(i));
    return o;
  }, t.delimitedMany = function(n, r) {
    this.expectOptionalToken(n);
    var i = [];
    do
      i.push(r.call(this));
    while (this.expectOptionalToken(n));
    return i;
  }, e;
}();
function to(e) {
  var t = e.value;
  return Nl(e.kind) + (t != null ? ' "'.concat(t, '"') : "");
}
function Nl(e) {
  return id(e) ? '"'.concat(e, '"') : e;
}
var Zr = /* @__PURE__ */ new Map(), $o = /* @__PURE__ */ new Map(), Il = !0, fi = !1;
function Rl(e) {
  return e.replace(/[\s,]+/g, " ").trim();
}
function md(e) {
  return Rl(e.source.body.substring(e.start, e.end));
}
function gd(e) {
  var t = /* @__PURE__ */ new Set(), n = [];
  return e.definitions.forEach(function(r) {
    if (r.kind === "FragmentDefinition") {
      var i = r.name.value, o = md(r.loc), s = $o.get(i);
      s && !s.has(o) ? Il && console.warn("Warning: fragment with name " + i + ` already exists.
graphql-tag enforces all fragment names across your application to be unique; read more about
this in the docs: http://dev.apollodata.com/core/fragments.html#unique-names`) : s || $o.set(i, s = /* @__PURE__ */ new Set()), s.add(o), t.has(o) || (t.add(o), n.push(r));
    } else
      n.push(r);
  }), di(di({}, e), { definitions: n });
}
function yd(e) {
  var t = new Set(e.definitions);
  t.forEach(function(r) {
    r.loc && delete r.loc, Object.keys(r).forEach(function(i) {
      var o = r[i];
      o && typeof o == "object" && t.add(o);
    });
  });
  var n = e.loc;
  return n && (delete n.startToken, delete n.endToken), e;
}
function bd(e) {
  var t = Rl(e);
  if (!Zr.has(t)) {
    var n = fd(e, { experimentalFragmentVariables: fi, allowLegacyFragmentVariables: fi });
    if (!n || n.kind !== "Document")
      throw new Error("Not a valid GraphQL document.");
    Zr.set(t, yd(gd(n)));
  }
  return Zr.get(t);
}
function dr(e) {
  for (var t = [], n = 1; n < arguments.length; n++)
    t[n - 1] = arguments[n];
  typeof e == "string" && (e = [e]);
  var r = e[0];
  return t.forEach(function(i, o) {
    i && i.kind === "Document" ? r += i.loc.source.body : r += i, r += e[o + 1];
  }), bd(r);
}
function jd() {
  Zr.clear(), $o.clear();
}
function xd() {
  Il = !1;
}
function wd() {
  fi = !0;
}
function _d() {
  fi = !1;
}
var Kn = { gql: dr, resetCaches: jd, disableFragmentWarnings: xd, enableExperimentalFragmentVariables: wd, disableExperimentalFragmentVariables: _d };
(function(e) {
  e.gql = Kn.gql, e.resetCaches = Kn.resetCaches, e.disableFragmentWarnings = Kn.disableFragmentWarnings, e.enableExperimentalFragmentVariables = Kn.enableExperimentalFragmentVariables, e.disableExperimentalFragmentVariables = Kn.disableExperimentalFragmentVariables;
})(dr || (dr = {}));
dr.default = dr;
function Ed() {
}
function ms() {
  return Ed;
}
var y = ms, we = ms, U = ms, Cl = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Dl = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Vt = class {
  constructor(e) {
    this.code = e;
  }
};
Cl([y(), Dl("design:type", String)], Vt.prototype, "code", void 0);
Vt = Cl([U(), Dl("design:paramtypes", [String])], Vt);
var gs = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, ys = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Wt = class {
  constructor(e, t) {
    this.address = e, this.name = t;
  }
};
gs([y(), ys("design:type", String)], Wt.prototype, "address", void 0);
gs([y(), ys("design:type", String)], Wt.prototype, "name", void 0);
Wt = gs([U(), ys("design:paramtypes", [String, String])], Wt);
var te = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, ue = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, jt = class {
  constructor(e, t) {
    this.key = t, this.signature = e;
  }
};
te([y(), ue("design:type", String)], jt.prototype, "signature", void 0);
te([y(), ue("design:type", String)], jt.prototype, "key", void 0);
te([y(), ue("design:type", Boolean)], jt.prototype, "valid", void 0);
te([y(), ue("design:type", Boolean)], jt.prototype, "invalid", void 0);
jt = te([U(), we(), ue("design:paramtypes", [String, String])], jt);
var Ht = class {
};
te([y(), ue("design:type", String)], Ht.prototype, "signature", void 0);
te([y(), ue("design:type", String)], Ht.prototype, "key", void 0);
te([y(), ue("design:type", Boolean)], Ht.prototype, "valid", void 0);
te([y(), ue("design:type", Boolean)], Ht.prototype, "invalid", void 0);
Ht = te([we()], Ht);
function Ot(e) {
  let t = class {
    constructor(n, r, i, o) {
      this.author = n, this.timestamp = r, this.data = i, this.proof = o;
    }
  };
  return te([y(), ue("design:type", String)], t.prototype, "author", void 0), te([y(), ue("design:type", String)], t.prototype, "timestamp", void 0), te([y(), ue("design:type", Object)], t.prototype, "data", void 0), te([y(), ue("design:type", jt)], t.prototype, "proof", void 0), t = te([U(), ue("design:paramtypes", [String, String, Object, jt])], t), t;
}
function kd(e) {
  let t = class {
  };
  return te([y(), ue("design:type", String)], t.prototype, "author", void 0), te([y(), ue("design:type", String)], t.prototype, "timestamp", void 0), te([y(), ue("design:type", Object)], t.prototype, "data", void 0), te([y(), ue("design:type", Ht)], t.prototype, "proof", void 0), t = te([we()], t), t;
}
var ba = class extends Ot() {
};
ba = te([U()], ba);
var vi = class extends Ot() {
};
te([y(), ue("design:type", Wt)], vi.prototype, "language", void 0);
te([y(), ue("design:type", Vt)], vi.prototype, "icon", void 0);
vi = te([U()], vi);
var se = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, fe = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, fr = class {
  constructor(e) {
    this.source = e.source ? e.source : "", this.target = e.target ? e.target : "", this.predicate = e.predicate ? e.predicate : "";
  }
};
se([y(), fe("design:type", String)], fr.prototype, "source", void 0);
se([y(), fe("design:type", String)], fr.prototype, "target", void 0);
se([y(), fe("design:type", String)], fr.prototype, "predicate", void 0);
fr = se([U(), fe("design:paramtypes", [Object])], fr);
var mi = class {
};
se([y(), fe("design:type", Array)], mi.prototype, "additions", void 0);
se([y(), fe("design:type", Array)], mi.prototype, "removals", void 0);
mi = se([we()], mi);
var gi = class {
  constructor(e, t) {
    this.additions = e, this.removals = t;
  }
};
se([y(), fe("design:type", Array)], gi.prototype, "additions", void 0);
se([y(), fe("design:type", Array)], gi.prototype, "removals", void 0);
gi = se([U(), fe("design:paramtypes", [Array, Array])], gi);
var vr = class {
};
se([y(), fe("design:type", String)], vr.prototype, "source", void 0);
se([y(), fe("design:type", String)], vr.prototype, "target", void 0);
se([y(), fe("design:type", String)], vr.prototype, "predicate", void 0);
vr = se([we()], vr);
var Gt = class extends Ot() {
  hash() {
    let e = JSON.stringify(this.data, Object.keys(this.data).sort()) + JSON.stringify(this.author) + this.timestamp, t = 0, n, r;
    for (n = 0; n < e.length; n++)
      r = e.charCodeAt(n), t = (t << 5) - t + r, t |= 0;
    return t;
  }
};
se([y(), fe("design:type", String)], Gt.prototype, "status", void 0);
Gt = se([U()], Gt);
var zo = class extends kd() {
};
se([y(), fe("design:type", String)], zo.prototype, "status", void 0);
zo = se([we()], zo);
var yi = class {
  constructor(e, t) {
    this.oldLink = e, this.newLink = t;
  }
};
se([y(), fe("design:type", Gt)], yi.prototype, "oldLink", void 0);
se([y(), fe("design:type", Gt)], yi.prototype, "newLink", void 0);
yi = se([U(), fe("design:paramtypes", [Gt, Gt])], yi);
var Qt = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Or = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Lo, xt = class {
  constructor(e) {
    e ? this.links = e : this.links = [];
  }
  get(e) {
    if (!e || !e.source && !e.predicate && !e.target)
      return this.links;
    if (e.source) {
      let n = JSON.parse(JSON.stringify(this.links));
      return e.target && (n = n.filter((r) => r.data.target === e.target)), e.predicate && (n = n.filter((r) => r.data.predicate === e.predicate)), e.fromDate && (n = n.filter((r) => new Date(r.timestamp) >= e.fromDate)), e.untilDate && (n = n.filter((r) => new Date(r.timestamp) <= e.untilDate)), e.limit && (n = n.slice(0, e.limit)), n;
    }
    if (e.target) {
      let n = JSON.parse(JSON.stringify(this.links));
      return e.predicate && (n = n.filter((r) => r.data.predicate === e.predicate)), e.fromDate && (n = n.filter((r) => new Date(r.timestamp) >= e.fromDate)), e.untilDate && (n = n.filter((r) => new Date(r.timestamp) <= e.untilDate)), e.limit && (n = n.slice(0, e.limit)), n;
    }
    let t = JSON.parse(JSON.stringify(this.links));
    return t = t.filter((n) => n.data.predicate === e.predicate), e.limit && (t = t.slice(0, e.limit)), t;
  }
  getSingleTarget(e) {
    delete e.target;
    let t = this.get(e);
    return t.length ? t[0].data.target : null;
  }
};
Qt([y(), Or("design:type", Array)], xt.prototype, "links", void 0);
xt = Qt([U(), Or("design:paramtypes", [Array])], xt);
var Bo = class {
};
Qt([y(), Or("design:type", Array)], Bo.prototype, "links", void 0);
Bo = Qt([we()], Bo);
var Fo = Lo = class {
  constructor(e) {
    e ? this.links = e : this.links = [];
  }
  static fromLink(e) {
    let t = new Lo();
    return t.links.push(e), t;
  }
};
Qt([y(), Or("design:type", Array)], Fo.prototype, "links", void 0);
Fo = Lo = Qt([we(), Or("design:paramtypes", [Array])], Fo);
var Ko = class extends Ot() {
};
Ko = Qt([U()], Ko);
var D = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, P = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, mr = class {
  constructor(e, t) {
    this.did = e, t ? this.perspective = t : this.perspective = new xt();
  }
};
D([y(), P("design:type", String)], mr.prototype, "did", void 0);
D([y(), P("design:type", xt)], mr.prototype, "perspective", void 0);
D([y(), P("design:type", String)], mr.prototype, "directMessageLanguage", void 0);
mr = D([U(), P("design:paramtypes", [String, xt])], mr);
var ja = class extends Ot() {
};
ja = D([U()], ja);
var wt = class {
  constructor(e, t, n, r, i, o) {
    this.did = e, this.didSigningKeyId = t, this.deviceKeyType = n, this.deviceKey = r, this.deviceKeySignedByDid = i, this.didSignedByDeviceKey = o;
  }
};
D([y(), P("design:type", String)], wt.prototype, "did", void 0);
D([y(), P("design:type", String)], wt.prototype, "didSigningKeyId", void 0);
D([y(), P("design:type", String)], wt.prototype, "deviceKeyType", void 0);
D([y(), P("design:type", String)], wt.prototype, "deviceKey", void 0);
D([y(), P("design:type", String)], wt.prototype, "deviceKeySignedByDid", void 0);
D([y(), P("design:type", String)], wt.prototype, "didSignedByDeviceKey", void 0);
wt = D([U(), P("design:paramtypes", [String, String, String, String, String, String])], wt);
var _t = class {
  constructor(e, t, n, r, i, o) {
    this.did = e, this.didSigningKeyId = t, this.deviceKeyType = n, this.deviceKey = r, this.deviceKeySignedByDid = i, this.didSignedByDeviceKey = o;
  }
};
D([y(), P("design:type", String)], _t.prototype, "did", void 0);
D([y(), P("design:type", String)], _t.prototype, "didSigningKeyId", void 0);
D([y(), P("design:type", String)], _t.prototype, "deviceKeyType", void 0);
D([y(), P("design:type", String)], _t.prototype, "deviceKey", void 0);
D([y(), P("design:type", String)], _t.prototype, "deviceKeySignedByDid", void 0);
D([y(), P("design:type", String)], _t.prototype, "didSignedByDeviceKey", void 0);
_t = D([we(), P("design:paramtypes", [String, String, String, String, String, String])], _t);
var bi = class {
  constructor(e, t) {
    this.signature = e, this.publicKey = t;
  }
};
D([y(), P("design:type", String)], bi.prototype, "signature", void 0);
D([y(), P("design:type", String)], bi.prototype, "publicKey", void 0);
bi = D([U(), P("design:paramtypes", [String, String])], bi);
var _n = class {
  constructor(e, t) {
    this.domain = e, this.pointers = t;
  }
};
D([y(), P("design:type", String)], _n.prototype, "domain", void 0);
D([y(), P("design:type", Array)], _n.prototype, "pointers", void 0);
_n = D([U(), P("design:paramtypes", [String, Array])], _n);
var ji = class {
  constructor(e, t) {
    this.with = e, this.can = t;
  }
};
D([y(), P("design:type", _n)], ji.prototype, "with", void 0);
D([y(), P("design:type", Array)], ji.prototype, "can", void 0);
ji = D([U(), P("design:paramtypes", [_n, Array])], ji);
var lt = class {
  constructor(e, t, n, r, i) {
    this.appName = e, this.appDesc = t, this.appIconPath = i, this.appUrl = n, this.capabilities = r;
  }
};
D([y(), P("design:type", String)], lt.prototype, "appName", void 0);
D([y(), P("design:type", String)], lt.prototype, "appDesc", void 0);
D([y(), P("design:type", String)], lt.prototype, "appUrl", void 0);
D([y(), P("design:type", String)], lt.prototype, "appIconPath", void 0);
D([y(), P("design:type", Array)], lt.prototype, "capabilities", void 0);
lt = D([U(), P("design:paramtypes", [String, String, String, Array, String])], lt);
var En = class {
  constructor(e, t, n, r) {
    this.requestId = e, this.auth = t, this.token = n, this.revoked = r;
  }
};
D([y(), P("design:type", String)], En.prototype, "requestId", void 0);
D([y(), P("design:type", String)], En.prototype, "token", void 0);
D([y(), P("design:type", Boolean)], En.prototype, "revoked", void 0);
D([y(), P("design:type", lt)], En.prototype, "auth", void 0);
En = D([U(), P("design:paramtypes", [String, lt, String, Boolean])], En);
var kn = class {
  constructor(e, t) {
    this.domain = e, this.pointers = t;
  }
};
D([y(), P("design:type", String)], kn.prototype, "domain", void 0);
D([y(), P("design:type", Array)], kn.prototype, "pointers", void 0);
kn = D([we(), P("design:paramtypes", [String, Array])], kn);
var xi = class {
  constructor(e, t) {
    this.with = e, this.can = t;
  }
};
D([y(), P("design:type", kn)], xi.prototype, "with", void 0);
D([y(), P("design:type", Array)], xi.prototype, "can", void 0);
xi = D([we(), P("design:paramtypes", [kn, Array])], xi);
var Et = class {
  constructor(e, t, n, r, i, o) {
    this.appName = e, this.appDesc = t, this.appUrl = r, this.appDomain = n, this.capabilities = o, this.appIconPath = i;
  }
};
D([y(), P("design:type", String)], Et.prototype, "appName", void 0);
D([y(), P("design:type", String)], Et.prototype, "appDesc", void 0);
D([y(), P("design:type", String)], Et.prototype, "appDomain", void 0);
D([y(), P("design:type", String)], Et.prototype, "appUrl", void 0);
D([y(), P("design:type", String)], Et.prototype, "appIconPath", void 0);
D([y(), P("design:type", Array)], Et.prototype, "capabilities", void 0);
Et = D([we(), P("design:paramtypes", [String, String, String, String, String, Array])], Et);
var Rn = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Cn = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Yt = class {
  constructor(e) {
    e ? (this.isInitialized = e.isInitialized, this.isInitialized || (this.isInitialized = !1), this.isUnlocked = e.isUnlocked, this.isUnlocked || (this.isUnlocked = !1), this.did = e.did, this.didDocument = e.didDocument, this.error = e.error) : (this.isInitialized = !1, this.isUnlocked = !1);
  }
};
Rn([y(), Cn("design:type", Boolean)], Yt.prototype, "isInitialized", void 0);
Rn([y(), Cn("design:type", Boolean)], Yt.prototype, "isUnlocked", void 0);
Rn([y(), Cn("design:type", String)], Yt.prototype, "did", void 0);
Rn([y(), Cn("design:type", String)], Yt.prototype, "didDocument", void 0);
Rn([y(), Cn("design:type", String)], Yt.prototype, "error", void 0);
Yt = Rn([U(), Cn("design:paramtypes", [Object])], Yt);
var Zt = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, en = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, kt = class {
  constructor(e) {
    e && (this.source = e.source, this.predicate = e.predicate, this.target = e.target, e.fromDate && (this.fromDate = e.fromDate), e.untilDate && (this.untilDate = e.untilDate), e.limit && (this.limit = e.limit));
  }
  isMatch(e) {
    return !(this.source && this.source !== e.source || this.predicate && this.predicate !== e.predicate || this.target && this.target !== e.target);
  }
};
Zt([y(), en("design:type", String)], kt.prototype, "source", void 0);
Zt([y(), en("design:type", String)], kt.prototype, "target", void 0);
Zt([y(), en("design:type", String)], kt.prototype, "predicate", void 0);
Zt([y(), en("design:type", Date)], kt.prototype, "fromDate", void 0);
Zt([y(), en("design:type", Date)], kt.prototype, "untilDate", void 0);
Zt([y(), en("design:type", Number)], kt.prototype, "limit", void 0);
kt = Zt([U(), we(), en("design:paramtypes", [Object])], kt);
var xa;
(function(e) {
  e[e.LanguageIsNotLoaded = 0] = "LanguageIsNotLoaded", e[e.ExpressionIsNotVerified = 1] = "ExpressionIsNotVerified", e[e.AgentIsUntrusted = 2] = "AgentIsUntrusted", e[e.CapabilityRequested = 3] = "CapabilityRequested";
})(xa || (xa = {}));
var bs = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, js = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, wi = class {
  constructor(e, t) {
    this.language = e, this.expression = t;
  }
};
bs([y(), js("design:type", Wt)], wi.prototype, "language", void 0);
bs([y(), js("design:type", String)], wi.prototype, "expression", void 0);
wi = bs([U(), js("design:paramtypes", [Wt, String])], wi);
var Ie = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Je = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, _i = class {
};
Ie([y(), Je("design:type", String)], _i.prototype, "name", void 0);
Ie([y(), Je("design:type", String)], _i.prototype, "type", void 0);
_i = Ie([U()], _i);
var gr = class {
};
Ie([y(), Je("design:type", String)], gr.prototype, "label", void 0);
Ie([y(), Je("design:type", String)], gr.prototype, "name", void 0);
Ie([y(), Je("design:type", Array)], gr.prototype, "parameters", void 0);
gr = Ie([U()], gr);
var Ei = class {
  get parameters() {
    return JSON.parse(this.parametersStringified);
  }
  constructor(e, t) {
    this.name = e, this.parametersStringified = JSON.stringify(t);
  }
};
Ie([y(), Je("design:type", String)], Ei.prototype, "name", void 0);
Ie([y(), Je("design:type", String)], Ei.prototype, "parametersStringified", void 0);
Ei = Ie([we(), Je("design:paramtypes", [String, Object])], Ei);
var ki = class {
};
Ie([y(), Je("design:type", String)], ki.prototype, "did", void 0);
Ie([y(), Je("design:type", Ko)], ki.prototype, "status", void 0);
ki = Ie([U()], ki);
var tn = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Dn = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, St = class {
};
tn([y(), Dn("design:type", String)], St.prototype, "name", void 0);
tn([y(), Dn("design:type", String)], St.prototype, "address", void 0);
tn([y(), Dn("design:type", String)], St.prototype, "settings", void 0);
tn([y(), Dn("design:type", Vt)], St.prototype, "icon", void 0);
tn([y(), Dn("design:type", Vt)], St.prototype, "constructorIcon", void 0);
tn([y(), Dn("design:type", Vt)], St.prototype, "settingsIcon", void 0);
St = tn([U()], St);
var _e = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Se = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Ue = class {
};
_e([y(), Se("design:type", String)], Ue.prototype, "name", void 0);
_e([y(), Se("design:type", String)], Ue.prototype, "address", void 0);
_e([y(), Se("design:type", String)], Ue.prototype, "description", void 0);
_e([y(), Se("design:type", String)], Ue.prototype, "author", void 0);
_e([y(), Se("design:type", Boolean)], Ue.prototype, "templated", void 0);
_e([y(), Se("design:type", String)], Ue.prototype, "templateSourceLanguageAddress", void 0);
_e([y(), Se("design:type", String)], Ue.prototype, "templateAppliedParams", void 0);
_e([y(), Se("design:type", Array)], Ue.prototype, "possibleTemplateParams", void 0);
_e([y(), Se("design:type", String)], Ue.prototype, "sourceCodeLink", void 0);
Ue = _e([U()], Ue);
var Sn = class {
  constructor(e, t) {
    this.name = e, this.description = t, this.description || (this.description = "");
  }
};
_e([y(), Se("design:type", String)], Sn.prototype, "name", void 0);
_e([y(), Se("design:type", String)], Sn.prototype, "description", void 0);
_e([y(), Se("design:type", Array)], Sn.prototype, "possibleTemplateParams", void 0);
_e([y(), Se("design:type", String)], Sn.prototype, "sourceCodeLink", void 0);
Sn = _e([we(), Se("design:paramtypes", [String, String])], Sn);
(class extends Ot() {
});
var Pi = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, xs = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, yr = class {
  constructor(e, t) {
    this.linkLanguage = e, this.meta = t;
  }
};
Pi([y(), xs("design:type", String)], yr.prototype, "linkLanguage", void 0);
Pi([y(), xs("design:type", xt)], yr.prototype, "meta", void 0);
yr = Pi([U(), xs("design:paramtypes", [String, xt])], yr);
var wa = class extends Ot() {
};
wa = Pi([U()], wa);
var Pn = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Mn = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Uo;
(function(e) {
  e.Private = "Private", e.NeighbourhoodJoinInitiated = "NeighbourhoodJoinInitiated", e.LinkLanguageFailedToInstall = "LinkLanguageFailedToInstall", e.LinkLanguageInstalledButNotSynced = "LinkLanguageInstalledButNotSynced", e.Synced = "Synced";
})(Uo || (Uo = {}));
var Jt = class {
  constructor(e, t, n) {
    this.uuid = e, this.name = t, n ? this.state = n : this.state = Uo.Private;
  }
};
Pn([y(), Mn("design:type", String)], Jt.prototype, "uuid", void 0);
Pn([y(), Mn("design:type", String)], Jt.prototype, "name", void 0);
Pn([y(), Mn("design:type", String)], Jt.prototype, "state", void 0);
Pn([y(), Mn("design:type", String)], Jt.prototype, "sharedUrl", void 0);
Pn([y(), Mn("design:type", yr)], Jt.prototype, "neighbourhood", void 0);
Jt = Pn([U(), Mn("design:paramtypes", [String, String, String])], Jt);
var Mi = function(e, t, n, r) {
  var i = arguments.length, o = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, s;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function")
    o = Reflect.decorate(e, t, n, r);
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (o = (i < 3 ? s(o) : i > 3 ? s(t, n, o) : s(t, n)) || o);
  return i > 3 && o && Object.defineProperty(t, n, o), o;
}, Pl = function(e, t) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function")
    return Reflect.metadata(e, t);
}, Si = class {
};
Mi([y(), Pl("design:type", Array)], Si.prototype, "additions", void 0);
Mi([y(), Pl("design:type", Array)], Si.prototype, "removals", void 0);
Si = Mi([U()], Si);
var _a = class extends Ot() {
};
_a = Mi([U()], _a);
var Sd = {};
An(Sd, { AD4M_AGENT: () => Od, JUNTO_AGENT: () => Ad, KAICHAO_AGENT: () => Td, NOTE_IPFS_AUTHOR: () => Nd });
var Ad = "did:key:zQ3sheV6m6sT83woZtVL2PHiz6J1qWRh4FWW2aiJvxy6d2o7S", Od = "did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n", Td = "did:key:zQ3shfhvaHzE81hZqLorVNDmq971EpGPXq3nhyLF1JRP18LM3", Nd = "did:key:zQ3shmm1adTSjzyVqWthFkJ4yby8zCdH5uvwxWaQDEuJLUPfq", Id = {};
An(Id, { AD4M_CLASS: () => Ud, BODY: () => Zd, CARD_HIDDEN: () => $l, CHANNEL: () => Bd, CHANNEL_NAME: () => Fd, CREATED_AT: () => Md, CREATOR: () => Pd, DESCRIPTION: () => Rd, DID: () => af, EDITED_TO: () => Ml, END_DATE: () => of, ENTRY_TYPE: () => Xd, EXPRESSION: () => Ld, FLUX_APP: () => Kd, FLUX_CHANNEL: () => qd, FLUX_GROUP_DESCRIPTION: () => Wd, FLUX_GROUP_IMAGE: () => Hd, FLUX_GROUP_NAME: () => Vd, FLUX_GROUP_THUMBNAIL: () => Gd, IMAGE: () => tf, LANGUAGE: () => Dd, MEMBER: () => zd, NAME: () => $d, OMIT: () => Jd, REACTION: () => qo, REPLY_TO: () => zl, SDNA_VERSION: () => sf, SELF: () => Cd, START_DATE: () => rf, THUMBNAIL: () => nf, TITLE: () => Qd, URL: () => ef, ZOME: () => Yd });
var Rd = "rdf://description", Cd = "ad4m://self", Dd = "ad4m://language", Pd = "rdf://creator", Md = "rdf://dateCreated", $d = "rdf://name", zd = "sioc://has_member", Ld = "sioc://content_of", Ml = "temp://edited_to", Bd = "flux://has_channel", Fd = "flux://has_channel_name", Kd = "flux://has_app", Ud = "ad4m://has_class", qd = "flux://channel", Vd = "flux://communityName", Wd = "flux://communityDescription", Hd = "flux://communityImage", Gd = "flux://communityThumbnail", Yd = "ad4m://has_zome", $l = "flux://is_card_hidden", Jd = "flux://null", zl = "flux://has_reply", qo = "flux://has_reaction", Xd = "flux://entry_type", Qd = "flux://title", Zd = "flux://body", ef = "flux://url", tf = "flux://image", nf = "flux://thumbnail", rf = "flux://start_date", of = "flux://end_date", sf = "ad4m://sdna_version", af = "ad4m://did", lf = {};
An(lf, { AD4M_PREDICATE_FIRSTNAME: () => Df, AD4M_PREDICATE_LASTNAME: () => Pf, AD4M_PREDICATE_USERNAME: () => Cf, AD4M_SOURCE_PROFILE: () => Rf, AREA_COMMUNITY: () => jf, AREA_HAS_DESCRIPTION: () => _f, AREA_HAS_IMAGE: () => Ef, AREA_HAS_IMAGES: () => kf, AREA_HAS_NAME: () => wf, AREA_SIMPLE_AREA: () => xf, AREA_TYPE: () => Sf, AREA_WEBLINK: () => bf, FLUX_PROFILE: () => cf, HAS_AREA: () => Af, HAS_BG_IMAGE: () => gf, HAS_BIO: () => mf, HAS_EMAIL: () => ff, HAS_FAMILY_NAME: () => df, HAS_GIVEN_NAME: () => hf, HAS_POST: () => yf, HAS_PROFILE_IMAGE: () => uf, HAS_THUMBNAIL_IMAGE: () => pf, HAS_USERNAME: () => vf, OG_DESCRIPTION: () => Tf, OG_IMAGE: () => If, OG_LINK: () => Of, OG_TITLE: () => Nf });
var cf = "flux://profile", uf = "sioc://has_profile_image", pf = "sioc://has_profile_thumbnail_image", hf = "sioc://has_given_name", df = "sioc://has_family_name", ff = "sioc://has_email", vf = "sioc://has_username", mf = "sioc://has_bio", gf = "sioc://has_bg_image", yf = "sioc://has_post", bf = "flux://webLink", jf = "flux://community", xf = "flux://simpleArea", wf = "sioc://has_name", _f = "sioc://has_description", Ef = "sioc://has_image", kf = "sioc://has_images", Sf = "flux://area_type", Af = "flux://has_aread", Of = "og://link", Tf = "og://description", Nf = "og://title", If = "og://image", Rf = "ad4m://profile", Cf = "sioc://has_username", Df = "sioc://has_firstname", Pf = "sioc://has_lastname", Mf = {};
An(Mf, { FILE_STORAGE_LANGUAGE: () => $f });
var $f = "QmZ3fQtyttf72ktVuV7eQLczSXmJ4YgxMkVRhJAazhodw9", zf = {};
An(zf, { DEFAULT_LIMIT: () => Ff, LATEST_SDNA_VERSION: () => Kf, SDNA: () => qf, SDNA_CREATION_DATE: () => Uf, emoji: () => Bf, emojiCount: () => Lf, messageFilteredQuery: () => Vf, messageFilteredQueryBackwards: () => Wf, messageQuery: () => Hf });
var Lf = 3, Bf = "1f44d", Ff = 50, Kf = 8, Uf = /* @__PURE__ */ new Date("2022-11-18T17:22:56Z"), qf = `
    emojiCount(Message, Count):- 
        aggregate_all(count, link(Message, "${qo}", "emoji://$emoji", _, _), Count).

    isPopular(Message) :- emojiCount(Message, Count), Count >= $emojiCount.
    isNotPopular(Message) :- emojiCount(Message, Count), Count < $emojiCount.

    flux_message(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages):-
        link(Source, "flux://has_message", Message, Timestamp, Author),
        findall((EditMessage, EditMessageTimestamp, EditMessageAuthor), link(Message, "${Ml}", EditMessage, EditMessageTimestamp, EditMessageAuthor), EditMessages),
        findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Message, "${qo}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
        findall((IsHidden, IsHiddenTimestamp, IsHiddenAuthor), link(Message, "${$l}", IsHidden, IsHiddenTimestamp, IsHiddenAuthor), AllCardHidden),
        findall((Reply, ReplyTimestamp, ReplyAuthor), link(Reply, "${zl}", Message, ReplyTimestamp, ReplyAuthor), Replies).
    
    flux_message_query_popular(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, true):- 
        flux_message(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isPopular(Message).
    
    flux_message_query_popular(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, false):- 
        flux_message(Source, Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages), isNotPopular(Message). 

`, Vf = 'limit($limit, (order_by([desc(Timestamp)], flux_message_query_popular("$source", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp =< $fromDate)).', Wf = '(order_by([asc(Timestamp)], flux_message_query_popular("$source", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular)), Timestamp >= $fromDate).', Hf = 'limit($limit, order_by([desc(Timestamp)], flux_message_query_popular("$source", Message, Timestamp, Author, Reactions, Replies, AllCardHidden, EditMessages, IsPopular))).', Gf = {};
An(Gf, { defaultSettings: () => Xf, videoDimensions: () => Jf });
var Yf = { min: 5, ideal: 15, max: 20 }, Jf = { width: { min: 640, ideal: 1280, max: 1920 }, height: { min: 360, ideal: 720, max: 1080 }, aspectRatio: 1.777, frameRate: Yf, deviceId: void 0 }, Xf = { audio: !0, video: !1, screen: !1 }, no = { year: 24 * 60 * 60 * 1e3 * 365, month: 24 * 60 * 60 * 1e3 * 365 / 12, day: 24 * 60 * 60 * 1e3, hour: 60 * 60 * 1e3, minute: 60 * 1e3, second: 1e3 };
function Qf(e, t = /* @__PURE__ */ new Date(), n) {
  var r = e - t;
  for (var i in no)
    if (Math.abs(r) > no[i] || i == "second")
      return n.format(Math.round(r / no[i]), i);
}
var he = class extends W {
  constructor() {
    super(...arguments), this.value = "01/01/1970", this.locales = "en", this.relative = !1, this.dateStyle = null, this.timeStyle = null, this.dayPeriod = null, this.hourCycle = null, this.timeZone = null, this.weekday = null, this.era = null, this.year = null, this.month = null, this.day = null, this.hour = null, this.minute = null, this.second = null;
  }
  get options() {
    return this.dateStyle ? { dateStyle: this.dateStyle, ...this.timeStyle && { timeStyle: this.timeStyle }, ...this.timeZone && { timeZone: this.timeZone } } : { ...this.dayPeriod && { dayPeriod: this.dayPeriod }, ...this.timeStyle && { timeStyle: this.timeStyle }, ...this.timeZone && { timeZone: this.timeZone }, ...this.weekday && { weekday: this.weekday }, ...this.era && { era: this.era }, ...this.year && { year: this.year }, ...this.month && { month: this.month }, ...this.day && { day: this.day }, ...this.second && { second: this.second }, ...this.hour && { hour: this.hour }, ...this.minute && { minute: this.minute }, ...this.hourCycle && { hourCycle: this.hourCycle } };
  }
  firstUpdated() {
    this.relative && this.runLoop();
  }
  runLoop() {
    setTimeout(() => {
      this.requestUpdate(), this.runLoop();
    }, 60 * 1e3);
  }
  get formattedTime() {
    if (this.relative) {
      let e = new Intl.RelativeTimeFormat(this.locales, { numeric: "auto", style: "long" });
      return Qf(new Date(this.value), /* @__PURE__ */ new Date(), e);
    } else
      return new Intl.DateTimeFormat(this.locales, this.options).format(new Date(this.value));
  }
  render() {
    return B`<span>${this.formattedTime}</span>`;
  }
};
he.styles = [H], g([k({ type: String, reflect: !0 })], he.prototype, "value", 2), g([k({ type: String, reflect: !0 })], he.prototype, "locales", 2), g([k({ type: Boolean, reflect: !0 })], he.prototype, "relative", 2), g([k({ type: String, reflect: !0 })], he.prototype, "dateStyle", 2), g([k({ type: String, reflect: !0 })], he.prototype, "timeStyle", 2), g([k({ type: String, reflect: !0 })], he.prototype, "dayPeriod", 2), g([k({ type: String, reflect: !0 })], he.prototype, "hourCycle", 2), g([k({ type: String, reflect: !0 })], he.prototype, "timeZone", 2), g([k({ type: String, reflect: !0 })], he.prototype, "weekday", 2), g([k({ type: String, reflect: !0 })], he.prototype, "era", 2), g([k({ type: String, reflect: !0 })], he.prototype, "year", 2), g([k({ type: String, reflect: !0 })], he.prototype, "month", 2), g([k({ type: String, reflect: !0 })], he.prototype, "day", 2), g([k({ type: String, reflect: !0 })], he.prototype, "hour", 2), g([k({ type: String, reflect: !0 })], he.prototype, "minute", 2), g([k({ type: String, reflect: !0 })], he.prototype, "second", 2), he = g([oe("j-timestamp")], he);
function Ll(e, { onScroll: t = (i) => null, onScrollStop: n = (i) => null, removeListenerAfterStop: r = !1 }) {
  let i = null;
  function o(s) {
    t(s), i && clearTimeout(i), i = setTimeout(() => {
      n(s), r && e.removeEventListener("scroll", o);
    }, 150);
  }
  e.addEventListener("scroll", o);
}
function Zf(e, t, n) {
  Ll(e, { onScrollStop: n, removeListenerAfterStop: !0 }), e.scrollTo({ left: e.clientWidth * t, behavior: "smooth" });
}
var Bl = Z`:host{--j-carousel-gap:none}[part=base]{width:100%;overflow:hidden}[part=carousel]{display:flex;gap:var(--j-carousel-gap);overflow-x:scroll;scroll-snap-type:x mandatory;scrollbar-width:none;align-items:center}[part=carousel]::-webkit-scrollbar{display:none}::slotted(*){min-width:100%;width:100%;flex-shrink:0;scroll-snap-align:start}[part=navigation]{display:flex;padding-top:var(--j-space-200);gap:var(--j-space-500);align-items:center;justify-content:center}[part=navigation-button]{border:1px solid transparent;cursor:pointer;background:var(--j-color-ui-100);width:.8rem;height:.8rem;border-radius:50%}[part=navigation-button][active]{background:var(--j-color-primary-500)}`, Lr = class extends W {
  constructor() {
    super(), this._timer = null, this._value = 0, this._isScrolling = !1, this.gap = null, this.goToSlide = this.goToSlide.bind(this);
  }
  get nearestIndex() {
    return Math.round(this.carouselEl.scrollLeft / this.carouselEl.clientWidth);
  }
  goToSlide(e) {
    this.value = e;
  }
  firstUpdated() {
    Ll(this.carouselEl, { onScroll: () => {
      this._isScrolling = !0, this.value = this.nearestIndex;
    }, onScrollStop: () => {
      this.value = this.nearestIndex, this._isScrolling = !1;
    } });
  }
  shouldUpdate() {
    let e = [Bl, H];
    if (this.gap) {
      let t = Fe("j-space", this.gap);
      e.push(Ho("--j-carousel-gap", t));
    }
    return br(this.shadowRoot, e), !0;
  }
  set value(e) {
    e !== this._value && (this._isScrolling ? (this._value = e, this.dispatchEvent(new CustomEvent("change")), this.requestUpdate()) : Zf(this.carouselEl, e, () => {
      this._value = e, this.dispatchEvent(new CustomEvent("change")), this.requestUpdate();
    }));
  }
  get value() {
    return this._value;
  }
  get slides() {
    return [...this.children];
  }
  get carouselEl() {
    return this.renderRoot.querySelector("[part='carousel']");
  }
  render() {
    return B`<div part="base"><div part="carousel"><slot></slot></div><div part="navigation">${this.slides.map((e, t) => B`<button ?active="${this.value === t}" data-index="${t}" @click="${() => this.goToSlide(t)}" part="navigation-button"></button>`)}</div></div>`;
  }
};
Lr.styles = [Bl, H], g([k({ type: String, reflect: !0 })], Lr.prototype, "gap", 2), Lr = g([oe("j-carousel")], Lr);
var ev = Z`:host{--j-toggle-size:var(--j-size-md)}:host([size=sm]){--j-toggle-size:var(--j-size-sm)}:host([size=lg]){--j-toggle-size:var(--j-size-lg)}input{position:absolute;clip:rect(1px 1px 1px 1px);clip:rect(1px,1px,1px,1px);vertical-align:middle}[part=base]{cursor:pointer;display:flex;height:var(--j-toggle-size);align-items:center;gap:var(--j-space-400)}:host([disabled]) [part=base]{opacity:.5;cursor:default}:host(:not([disabled]):not([checked])) [part=base]:hover [part=toggle]{background:var(--j-color-ui-300)}[part=toggle]{display:inline-flex;align-items:center;justify-content:center;width:calc(var(--j-toggle-size) * 1);height:calc(var(--j-toggle-size) * .6);border-radius:var(--j-border-radius);background:var(--j-color-ui-200);color:var(--j-color-white);position:relative;border-radius:300px}:host([checked]) [part=toggle]{background:var(--j-color-primary-500)}[part=indicator]{position:absolute;transition:all .2s ease;top:50%;transform:translateY(-50%) translateX(0);left:5px;display:inline-block;border-radius:50%;background:var(--j-color-white);width:calc(var(--j-toggle-size) * .4);height:calc(var(--j-toggle-size) * .4)}:host([checked]) [part=indicator]{left:calc(100% - 5px);transform:translateY(-50%) translateX(-100%)}`, tv = class extends W {
  constructor() {
    super(), this.checked = !1, this.full = !1, this.disabled = !1, this.size = null, this.value = null, this._handleChange = this._handleChange.bind(this);
  }
  static get properties() {
    return { checked: { type: Boolean, reflect: !0 }, disabled: { type: Boolean, reflect: !0 }, full: { type: Boolean, reflect: !0 }, size: { type: String, reflect: !0 }, value: { type: String } };
  }
  static get styles() {
    return [ev, H];
  }
  _handleChange(e) {
    e.stopPropagation(), this.checked = e.target.checked, this.dispatchEvent(new CustomEvent("change"));
  }
  render() {
    return B`<label part="base"><input ?disabled="${this.disabled}" @change="${this._handleChange}" .checked="${this.checked}" value="${this.value}" type="checkbox"> <span aria-hidden="true" part="toggle"><span part="indicator" name="indicator"></span> </span><span part="label"><slot></slot></span></label>`;
  }
};
customElements.define("j-toggle", tv);
var nv = Z`:host{--j-skeleton-height:var(--j-size-md);--j-skeleton-width:100%;--j-skeleton-border-radius:var(--j-border-radius, 0px);--j-skeleton-display:inline-block}[part=base]{display:var(--j-skeleton-display);width:var(--j-skeleton-width);height:var(--j-skeleton-height);border-radius:var(--j-skeleton-border-radius);background:linear-gradient(90deg,var(--j-color-ui-100) 0,var(--j-color-ui-200) 50%,var(--j-color-ui-100) 100%);animation:placeHolderShimmer 10s linear infinite}:host([height=xxs]){--j-skeleton-height:var(--j-size-xxs)}:host([height=xs]){--j-skeleton-height:var(--j-size-xs)}:host([height=sm]){--j-skeleton-height:var(--j-size-sm)}:host([height=md]){--j-skeleton-height:var(--j-size-md)}:host([height=lg]){--j-skeleton-height:var(--j-size-lg)}:host([height=xl]){--j-skeleton-height:var(--j-size-xl)}:host([height=xxl]){--j-skeleton-height:var(--j-size-xxl)}:host([height=full]){--j-skeleton-height:100%}:host([height=text]){--j-skeleton-height:1em}:host([width=xxs]){--j-skeleton-width:var(--j-size-xxs)}:host([width=xs]){--j-skeleton-width:var(--j-size-xs)}:host([width=sm]){--j-skeleton-width:var(--j-size-sm)}:host([width=md]){--j-skeleton-width:var(--j-size-md)}:host([width=lg]){--j-skeleton-width:var(--j-size-lg)}:host([width=xl]){--j-skeleton-width:var(--j-size-xl)}:host([width=xxl]){--j-skeleton-width:var(--j-size-xxl)}:host([width=full]){--j-skeleton-width:100%;--j-skeleton-displa:block}:host([width=text]){--j-skeleton-width:1em}:host([variant=circle]){--j-skeleton-border-radius:50%}:host([variant=circle]) [part=base]{aspect-ratio:1/1}@keyframes placeHolderShimmer{0%{background-position:-500px 0}100%{background-position:500px 0}}`, un = class extends W {
  constructor() {
    super(...arguments), this.variant = null, this.height = "md", this.width = "md";
  }
  render() {
    return B`<div part="base"></div>`;
  }
};
un.styles = [nv, H], g([k({ type: String, reflect: !0 })], un.prototype, "variant", 2), g([k({ type: String, reflect: !0 })], un.prototype, "height", 2), g([k({ type: String, reflect: !0 })], un.prototype, "width", 2), un = g([oe("j-skeleton")], un);
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/unsafe-svg.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/if-defined.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/

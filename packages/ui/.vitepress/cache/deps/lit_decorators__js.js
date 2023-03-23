import "./chunk-HYZYPRER.js";

// ../../node_modules/@lit/reactive-element/development/decorators/custom-element.js
var legacyCustomElement = (tagName, clazz) => {
  customElements.define(tagName, clazz);
  return clazz;
};
var standardCustomElement = (tagName, descriptor) => {
  const { kind, elements } = descriptor;
  return {
    kind,
    elements,
    // This callback is called once the class is otherwise fully defined
    finisher(clazz) {
      customElements.define(tagName, clazz);
    }
  };
};
var customElement = (tagName) => (classOrDescriptor) => typeof classOrDescriptor === "function" ? legacyCustomElement(tagName, classOrDescriptor) : standardCustomElement(tagName, classOrDescriptor);

// ../../node_modules/@lit/reactive-element/development/decorators/property.js
var standardProperty = (options, element) => {
  if (element.kind === "method" && element.descriptor && !("value" in element.descriptor)) {
    return {
      ...element,
      finisher(clazz) {
        clazz.createProperty(element.key, options);
      }
    };
  } else {
    return {
      kind: "field",
      key: Symbol(),
      placement: "own",
      descriptor: {},
      // store the original key so subsequent decorators have access to it.
      originalKey: element.key,
      // When @babel/plugin-proposal-decorators implements initializers,
      // do this instead of the initializer below. See:
      // https://github.com/babel/babel/issues/9260 extras: [
      //   {
      //     kind: 'initializer',
      //     placement: 'own',
      //     initializer: descriptor.initializer,
      //   }
      // ],
      initializer() {
        if (typeof element.initializer === "function") {
          this[element.key] = element.initializer.call(this);
        }
      },
      finisher(clazz) {
        clazz.createProperty(element.key, options);
      }
    };
  }
};
var legacyProperty = (options, proto, name) => {
  proto.constructor.createProperty(name, options);
};
function property(options) {
  return (protoOrDescriptor, name) => name !== void 0 ? legacyProperty(options, protoOrDescriptor, name) : standardProperty(options, protoOrDescriptor);
}

// ../../node_modules/@lit/reactive-element/development/decorators/state.js
function state(options) {
  return property({
    ...options,
    state: true
  });
}

// ../../node_modules/@lit/reactive-element/development/decorators/base.js
var decorateProperty = ({ finisher, descriptor }) => (protoOrDescriptor, name) => {
  var _a2;
  if (name !== void 0) {
    const ctor = protoOrDescriptor.constructor;
    if (descriptor !== void 0) {
      Object.defineProperty(protoOrDescriptor, name, descriptor(name));
    }
    finisher === null || finisher === void 0 ? void 0 : finisher(ctor, name);
  } else {
    const key = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_a2 = protoOrDescriptor.originalKey) !== null && _a2 !== void 0 ? _a2 : protoOrDescriptor.key
    );
    const info = descriptor != void 0 ? {
      kind: "method",
      placement: "prototype",
      key,
      descriptor: descriptor(protoOrDescriptor.key)
    } : { ...protoOrDescriptor, key };
    if (finisher != void 0) {
      info.finisher = function(ctor) {
        finisher(ctor, key);
      };
    }
    return info;
  }
};

// ../../node_modules/@lit/reactive-element/development/decorators/event-options.js
function eventOptions(options) {
  return decorateProperty({
    finisher: (ctor, name) => {
      Object.assign(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctor.prototype[name],
        options
      );
    }
  });
}

// ../../node_modules/@lit/reactive-element/development/decorators/query.js
function query(selector, cache) {
  return decorateProperty({
    descriptor: (name) => {
      const descriptor = {
        get() {
          var _a2, _b;
          return (_b = (_a2 = this.renderRoot) === null || _a2 === void 0 ? void 0 : _a2.querySelector(selector)) !== null && _b !== void 0 ? _b : null;
        },
        enumerable: true,
        configurable: true
      };
      if (cache) {
        const key = typeof name === "symbol" ? Symbol() : `__${name}`;
        descriptor.get = function() {
          var _a2, _b;
          if (this[key] === void 0) {
            this[key] = (_b = (_a2 = this.renderRoot) === null || _a2 === void 0 ? void 0 : _a2.querySelector(selector)) !== null && _b !== void 0 ? _b : null;
          }
          return this[key];
        };
      }
      return descriptor;
    }
  });
}

// ../../node_modules/@lit/reactive-element/development/decorators/query-all.js
function queryAll(selector) {
  return decorateProperty({
    descriptor: (_name) => ({
      get() {
        var _a2, _b;
        return (_b = (_a2 = this.renderRoot) === null || _a2 === void 0 ? void 0 : _a2.querySelectorAll(selector)) !== null && _b !== void 0 ? _b : [];
      },
      enumerable: true,
      configurable: true
    })
  });
}

// ../../node_modules/@lit/reactive-element/development/decorators/query-async.js
function queryAsync(selector) {
  return decorateProperty({
    descriptor: (_name) => ({
      async get() {
        var _a2;
        await this.updateComplete;
        return (_a2 = this.renderRoot) === null || _a2 === void 0 ? void 0 : _a2.querySelector(selector);
      },
      enumerable: true,
      configurable: true
    })
  });
}

// ../../node_modules/@lit/reactive-element/development/decorators/query-assigned-elements.js
var _a;
var NODE_MODE = false;
var global = NODE_MODE ? globalThis : window;
var slotAssignedElements = ((_a = global.HTMLSlotElement) === null || _a === void 0 ? void 0 : _a.prototype.assignedElements) != null ? (slot, opts) => slot.assignedElements(opts) : (slot, opts) => slot.assignedNodes(opts).filter((node) => node.nodeType === Node.ELEMENT_NODE);
function queryAssignedElements(options) {
  const { slot, selector } = options !== null && options !== void 0 ? options : {};
  return decorateProperty({
    descriptor: (_name) => ({
      get() {
        var _a2;
        const slotSelector = `slot${slot ? `[name=${slot}]` : ":not([name])"}`;
        const slotEl = (_a2 = this.renderRoot) === null || _a2 === void 0 ? void 0 : _a2.querySelector(slotSelector);
        const elements = slotEl != null ? slotAssignedElements(slotEl, options) : [];
        if (selector) {
          return elements.filter((node) => node.matches(selector));
        }
        return elements;
      },
      enumerable: true,
      configurable: true
    })
  });
}

// ../../node_modules/@lit/reactive-element/development/decorators/query-assigned-nodes.js
function queryAssignedNodes(slotOrOptions, flatten, selector) {
  let slot = slotOrOptions;
  let assignedNodesOptions;
  if (typeof slotOrOptions === "object") {
    slot = slotOrOptions.slot;
    assignedNodesOptions = slotOrOptions;
  } else {
    assignedNodesOptions = { flatten };
  }
  if (selector) {
    return queryAssignedElements({
      slot,
      flatten,
      selector
    });
  }
  return decorateProperty({
    descriptor: (_name) => ({
      get() {
        var _a2, _b;
        const slotSelector = `slot${slot ? `[name=${slot}]` : ":not([name])"}`;
        const slotEl = (_a2 = this.renderRoot) === null || _a2 === void 0 ? void 0 : _a2.querySelector(slotSelector);
        return (_b = slotEl === null || slotEl === void 0 ? void 0 : slotEl.assignedNodes(assignedNodesOptions)) !== null && _b !== void 0 ? _b : [];
      },
      enumerable: true,
      configurable: true
    })
  });
}
export {
  customElement,
  eventOptions,
  property,
  query,
  queryAll,
  queryAssignedElements,
  queryAssignedNodes,
  queryAsync,
  state
};
/*! Bundled license information:

@lit/reactive-element/development/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/development/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=lit_decorators__js.js.map

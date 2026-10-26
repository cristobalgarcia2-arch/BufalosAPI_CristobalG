class BaseIterator {
  [Symbol.iterator]() { return this; }
  find(predicate) {
    for (const item of this) {
      if (predicate(item)) return item;
    }
    return undefined;
  }
  some(predicate) {
    for (const item of this) {
      if (predicate(item)) return true;
    }
    return false;
  }
  every(predicate) {
    for (const item of this) {
      if (!predicate(item)) return false;
    }
    return true;
  }
  forEach(fn) {
    for (const item of this) {
      fn(item);
    }
  }
  toArray() {
    return Array.from(this);
  }
  filter(fn) {
    const self = this;
    const it = (function* () {
      for (const item of self) {
        if (fn(item)) yield item;
      }
    })();
    Object.setPrototypeOf(it, BaseIterator.prototype);
    return it;
  }
  map(fn) {
    const self = this;
    const it = (function* () {
      for (const item of self) {
        yield fn(item);
      }
    })();
    Object.setPrototypeOf(it, BaseIterator.prototype);
    return it;
  }
  take(limit) {
    const self = this;
    const it = (function* () {
      let count = 0;
      for (const item of self) {
        if (count++ >= limit) break;
        yield item;
      }
    })();
    Object.setPrototypeOf(it, BaseIterator.prototype);
    return it;
  }
  drop(limit) {
    const self = this;
    const it = (function* () {
      let count = 0;
      for (const item of self) {
        if (count++ < limit) continue;
        yield item;
      }
    })();
    Object.setPrototypeOf(it, BaseIterator.prototype);
    return it;
  }
  static from(obj) {
    if (obj instanceof BaseIterator) return obj;
    const iter = obj[Symbol.iterator] ? obj[Symbol.iterator]() : Array.from(obj)[Symbol.iterator]();
    Object.setPrototypeOf(iter, BaseIterator.prototype);
    return iter;
  }
}

// Attach to global
if (typeof Iterator === 'undefined') {
  globalThis.Iterator = BaseIterator;
} else {
  for (const name of Object.getOwnPropertyNames(BaseIterator.prototype)) {
    if (name !== 'constructor') {
      Iterator.prototype[name] = BaseIterator.prototype[name];
    }
  }
}

// Polyfill Promise.withResolvers
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

const vm = require('node:vm');
const origRunInContext = vm.runInContext;
vm.runInContext = function(code, contextifiedObject, options) {
  if (code === 'Iterator') {
    try {
      return origRunInContext.call(this, code, contextifiedObject, options);
    } catch (e) {
      if (contextifiedObject) {
        try { contextifiedObject.Iterator = BaseIterator; } catch(err) {}
      }
      return BaseIterator;
    }
  }
  return origRunInContext.call(this, code, contextifiedObject, options);
};

const origCreateContext = vm.createContext;
vm.createContext = function(contextObject, options) {
  const ctx = origCreateContext.call(this, contextObject, options);
  try {
    if (ctx && typeof ctx === 'object') {
      ctx.Iterator = BaseIterator;
      if (ctx.Promise && !ctx.Promise.withResolvers) {
        ctx.Promise.withResolvers = Promise.withResolvers;
      }
    }
  } catch(e) {}
  return ctx;
};

try {
  const wt = require('node:worker_threads');
  if (wt && !wt.markAsUncloneable) {
    wt.markAsUncloneable = () => {};
  }
} catch (e) {}

try {
  const zlib = require('node:zlib');
  if (zlib && !zlib.createZstdDecompress) {
    zlib.createZstdDecompress = () => {};
  }
} catch (e) {}

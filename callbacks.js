module.exports = class Callbacks {

  constructor(...kinds) {
    for (let kind of kinds) {
      this[`${kind}_chain`] = new Set();
      this[`${kind}_conditions`] = {};
      this[`skip_${kind}_conditions`] = {};
    }
  }

  static define_callbacks(...kinds) {
    for (let kind of kinds) {
      // define kind method i.e. before_action
      this._define_callback_method(kind);

      // define skip_kind method i.e. skip_before_action
      this._define_skip_callback_method(kind);
    }
    return new this(...kinds);
  }


  static _define_callback_method(kind) {
    this.prototype[kind] = function (...funcs) {
      let opts = funcs[funcs.length - 1];
      if (typeof opts === 'object') {
        funcs = funcs.slice(0, -1);
      }

      if (opts && opts.condition && typeof opts.condition === 'function') {
        for (let func of funcs) {
          this[`${kind}_conditions`][func] = opts.condition;
        }
      }

      for (let func of funcs) {
        this[`${kind}_chain`].add(func);
      }
    }
  }


  static _define_skip_callback_method(kind) {
    this.prototype[`skip_${kind}`] = function (...funcs) {
      let opts = funcs[funcs.length - 1];
      if (typeof opts === 'object') {
        funcs = funcs.slice(0, -1);
      }

      for (let func of funcs) {
        if (opts && opts.condition && typeof opts.condition === 'function') {
          this[`skip_${kind}_conditions`][func] = opts.condition;
        } else {
          this[`skip_${kind}_conditions`][func] = async () => true;
        }
      }
    }
  }



  async run_callback(kind, caller, func = null) {
    for (let callback of this[`${kind}_chain`]) {
      // TODO throw exception on caller[callback] is missing
      if (! await this._should_run_callback(kind, callback, caller)) continue;

      let result = await caller[callback]();

      if (func && func(result, caller)) {
        return result;
      }
    }
  }


  async _should_run_callback(kind, callback, caller) {
    let skip_condition = this[`skip_${kind}_conditions`][callback];
    if (skip_condition && typeof skip_condition === 'function') {
      return ! await skip_condition(caller);
    }

    let condition = this[`${kind}_conditions`][callback];

    if (condition && typeof condition === 'function') {
      return await condition(caller);
    }
    return true;
  }





}
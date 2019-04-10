module.exports = class RouterDispatcher {

  constructor(anchor_or_opts, route_set) {
    this.route_set = route_set

    let type_name = typeof anchor_or_opts;
    this.opts = {};

    if (type_name === 'function') {
      this.middleware = anchor_or_opts;
    } else if (type_name === 'object') {
      this.opts = anchor_or_opts;
    } else {
      throw new TypeError("anchor_or_opts is not a string or function or object");
    }
  }


  dispatch() {
    return async (ctx) => {
      if (this.middleware) return await this.middleware(ctx);

      let request_opts = {};
      Object.assign(request_opts, ctx.params);
      Object.assign(request_opts, this.opts);

      let controller = this.load_controller(request_opts);
      let action = request_opts.action;

      return await controller.process(ctx, action);
    }
  }



  load_controller(request_opts) {
    if (typeof request_opts.controller === 'function') {
      return request_opts.controller;
    } else {
      let scope_methods = []

      if (request_opts.namespace && request_opts.namespace.length > 0) {
        scope_methods = scope_methods.concat(request_opts.namespace);
      }

      let controller_name = request_opts.controller;
      if (!~controller_name.indexOf('Controller')) controller_name += '_controller';

      scope_methods.push(controller_name)

      let result = this.route_set.endpoints;
      for (let method of scope_methods) {
        if (!result[method]) {
          throw new TypeError(`Missing the scope or controller attribute [${method}] in Object:\n ${JSON.stringify(result)}
          \n Change your controller path or modify your routes.js to fix`);
        }
        result = result[method];
      }

      return result;
    }
  }



}
const Callback = require('./callbacks');


class BaseController {

  constructor(ctx) {
    this.ctx = ctx;
    if (global.Koa && Koa.logger) {
      this.logger = Koa.logger;
    }

    this.logger 

    this._init_method_alias()

    this._filter = Callback.define_callbacks('before_action', 'after_action');
    this.constructor._init_filter(this._filter);
  }

  _init_method_alias() {
    let ctx_methods =
      ['request',
        'response',
        'session',
        'app',
        'req',
        'res',
        'originalUrl',
        'state',
        'params',
        'render',
        'matched',
        'router',
        '_matchedRoute',
        'captures',
        'routerName'];
    for (let ctx_m of ctx_methods) {
      this[ctx_m] = this.ctx[ctx_m];
    }
  }

  static _init_filter(filter) {
    let super_class = this.__proto__;

    if (super_class && super_class._init_filter) {
      super_class._init_filter(filter)
    }

    this.filter_define(filter);
  }


  static filter_define(filter) {
    // to be implemented
    // filter.before_action
    // filter.after_action and so on
  }


  static async process(ctx, action) {
    let processor = new this(ctx);
    processor.action = action;

    if (!processor[action]) {
      ctx.throw(500, `Action: ${request_opts.action} is missing in Controller: ${this.controller_name(request_opts)}`);
    }

    if (processor.logger) {
      processor.logger.debug(`Processing by ${this.name}#${action}`);
      processor.logger.debug(`  Parameters: ${JSON.stringify(ctx.params)}`);
    }

    let before_callback_result = processor._filter.run_callback('before_action', processor, function (callback_result, controller) {
      // Give a condition for breaking iterative of the callbacks and return the result of current callback
      return callback_result == false;
    })

    if (before_callback_result == false) return;
    let res = await processor[action]();
    await processor._filter.run_callback('after_action', processor);

    return res;
  }


}


module.exports = BaseController


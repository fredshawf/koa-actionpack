class BaseController {
  
  constructor(ctx) {
    this.ctx = ctx;
  }
  
  // TODO: 指定only对应的action进行过滤
  static get_before_actions() {
    let before_actions = new Set();
    
    let super_class = this.__proto__;
    if (super_class.reload) super_class.re
    
    if (super_class && super_class.get_before_actions) {
      super_class.get_before_actions().forEach(action => {
        before_actions.add(action);
      })
    }
    
    if (!this.before_actions) return before_actions;
    
    let self_before_actions = this.before_actions();
    if (typeof self_before_actions === 'object' && self_before_actions.forEach) {
      self_before_actions.forEach(action => {
        before_actions.add(action);
      })
    }
    return before_actions;
  }
  
  
  // TODO: get_after_actions()
  // TODO: get_around_actions()
  
  
  
  static async process(ctx, action) {
    let processor = new this(ctx);
    
    if (!processor[action]) {
      ctx.throw(500, `Action: ${request_opts.action} is missing in Controller: ${this.controller_name(request_opts)}`);
    }
    
    if (await processor.do_before_action() == false) return;
    let res = await processor[action]();
    // await processor.do_after_action();
    
    return res;
  }
  
  
  async do_before_action() {
    for(let func_name of this.constructor.get_before_actions()) {
      if (!this[func_name]) continue;
    
      let res = await this[func_name]();
      if (res == false) {
        return false;
      }
    }
  }
  
  
  async do_after_action() {
    for(let func_name of this.constructor.after_filter_chain) {
      if (!this[func_name]) continue;
      
      await this[func_name]();
    }
  }
  
  
}

let ctx_methods = 
  [ 'request',
  'response',
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
  'routerName' ];

  
for(let ctx_m of ctx_methods) {
  BaseController.prototype[ctx_m] = function(...args) { return this.ctx[ctx_m](...args) }
}

BaseController.before_filter_chain = new Set();
BaseController.after_filter_chain = new Set();

module.exports = BaseController


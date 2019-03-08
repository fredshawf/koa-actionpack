class BaseController {
  
  constructor(ctx) {
    this.ctx = ctx;
  }
  
  static before_action(...filters){
    for(let filter of filters) {
      this.before_filter_chain.add(filter);
    }
  }
  
  static after_action(...filters){
    for(let filter of filters) {
      this.after_filter_chain.add(filter);
    }
  }
  
  static async process(ctx, action) {
    let processor = new this.constructor(ctx)
    let proxy = new Proxy(processor, {
      get: (tar, attr) => { return ctx[attr] ? ctx[attr] : tar[attr]; }
    });
    
    let action_fun = proxy[action];
    if (!action_fun) {
      ctx.throw(500, `Action: ${request_opts.action} is missing in Controller: ${this.controller_name(request_opts)}`);
    }
    
    if (await this.do_before_action() == false) return;
    let res = await action_fun.apply(proxy);
    await this.do_after_action()
    
    return res;
  }
  
  
  async do_before_action() {
    for(let func_name of this.before_filter_chain) {
      let func = this['func_name'];
      if (!func) continue;
      
      let res = await func.apply(this);
      if (res == false) {
        return false;
      }
    }
  }
  
  
  async do_after_action() {
    for(let func_name of this.after_filter_chain) {
      let func = this['func_name'];
      if (!func) continue;
      
      await func.apply(this);
    }
  }
  
  
  
  
  
}

BaseController.before_filter_chain = new Set();
BaseController.after_filter_chain = new Set();

module.exports = BaseController
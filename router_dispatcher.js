module.exports = class RouterDispatcher {
  
  constructor(anchor_or_opts) {
    let type_name = typeof anchor_or_opts;
    this.opts = {};
    
    if (type_name === 'string') {
      require('class-autoloader');
      let [controller_name, action_name] = anchor_or_opts.split('#');
      this.opts.controller = controller_name;
      this.opts.action = action_name;
    } else if (type_name === 'function') {
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
  
  
  controller_name(request_opts) {
    if (typeof request_opts.controller === 'function') {
      return request_opts.controller.name;
    } else {
      let namespace = '';
      if (request_opts.namespace && request_opts.namespace.length > 0) {
        namespace = request_opts.namespace.map((e) => {return this._camel_case(e)}).join('.') + '.';
      }
      
      let controller_name = this._camel_case(request_opts.controller);
      if (!~controller_name.indexOf('Controller')) controller_name += 'Controller';
      
      return namespace + controller_name;
    }
  }
  
  
  
  load_controller(request_opts) {
    if (typeof request_opts.controller === 'function') {
      return request_opts.controller;
    } else {
      let namespace = '';
      if (request_opts.namespace && request_opts.namespace.length > 0) {
        namespace = request_opts.namespace.map((e) => {return this._camel_case(e)}).join('.') + '.';
      }
      
      let controller_name = this._camel_case(request_opts.controller);
      if (!~controller_name.indexOf('Controller')) controller_name += 'Controller';
      
      return eval(namespace + controller_name);
    }    
  }
  
  
  
  
  _camel_case(underscore_name) {
    let class_name = underscore_name.replace(/(^|_)([a-z])/g, function($0, $1, $2) { return $2.toUpperCase() } );
    return class_name;
  }
  
  
  
}
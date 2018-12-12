const RouterDispatcher = require('./koa-router-dispatcher');
const Router = require('koa-router');

class RouterGenerator {
  
  
  static draw(path, opts={}) {
    let func = require(path);
    let router = new Router();
    let generator = new RouterGenerator(router);
    
    RouterDispatcher.logger = opts.logger;
    generator.draw_func(func);
    
    return router;
  }
  
  
  static define_generator_methods() {
    for(let method of ['get', 'put', 'post', 'patch', 'delete']) {
      this.prototype[method] = function (path, target) {
        
        let path_prefix = this.path_prefix();
        if (target.prefix) path_prefix += target.prefix[0] === '/' ? target.prefix : `/${target.prefix}`;
        if (!target.prefix && target.namespace) path_prefix += `/${target.namespace}`;
        
        if (!(path[0] === '/')) path = `/${path}`;
        
        let namespace_names = Object.assign([], this.namespace_names)
        if (target.namespace) namespace_names.push(target.namespace);
        if (typeof(target) === 'object') Object.assign(target, {namespace: namespace_names});
        
        this.router[method](path_prefix + path, new RouterDispatcher(target).dispatch());
      }
    }
    this.prototype['del'] = this.prototype['delete']; 
  }
  
  constructor(router) {
    this.router = router;
    this.namespace_names = [];
  }
  
  path_prefix() {
    return this.namespace_names.length > 0 ? `/${this.namespace_names.join('/')}` : '';
  }
  
  
  draw_func(func) {
    func.apply(this);
  }
  
  namespace(space, func) {
    new NamespaceGenerator(this.router, space).draw_func(func);
  }
  
  resources(resource_name, opts={}, func) {
    if (typeof opts === 'function') {
      func = opts;
      opts = {};
    }
    
    let namespace_names = Object.assign([], this.namespace_names);
    if (opts.namespace) namespace_names.push(opts.namespace);
    delete opts.namespace
    opts.namespace_names = namespace_names;
    
    let r_generator = new ResourcesGenerator(this.router, resource_name, opts);
    r_generator.generate_restful_routers();
    if (func) r_generator.draw_func(func);
  }
  
}

RouterGenerator.define_generator_methods()



class NamespaceGenerator extends RouterGenerator {
  constructor(router, ...space) {
    super(router);
    this.namespace_names = this.namespace_names.concat(space);
  }
  
  namespace(space, func) {
    new this.constructor(this.router, ...this.namespace_names.concat(space)).draw_func(func);
  } 
}



class ResourcesGenerator extends RouterGenerator {
  
  static rewrite_generator_methods() {
    for(let method of ['get', 'put', 'post', 'patch', 'delete', 'del']) {
      this.prototype[`_${method}`] = this.prototype[method];
      this.prototype[method] = function () {};
    }
  }
  
  
  constructor(router, resource_name, opts) {
    super(router);
    this.resource_name = resource_name;
    this.nested = opts.nested;
    this.namespace_names = opts.namespace_names;
    this.opts = opts;
    if (!opts.controller) opts.controller = resource_name;
  }
  
  generate_restful_routers() {
    let resources = {
      index:    ['get', ''],
      show:     ['get', '/:id(\\d+)'],
      new:      ['get', '/new'],
      create:   ['post', ''],
      edit:     ['get', '/:id(\\d+)/edit'],
      update:   ['put', '/:id(\\d+)'],
      destroy:  ['del', '/:id(\\d+)']    
    }
    
    let actions = Object.keys(resources);
    let allowed_actions = this.opts.only || actions.filter((i) => {
      return this.opts.except ? !this.opts.except.includes(i) : true;
    })
    
    for (let action of allowed_actions) {
      let opts = Object.assign({}, this.opts);
      
      this['_' + resources[action][0]](
        resources[action][1],
        Object.assign( opts, {action: action })
      );
    }
    return this;
  }
  
  path_prefix() {
    let super_path_prefix = super.path_prefix();
    return this.nested ? 
      `${this.nested.path_prefix()}/:${this.nested.resource_name}_id(\\d+)/${this.resource_name}` : 
      (super_path_prefix + `/${this.resource_name}`);
  }
  
  controller_name() {
    return this.opts.controller ? this.opts.controller : this.resource_name
  }
  
  namespace(func) {
    func.apply(this);
  }
  
  resources(resource_name, opts = {}, func) {
    if (typeof opts === 'function') {
      func = opts;
      opts = {};
    }
    
    Object.assign(opts, {nested: this});
    super.resources(resource_name, opts, func);
  }
  
  member(func) {
    new MemberResourcesGenerator(this.router, this.resource_name, Object.assign({}, this.opts)).draw_func(func)
  }
  
  collection(func) {
    new CollectionResourcesGenerator(this.router, this.resource_name, Object.assign({}, this.opts)).draw_func(func)
  }
  
}
ResourcesGenerator.rewrite_generator_methods()



class MemberResourcesGenerator extends ResourcesGenerator {
  
  path_prefix() {
    let super_path_prefix = super.path_prefix()
    return super_path_prefix + '/:id(\\d+)'
  }
  
  static define_member_generator_methods() {
    for(let method of ['get', 'put', 'post', 'patch', 'delete', 'del']) {
      this.prototype[method] = function (member_name) {
        let opts = Object.assign({}, this.opts);
        this['_' + method](member_name, Object.assign( opts, {action: member_name }))
      }
    }
  }
}
MemberResourcesGenerator.define_member_generator_methods()


class CollectionResourcesGenerator extends ResourcesGenerator {
  
  static define_member_generator_methods() {
    for(let method of ['get', 'put', 'post', 'patch', 'delete', 'del']) {
      this.prototype[method] = function (collection_name) {
        let opts = Object.assign({}, this.opts);
        this['_' + method](collection_name, Object.assign( opts, {action: collection_name }))
      }
    }
  }
  
}
CollectionResourcesGenerator.define_member_generator_methods()


module.exports = RouterGenerator












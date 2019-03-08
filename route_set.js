const Router = require('koa-router');
const RouterGenerator = require('./router_generator');

module.exports = class RouteSet {
  
  constructor(logger=null) {
    this.router = new Router();
    this.generator = new RouterGenerator();
    RouterGenerator.set_route_set(this)
    this.logger = logger;
  }
  
  
  
  draw(path) {
    let func = require(path);
    if (typeof func !== 'function') {
      throw new TypeError("the database.js should exports a function");
    }
    this.generator.draw_func(func);
  }
  
  
  add_route(method, path, app) {
    this.router[method](path, app);
  }
  
  
  routes() {
    return this.router.routes();
  }
  
  
}
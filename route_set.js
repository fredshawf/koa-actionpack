const Router = require('koa-router');
const requireDirectory = require('require-directory');
const RouterGenerator = require('./router_generator');

module.exports = class RouteSet {

  constructor(app_root = null) {
    this.router = new Router();
    this.generator = new RouterGenerator();
    this.app_root = app_root;
    RouterGenerator.set_route_set(this);
    this.endpoints = {};

    if (this.app_root) {
      this.load_controllers();
      this.draw();
    }
  }

  load_controllers(path = null) {
    path = path ? path : `${this.app_root}/app/controllers`
    let endpoints = requireDirectory(module, path);
    Object.assign(this.endpoints, endpoints);
  }


  draw(path = null) {
    path = path ? path : `${this.app_root}/config/routes`;

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
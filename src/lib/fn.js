"use strict";

const Config = require('./config');
const Utils = require('./utils');
const fs = require('fs-extra');

class Fn {
  constructor(project, name) {
    this.project = project;
    this.name = name;
  }

  static find(project, name) {
    return new Promise((resolve, reject) => {
      const functions = project.config.get('functions');
      
      if (functions && functions[name])
        resolve(new Fn(project, name));
      else reject('No function found!');
    });
  }

  copyTemplate() {
    return new Promise((resolve, reject) => {
      const source = Utils.modulePath('templates', 'function.js');
      const target = this.project.path('functions', this.name + '.js');

      fs.copy(source, target, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  save() {
    return this.copyTemplate()
      .then(() => {
        const functions = this.project.config.get('functions') || {};
        functions[this.name] = functions[this.name] || {};
        functions[this.name].method = this.method;
        functions[this.name].endpoint = this.endpoint;
        this.project.config.set('functions', functions);
      });
  }
}

module.exports = Fn;

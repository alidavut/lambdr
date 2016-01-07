"use strict";

const fs = require('fs');

class Config {
  constructor(project) {
    this.project = project;
  }

  create() {
    fs.writeFileSync(this.project.configPath, '{}');
  }

  get all() {
    return require(this.project.configPath);
  }

  get(key) {
    return this.all[key];
  }

  set(key, value) {
    const config = this.all;
    config[key] = value;
    fs.writeFileSync(this.project.configPath, JSON.stringify(config, null, 2));
  }
}

module.exports = Config;

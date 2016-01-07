"use strict";

const fs = require('fs');

class Config {
  constructor(project, configPath) {
    this.project = project;
    this.configPath = configPath || this.project.configPath
  }

  create() {
    fs.writeFileSync(this.configPath, '{}');
  }

  get all() {
    return require(this.configPath);
  }

  get(key) {
    return this.all[key];
  }

  set(key, value) {
    const config = this.all;
    config[key] = value;
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }
}

module.exports = Config;

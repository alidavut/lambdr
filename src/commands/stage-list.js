"use strict";

const utils = require('../utils');

module.exports = () => {
  const command = new Command();
  return command.start();
}

class Command {
  constructor() {
  }

  start() {
    return utils
      .checkLambdrProject()
      .then(() => this.list())
      .catch(err => console.log(err.stack || err));
  }

  list() {
    const config = utils.getConfig();

    Object.keys(config.stages).forEach(key => {
      console.log(`* ${key}`);
    });
  }
}

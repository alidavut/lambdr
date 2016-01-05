"use strict";

const utils = require('../utils');

module.exports = (name) => {
  const command = new Command(name);
  return command.start();
}

class Command {
  constructor(name) {
    this.name = name;
  }

  start() {
    return utils
      .checkLambdrProject()
      .catch(console.log);
  }
}

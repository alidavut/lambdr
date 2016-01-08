"use strict";

const Fn = require('../lib/fn');

module.exports = (name) => {
  const command = new Command(global.project, name);
  return command.start();
}

class Command {
  constructor(project, name) {
    this.project = project;
    this.name = name;
  }

  start() {
    return this.project.correct()
      .then(() => Fn.find(this.project, this.name))
      .then(fn => fn.run())
      .catch(err => console.log(err.stack || err));
  }
}

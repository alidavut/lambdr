"use strict";

const Stage = require('../lib/stage');

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
      .then(() => Stage.find(this.project, this.name))
      .then(stage => {
        return stage.remove();
      })
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
  }

  finish() {
    console.log(`${this.name} stage has been removed successfully.`);
  }
}

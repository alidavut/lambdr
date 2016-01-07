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
    this.stage = new Stage(project, name);
  }

  start() {
    return this.project.correct()
      .then(() => Stage.find(this.project, this.name).catch(() => null))
      .then(stage => {
        if (stage) throw 'The stage already exists.';
      })
      .then(() => this.stage.save())
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
  }

  finish() {
    console.log(`${this.name} stage has been created successfully.`);
  }
}

"use strict";

const Fn = require('../lib/fn');
const Stage = require('../lib/stage');

module.exports = (name, stage) => {
  const command = new Command(global.project, name, stage);
  return command.start();
}

class Command {
  constructor(project, name, stage) {
    this.project = project;
    this.name = name;
    this.stage = stage;
  }

  start() {
    return this.project.correct()
      .then(() => Stage.find(this.project, this.stage))
      .then(stage => this.stage = stage)
      .then(() => Fn.find(this.project, this.name))
      .then(fn => this.fn = fn)
      .then(() => this.fn.deploy(this.stage))
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
  }

  finish() {
    const apiId = this.stage.config.restApiId;
    console.log('The function has been deployed to:');
    console.log(`https://${apiId}.execute-api.us-east-1.amazonaws.com/lambdr${this.fn.config.endpoint}`);
  }
}

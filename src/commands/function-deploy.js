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
      .then(stage => Fn.find(this.project, this.name).then(fn => ({ fn: fn, stage: stage })))
      .then(res => res.fn.deploy(res.stage).then(() => res))
      .then(res => this.finish(res))
      .catch(err => console.log(err.stack || err));
  }

  finish(res) {
    const apiId = res.stage.config.restApiId;
    console.log('The function has been deployed to:');
    console.log(`https://${apiId}.execute-api.us-east-1.amazonaws.com/lambdr/${this.name}`);
  }
}

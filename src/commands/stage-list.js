"use strict";

const Stage = require('../lib/stage');

module.exports = () => {
  const command = new Command(global.project);
  return command.start();
}

class Command {
  constructor(project) {
    this.project = project;
  }

  start() {
    return this.project.correct()
      .then(() => this.list())
      .catch(err => console.log(err.stack || err));
  }

  list() {
    const stages = Stage.all(this.project);

    if (stages.length) {
      stages.forEach(stage => {
        console.log((`* ${stage.name}`));
      });
    } else {
      console.log('No stages added.');
    }
  }
}

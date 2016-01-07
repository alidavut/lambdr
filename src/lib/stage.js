"use strict";

const Config = require('./config');
const AWSHelper = require('./aws-helper');

class Stage {
  constructor(project, name) {
    this.project = project;
    this.name = name;
  }

  static all(project) {
    const stages = project.config.get('stages') || {};
    return Object.keys(stages).map(i => new Stage(project, i));
  }

  static find(project, name) {
    return new Promise((resolve, reject) => {
      const stages = project.config.get('stages');

      if (stages && stages[name])
        resolve(new Stage(project, name));
      else reject('No stages found!');
    });
  }

  get config() {
    return this.project.config.get('stages')[this.name];
  }

  exists() {
    return new Promise((resolve, reject) => {
      const stages = Config.get('stages');

      if (stages && stages[this.name]) resolve(true)
      else resolve(false);
    });
  }

  save() {
    const credentials = this.project.credentials;
    const stage = this.name;
    const project = this.project.name;

    return AWSHelper.createRole(credentials, project, stage)
      .then(() => AWSHelper.createRolePolicy(credentials, project, stage))
      .then(() => AWSHelper.createApi(credentials, project, stage))
      .then(apiId => {
        const stages = this.project.config.get('stages') || {};
        stages[this.name] = stages[this.name] || {};
        stages[this.name].restApiId = apiId;
        this.project.config.set('stages', stages);
      });
  }

  remove() {
    const credentials = this.project.credentials;
    const stage = this.name;
    const project = this.project.name;

    return AWSHelper.removeRolePolicy(credentials, project, stage)
      .then(() => AWSHelper.removeRole(credentials, project, stage))
      .then(() => AWSHelper.removeApi(credentials, this.config.restApiId))
      .then(() => {
        const stages = this.project.config.get('stages');
        delete(stages[stage]);
        this.project.config.set('stages', stages);
      });
  }
}

module.exports = Stage;

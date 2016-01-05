"use strict";

const utils = require('../utils');
const AWS = require('aws-sdk');

module.exports = (name) => {
  const command = new Command(name);
  return command.start();
}

class Command {
  constructor(name) {
    this.name = name;
    this.awsCredentials = utils.getCredentials();
  }

  start() {
    return utils
      .checkLambdrProject()
      .then(() => this.checkStageExists())
      .then(() => this.removeRolePolicy())
      .then(() => this.removeRole())
      .then(() => this.setConfig())
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
  }

  checkStageExists() {
    return new Promise((resolve, reject) => {
      const stages = utils.getConfig().stages;

      if (!stages || !stages[this.name]) reject('Stage doesn\'t exist.');
      else resolve();
    });
  }

  removeRolePolicy() {
    return new Promise((resolve, reject) => {
      const config = utils.getConfig();
      const iam = new AWS.IAM(this.awsCredentials);
      const variables = {
        RoleName: `lambdr_${config.name}_${this.name}`,
        PolicyName: `lambdr_${config.name}_${this.name}_policy`
      }

      console.log('Removing role policy...');

      iam.deleteRolePolicy(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  removeRole() {
    return new Promise((resolve, reject) => {
      const config = utils.getConfig();
      const iam = new AWS.IAM(this.awsCredentials);
      const variables = {
        RoleName: `lambdr_${config.name}_${this.name}`
      }

      console.log('Removing role...');

      iam.deleteRole(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setConfig() {
    const config = utils.getConfig();
    config.stages = config.stages || {};
    delete(config.stages[this.name]);
    return utils.setConfig('stages', config.stages);
  }

  finish() {
    console.log(`${this.name} stage has been removed successfully.`);
  }
}

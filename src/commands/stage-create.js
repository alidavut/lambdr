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
      .then(() => this.createRole())
      .then(() => this.createRolePolicy())
      .then(() => this.setConfig())
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
  }

  checkStageExists() {
    return new Promise((resolve, reject) => {
      const stages = utils.getConfig().stages;

      if (stages && stages[this.name]) reject('Stage has already created');
      else resolve();
    });
  }

  createRole() {
    return new Promise((resolve, reject) => {
      const config = utils.getConfig();
      const iam = new AWS.IAM(this.awsCredentials);
      const policy = JSON.stringify(utils.getAssumeRolePolicyDocument())
      const variables = {
        AssumeRolePolicyDocument: policy,
        RoleName: `lambdr_${config.name}_${this.name}`
      }

      console.log('Creating role...');

      iam.createRole(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  createRolePolicy() {
    return new Promise((resolve, reject) => {
      const config = utils.getConfig();
      const iam = new AWS.IAM(this.awsCredentials);
      const policy = JSON.stringify(utils.getPolicyDocument(this.region))
      const variables = {
        PolicyDocument: policy,
        RoleName: `lambdr_${config.name}_${this.name}`,
        PolicyName: `lambdr_${config.name}_${this.name}_policy`
      }

      console.log('Adding role policy...');

      iam.putRolePolicy(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setConfig() {
    const config = utils.getConfig();
    config.stages = config.stages || {};
    config.stages[this.name] = {};
    return utils.setConfig('stages', config.stages);
  }

  finish() {
    console.log(`${this.name} stage has been created successfully.`);
  }
}

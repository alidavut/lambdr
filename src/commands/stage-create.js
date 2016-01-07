"use strict";

const utils = require('../utils');
const AWS = require('aws-sdk');
const Project = require('../lib/project');

module.exports = (name) => {
  const command = new Command(global.project, name);
  return command.start();
}

class Command {
  constructor(project, name) {
    this.project = project;
    this.name = name;
    this.awsCredentials = utils.getCredentials();
  }

  start() {
    return this.project.correct()
      .then(() => this.checkStageExists())
      .then(() => this.createRole())
      .then(() => this.createRolePolicy())
      .then(() => this.createAPI())
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

  createAPI() {
    return new Promise((resolve, reject) => {
      const config = utils.getConfig();
      const apigateway = new AWS.APIGateway(this.awsCredentials);
      const params = {
        name: `${config.name}-${this.name}`
      };

      console.log('Creating api...');

      apigateway.createRestApi(params, (err, data) => {
        if (err) reject(err);
        else {
          this.restApiId = data.id;
          resolve();
        }
      });
    });
  }

  setConfig() {
    const config = utils.getConfig();
    config.stages = config.stages || {};
    config.stages[this.name] = { restApiId: this.restApiId };
    return utils.setConfig('stages', config.stages);
  }

  finish() {
    console.log(`${this.name} stage has been created successfully.`);
  }
}

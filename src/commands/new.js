"use strict";

const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;
const inquirer = require('inquirer');
const rmdir = require('rimraf');
const AWS = require('aws-sdk');
const utils = require('../utils');

module.exports = (name) => {
  const command = new Command(name);
  return command.start();
}

class Command {
  constructor(name) {
    this.name = name;
    this.target = path.join(process.cwd(), this.name);
    this.removeTarget = false;
  }

  start() {
    return this
      .createFolder()
      .then(() => this.copyTemplate())
      .then(() => this.getCredentials())
      .then(() => this.verifyCredentials())
      .then(() => this.createRole())
      .then(() => this.createRolePolicy())
      .then(() => this.generateAWSFile())
      .then(() => this.generatePackageJSON())
      .then(this.finish)
      .catch(err => {
        console.log(err);
        this.removeTargetDir()
      });
  }

  get awsCredentials() {
    return {
      accessKeyId: this.key,
      secretAccessKey: this.secret,
      region: this.region
    }
  }

  createFolder() {
    return new Promise((resolve, reject) => {
      fs.mkdir(this.target, err => {
        if (err) reject(err);
        else resolve();
        this.removeTarget = true;
      });
    });
  }

  removeTargetDir() {
    if (this.removeTarget) rmdir(this.target, () => {
      console.log('Operation aborted!');
    });
  }

  copyTemplate() {
    return new Promise((resolve, reject) => {
      const source = path.join(__dirname, '../../template');

      ncp(source, this.target, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getCredentials() {
    return new Promise((resolve, reject) => {
      inquirer.prompt([
        {
          type: 'list',
          name: 'region',
          message: 'Select you region :',
          choices: [
            'us-east-1',
            'us-east-2'
          ]
        },
        {
          type: 'input',
          name: 'key',
          message: 'You AWS KEY ID :'
        },
        {
          type: 'input',
          name: 'secret',
          message: 'You AWS KEY SECRET :'
        },
      ], answers => {
        this.region = answers.region;
        this.key = answers.key;
        this.secret = answers.secret;
        resolve();
      });
    });
  }

  verifyCredentials() {
    return new Promise((resolve, reject) => {
      const lambda = new AWS.Lambda(this.awsCredentials);

      console.log('Checking credentials...');

      lambda.listFunctions((err, fns) => {
        if (err) return reject('Your AWS credentials are not valid!');
        resolve();
      });
    });
  }

  createRole() {
    return new Promise((resolve, reject) => {
      const iam = new AWS.IAM(this.awsCredentials);
      const policy = JSON.stringify(utils.getAssumeRolePolicyDocument())
      const variables = {
        AssumeRolePolicyDocument: policy,
        RoleName: `lambdr_${this.name}_executions`
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
      const iam = new AWS.IAM(this.awsCredentials);
      const policy = JSON.stringify(utils.getPolicyDocument(this.region))
      const variables = {
        PolicyDocument: policy,
        RoleName: `lambdr_${this.name}_executions`,
        PolicyName: `lambdr_${this.name}_executions_policy`
      }

      console.log('Adding role policy...');

      iam.putRolePolicy(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  generateAWSFile() {
    return new Promise((resolve, reject) => {
      const fileTarget = path.join(this.target, './.lambdr/aws.json');
      const variables = {
        accessKeyId: this.key,
        secretAccessKey: this.secret,
        region: this.region,
        project: this.name
      }

      fs.writeFile(fileTarget, JSON.stringify(variables, null, 4), err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  generatePackageJSON() {
    return new Promise((resolve, reject) => {
      const fileTarget = path.join(this.target, './package.json');
      const variables = {
        name: this.name
      };

      fs.writeFile(fileTarget, JSON.stringify(variables, null, 4), err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  finish() {
    console.log('Project created!');
  }
}

"use strict";

const utils = require('../utils');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const AWS = require('aws-sdk');
const _ = require('lodash');
const ResourceCreator = require('../lib/aws-recursive-resource-creator');

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
      .then(() => this.checkFunctionExists())
      .then(() => this.getConfig())
      .then(() => this.copyTemplate())
      .then(() => this.setConfig())
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
  }

  checkStageExists() {
    return new Promise((resolve, reject) => {
      const stages = utils.getConfig().stages;

      if (!stages || !Object.keys(stages).length)
        reject('No stage exists, please add one.');
      else resolve();
    });
  }

  checkFunctionExists() {
    return new Promise((resolve, reject) => {
      const functions = utils.getConfig().functions;

      if (functions && functions[this.name])
        reject('The function is already exist.');
      else resolve();
    });
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      inquirer.prompt([
        {
          type: 'input',
          name: 'endpoint',
          message: 'Enter the endpoint for this function :',
          default: `/${this.name}`
        },
        {
          type: 'list',
          name: 'method',
          message: 'Select HTTP method for this function :',
          choices: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE'
          ],
          default: 'GET'
        }
      ], answers => {
        this.method = answers.method;
        this.endpoint = answers.endpoint;
        resolve();
      });
    });
  }

  copyTemplate() {
    return new Promise((resolve, reject) => {
      const source = path.join(__dirname, '../../templates/function.js');
      const target = path.join(process.cwd(), 'functions', this.name + '.js');

      fs.copy(source, target, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setConfig() {
    const config = utils.getConfig();
    config.functions = config.functions || {};
    config.functions[this.name] = {
      method: this.method,
      endpoint: this.endpoint
    };

    return utils.setConfig('stages', config.stages);
  }

  finish() {
    console.log(`${this.name} function has been created successfully.`);
  }
}

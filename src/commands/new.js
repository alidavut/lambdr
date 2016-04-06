"use strict";

const Project = require('../lib/project');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

module.exports = (name) => {
  const command = new Command(name);
  return command.start();
}

class Command {
  constructor(name) {
    this.name = name;
    this.path = path.join(process.cwd(), this.name);
    this.project = new Project(this.path, this.name);
  }

  start() {
    return this.checkDirectory()
      .then(() => this.getCredentials())
      .then(() => this.project.save())
      .then(this.finish)
      .catch(err => {
        console.log(err.stack || err);
        this.remove().then(() => {
          console.log('Operation aborted!');
        });
      });
  }

  checkDirectory() {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(this.path))
        console.log(`There is already a folder named ${this.name}`);
      else resolve();
    })
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
            'us-east-2',
            'eu-west-1',
            'eu-central-1',
            'ap-northeast-1'
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
        this.project._credentials = {
          accessKeyId: answers.key,
          secretAccessKey: answers.secret,
          region: answers.region
        }
        resolve();
      });
    });
  }

  finish() {
    console.log('Project created!');
  }
}

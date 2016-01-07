"use strict";

const Project = require('../lib/project');
const Fn = require('../lib/fn');
const inquirer = require('inquirer');

module.exports = (name) => {
  const command = new Command(global.project, name);
  return command.start();
}

class Command {
  constructor(project, name) {
    this.project = project;
    this.fn = new Fn(project, name);
    this.name = name;
  }

  start() {
    return this.project.correct()
      .then(() => Fn.find(this.project, this.name).catch(() => null))
      .then(fn => {
        if (fn) throw 'The function already exists.';
      })
      .then(() => this.getConfig())
      .then(() => this.fn.save())
      .then(() => this.finish())
      .catch(err => console.log(err.stack || err));
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
        this.fn.method = answers.method;
        this.fn.endpoint = answers.endpoint;
        resolve();
      });
    });
  }

  finish() {
    console.log(`${this.name} function has been created successfully.`);
  }
}

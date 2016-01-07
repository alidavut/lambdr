"use strict";

const Utils = require('./utils');
const Config = require('./config');
const ncp = require('ncp');
const path = require('path');
const AWS = require('aws-sdk');
const AWSHelper = require('./aws-helper');
const rmdir = require('rimraf');
const fs = require('fs');

class Project {
  constructor(path, name) {
    this._path = path;
    this._name = name;
    this.configPath = this.path('config', 'lambdr.json');
    this.credentialsPath = this.path('config', 'aws.json');
    this.envPath = this.path('config', 'env.json');
    this.config = new Config(this);
  }

  get credentials() {
    this._credentials = this._credentials || require(this.credentialsPath);
    return this._credentials;
  }

  get name() {
    this._name = this._name || this.config.get('name');
    return this._name
  }

  exists() {
    return Utils.exists(this._path);
  }

  path() {
    const args = Array.prototype.slice.call(arguments);
    args.unshift(this._path);
    return path.join.apply(null, args);
  }

  correct() {
    const message1 = 'This is not a Lambdr project';
    const message2 = 'AWS Credentials file does not exist';
    const message3 = 'Environment Variables config file does not exist';

    return Utils.existsOrThrow(this.configPath, message1)
      .then(() => Utils.existsOrThrow(this.configPath, message2))
      .then(() => Utils.existsOrThrow(this.configPath, message3))
  }

  copyTemplate() {
    return new Promise((resolve, reject) => {
      const source = Utils.modulePath('templates', 'project');

      ncp(source, this._path, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  set credentials(credentials) {
    this._credentials = credentials;
    const content = JSON.stringify(credentials, null, 2);
    fs.writeFileSync(this.credentialsPath, content);
  }

  generatePackageJSON() {
    const content = JSON.stringify({
      name: this.name
    }, null, 2);

    fs.writeFileSync(this.path('package.json'), content);
  }

  save() {
    console.log('Verifying aws credentials...');
    return AWSHelper.verifyCredentials(this.credentials)
      .then(() => this.copyTemplate())
      .then(() => AWSHelper.getUser(this.credentials))
      .then(user => {
        this.credentials = this._credentials;
        this.generatePackageJSON();
        this.config.create();
        this.config.set('accountId', user.UserId);
        this.config.set('name', this.name);
      });
  }

  remove() {
    return new Promise((resolve, reject) => {
      rmdir(this._path, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Project;

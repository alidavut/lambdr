"use strict";

const Config = require('./config');
const Utils = require('./utils');
const Stage = require('./stage');
const fs = require('fs-extra');
const ResourceCreator = require('./aws-recursive-resource-creator');
const AWSHelper = require('./aws-helper');
const ncp = require('ncp');
const archiver = require('archiver');
const rmdir = require('rimraf');

class Fn {
  constructor(project, name) {
    this.project = project;
    this.name = name;
  }

  static all(project) {
    const functions = project.config.get('functions') || {};
    return Object.keys(functions).map(i => new Fn(project, i));
  }

  static find(project, name) {
    return new Promise((resolve, reject) => {
      const functions = project.config.get('functions');

      if (functions && functions[name])
        resolve(new Fn(project, name));
      else reject('No function found!');
    });
  }

  get config() {
    return this.project.config.get('functions')[this.name];
  }

  get path() {
    return this.project.path('functions', this.name + '.js')
  }

  copyTemplate() {
    return new Promise((resolve, reject) => {
      const source = Utils.modulePath('templates', 'function.js');
      const target = this.project.path('functions', this.name + '.js');

      fs.copy(source, target, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  createEndpoint(stage) {
    console.log('Configuring the endpoints...');

    const resourceCreator = new ResourceCreator(
      this.project.credentials,
      stage.config.restApiId
    );

    return resourceCreator.getOrCreate(this.config.endpoint)
      .then((resourceId) => AWSHelper.putMethod(
          this.project.credentials,
          stage.config.restApiId,
          resourceId,
          this.config.method
        )
        .then(() => resourceId).catch(() => resourceId)
      )
      .then(resourceId => AWSHelper.putIntegration(
          this.project.credentials,
          stage.config.restApiId,
          resourceId,
          this.config.method,
          this.project.config.get('accountId'),
          this.project.name,
          stage.name,
          this.name
        ).then(() => resourceId).catch(() => resourceId)
      )
      .then(resourceId => AWSHelper.putMethodResponse(
          this.project.credentials,
          stage.config.restApiId,
          resourceId,
          this.config.method
        ).then(() => resourceId).catch(() => resourceId)
      )
      .then(resourceId => AWSHelper.putIntegrationResponse(
          this.project.credentials,
          stage.config.restApiId,
          resourceId,
          this.config.method
        ).then(() => resourceId).catch(() => resourceId)
      )
      .then(resourceId => AWSHelper.addLambdaPermission(
          this.project.credentials,
          stage.config.restApiId,
          this.config.method,
          this.config.endpoint,
          this.project.config.get('accountId'),
          this.project.name,
          stage.name,
          this.name
        ).then(() => resourceId).catch(() => resourceId)
      )
      .then(resourceId => AWSHelper.deployApi(
        this.project.credentials,
        stage.config.restApiId
      ));
  }

  removeTemp() {
    return new Promise((resolve, reject) => {
      rmdir(Utils.modulePath('.deploy'), err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  zip(stage) {
    console.log('Preparing zip file...');

    return this.removeTemp()
      .then(() => new Promise(resolve => {
        fs.mkdirSync(Utils.modulePath('.deploy'));
        resolve();
      }))
      .then(() => new Promise((resolve, reject) => {
        const source = this.project.path();
        const target = Utils.modulePath('.deploy', 'codes');

        ncp(source, target, err => {
          if (err) reject(err);
          else resolve();
        });
      }))
      .then(() => this.deleteSensitiveFiles())
      .then(() => this.wrapFunction(stage))
      .then(() => new Promise((resolve, reject) => {
        const archive = archiver('zip');
        const out = fs.createWriteStream(Utils.modulePath('.deploy/code.zip'));
        archive.on('error', reject);
        archive.on('end', resolve);
        archive.pipe(out);
        archive.file(Utils.modulePath('templates', 'lambdr.js'), { name: 'lambdr.js' });
        archive.directory(Utils.modulePath('.deploy', 'codes'), '');
        archive.finalize();
      }));
  }

  deleteSensitiveFiles() {
    return new Promise((resolve, reject) => {
      fs.removeSync(Utils.modulePath('.deploy', 'codes', 'config', 'aws.json'));
      resolve();
    });
  }

  wrapFunction(stage) {
    return new Promise(resolve => {
      const fnTarget = Utils.modulePath('.deploy', 'codes', 'functions', this.name + '.js');
      const file = fs.readFileSync(this.path);

      let wrapped = `process.env.NODE_ENV="${stage.name}";\n`;
      wrapped += `require('../lambdr');\n${file}`;
      fs.writeFileSync(fnTarget, wrapped);
      resolve();
    });
  }

  syncFunction(stage) {
    console.log('Uploading function...');

    return AWSHelper.createFunction(
      this.project.credentials,
      this.name,
      this.project.config.get('accountId'),
      this.project.name,
      stage.name,
      Utils.modulePath('.deploy', 'code.zip')
    );
  }

  deploy(stage) {
    return this.zip(stage)
      .then(() => this.syncFunction(stage))
      .then(() => this.createEndpoint(stage))
      .then(() => this.removeTemp());
  }

  save() {
    return this.copyTemplate()
      .then(() => {
        const functions = this.project.config.get('functions') || {};
        functions[this.name] = functions[this.name] || {};
        functions[this.name].method = this.method;
        functions[this.name].endpoint = this.endpoint;
        this.project.config.set('functions', functions);
      });
  }
}

module.exports = Fn;

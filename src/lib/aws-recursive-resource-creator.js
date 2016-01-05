"use strict";

const AWS = require('aws-sdk');
const _ = require('lodash');

class ResourceCreator {
  constructor(credentials, restApiId) {
    this.api = new AWS.APIGateway(credentials);
    this.restApiId = restApiId;
  }

  getOrCreate(path) {
    return this.loadResources().then(() => this._getOrCreate(path));
  }

  _getOrCreate(path) {
    const pathArray = path.split('/');
    const currentPath = pathArray.splice(pathArray.length - 1, 1)[0];
    const parentPath = pathArray.length === 1 ? '/' : pathArray.join('/');
    const parent = _.find(this.resources, i => i.path === parentPath);
    const resource = _.find(this.resources, i => i.path === path);

    if (resource) {
      return new Promise(resolve => resolve(resource.id));
    } else if (parent) {
      return new Promise((resolve, reject) => {
        this.api.createResource({
          parentId: parent.id,
          pathPart: currentPath,
          restApiId: this.restApiId
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            this.resources.push(data);
            resolve(data.id);
          }
        });
      });
    } else {
      return this
        .getOrCreate(parentPath)
        .then(() => this.getOrCreate(path));
    }
  }

  loadResources() {
    return new Promise((resolve, reject) => {
      this.api.getResources({restApiId: this.restApiId}, (err, data) => {
        if (err) {
          reject(err);
        } else {
          this.resources = data.items;
          resolve();
        }
      });
    });
  }
}

module.exports = ResourceCreator

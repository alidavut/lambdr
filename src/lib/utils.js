"use strict";

const path = require('path');
const fs = require('fs');

module.exports = {
  modulePath() {
    const args = Array.prototype.slice.call(arguments);
    args.unshift('../../');
    args.unshift(__dirname);
    return path.join.apply(null, args);
  },

  exists(path) {
    return new Promise(resolve => {
      fs.exists(path, exists => {
        resolve(exists);
      });
    });
  },

  existsOrThrow(path, error) {
    return this.exists(path).then(result => {
      if (!result) throw new Error(error);
    });
  }
}

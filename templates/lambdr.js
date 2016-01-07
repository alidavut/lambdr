var env = require('./config/env');

Object.keys(env.default).forEach(function(key) {
  process.env[key] = env.default[key];
});

Object.keys(env[process.env.NODE_ENV]).forEach(function(key) {
  process.env[key] = env[process.env.NODE_ENV][key];
});

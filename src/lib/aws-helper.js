const AWS = require('aws-sdk');

module.exports = {
  verifyCredentials(credentials) {
    return new Promise((resolve, reject) => {
      const lambda = new AWS.Lambda(credentials);

      lambda.listFunctions((err, fns) => {
        if (err) return reject('Your AWS credentials are not valid!');
        resolve();
      });
    });
  },

  removeRolePolicy(credentials, projectName, stageName) {
    return new Promise((resolve, reject) => {
      const iam = new AWS.IAM(credentials);
      const variables = {
        RoleName: `lambdr_${projectName}_${stageName}`,
        PolicyName: `lambdr_${projectName}_${stageName}_policy`
      }

      console.log('Removing role policy...');

      iam.deleteRolePolicy(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  removeRole(credentials, projectName, stageName) {
    return new Promise((resolve, reject) => {
      const iam = new AWS.IAM(credentials);
      const variables = {
        RoleName: `lambdr_${projectName}_${stageName}`
      }

      console.log('Removing role...');

      iam.deleteRole(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  removeApi(credentials, id) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        restApiId: id
      };

      console.log('Removing api...');

      apigateway.deleteRestApi(params, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

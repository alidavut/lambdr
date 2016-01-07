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

  createRolePolicy(credentials, projectName, stageName) {
    return new Promise((resolve, reject) => {
      const iam = new AWS.IAM(credentials);
      const policy = JSON.stringify(this.getPolicyDocument(credentials.region));
      const variables = {
        PolicyDocument: policy,
        RoleName: `lambdr_${projectName}_${stageName}`,
        PolicyName: `lambdr_${projectName}_${stageName}_policy`
      }

      console.log('Adding role policy...');

      iam.putRolePolicy(variables, (err, data) => {
        if (err) reject(err);
        else resolve();
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

  createRole(credentials, projectName, stageName) {
    return new Promise((resolve, reject) => {
      const iam = new AWS.IAM(credentials);
      const policy = JSON.stringify(this.getAssumeRolePolicyDocument())
      const variables = {
        AssumeRolePolicyDocument: policy,
        RoleName: `lambdr_${projectName}_${stageName}`
      }

      console.log('Creating role...');

      iam.createRole(variables, (err, data) => {
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

  createApi(credentials, projectName, stageName) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        name: `${projectName}-${stageName}`
      };

      console.log('Creating api...');

      apigateway.createRestApi(params, (err, data) => {
        if (err) reject(err);
        else {
          resolve(data.id);
        }
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
  },

  getAssumeRolePolicyDocument() {
    return {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com"
          },
          Action: "sts:AssumeRole"
        }
      ]
    }
  },

  getPolicyDocument(region) {
    return {
      Statement: [
        {
          Resource: `arn:aws:logs:${region}:*:*`,
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          Effect: "Allow"
        }
      ],
      Version: "2012-10-17"
    }
  }
}

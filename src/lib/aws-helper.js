const AWS = require('aws-sdk');
const fs = require('fs');

module.exports = {
  getUser(credentials) {
    return new Promise((resolve, reject) => {
      const iam = new AWS.IAM(credentials);

      iam.getUser({}, function(err, data) {
        if (err) reject(err);
        else resolve(data.User);
      });
    });
  },

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

  deployApi(credentials, restApiId) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        restApiId: restApiId,
        stageName: 'lambdr'
      };

      console.log('Deploying api...');

      apigateway.createDeployment(params, err => {
        if (err) reject(err);
        else resolve()
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

  putMethod(credentials, restApiId, resourceId, method) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        authorizationType: 'NONE',
        httpMethod: method,
        resourceId: resourceId,
        restApiId: restApiId,
        apiKeyRequired: false
      };

      apigateway.putMethod(params, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  putMethodResponse(credentials, restApiId, resourceId, method) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        httpMethod: method,
        resourceId: resourceId,
        restApiId: restApiId,
        statusCode: '200'
      };

      apigateway.putMethodResponse(params, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  putIntegration(credentials, restApiId, resourceId, method, accountId, projectName, stageName, functionName) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        httpMethod: method,
        integrationHttpMethod: 'POST',
        resourceId: resourceId,
        restApiId: restApiId,
        type: 'AWS',
        uri: `arn:aws:apigateway:${credentials.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${credentials.region}:${accountId}:function:${projectName}-${functionName}-${stageName}/invocations`,
        credentials: null,
        requestParameters: {},
        cacheKeyParameters: [],
        cacheNamespace: null
      };

      apigateway.putIntegration(params, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  putIntegrationResponse(credentials, restApiId, resourceId, method) {
    return new Promise((resolve, reject) => {
      const apigateway = new AWS.APIGateway(credentials);
      const params = {
        httpMethod: method,
        resourceId: resourceId,
        restApiId: restApiId,
        statusCode: '200'
      };

      apigateway.putIntegrationResponse(params, (err, data) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  createFunction(credentials, name, accountId, projectName, stageName, zip) {
    return new Promise((resolve, reject) => {
      const params = {
        Code: {
          ZipFile: new Buffer(fs.readFileSync(zip))
        },
        FunctionName: `${projectName}-${name}-${stageName}`,
        Handler: `functions/${name}.handler`,
        Role: `arn:aws:iam::${accountId}:role/lambdr_${projectName}_${stageName}`,
        Runtime: 'nodejs'
      };

      const lambda = new AWS.Lambda(credentials);

      lambda.createFunction(params, err => {
        if (err) reject(err);
        else resolve();
      });
    }).catch(() => this.updateFunctionCode(
      credentials, name, projectName, stageName, zip
    ));
  },

  updateFunctionCode(credentials, name, projectName, stageName, zip) {
    return new Promise((resolve, reject) => {
      const params = {
        ZipFile: new Buffer(fs.readFileSync(zip)),
        Publish: true,
        FunctionName: `${projectName}-${name}-${stageName}`,
      };

      const lambda = new AWS.Lambda(credentials);

      lambda.updateFunctionCode(params, (err, v) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  addLambdaPermission(credentials, restApiId, method, path, accountId, projectName, stageName, name) {
    return new Promise((resolve, reject) => {
      const params = {
        Action: 'lambda:InvokeFunction',
        FunctionName: `${projectName}-${name}-${stageName}`,
        Principal: 'apigateway.amazonaws.com',
        SourceArn: `arn:aws:execute-api:${credentials.region}:${accountId}:${restApiId}/*/${method}${path}`,
        StatementId: `lambdr-sapid-${projectName}-${name}-${stageName}-${path}-${method}`.replace(/[\/{}]/g, '-')
      };

      const lambda = new AWS.Lambda(credentials);
      lambda.addPermission(params, err => {
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

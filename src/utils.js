const fs = require('fs');
const path = require('path');
const lambdrPath = path.join(process.cwd(), 'config', 'lambdr.json');
const awsPath = path.join(process.cwd(), 'config', 'aws.json');

exports.checkLambdrProject = () => new Promise((resolve, reject) => {
  const file = path.join(process.cwd(), 'config', 'lambdr.json');
  fs.exists(file, exists => {
    if (exists) resolve();
    else reject('This directory is not a lambdr project.');
  })
});

exports.getCredentials = () => require(awsPath);
exports.getConfig = () => require(lambdrPath);
exports.setConfig = (key, value) => new Promise((resolve, reject) => {
  const config = this.getConfig();
  config[key] = value;

  const content = JSON.stringify(config, null, 2)
  fs.writeFile(lambdrPath, content, err => {
    if (err) reject(err);
    else resolve();
  });
});

exports.getAssumeRolePolicyDocument = () => {
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
}

exports.getPolicyDocument = (region) => {
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

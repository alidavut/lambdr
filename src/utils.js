const fs = require('fs');
const path = require('path');

exports.checkLambdrProject = () => new Promise((resolve, reject) => {
  const file = path.join(process.cwd(), './.lambdr');
  fs.exists(file, exists => {
    if (exists) resolve();
    else reject('This directory is not a lambdr project.');
  })
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

Lambdr
======
Lambdr is automated deployment and flow management module to create powerful micro services with AWS Lambda functions. It's still in development and looking for contributors. 🤘

## Getting Started
First we need to install cli globally.
```
npm install lambdr -g
```

### Creating a project
Assume that a lambdr project as a micro service.
```
lambdr new my-micro-service
```

This will create a folder named 'my-micro-service' and it includes the following files:

```
my-micro-service
|-- config
|   |-- aws.json (AWS credentials)
|   |-- env.json (Environment variables for every stage)
|   |-- lambdr.json (Lambder configurations)
|-- functions
|   |-- .... (You lambda functions will be here)
|-- package.json
|-- .gitignore
```

### Creating a function
Let's create a signup function. After you enter the command the cli will ask you the HTTP method for the function and the endpoint.

We can use ```POST``` method and ```/users``` endpoint for signup function.

```
lambdr function:create signup
```

After the command finishes, a js file will be added into ```functions``` folder.

### Running a function locally
It's really easy to run the function in your local machine by using this command:
```
lambdr function:run signup
```

Before running a function you can pass ```event``` parameters by changing ```testEvents``` function property in ```config/lambdr.json```.
```javascript
{
  "accountId": "123456789",
  "name": "my-micro-service",
  "functions": {
    "signup": {
      "method": "POST",
      "endpoint": "/users",
      "testEvent": {
        "email": "test@example.com",
        "password": "incredible_password"
      }
    }
  }
}
```

### Create a stage
To deploy your functions you need to create a stage. You can create multiple stages like (development, staging, production).

Assume we want a ```development``` stage for now.

```
lambdr stage:create development
```

### Deploy a function
```
lambdr function:deploy signup development
```

We deployed signup function into development stage. After this command you will see an endpoint to test this function.

### Using environment variables
Lambdr deploys environment variables for it's own stage. You can set environment variables in ```config/env.json``` file. An example ```env.json```:
```javascript
{
  "default": {
    "APP_NAME": "Example OAuth Micro Service",
    "TEST_STAGE": true
  },
  "local": {
    "DYNAMO_TABLE": "users-local"
  },
  "development": {
    "DYNAMO_TABLE": "users-dev"
  },
  "production": {
    "TEST_STAGE": false
  }
}
```

Notice that ```TEST_STAGE``` will be overridden in production stage.

```javascript
exports.handler = function(event, context) {
  if (process.env.TEST_STAGE) {
    context.done(null, 'This stage is for testing');
  } else {
    context.done(null, 'This stage is production');
  }
}
```



## Other Commands
### List stages
```
lambdr stage:list
```

### Remove a stage
```
lambdr stage:remove staging
```

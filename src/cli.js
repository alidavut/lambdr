var program = require('commander');

program
  .version('0.0.1')
  .description('Lambdr');

program
  .command('new <projectName>')
  .description('creates a new project')
  .action(require('./commands/new'));

program
  .command('function:create <functionName>')
  .description('creates a new lambda function')
  .action(require('./commands/function-create'));

program
  .command('function:deploy [functionName]')
  .description('deploys a function')
  .action(require('./commands/function-deploy'));

  program
    .command('function:release <functionName>')
    .description('deploys a function')
    .action(require('./commands/function-release'));

program.parse(process.argv);

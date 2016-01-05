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
  .command('stage:create')
  .description('creates a new stage')
  .action(require('./commands/stage-create'));

program
  .command('stage:list')
  .description('lists all stages')
  .action(require('./commands/stage-list'));

program
  .command('stage:remove <stageName>')
  .description('removes a stage')
  .action(require('./commands/stage-remove'));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

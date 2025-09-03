import * as dotenv from 'dotenv';
import { program } from 'commander';

import rancherService from '@/service/rancher-service';

dotenv.config();

async function main() {
  program
    .name('rancher-utils')
    .description('CLI to some Rancher utilities')
    .version('1.0.0', '-v, --version');

  program
    .command('restart')
    .description('Restart containers of one or more environments')
    .requiredOption('-e, --environments [environments...]', 'specify environments')
    .requiredOption('-c, --containers [containers...]', 'specify containers')
    .action(rancherService.restartContainers);

  program
    .command('find-database-properties')
    .description('Get all environments database connection properties')
    .action(rancherService.getAllProperties);

  program
    .command('deploy')
    .description('Deploy containers of one or more environments')
    .requiredOption('-e, --environments [environments...]', 'specify environments')
    .requiredOption('-c, --containers [containers...]', 'specify containers')
    .option('-t, --target <value>', 'which branch to deploy', 'main')
    .option('-b, --build', 'build the project')
    .action(rancherService.deployContainers);

  // program
  //   .command('checkout')
  //   .description('Checkout project(s) to determined branch')
  //   .option('-b, --branch <value>', 'which branch to checkout', 'main')
  //   .option('-p, --projects [projects...]', 'Services to build, if none, all services will build')
  //   .action(projectService.buildProjects);

  program.parse();
  return 0;
}

main();

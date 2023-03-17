import * as dotenv from 'dotenv';
import { program } from 'commander';

import rancherService from './service/rancherService';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('ttycolor')().defaults();
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

  program.parse();
  return 0;
}

main();

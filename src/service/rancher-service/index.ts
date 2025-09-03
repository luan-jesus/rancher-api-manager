import rancherRepository from '@/repository/rancher-repository';
import logger from '@/infrastructure/logger';
import type RancherProject from '@/models/rancher-project';
import type RancherContainer from '@/models/rancher-container';
import fs, { readdirSync, statSync } from 'fs';
import { promisify } from 'util';

import RancherStates from '@/models/rancher-project/rancher-states-enum';
import { ansiTextColor, AnsiColor} from '@/utils/ansi-utils';
import { exec } from 'child_process';
import { join } from 'path';

interface RestartContainersParams {
  environments: string[];
  containers: string[];
}

const execPromise = promisify(exec);

async function restartContainers({ environments, containers }: RestartContainersParams) {
  for (const env of environments) {
    try {
      logger.info(`==============================================`);
      logger.info(`Searching for project: ${ansiTextColor(env, AnsiColor.LIGHT_BLUE)}`);
      logger.info(`==============================================`);
      const projectResponse = await rancherRepository.findRancherProjectByName(env);
      const project = projectResponse?.data?.find((p) => p.name === env);

      if (!project) {
        throw new Error(`Project ${env} not found`);
      }

      logger.info(`Project:`, printRancherObject(project));

      if (project.state !== RancherStates.ACTIVE) {
        throw new Error('Project is not active');
      }

      logger.info(`Searching for containers`);
      const rancherContainersResponse = await rancherRepository.findContainersByProjectId(project.id);
      const rancherContainers = rancherContainersResponse?.data;

      if (!rancherContainers || rancherContainers.length === 0) {
        throw new Error(`No containers were found for project: {id: ${project.id}, name: ${project.name}}`);
      }

      const selectedContainers = rancherContainers.filter((c) => nameExistsInList(containers, c.name));

      if (!selectedContainers || selectedContainers.length === 0) {
        throw new Error(`None of the specified containers were found on project: {id: ${project.id}, name: ${project.name}}`);
      }

      logger.info(`Containers to restart:`, selectedContainers.map((sc) => sc.name));

      for (const sc of selectedContainers) {
        try {
          logger.info(`Restarting:`, { name: sc.name, id: sc.id });
          await rancherRepository.restartContainer(project.id, sc.id);
          logger.success(`Container restarted successfully`);
        } catch (e) {
          if (e instanceof Error) {
            logger.warn('Error: ' + e);
          }
        }
      }
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        logger.error(e.message);
        continue;
      }
    }
  }
}

async function getAllProperties() {
  logger.info(`==============================================`);
  logger.info(`Searching for projects`);
  logger.info(`==============================================`);
  const projectResponse = await rancherRepository.findAllRancherProjects();
  const projects = projectResponse?.data
    .filter(p => p.state === RancherStates.ACTIVE)
    .map(p => ({id: p.id, name: p.name}));

  const projectsWithDatabase = [];

  for (const project of projects) {
    projectsWithDatabase.push({
        ...project,
        databases: await getProjectDatabaseProperties(project.id)
    });
  }

  if (!fs.existsSync('./output')){
      fs.mkdirSync('./output');
  }

  const fileOutput = `./output/json-${getLocalDateTimeString()}.json`;
  fs.writeFileSync(fileOutput, JSON.stringify(projectsWithDatabase), 'utf-8');
  logger.success(`Output file saved at: ${fileOutput}`);
}

async function deployContainers({ environments, containers, target, build }: { environments: string[]; containers: Container[]; target: string; build: boolean }) {
  logger.info(`Updating local projects`);

  await updateLocalProjects(target, build);
  logger.info(`Updated!`);

  await Promise.all(environments.map(async (env) => {
    logger.info(`${env} - Sending artifacts for`);
    await publishArtifacts(env, containers);

    logger.info(`${env} - Restarting containers`);
    await restartContainers({ environments: [env], containers });

    logger.info(`${env} - Containers restarted`);

    logger.info(`${env} - Checking status`);
    await checkContainersStatus(env, containers);
    logger.info(`${env} - Status check completed`);
  }));

}

async function updateLocalProjects(target: string, build = false): Promise<void> {
  const rootDir = process.env.PROJECT_BASE_PATH || '.';
  try {
    const entries = readdirSync(rootDir);

    for (const entry of entries) {
      const entryPath = join(rootDir, entry);
      const isDirectory = statSync(entryPath).isDirectory();

      if (isDirectory) {
        try {
          const { stdout: isGitRepo } = await execPromise('git rev-parse --is-inside-work-tree', { cwd: entryPath });
          if (isGitRepo.trim() === 'true') {
            logger.info(`Syncing repository in: ${entryPath}`);

            // Navigate to the repository and checkout main branch
            logger.info(' -> Checking out main branch...');
            await execPromise(`git checkout ${target} --force`, { cwd: entryPath });

            // Pull latest changes from the main branch
            logger.info(' -> Discarding local changes...');
            await execPromise('git restore .', { cwd: entryPath });

            // Pull latest changes from the main branch
            logger.info(' -> Pulling latest changes...');
            await execPromise('git pull', { cwd: entryPath });

            if (build) {
              if (entry === 'regulatorio-app') {
                logger.info(` -> Building front`);
                // await execPromise('nvm use 8 && npm run build:prod', { cwd: entryPath });
              } else {
                logger.info(` -> Building service`);
                await execPromise('mvn clean install -DskipTests', { cwd: entryPath });
              }
            }

            logger.info('Repository synced successfully.');
          }
        } catch (error) {
          if (error instanceof Error) {
            logger.error(`Error processing directory ${entryPath}: ${error.message}`);
          }
        }
      }
    }
    logger.info('All Git repositories processed.');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Could not read directory ${rootDir}: ${error.message}`);
    }
  }
}


function getLocalDateTimeString() {
  return new Date()
    .toLocaleString()
    .replace(/\//g, '-')
    .replace(/:/g, '-')
    .replace(', ', 'T');
}

type EnvironmentDatabaseProperties = {
  serviceName?: string;
  dbUrl?: string;
  dbUser?: string;
  dbPassword?: string;
  dbPool?: string;
  rotinasImediatas?: string;
  integradorThreads?: string;
}

async function getProjectDatabaseProperties(envId:string): Promise<EnvironmentDatabaseProperties[] | null> {
  logger.info(`Finding project data from ${envId}`);
  const response = await rancherRepository.findContainersByProjectId(envId);

  const databaseProperties: EnvironmentDatabaseProperties[] = [];

  // for (const container of response.data) {
  //   if (container.name.includes('rotina') && container.environment) {

  //     if (container.environment['DB_URL']) {
  //       databaseProperties.push({
  //         rotinasImediatas: container.environment['POOL_SIZE_IMEDIATA_CONTABIL']
  //       });
  //     }
  //   }

  for (const container of response.data) {

    //Find all services envs
    if (container.environment) {
      if (container.environment['DB_URL']) {
        console.log(container.environment);
        databaseProperties.push({
          serviceName: container.name,
          dbUrl: container.environment['DB_URL'],
          dbUser: container.environment['DB_USER'],
          dbPassword: container.environment['DB_PASSWORD'],
          // dbPool: container.environment['DB_MAX_POOL']
        });
      }
    }
  }

  return databaseProperties;
}

function nameExistsInList(list: string[], name: string): boolean {
  for (const element of list) {
    if (name.includes(element)) {
      return true;
    }
  }
  return false;
}

function printRancherObject(object: RancherProject | RancherContainer) {
  return {
    id: object.id,
    name: object.name,
    description: object.description,
    state: object.state,
    type: object.type,
    uuid: object.uuid,
  };
}

type Container = 'app' | 'arquivo' | 'auditoria' | 'autenticacao' | 'contabilizador' | 'database' | 'email' | 'gateway' | 'gerencial' | 'importador' | 'integrador' | 'movimentacao' | 'parametro' | 'rotina' | 'saldo';

async function publishArtifacts(env: string, containers: Container[]) {
  const rootDir = process.env.PROJECT_BASE_PATH || '.';

  for (const container of containers) {
    const category = getCategory(container);

    if (container === 'app') {
      const path = join(rootDir, `regulatorio-${container}`);

      logger.info(` -> Publishing ${env}.${category}.1a.regulatorio.marketpay.com.br`);

      await execPromise(`rsync -rave "ssh -o StrictHostKeyChecking=no -i ${process.env.SSH_KEY}" --delete ./dist/* regulatorio@${env}.${category}.1a.regulatorio.marketpay.com.br:/services/html`, { cwd: path });
    } else {
      const path = join(rootDir, `regulatorio-${container}-service`);

      logger.info(` -> Publishing ${env}.${category}.1a.regulatorio.marketpay.com.br`);

      await execPromise(`rsync -rave "ssh -o StrictHostKeyChecking=no -i ${process.env.SSH_KEY}" --include '*.jar' --exclude '*' ./target/* regulatorio@${env}.${category}.1a.regulatorio.marketpay.com.br:/services`, { cwd: path });
    }
  }
}

function checkContainersStatus(env: string, containers: string[]) {
  throw new Error('Function not implemented.');
}

function getCategory(container: Container): string {
  switch (container) {
    case 'app':
      return 'front';
    case 'arquivo':
    case 'auditoria':
    case 'autenticacao':
    case 'contabilizador':
    case 'gerencial':
    case 'importador':
    case 'integrador':
    case 'movimentacao':
    case 'rotina':
    case 'saldo':
      return 'business';
    case 'gateway':
    case 'parametro':
    case 'email':
      return 'support';
    default:
      return 'business';
  }
}

export default { restartContainers, getAllProperties, deployContainers };


import rancherRepository from '@/repository/rancher-repository';
import logger from '@/infrastructure/logger';
import type RancherProject from '@/models/rancher-project';
import type RancherContainer from '@/models/rancher-container';
import fs from 'fs';
import RancherStates from '@/models/rancher-project/rancher-states-enum';
import { ansiTextColor, AnsiColor} from '@/utils/ansi-utils';
import { env } from 'process';

interface RestartContainersParams {
  environments: string[];
  containers: string[];
}

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

      if (!rancherContainers ?? rancherContainers.length === 0) {
        throw new Error(`No containers were found for project: {id: ${project.id}, name: ${project.name}}`);
      }

      const selectedContainers = rancherContainers.filter((c) => nameExistsInList(containers, c.name));

      if (!selectedContainers ?? selectedContainers.length === 0) {
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

  for (const container of response.data) {
    if (container.name.includes('rotina') && container.environment) {

      if (container.environment['DB_URL']) {
        databaseProperties.push({
          rotinasImediatas: container.environment['POOL_SIZE_IMEDIATA_CONTABIL']
        });
      }
    }

    // Find all services envs
    // if (!container.name.includes('database') && container.environment) {
    //   if (container.environment['DB_URL']) {
    //     console.log(container.environment);
    //     databaseProperties.push({
    //       serviceName: container.name,
    //       dbUrl: container.environment['DB_URL'],
    //       dbUser: container.environment['DB_USER'],
    //       dbPassword: container.environment['DB_PASSWORD'],
    //       dbPool: container.environment['DB_MAX_POOL']
    //     });
    //   }
    // }
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

export default { restartContainers, getAllProperties };

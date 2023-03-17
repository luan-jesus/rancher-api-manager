import rancherRepository from '@/repository/rancherRepository';
import logger, { ansiColorLightBlue, ansiReset } from '@/infrastructure/logger';
import type RancherProject from '@/models/RancherProject';
import type RancherContainer from '@/models/RancherContainer';
import RancherStates from '@/models/RancherProject/StatesEnum';

interface RestartContainersParams {
  environments: string[];
  containers: string[];
}

async function restartContainers({ environments, containers }: RestartContainersParams) {
  for (const env of environments) {
    try {
      logger.info(`==============================================`);
      logger.info(`Searching for project: ${ansiColorLightBlue}${env}${ansiReset}`);
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
          logger.info(`==============================================`);
          logger.info(`Restarting:`, { name: sc.name, id: sc.id });
          logger.info(`==============================================`);
          await rancherRepository.restartContainer(project.id, sc.id);
          logger.success(`Container restarted successfully`);
        } catch (e) {
          if (e instanceof Error) {
            logger.warn('Error: ' + e);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e.message);
        break;
      }
    }
  }
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

export default { restartContainers };

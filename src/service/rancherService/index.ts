import rancherRepository from 'repository/rancherRepository';

interface RestartContainersParams {
  environments: string[];
  containers: string[];
}

async function restartContainers({ environments, containers }: RestartContainersParams) {
  for (const env of environments) {
    try {
      console.info(`==============================================`);
      console.info(`searching for project:`, env);
      console.info(`==============================================`);
      const projectResponse = await rancherRepository.findRancherProjectByName(env);
      const project = projectResponse?.data?.find((p) => p.name === env);

      if (!project) {
        throw new Error(`project ${env} not found`);
      }

      console.info(`project:`, `{id: ${project.id}, name: ${project.name}, description: ${project.description}, state: ${project.state}}`);

      console.info(`Searching for containers`);
      const rancherContainersResponse = await rancherRepository.findContainersByProjectId(project.id);
      const rancherContainers = rancherContainersResponse?.data;

      if (!rancherContainers || rancherContainers.length === 0) {
        throw new Error(`no containers were found for project: {id: ${project.id}, name: ${project.name}}`);
      }

      const selectedContainers = rancherContainers.filter((c) => nameExistsInList(containers, c.name));

      if (!selectedContainers || selectedContainers.length === 0) {
        throw new Error(`none of the specified containers were found on project: {id: ${project.id}, name: ${project.name}}`);
      }

      console.info(`containers to restart:`, selectedContainers.map((sc) => sc.name));

      for (const sc of selectedContainers) {
        try {
          console.info(`==============================================`);
          console.info(`Restarting:`, `{name: ${sc.name}}, id: ${sc.id}`);
          console.info(`==============================================`);
          await rancherRepository.restartContainer(project.id, sc.id);
          console.info(`success`);
        } catch (e) {
          if (e instanceof Error) {
            console.warn('error: ' + e.message);
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error: ${e.message}, ending execution`);
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

export default { restartContainers };

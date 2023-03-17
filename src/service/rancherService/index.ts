import rancherRepository from 'repository/rancherRepository';

interface RestartContainersParams {
  environments: string[];
  containers: string[];
}

async function restartContainers({ environments, containers }: RestartContainersParams) {
  for (const env of environments) {
    try {
      console.info(`Searching for project:`, env);
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

      const selectedContainers = rancherContainers.filter((c) => containers.indexOf(c.name) !== -1);
      if (!selectedContainers || selectedContainers.length === 0) {
        throw new Error(`none of the specified containers were found on project: {id: ${project.id}, name: ${project.name}}`);
      }

      console.info(`containers to restart`, selectedContainers);
      selectedContainers.forEach(async (c) => {
        console.info(`restarting container`, c);
        await rancherRepository.restartContainer(project.id, c.id);
      });
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error: ${e.message}, ending execution`);
        break;
      }
    }
  }
}



export default { restartContainers };

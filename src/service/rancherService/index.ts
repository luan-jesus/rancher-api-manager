import rancherRepository from 'repository/rancherRepository';

interface RestartContainersParams {
  environments: string[];
  containers: string[];
}

async function restartContainers({
  environments,
  containers,
}: RestartContainersParams) {
  try {
    environments.forEach(async (env) => {
      const rancherContainers = await rancherRepository.getEnvironmentContainers(env);

      if (containers.length === 0) {
        throw new Error('Wrong environment or none container was found');
      }

      await rancherRepository.restartEnvironmentContainers(env, rancherContainers);
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    }
  }
}

export default { restartContainers };

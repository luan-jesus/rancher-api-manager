async function getEnvironmentContainers(environment: string): Promise<string[]> {
  return [];
}

async function restartEnvironmentContainers(environment: string, containers: string[]): Promise<void> {
  return;
}

export default { getEnvironmentContainers, restartEnvironmentContainers };

interface BuildProjectsParams {
  branch: string;
  projects: string[];
}

async function buildProjects({ branch, projects }: BuildProjectsParams): Promise<void> {
  console.log(branch);
  console.log(projects);
}

export default { buildProjects };

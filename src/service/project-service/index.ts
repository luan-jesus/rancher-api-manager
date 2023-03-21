import ProjectsEnum from './projects-enum';
import logger from '@/infrastructure/logger';
import { ansiTextColor, AnsiColor } from '@/utils/ansi-utils';
import { exec } from 'child_process';
import util from 'util';

interface BuildProjectsParams {
  branch: string;
  projects: string[];
}

async function buildProjects({ branch, projects }: BuildProjectsParams): Promise<void> {
  const projectsToBuild = projects?.length > 0 ? projects : Object.values(ProjectsEnum);

  for (const project of projectsToBuild) {
    const folders = Object.values(ProjectsEnum).filter((p) => p.includes(project));

    if (!folders?.length) {
      logger.error(`project ${project} not found, skipping`);
      continue;
    }

    try {
      const cli = util.promisify(exec);

      for (const folder of folders) {
        logger.info(`checking out to branch ${ansiTextColor(branch, AnsiColor.GREEN)} in project: ${ansiTextColor(folder, AnsiColor.LIGHT_BLUE)}`);
      }

      const { stdout, stderr } = await cli(`cd C:\\Regulatorio\\rancher-utils || git status`);

      console.log(stdout);


    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
    }
  }
}

export default { buildProjects };

import axios from 'axios';

import type RancherResponse from '@/models/rancher-response';
import type RancherProject from '@/models/rancher-project';
import type RancherContainer from '@/models/rancher-container';

async function findRancherProjectByName(name: string): Promise<RancherResponse<RancherProject>> {
  const response = await axios.get<RancherResponse<RancherProject>>('/v2-beta/projects', {
    baseURL: process.env.BASE_URL,
    auth: {
      username: process.env.KEY ?? '',
      password: process.env.SECRET ?? '',
    },
    params: {
      name: name,
    },
  });

  return response.data;
}

async function findContainersByProjectId(projectId: string): Promise<RancherResponse<RancherContainer>> {
  const response = await axios.get<RancherResponse<RancherContainer>>(`/v2-beta/projects/${projectId}/instances`, {
    baseURL: process.env.BASE_URL,
    auth: {
      username: process.env.KEY ?? '',
      password: process.env.SECRET ?? '',
    },
    params: {
      sort: 'name',
      type: 'container',
      limit: '-1',
    },
  });

  return response.data;
}

async function restartContainer(projectId: string, containerId: string): Promise<RancherResponse<RancherContainer>> {
  const response = await axios.post<RancherResponse<RancherContainer>>(`/v2-beta/projects/${projectId}/containers/${containerId}?action=restart`,
    {},
    {
      baseURL: process.env.BASE_URL,
      auth: {
        username: process.env.KEY ?? '',
        password: process.env.SECRET ?? '',
      },
    }
  );

  return response.data;
}

export default { findRancherProjectByName, findContainersByProjectId, restartContainer };

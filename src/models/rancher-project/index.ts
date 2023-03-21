import type RancherStates from './rancher-states-enum';

interface RancherProject {
  id: string;
  type: string;
  name: string;
  state: RancherStates;
  description: string;
  uuid: string;
}

export default RancherProject;

import type RancherStates from './StatesEnum';

interface RancherProject {
  id: string;
  type: string;
  name: string;
  state: RancherStates;
  description: string;
  uuid: string;
}

export default RancherProject;

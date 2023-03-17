import type ContainerState from './ContainerState';

interface RancherContainer {
  id: string;
  type: string;
  name: string;
  state: ContainerState;
  description: string;
  uuid: string;
}

export default RancherContainer;

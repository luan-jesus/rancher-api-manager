import type ContainerState from './ContainerStatesEnum';

interface RancherContainer {
  id: string;
  type: string;
  name: string;
  state: ContainerState;
  description: string;
  uuid: string;
}

export default RancherContainer;

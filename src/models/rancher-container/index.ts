import type ContainerState from './container-states-enum';

interface RancherContainer {
  id: string;
  type: string;
  name: string;
  state: ContainerState;
  description: string;
  uuid: string;
}

export default RancherContainer;

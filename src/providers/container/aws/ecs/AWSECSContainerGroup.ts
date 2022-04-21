import { IContainer, IContainerGroup } from '../../ContainerGroupProvider';

/**
 * Container spec for AWS ECS.
 */
export class AWSECSContainer extends IContainer
{
    environment: {
        name: string;
        value: string;
    }[];
    resourceRequirements?: {
        type: string;
        value: string;
    }[];
}

/**
 * Job spec for AWS ECS.
 */
export class AWSECSContainerGroup extends IContainerGroup 
{
    definition?: string;
    cluster: string;
    name?: string;
    command?: string;
    container?: AWSECSContainer
}
import { IContainer, IContainerGroup } from '../../ContainerGroupProvider';

/**
 * Container spec for AWS Batch.
 */
export class AWSBatchContainer extends IContainer
{
    image: string;
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
 * Job spec for AWS Batch.
 */
export class AWSBatchContainerGroup extends IContainerGroup 
{
    definition?: string;
    queue?: string;
    name?: string;
    command?: string;
    container?: AWSBatchContainer
}
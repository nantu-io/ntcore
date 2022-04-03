import { IContainerGroup, IContainer } from "../ContainerGroupProvider";

/**
 * Local container definition.
 */
export class LocalContainer extends IContainer 
{
    Image?: string;
    Env?: string[];
    Labels?: { [label: string]: string; };
    HostConfig?: {
        NetworkMode?: string;
        PortBindings?: {
            [key: string]: { HostPort: string }[]
        };
        Mounts?: {
            Target: string;
            Source: string;
            Type: 'bind' | 'volume' | 'tmpfs';
        }[];
        CpuQuota?: number;
        Memory?: number;
    };
}
 /**
  * Local container service.
  */
export class LocalContainerService extends IContainerGroup 
{
    ExposedPorts?: { [key: string]: {}};
    Containers?: LocalContainer[];
}
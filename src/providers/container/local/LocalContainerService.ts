import { GenericService, GenericContainer } from "../GenericServiceProvider";

/**
 * Local container definition.
 */
export class LocalContainer extends GenericContainer 
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
export class LocalContainerService extends GenericService 
{
    ExposedPorts?: { [key: string]: {}};
    Containers?: LocalContainer[];
}
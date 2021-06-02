import { ProviderType } from "../../commons/ProviderType";
import { LocalVolumeProvider } from "./local/LocalVolumeProvider";
import { localDockerClient } from '../../commons/ClientConfig';

/**
 * Volume provider factory.
 */
export class VolumeProviderFactory {
    /**
     * Create a provider for local volumes.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Deployment provider.
     */
    public createProvider(type: ProviderType) {
        switch(type) {
            case ProviderType.LOCAL: return new LocalVolumeProvider(localDockerClient);
        }
    }
}
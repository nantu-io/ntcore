import { LocalVolumeProvider } from "./local/LocalVolumeProvider";
import { ProviderType } from "../../commons/ProviderType";
import { appConfig } from "../../libs/config/AppConfigProvider";
import DockerClientProvider from "../../libs/client/DockerClientProvider";

/**
 * Volume config base.
 */
export abstract class GenericVolume 
{
    name: string;
    size?: number;
    label?: string;
}
/**
 * Interface for volume provider.
 */
export interface GenericVolumeProvider 
{
    /**
     * Creates a new volume.
     */
    create: (volume: GenericVolume) => Promise<any>
    /**
     * Delete a volume.
     */
    delete: (volume: GenericVolume) => Promise<any>
}

export class VolumeProviderFactory 
{
    /**
     * Create a provider for local volumes.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Deployment provider.
     */
    public createProvider(): GenericVolumeProvider {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.DOCKER: return new LocalVolumeProvider(DockerClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}
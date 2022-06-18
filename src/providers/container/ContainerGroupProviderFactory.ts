import { ProviderType } from "../../commons/ProviderType";
import { DockerContainerGroupProvider } from "./docker/DockerContainerGroupProvider";
import { KubernetesContainerGroupContextProvider } from "./kubernetes/KubeContainerGroupContextProvider";
import { KubernetesContainerGroupProvider } from "./kubernetes/KubeContainerGroupProvider";
import { DockerContainerGroupContextProvider } from "./docker/DockerContainerGroupContextProvider";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { IProviderFactory, IContainerGroupProvider, IContainerGroupContextProvider } from "./ContainerGroupProvider";
import KubernetesClientProvider from "../../libs/client/KubernetesClientProvider";
import DockerClientProvider from "../../libs/client/DockerClientProvider";

export class ContainerProviderFactory implements IProviderFactory<IContainerGroupProvider> 
{
    /**
     * Create a provider for local services.
     * @returns Service provider.
     */
    public createProvider(): IContainerGroupProvider 
    {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.KUBERNETES: return new KubernetesContainerGroupProvider(KubernetesClientProvider.get());
            case ProviderType.DOCKER: return new DockerContainerGroupProvider(DockerClientProvider.get());
            default: throw new Error(`Invalid provider type ${providerType}.`);
        }
    }
}

export class ContainerGroupContextProviderFactory implements IProviderFactory<IContainerGroupContextProvider> 
{
    /**
     * Create a provider for local service configurations.
     * @returns Service configuration provider.
     */
    public createProvider(): IContainerGroupContextProvider 
    {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.DOCKER: return new DockerContainerGroupContextProvider();
            case ProviderType.KUBERNETES: return new KubernetesContainerGroupContextProvider();
            default: throw new Error(`Invalid provider type ${providerType}`);
        }
    }
}
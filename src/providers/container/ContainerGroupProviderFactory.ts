import { ProviderType, DatabaseType } from "../../commons/ProviderType";
import { GenericLocalServiceProvider } from "./docker/DockerContainerGroupProvider";
import { LocalServiceStateProvider } from "./docker/DockeContainerGroupStateProvider";
import { LocalServiceConfigProvider } from "./docker/DockerContainerGroupConfigProvider";
import { KubeContainerGroupProvider } from "./kubernetes/KubeContainerGroupProvider";
import { KubeServiceConfigProvider } from "./kubernetes/KubeContainerGroupConfigProvider";
import { appConfig } from "../../libs/config/AppConfigProvider";
import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import KubernetesClientProvider from "../../libs/client/KubernetesClientProvider";
import DockerClientProvider from "../../libs/client/DockerClientProvider";
import { IContainerGroupStateProvider, IProviderFactory, IContainerGroupProvider, IContainerGroupConfigProvider } from "./ContainerGroupProvider";
import { PostgresServiceStateProvider } from "./kubernetes/KubeContainerGroupStateProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";

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
            case ProviderType.KUBERNETES: return new KubeContainerGroupProvider(KubernetesClientProvider.get());
            case ProviderType.DOCKER: return new GenericLocalServiceProvider(DockerClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}

export class ServiceConfigProviderFactory implements IProviderFactory<IContainerGroupConfigProvider> 
{
    /**
     * Create a provider for local service configurations.
     * @returns Service configuration provider.
     */
    public createProvider(): IContainerGroupConfigProvider 
    {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.KUBERNETES: return new KubeServiceConfigProvider();
            case ProviderType.DOCKER: return new LocalServiceConfigProvider();
            default: throw new Error("Invalid provider type.");
        }
    }
}

export class ServiceStateProviderFactory implements IProviderFactory<IContainerGroupStateProvider> 
{
    /**
     * Create a provider for local service states.
     * @returns Service state provider.
     */
    public createProvider(): IContainerGroupStateProvider 
    {
        const providerType: DatabaseType = appConfig.database.provider;
        switch(providerType) {
            case DatabaseType.POSTGRES: return new PostgresServiceStateProvider(PostgresClientProvider.get());
            case DatabaseType.SQLITE: return new LocalServiceStateProvider(SQliteClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}
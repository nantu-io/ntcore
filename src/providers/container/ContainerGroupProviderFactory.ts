import { ProviderType, DatabaseType } from "../../commons/ProviderType";
import { DockerContainerGroupProvider } from "./docker/DockerContainerGroupProvider";
import { DockerContainerGroupStateProvider } from "./docker/DockeContainerGroupStateProvider";
import { DockerContainerGroupConfigProvider } from "./docker/DockerContainerGroupConfigProvider";
import { KubernetesContainerGroupProvider } from "./kubernetes/KubeContainerGroupProvider";
import { KubernetesContainerGroupConfigProvider } from "./kubernetes/KubeContainerGroupConfigProvider";
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
            case ProviderType.KUBERNETES: return new KubernetesContainerGroupProvider(KubernetesClientProvider.get());
            case ProviderType.DOCKER: return new DockerContainerGroupProvider(DockerClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}

export class ContainerGroupConfigProviderFactory implements IProviderFactory<IContainerGroupConfigProvider> 
{
    /**
     * Create a provider for local service configurations.
     * @returns Service configuration provider.
     */
    public createProvider(): IContainerGroupConfigProvider 
    {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.KUBERNETES: return new KubernetesContainerGroupConfigProvider();
            case ProviderType.DOCKER: return new DockerContainerGroupConfigProvider();
            default: throw new Error("Invalid provider type.");
        }
    }
}

export class ContainerGroupStateProviderFactory implements IProviderFactory<IContainerGroupStateProvider> 
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
            case DatabaseType.SQLITE: return new DockerContainerGroupStateProvider(SQliteClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}
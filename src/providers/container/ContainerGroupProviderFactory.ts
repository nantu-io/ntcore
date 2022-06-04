import { ProviderType, DatabaseType } from "../../commons/ProviderType";
import { DockerContainerGroupProvider } from "./docker/DockerContainerGroupProvider";
import { KubernetesContainerGroupContextProvider } from "./kubernetes/KubeContainerGroupContextProvider";
import { SQLiteContainerGroupStateProvider } from "./state/sqlite/SQLiteContainerGroupStateProvider";
import { DockerContainerGroupConfigProvider } from "./docker/DockerContainerGroupConfigProvider";
import { KubernetesContainerGroupProvider } from "./kubernetes/KubeContainerGroupProvider";
import { KubernetesContainerGroupConfigProvider } from "./kubernetes/KubeContainerGroupConfigProvider";
import { DockerContainerGroupContextProvider } from "./docker/DockerContainerGroupContextProvider";
import { appConfig } from "../../libs/config/AppConfigProvider";
import { IContainerGroupStateProvider, IProviderFactory, IContainerGroupProvider, IContainerGroupConfigProvider, IContainerGroupContextProvider } from "./ContainerGroupProvider";
import { PostgresServiceStateProvider } from "./state/postgres/PostgresContainerGroupStateProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";
import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
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
            case DatabaseType.SQLITE: return new SQLiteContainerGroupStateProvider(SQliteClientProvider.get());
            default: throw new Error(`Invalid provider type. ${providerType}`);
        }
    }
}
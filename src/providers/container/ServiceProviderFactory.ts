import { ProviderType, DatabaseType } from "../../commons/ProviderType";
import { GenericLocalServiceProvider } from "./local/LocalServiceProvider";
import { LocalServiceStateProvider } from "./local/LocalServiceStateProvider";
import { LocalServiceConfigProvider } from "./local/LocalServiceConfigProvider";
import { KubeContainerServiceProvider } from "./kubernetes/KubeServiceProvider";
import { KubeServiceConfigProvider } from "./kubernetes/KubeServiceConfigProvider";
import { appConfig } from "../../libs/config/AppConfigProvider";
import SQliteClientProvider from "../../libs/client/SQLiteClientProvider";
import KubernetesClientProvider from "../../libs/client/KubernetesClientProvider";
import DockerClientProvider from "../../libs/client/DockerClientProvider";
import { GenericServiceStateProvider, GenericProviderFactory, GenericServiceProvider, GenericServiceConfigProvider } from "./GenericServiceProvider";
import { PostgresServiceStateProvider } from "./postgres/PostgresServiceStateProvider";
import PostgresClientProvider from "../../libs/client/PostgresClientProvider";

export class ContainerProviderFactory implements GenericProviderFactory<GenericServiceProvider> 
{
    /**
     * Create a provider for local services.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Service provider.
     */
    public createProvider(): GenericServiceProvider 
    {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.KUBERNETES: return new KubeContainerServiceProvider(KubernetesClientProvider.get());
            case ProviderType.DOCKER: return new GenericLocalServiceProvider(DockerClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}

export class ServiceConfigProviderFactory implements GenericProviderFactory<GenericServiceConfigProvider> 
{
    /**
     * Create a provider for local service configurations.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Service configuration provider.
     */
    public createProvider(): GenericServiceConfigProvider 
    {
        const providerType: ProviderType = appConfig.container.provider;
        switch(providerType) {
            case ProviderType.KUBERNETES: return new KubeServiceConfigProvider();
            case ProviderType.DOCKER: return new LocalServiceConfigProvider();
            default: throw new Error("Invalid provider type.");
        }
    }
}

export class ServiceStateProviderFactory implements GenericProviderFactory<GenericServiceStateProvider> 
{
    /**
     * Create a provider for local service states.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Service state provider.
     */
    public createProvider(): GenericServiceStateProvider 
    {
        const providerType: DatabaseType = appConfig.database.provider;
        switch(providerType) {
            case DatabaseType.POSTGRES: return new PostgresServiceStateProvider(PostgresClientProvider.get());
            case DatabaseType.SQLITE: return new LocalServiceStateProvider(SQliteClientProvider.get());
            default: throw new Error("Invalid provider type.");
        }
    }
}
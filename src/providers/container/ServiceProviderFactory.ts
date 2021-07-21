import { ProviderType } from "../../commons/ProviderType";
import { localDockerClient } from '../../commons/ClientConfig';
import { GenericLocalServiceProvider } from "./local/LocalServiceProvider";
import { LocalServiceStateProvider } from "./local/LocalServiceStateProvider";
import { LocalServiceConfigProvider } from "./local/LocalServiceConfigProvider";
import { 
    GenericServiceStateProvider, 
    GenericProviderFactory, 
    GenericServiceProvider, 
    GenericServiceConfigProvider
} from "./GenericServiceProvider";

export class ContainerProviderFactory implements GenericProviderFactory<GenericServiceProvider> {
    /**
     * Create a provider for local services.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Service provider.
     */
    public createProvider(type: ProviderType): GenericServiceProvider {
        switch(type) {
            case ProviderType.DOCKER: return new GenericLocalServiceProvider(localDockerClient);
        }
    }
}

export class ServiceConfigProviderFactory implements GenericProviderFactory<GenericServiceConfigProvider> {
    /**
     * Create a provider for local service configurations.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Service configuration provider.
     */
    public createProvider(type: ProviderType): GenericServiceConfigProvider {
        switch(type) {
            case ProviderType.DOCKER: return new LocalServiceConfigProvider();
        }
    }
}

export class ServiceStateProviderFactory implements GenericProviderFactory<GenericServiceStateProvider> {
    /**
     * Create a provider for local service states.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Service state provider.
     */
    public createProvider(type: ProviderType): GenericServiceStateProvider {
        switch(type) {
            case ProviderType.DOCKER: return new LocalServiceStateProvider();
        }
    }
}
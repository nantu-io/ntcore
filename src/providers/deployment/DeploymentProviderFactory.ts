import { ProviderType } from "../../commons/ProviderType";
import { LocalDeploymentProvider } from "./local/LocalDeploymentProvider";

export class DeploymentProviderFactory {
    /**
     * Create a provider for local deployments.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Deployment provider.
     */
    public createProvider(type: ProviderType) {
        switch(type) {
            case ProviderType.LOCAL: return new LocalDeploymentProvider();
        }
    }
}
import { ProviderType } from "../../commons/ProviderType";
import { LocalExperimentProvider } from "./local/LocalExperimentProvider";

export class ExperimentProviderFactory {
    /**
     * Create a provider for local experiments.
     * @param type Provider type, e.g., LOCAL, AWS etc.
     * @returns Experiment provider.
     */
    public createProvider(type: ProviderType) {
        switch(type) {
            case ProviderType.DOCKER: return new LocalExperimentProvider();
        }
    }
}
import { WorkpaceProviderFactory } from "../../providers/workspace/GenericWorkspaceProvider";
import { ExperimentProviderFactory } from "../../providers/experiment/GenericExperimentProvider";

export const workspaceProvider = new WorkpaceProviderFactory().createProvider();
export const experimentProvider = new ExperimentProviderFactory().createProvider();

export async function initialize() {
    await workspaceProvider.initialize();
    await experimentProvider.initialize();
}
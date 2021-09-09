import { WorkpaceProviderFactory } from "../../providers/workspace/GenericWorkspaceProvider";
import { ExperimentProviderFactory } from "../../providers/experiment/GenericExperimentProvider";
import { DeploymentProviderFactory } from "../../providers/deployment/GenericDeploymentProvider";

export const workspaceProvider = new WorkpaceProviderFactory().createProvider();
export const experimentProvider = new ExperimentProviderFactory().createProvider();
export const deploymentProvider = new DeploymentProviderFactory().createProvider();

export async function initialize() {
    await workspaceProvider.initialize();
    await experimentProvider.initialize();
    await deploymentProvider.initialize();
}